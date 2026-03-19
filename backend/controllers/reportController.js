const { Visit } = require('../models/index');
const User = require('../models/User');

// Helper: get hostel filter for warden
async function getHostelFilter(user) {
  if (user.role === 'warden') {
    const w = await User.findById(user.id);
    if (w?.assignedHostel) return { hostel: w.assignedHostel };
    return null; // warden with no hostel sees nothing
  }
  return {}; // admin sees everything
}

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: { activeCount: 0, todayCount: 0, monthCount: 0, hostelWise: [] } });

    const [activeCount, todayCount, monthCount, hostelWise] = await Promise.all([
      Visit.countDocuments({ status: 'active', ...hostelFilter }),
      Visit.countDocuments({ checkIn: { $gte: today }, ...hostelFilter }),
      Visit.countDocuments({ checkIn: { $gte: monthStart }, ...hostelFilter }),
      Visit.aggregate([
        { $match: { checkIn: { $gte: today }, ...hostelFilter } },
        { $group: { _id: '$hostel', count: { $sum: 1 } } },
        { $lookup: { from: 'hostels', localField: '_id', foreignField: '_id', as: 'hostel' } },
        { $unwind: '$hostel' },
        { $project: { hostelName: '$hostel.name', type: '$hostel.type', count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);
    res.json({ success: true, data: { activeCount, todayCount, monthCount, hostelWise } });
  } catch (err) { next(err); }
};

exports.getDaily = async (req, res, next) => {
  try {
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: { stats: { totalVisits: 0, completed: 0, active: 0, avgDuration: 0 }, visits: [] } });

    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1);

    // Sorting
    const sortField = req.query.sortBy || 'checkIn';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const validSorts = { checkIn: 'checkIn', faculty: 'faculty', duration: 'duration', hostel: 'hostel', purpose: 'purpose' };
    const sortKey = validSorts[sortField] || 'checkIn';

    const visits = await Visit.find({ checkIn: { $gte: date, $lt: nextDay }, ...hostelFilter })
      .populate('faculty', 'name email department')
      .populate('hostel', 'name type')
      .sort({ [sortKey]: sortOrder });

    const durations = visits.filter(v => v.duration);
    const avgDuration = durations.length ? (durations.reduce((s, v) => s + v.duration, 0) / durations.length).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        date: dateStr,
        stats: {
          totalVisits: visits.length,
          completed: visits.filter(v => v.status === 'completed').length,
          active: visits.filter(v => v.status === 'active').length,
          avgDuration,
        },
        visits,
      },
    });
  } catch (err) { next(err); }
};

exports.getMonthly = async (req, res, next) => {
  try {
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: { total: 0, dailyBreakdown: [] } });

    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const breakdown = await Visit.aggregate([
      { $match: { checkIn: { $gte: start, $lte: end }, ...hostelFilter } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkIn' } },
        count: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    const total = await Visit.countDocuments({ checkIn: { $gte: start, $lte: end }, ...hostelFilter });
    res.json({ success: true, data: { month, year, total, dailyBreakdown: breakdown } });
  } catch (err) { next(err); }
};

exports.getByHostel = async (req, res, next) => {
  try {
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: [] });

    const { from, to, sortBy = 'totalVisits', order = 'desc' } = req.query;
    const match = { ...hostelFilter };
    if (from || to) {
      match.checkIn = {};
      if (from) match.checkIn.$gte = new Date(from);
      if (to) match.checkIn.$lte = new Date(to);
    }

    const validSorts = ['totalVisits', 'completedVisits', 'avgDuration'];
    const sortKey = validSorts.includes(sortBy) ? sortBy : 'totalVisits';

    const data = await Visit.aggregate([
      { $match: match },
      { $group: {
        _id: '$hostel',
        totalVisits: { $sum: 1 },
        completedVisits: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        avgDuration: { $avg: '$duration' },
      }},
      { $lookup: { from: 'hostels', localField: '_id', foreignField: '_id', as: 'hostel' } },
      { $unwind: '$hostel' },
      { $project: { hostelName: '$hostel.name', type: '$hostel.type', totalVisits: 1, completedVisits: 1, avgDuration: { $round: ['$avgDuration', 1] } } },
      { $sort: { [sortKey]: order === 'asc' ? 1 : -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getByFaculty = async (req, res, next) => {
  try {
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: [] });

    const { from, to, sortBy = 'totalVisits', order = 'desc', department } = req.query;
    const match = { ...hostelFilter };
    if (from || to) {
      match.checkIn = {};
      if (from) match.checkIn.$gte = new Date(from);
      if (to) match.checkIn.$lte = new Date(to);
    }

    const validSorts = ['totalVisits', 'completedVisits', 'avgDuration', 'lastVisit'];
    const sortKey = validSorts.includes(sortBy) ? sortBy : 'totalVisits';

    let pipeline = [
      { $match: match },
      { $group: {
        _id: '$faculty',
        totalVisits: { $sum: 1 },
        completedVisits: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        avgDuration: { $avg: '$duration' },
        lastVisit: { $max: '$checkIn' },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'faculty' } },
      { $unwind: '$faculty' },
      { $project: {
        facultyName: '$faculty.name',
        email: '$faculty.email',
        department: '$faculty.department',
        totalVisits: 1, completedVisits: 1,
        avgDuration: { $round: ['$avgDuration', 1] },
        lastVisit: 1,
      }},
    ];

    // Filter by department
    if (department) {
      pipeline.push({ $match: { department: { $regex: department, $options: 'i' } } });
    }

    pipeline.push({ $sort: { [sortKey]: order === 'asc' ? 1 : -1 } });

    const data = await Visit.aggregate(pipeline);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};