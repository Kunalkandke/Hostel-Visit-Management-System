// authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../data/db');

const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token provided' });
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.findUserById(decoded.userId);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Unauthorized' });
    req.user = {
      id: user._id,
      role: String(user.role || '').trim().toLowerCase(),
      name: user.name,
      email: user.email,
      assignedHostel: user.assignedHostel?._id || user.assignedHostel || null,
    };
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ success: false, message: msg });
  }
};

module.exports = { authMiddleware };
