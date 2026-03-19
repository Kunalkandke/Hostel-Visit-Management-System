// hostelController.js
const { Hostel } = require('../models/index');
const User = require('../models/User');
const { auditLogger } = require('../middleware/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ isActive: true }).populate('warden', 'name email phone').sort({ name: 1 });
    res.json({ success: true, data: hostels });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const h = await Hostel.findById(req.params.id).populate('warden', 'name email phone');
    if (!h) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: h });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, capacity, location } = req.body;
    const h = await Hostel.create({ name, type, capacity: Number(capacity), location });
    auditLogger(req.user.id, 'CREATE_HOSTEL', h._id, 'Hostel', { name }, req.ip);
    res.status(201).json({ success: true, message: 'Hostel created', data: h });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const h = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!h) return res.status(404).json({ success: false, message: 'Not found' });
    auditLogger(req.user.id, 'UPDATE_HOSTEL', h._id, 'Hostel', {}, req.ip);
    res.json({ success: true, message: 'Updated', data: h });
  } catch (err) { next(err); }
};

exports.assignWarden = async (req, res, next) => {
  try {
    const { wardenId } = req.body;
    const warden = await User.findOne({ _id: wardenId, role: 'warden' });
    if (!warden) return res.status(404).json({ success: false, message: 'Warden not found' });
    await Hostel.updateMany({ warden: wardenId }, { warden: null });
    const h = await Hostel.findByIdAndUpdate(req.params.id, { warden: wardenId }, { new: true }).populate('warden', 'name email');
    if (!h) return res.status(404).json({ success: false, message: 'Hostel not found' });
    await User.findByIdAndUpdate(wardenId, { assignedHostel: h._id });
    auditLogger(req.user.id, 'ASSIGN_WARDEN', h._id, 'Hostel', { wardenId }, req.ip);
    res.json({ success: true, message: 'Warden assigned', data: h });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const h = await Hostel.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!h) return res.status(404).json({ success: false, message: 'Not found' });
    auditLogger(req.user.id, 'DELETE_HOSTEL', h._id, 'Hostel', {}, req.ip);
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) { next(err); }
};
