const db = require('../data/db');
const { generatePassword } = require('../utils/helpers');
const { sendWelcomeEmail } = require('../services/emailService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined && isActive !== '') filter.isActive = isActive === 'true';

    const { total, users } = await db.listUsers({ role, isActive, page, limit });

    res.json({ success: true, data: { users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, role, department, phone, assignedHostel } = req.body;
    if (!name || !email || !role) return res.status(400).json({ success: false, message: 'Name, email and role required' });

    const exists = await db.findUserByEmail(email.toLowerCase());
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const tempPassword = generatePassword();
    const userData = { name, email, password: tempPassword, role, phone, mustChangePassword: true };

    // For warden: assign hostel instead of department
    if (role === 'warden' && assignedHostel) {
      userData.assignedHostel = assignedHostel;
      // Also update hostel record to point to this warden
    } else if (department) {
      userData.department = department;
    }

    const user = await db.createUser(userData);

    // If warden, update hostel's warden field too
    if (role === 'warden' && assignedHostel) {
      await db.updateHostelById(assignedHostel, { warden: user._id });
      // Clear this warden from any other hostel
      await db.clearWardenAssignments(user._id, assignedHostel);
      const otherWardens = await db.listUsers({ role: 'warden', page: 1, limit: 5000 });
      const previous = otherWardens.users.find(
        (u) => u._id !== user._id && u.assignedHostel && String(u.assignedHostel._id || u.assignedHostel) === String(assignedHostel)
      );
      if (previous) await db.updateUserById(previous._id, { assignedHostel: null });
    }

    // Send welcome email
    const emailSent = await sendWelcomeEmail({
      name, email, password: tempPassword, role,
      department: role === 'warden' ? null : department,
    });

    const safeUser = user;
    res.status(201).json({
      success: true,
      message: `User created${emailSent ? ' and welcome email sent' : ' (email failed — check SMTP config)'}`,
      data: { user: safeUser, tempPassword, emailSent },
    });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, department, phone } = req.body;
    const user = await db.updateUserById(req.params.id, {
      ...(name && { name }),
      ...(department !== undefined && { department }),
      ...(phone !== undefined && { phone }),
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated', data: user });
  } catch (err) { next(err); }
};

exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await db.updateUserById(req.params.id, { role });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Role updated', data: user });
  } catch (err) { next(err); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await db.updateUserById(req.params.id, { isActive });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const user = await db.findUserById(req.params.id, { includePassword: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const newPassword = generatePassword();
    await db.updateUserById(req.params.id, { password: newPassword, mustChangePassword: true });
    await sendWelcomeEmail({ name: user.name, email: user.email, password: newPassword, role: user.role, department: user.department });
    res.json({ success: true, message: 'Password reset and emailed to user' });
  } catch (err) { next(err); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await db.findUserById(req.params.id, { includeAssignedHostel: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
