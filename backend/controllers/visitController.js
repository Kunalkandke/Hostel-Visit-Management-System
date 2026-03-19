const { Visit, Hostel } = require('../models/index');
const User = require('../models/User');
const { auditLogger } = require('../middleware/helpers');
const { sendVisitCompletedEmail } = require('../services/emailService');

exports.startVisit = async (req, res, next) => {
  try {
    const { hostelId, purpose, purposeDetail, facultyRemarks } = req.body;
    if (!hostelId || !purpose) return res.status(400).json({ success: false, message: 'Hostel and purpose required' });

    const active = await Visit.findOne({ faculty: req.user.id, status: 'active' });
    if (active) return res.status(400).json({ success: false, message: 'You already have an active visit. End it first.' });

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const visit = await Visit.create({
      faculty: req.user.id, hostel: hostelId, purpose,
      purposeDetail: purposeDetail || null,
      facultyRemarks: facultyRemarks || null,
      checkIn: new Date(), status: 'active',
    });

    await visit.populate('hostel', 'name type location');
    await visit.populate('faculty', 'name email department');

    auditLogger(req.user.id, 'START_VISIT', visit._id, 'Visit', { hostelId, purpose }, req.ip);
    res.status(201).json({ success: true, message: 'Visit started', data: visit });
  } catch (err) { next(err); }
};

exports.endVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id).populate('hostel').populate('faculty', 'name email department');
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (visit.faculty._id.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Not your visit' });
    if (visit.status === 'completed') return res.status(400).json({ success: false, message: 'Already completed' });

    const checkOut = new Date();
    const duration = Math.max(1, Math.round((checkOut - visit.checkIn) / 60000));

    visit.checkOut = checkOut;
    visit.duration = duration;
    visit.status = 'completed';
    if (req.body.facultyRemarks) visit.facultyRemarks = req.body.facultyRemarks;
    await visit.save();

    auditLogger(req.user.id, 'END_VISIT', visit._id, 'Visit', { duration }, req.ip);

    // Email warden if assigned
    if (visit.hostel?.warden) {
      const warden = await User.findById(visit.hostel.warden);
      if (warden?.email) {
        sendVisitCompletedEmail({
          wardenEmail: warden.email,
          wardenName: warden.name,
          facultyName: visit.faculty.name,
          facultyDept: visit.faculty.department,
          hostelName: visit.hostel.name,
          checkIn: visit.checkIn,
          checkOut: visit.checkOut,
          duration: visit.duration,
          purpose: visit.purpose,
          facultyRemarks: visit.facultyRemarks,
        }).catch(() => {});
      }
    }

    res.json({ success: true, message: 'Visit ended successfully', data: visit });
  } catch (err) { next(err); }
};

exports.getMyVisits = async (req, res, next) => {
  try {
    const { status, hostelId, from, to, page = 1, limit = 12 } = req.query;
    let filter = {};
    
    // If warden, show visits to their hostel; if faculty, show their own visits
    if (req.user.role === 'warden') {
      const warden = await User.findById(req.user.id);
      if (!warden?.assignedHostel) return res.json({ success: true, data: { visits: [], pagination: { total: 0, page: 1, pages: 0 } } });
      filter.hostel = warden.assignedHostel;
    } else {
      filter.faculty = req.user.id;
    }
    
    if (status) filter.status = status;
    if (hostelId) filter.hostel = hostelId;
    if (from || to) { filter.checkIn = {}; if (from) filter.checkIn.$gte = new Date(from); if (to) filter.checkIn.$lte = new Date(to); }

    const total = await Visit.countDocuments(filter);
    const visits = await Visit.find(filter)
      .populate('hostel', 'name type location')
      .populate('faculty', 'name email department phone')
      .sort({ checkIn: -1 }).skip((page - 1) * limit).limit(Number(limit));

    res.json({ success: true, data: { visits, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

exports.getActiveVisits = async (req, res, next) => {
  try {
    const filter = { status: 'active' };
    if (req.user.role === 'warden') {
      const warden = await User.findById(req.user.id);
      if (!warden?.assignedHostel) return res.json({ success: true, data: [] });
      filter.hostel = warden.assignedHostel;
    }
    const visits = await Visit.find(filter)
      .populate('faculty', 'name email department phone')
      .populate('hostel', 'name type location')
      .sort({ checkIn: -1 });
    res.json({ success: true, data: visits });
  } catch (err) { next(err); }
};

exports.verifyVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const warden = await User.findById(req.user.id);
    if (warden?.assignedHostel?.toString() !== visit.hostel.toString())
      return res.status(403).json({ success: false, message: 'Not your hostel' });
    visit.isVerified = true;
    if (req.body.wardenRemarks) visit.wardenRemarks = req.body.wardenRemarks;
    await visit.save();
    auditLogger(req.user.id, 'VERIFY_VISIT', visit._id, 'Visit', {}, req.ip);
    res.json({ success: true, message: 'Visit verified', data: visit });
  } catch (err) { next(err); }
};

exports.getAllVisits = async (req, res, next) => {
  try {
    const { status, hostelId, facultyId, from, to, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (hostelId) filter.hostel = hostelId;
    if (facultyId) filter.faculty = facultyId;
    if (from || to) { filter.checkIn = {}; if (from) filter.checkIn.$gte = new Date(from); if (to) filter.checkIn.$lte = new Date(to); }

    const total = await Visit.countDocuments(filter);
    const visits = await Visit.find(filter)
      .populate('faculty', 'name email department')
      .populate('hostel', 'name type')
      .sort({ checkIn: -1 }).skip((page - 1) * limit).limit(Number(limit));

    res.json({ success: true, data: { visits, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

exports.getVisitById = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('faculty', 'name email department phone')
      .populate({ path: 'hostel', populate: { path: 'warden', select: 'name email' } });
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: visit });
  } catch (err) { next(err); }
};
