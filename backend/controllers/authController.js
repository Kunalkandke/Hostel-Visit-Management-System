const bcrypt = require('bcryptjs');
const db = require('../data/db');
const { generateToken } = require('../utils/helpers');
const { auditLogger } = require('../middleware/helpers');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      console.log('❌ Login failed: Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Find user
    const user = await db.findUserByEmail(email.toLowerCase(), { includePassword: true });
    if (!user) {
      console.log(`❌ Login failed: User not found - ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check if account is active
    if (!user.isActive) {
      console.log(`❌ Login failed: Account deactivated - ${email}`);
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`❌ Login failed: Invalid password - ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ userId: user._id, role: user.role, name: user.name });
    auditLogger(user._id, 'LOGIN', null, null, { email: user.email }, req.ip);

    const hostel = user.assignedHostel ? user.assignedHostel : null;
    const normalizedRole = String(user.role || '').trim().toLowerCase();
    
    console.log(`✅ Login successful: ${email} (${normalizedRole})`);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id, name: user.name, email: user.email,
          role: normalizedRole, department: user.department,
          phone: user.phone, profilePhoto: user.profilePhoto,
          assignedHostel: hostel, mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    auditLogger(req.user.id, 'LOGOUT', null, null, {}, req.ip);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await db.findUserById(req.user.id, { includeAssignedHostel: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department } = req.body;
    const user = await db.updateUserById(req.user.id, { name, phone, department });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const user = await db.findUserById(req.user.id, { includePassword: true });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    await db.updateUserById(req.user.id, { password: newPassword, mustChangePassword: false });
    auditLogger(req.user.id, 'CHANGE_PASSWORD', null, null, {}, req.ip);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};
