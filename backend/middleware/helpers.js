// authorizeRoles.js
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(' or ')}` });
  next();
};

// errorHandler.js
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') console.error(err);
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err.name === 'CastError') { status = 400; message = `Invalid ID: ${err.value}`; }
  if (err.code === 11000) { status = 400; message = `${Object.keys(err.keyValue)[0]} already exists`; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  res.status(status).json({ success: false, message });
};

// Stub — audit logging removed
const auditLogger = async () => {};

module.exports = { authorizeRoles, errorHandler, auditLogger };
