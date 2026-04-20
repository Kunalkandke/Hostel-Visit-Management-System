const db = require('../data/db');
const { auditLogger } = require('../middleware/helpers');
const { sendVisitCompletedEmail } = require('../services/emailService');

exports.startVisit = async (req, res, next) => {
  try {
    const { hostelId, purpose, purposeDetail, facultyRemarks } = req.body;
    if (!hostelId || !purpose) return res.status(400).json({ success: false, message: 'Hostel and purpose required' });

    const active = await db.findOneVisit({ faculty: req.user.id, status: 'active' });
    if (active) return res.status(400).json({ success: false, message: 'You already have an active visit. End it first.' });

    const hostel = await db.findHostelById(hostelId, { includeInactive: false });
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const created = await db.createVisit({
      faculty: req.user.id, hostel: hostelId, purpose,
      purposeDetail: purposeDetail || null,
      facultyRemarks: facultyRemarks || null,
      checkIn: new Date(), status: 'active',
    });
    const visit = await db.findVisitById(created._id, { includeRelations: true });

    auditLogger(req.user.id, 'START_VISIT', visit._id, 'Visit', { hostelId, purpose }, req.ip);
    res.status(201).json({ success: true, message: 'Visit started', data: visit });
  } catch (err) { next(err); }
};

exports.endVisit = async (req, res, next) => {
  try {
    const visit = await db.findVisitById(req.params.id, { includeRelations: true, includeWardenInHostel: true });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (String(visit.faculty._id) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Not your visit' });
    if (visit.status === 'completed') return res.status(400).json({ success: false, message: 'Already completed' });

    const checkOut = new Date();
    const duration = Math.max(1, Math.round((checkOut - visit.checkIn) / 60000));

    const updated = await db.updateVisitById(req.params.id, {
      checkOut,
      duration,
      status: 'completed',
      ...(req.body.facultyRemarks !== undefined && { facultyRemarks: req.body.facultyRemarks }),
    });

    auditLogger(req.user.id, 'END_VISIT', req.params.id, 'Visit', { duration }, req.ip);

    // Email warden if assigned
    if (visit.hostel?.warden?._id) {
      const warden = await db.findUserById(visit.hostel.warden._id);
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
    const responseVisit = await db.findVisitById(updated._id, { includeRelations: true, includeWardenInHostel: true });
    res.json({ success: true, message: 'Visit ended successfully', data: responseVisit });
  } catch (err) { next(err); }
};

exports.getMyVisits = async (req, res, next) => {
  try {
    const { status, hostelId, from, to, page = 1, limit = 12 } = req.query;
    let filter = {};
    
    // If warden, show visits to their hostel; if faculty, show their own visits
    if (req.user.role === 'warden') {
      const warden = await db.findUserById(req.user.id);
      if (!warden?.assignedHostel) return res.json({ success: true, data: { visits: [], pagination: { total: 0, page: 1, pages: 0 } } });
      filter.hostel = warden.assignedHostel._id || warden.assignedHostel;
    } else {
      filter.faculty = req.user.id;
    }
    
    if (status) filter.status = status;
    if (hostelId) filter.hostel = hostelId;
    if (from) filter.fromCheckIn = new Date(from);
    if (to) filter.toCheckIn = new Date(to);

    const { total, visits } = await db.listVisits(filter, { page, limit, includeRelations: true });

    res.json({ success: true, data: { visits, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

exports.getActiveVisits = async (req, res, next) => {
  try {
    const filter = { status: 'active' };
    if (req.user.role === 'warden') {
      const warden = await db.findUserById(req.user.id);
      if (!warden?.assignedHostel) return res.json({ success: true, data: [] });
      filter.hostel = warden.assignedHostel._id || warden.assignedHostel;
    }
    const { visits } = await db.listVisits(filter, { page: 1, limit: 1000, includeRelations: true });
    res.json({ success: true, data: visits });
  } catch (err) { next(err); }
};

exports.verifyVisit = async (req, res, next) => {
  try {
    const visit = await db.findVisitById(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    const warden = await db.findUserById(req.user.id);
    const wardenHostelId = warden?.assignedHostel?._id || warden?.assignedHostel;
    const visitHostelId = visit.hostel?._id || visit.hostel;
    if (String(wardenHostelId) !== String(visitHostelId))
      return res.status(403).json({ success: false, message: 'Not your hostel' });
    const updated = await db.updateVisitById(req.params.id, {
      isVerified: true,
      ...(req.body.wardenRemarks !== undefined && { wardenRemarks: req.body.wardenRemarks }),
    });
    auditLogger(req.user.id, 'VERIFY_VISIT', visit._id, 'Visit', {}, req.ip);
    const responseVisit = await db.findVisitById(updated._id, { includeRelations: true });
    res.json({ success: true, message: 'Visit verified', data: responseVisit });
  } catch (err) { next(err); }
};

exports.getAllVisits = async (req, res, next) => {
  try {
    const { status, hostelId, facultyId, from, to, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (hostelId) filter.hostel = hostelId;
    if (facultyId) filter.faculty = facultyId;
    if (from) filter.fromCheckIn = new Date(from);
    if (to) filter.toCheckIn = new Date(to);

    const { total, visits } = await db.listVisits(filter, { page, limit, includeRelations: true });

    res.json({ success: true, data: { visits, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (err) { next(err); }
};

exports.getVisitById = async (req, res, next) => {
  try {
    const visit = await db.findVisitById(req.params.id, { includeRelations: true, includeWardenInHostel: true });
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: visit });
  } catch (err) { next(err); }
};
