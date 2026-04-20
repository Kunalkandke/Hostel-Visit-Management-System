const db = require('../data/db');

// Helper: get hostel filter for warden
async function getHostelFilter(user) {
  if (user.role === 'warden') {
    const w = await db.findUserById(user.id);
    if (w?.assignedHostel) return { hostel: w.assignedHostel._id || w.assignedHostel };
    return null; // warden with no hostel sees nothing
  }
  return {}; // admin sees everything
}

exports.getDashboardStats = async (req, res, next) => {
  try {
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: { activeCount: 0, todayCount: 0, monthCount: 0, hostelWise: [] } });
    const stats = await db.getDashboardStats(hostelFilter.hostel || null);
    res.json({ success: true, data: stats });
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

    const report = await db.getDailyReport(dateStr, hostelFilter.hostel || null, sortKey, sortOrder === 1 ? 'asc' : 'desc');

    res.json({
      success: true,
      data: {
        date: dateStr,
        stats: report.stats,
        visits: report.visits,
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
    const summary = await db.getMonthlyReport(month, year, hostelFilter.hostel || null);
    res.json({ success: true, data: { month, year, total: summary.total, dailyBreakdown: summary.dailyBreakdown } });
  } catch (err) { next(err); }
};

exports.getByHostel = async (req, res, next) => {
  try {
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: [] });

    const { from, to, sortBy = 'totalVisits', order = 'desc' } = req.query;
    const data = await db.getReportByHostel({ from, to, hostelId: hostelFilter.hostel || null, sortBy, order });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getByFaculty = async (req, res, next) => {
  try {
    const hostelFilter = await getHostelFilter(req.user);
    if (hostelFilter === null) return res.json({ success: true, data: [] });

    const { from, to, sortBy = 'totalVisits', order = 'desc', department } = req.query;
    const data = await db.getReportByFaculty({
      from,
      to,
      hostelId: hostelFilter.hostel || null,
      department,
      sortBy,
      order,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
