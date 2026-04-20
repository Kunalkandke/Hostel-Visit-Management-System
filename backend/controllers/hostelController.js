// hostelController.js
const db = require('../data/db');
const { auditLogger } = require('../middleware/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const hostels = await db.listHostels({ includeWarden: true, includeInactive: false });
    res.json({ success: true, data: hostels });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const h = await db.findHostelById(req.params.id, { includeWarden: true, includeInactive: true });
    if (!h) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: h });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, capacity, location } = req.body;
    const h = await db.createHostel({ name, type, capacity: Number(capacity), location });
    auditLogger(req.user.id, 'CREATE_HOSTEL', h._id, 'Hostel', { name }, req.ip);
    res.status(201).json({ success: true, message: 'Hostel created', data: h });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const h = await db.updateHostelById(req.params.id, req.body);
    if (!h) return res.status(404).json({ success: false, message: 'Not found' });
    auditLogger(req.user.id, 'UPDATE_HOSTEL', h._id, 'Hostel', {}, req.ip);
    res.json({ success: true, message: 'Updated', data: h });
  } catch (err) { next(err); }
};

exports.assignWarden = async (req, res, next) => {
  try {
    const { wardenId } = req.body;
    const currentHostel = await db.findHostelById(req.params.id, { includeWarden: true, includeInactive: true });
    if (!currentHostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    const warden = await db.findUserById(wardenId);
    if (warden && warden.role !== 'warden') return res.status(404).json({ success: false, message: 'Warden not found' });
    if (!warden) return res.status(404).json({ success: false, message: 'Warden not found' });
    await db.clearWardenAssignments(wardenId);
    await db.updateUserById(wardenId, { assignedHostel: req.params.id });
    if (currentHostel.warden?._id && String(currentHostel.warden._id) !== String(wardenId)) {
      await db.updateUserById(currentHostel.warden._id, { assignedHostel: null });
    }
    const h = await db.updateHostelById(req.params.id, { warden: wardenId });
    const withWarden = await db.findHostelById(h._id, { includeWarden: true, includeInactive: true });
    auditLogger(req.user.id, 'ASSIGN_WARDEN', h._id, 'Hostel', { wardenId }, req.ip);
    res.json({ success: true, message: 'Warden assigned', data: withWarden });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const h = await db.updateHostelById(req.params.id, { isActive: false });
    if (!h) return res.status(404).json({ success: false, message: 'Not found' });
    auditLogger(req.user.id, 'DELETE_HOSTEL', h._id, 'Hostel', {}, req.ip);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) { next(err); }
};
