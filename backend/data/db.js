const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const PURPOSES = ['inspection', 'student_meeting', 'routine_check', 'emergency', 'other'];

const toIsoOrNull = (v) => (v ? new Date(v).toISOString() : null);
const toDateOrNull = (v) => (v ? new Date(v) : null);
const asInt = (v) => (v == null ? null : Number(v));

const mapHostel = (row, warden) => ({
  _id: row.id,
  name: row.name,
  type: row.type,
  capacity: row.capacity,
  location: row.location,
  warden: warden
    ? { _id: warden._id || warden.id, name: warden.name, email: warden.email, phone: warden.phone || '' }
    : null,
  isActive: row.is_active,
  createdAt: toDateOrNull(row.created_at),
  updatedAt: toDateOrNull(row.updated_at),
});

const mapUser = (row, assignedHostel) => ({
  _id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role,
  department: row.department || '',
  phone: row.phone || '',
  profilePhoto: row.profile_photo || '',
  assignedHostel: assignedHostel || row.assigned_hostel || null,
  isActive: row.is_active,
  mustChangePassword: row.must_change_password,
  createdAt: toDateOrNull(row.created_at),
  updatedAt: toDateOrNull(row.updated_at),
});

const mapVisit = (row, faculty, hostel) => ({
  _id: row.id,
  faculty: faculty || row.faculty,
  hostel: hostel || row.hostel,
  purpose: row.purpose,
  purposeDetail: row.purpose_detail,
  checkIn: toDateOrNull(row.check_in),
  checkOut: toDateOrNull(row.check_out),
  duration: row.duration,
  status: row.status,
  facultyRemarks: row.faculty_remarks,
  wardenRemarks: row.warden_remarks,
  isVerified: row.is_verified,
  formSubmissions: row.form_submissions || [],
  createdAt: toDateOrNull(row.created_at),
  updatedAt: toDateOrNull(row.updated_at),
});

const throwIfError = (error, fallbackMessage) => {
  if (!error) return;
  const e = new Error(error.message || fallbackMessage || 'Database error');
  e.statusCode = 500;
  throw e;
};

const addRange = (query, page, limit) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const from = (p - 1) * l;
  const to = from + l - 1;
  return query.range(from, to);
};

const userSelect = `
  id, name, email, password, role, department, phone, profile_photo, assigned_hostel,
  is_active, must_change_password, created_at, updated_at
`;

const userSelectNoPassword = `
  id, name, email, role, department, phone, profile_photo, assigned_hostel,
  is_active, must_change_password, created_at, updated_at
`;

const hostelSelect = `
  id, name, type, capacity, location, warden, is_active, created_at, updated_at
`;

const visitSelectBase = `
  id, faculty, hostel, purpose, purpose_detail, check_in, check_out, duration, status,
  faculty_remarks, warden_remarks, is_verified, form_submissions, created_at, updated_at
`;

const visitSelectJoined = `
  ${visitSelectBase},
  faculty_user:users!visits_faculty_fkey (id, name, email, department, phone),
  hostel_data:hostels!visits_hostel_fkey (id, name, type, location, warden)
`;

async function initialize() {
  const { error } = await supabase.rpc('hvm_init_schema');
  if (error && !['PGRST202', '42883'].includes(String(error.code))) {
    const e = new Error(`Supabase init failed: ${error.message}`);
    e.statusCode = 500;
    throw e;
  }
}

async function testConnection() {
  const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' }).limit(1);
  throwIfError(error, 'Unable to connect to Supabase');
}

async function ensureAdminFromEnv() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@college.edu.in').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  const existing = await findUserByEmail(adminEmail, { includePassword: true });
  if (existing) return existing;

  return createUser({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    department: 'Administration',
    isActive: true,
    mustChangePassword: false,
  });
}

async function findUserById(id, options = {}) {
  const select = options.includePassword ? userSelect : userSelectNoPassword;
  const { data, error } = await supabase.from('users').select(select).eq('id', id).maybeSingle();
  throwIfError(error);
  if (!data) return null;

  let assignedHostel = null;
  if (data.assigned_hostel && options.includeAssignedHostel) {
    assignedHostel = await findHostelById(data.assigned_hostel, { includeWarden: false, includeInactive: true });
  }
  return mapUser(data, assignedHostel);
}

async function findUserByEmail(email, options = {}) {
  const select = options.includePassword ? userSelect : userSelectNoPassword;
  const { data, error } = await supabase.from('users').select(select).eq('email', email.toLowerCase()).maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return mapUser(data, null);
}

async function listUsers({ role, isActive, page = 1, limit = 20 }) {
  let query = supabase.from('users').select(`${userSelectNoPassword}`, { count: 'exact' }).order('created_at', { ascending: false });
  if (role) query = query.eq('role', role);
  if (isActive !== undefined && isActive !== '') query = query.eq('is_active', isActive === true || isActive === 'true');
  query = addRange(query, page, limit);
  const { data, error, count } = await query;
  throwIfError(error);

  const hostelIds = [...new Set((data || []).map((u) => u.assigned_hostel).filter(Boolean))];
  const hostelsById = await getHostelsByIds(hostelIds);

  return {
    total: count || 0,
    users: (data || []).map((row) => mapUser(row, hostelsById[row.assigned_hostel] || null)),
  };
}

async function createUser(input) {
  const hashed = await bcrypt.hash(input.password, 12);
  const payload = {
    name: input.name,
    email: input.email.toLowerCase(),
    password: hashed,
    role: input.role,
    department: input.department || '',
    phone: input.phone || '',
    profile_photo: input.profilePhoto || '',
    assigned_hostel: input.assignedHostel || null,
    is_active: input.isActive !== undefined ? !!input.isActive : true,
    must_change_password: input.mustChangePassword !== undefined ? !!input.mustChangePassword : false,
  };

  const { data, error } = await supabase.from('users').insert(payload).select(userSelectNoPassword).single();
  throwIfError(error);
  return mapUser(data, null);
}

async function updateUserById(id, updates) {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.isActive !== undefined) payload.is_active = !!updates.isActive;
  if (updates.assignedHostel !== undefined) payload.assigned_hostel = updates.assignedHostel;
  if (updates.mustChangePassword !== undefined) payload.must_change_password = !!updates.mustChangePassword;
  if (updates.password !== undefined) payload.password = await bcrypt.hash(updates.password, 12);

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', id)
    .select(userSelectNoPassword)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return mapUser(data, null);
}

async function listHostels({ includeInactive = false, includeWarden = false } = {}) {
  let query = supabase.from('hostels').select(hostelSelect).order('name', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  throwIfError(error);

  let wardensById = {};
  if (includeWarden) {
    const ids = [...new Set((data || []).map((h) => h.warden).filter(Boolean))];
    wardensById = await getUsersByIds(ids);
  }
  return (data || []).map((row) => mapHostel(row, wardensById[row.warden] || null));
}

async function getHostelsByIds(ids) {
  if (!ids.length) return {};
  const { data, error } = await supabase.from('hostels').select(hostelSelect).in('id', ids);
  throwIfError(error);
  const out = {};
  (data || []).forEach((row) => {
    out[row.id] = mapHostel(row, null);
  });
  return out;
}

async function getUsersByIds(ids) {
  if (!ids.length) return {};
  const { data, error } = await supabase.from('users').select(userSelectNoPassword).in('id', ids);
  throwIfError(error);
  const out = {};
  (data || []).forEach((row) => {
    out[row.id] = mapUser(row, null);
  });
  return out;
}

async function findHostelById(id, { includeWarden = false, includeInactive = true } = {}) {
  let query = supabase.from('hostels').select(hostelSelect).eq('id', id);
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query.maybeSingle();
  throwIfError(error);
  if (!data) return null;
  let warden = null;
  if (includeWarden && data.warden) warden = await findUserById(data.warden);
  return mapHostel(data, warden);
}

async function createHostel(input) {
  const payload = {
    name: input.name,
    type: input.type,
    capacity: Number(input.capacity),
    location: input.location,
    warden: input.warden || null,
    is_active: input.isActive !== undefined ? !!input.isActive : true,
  };
  const { data, error } = await supabase.from('hostels').insert(payload).select(hostelSelect).single();
  throwIfError(error);
  return mapHostel(data, null);
}

async function updateHostelById(id, updates) {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.capacity !== undefined) payload.capacity = Number(updates.capacity);
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.warden !== undefined) payload.warden = updates.warden;
  if (updates.isActive !== undefined) payload.is_active = !!updates.isActive;

  const { data, error } = await supabase
    .from('hostels')
    .update(payload)
    .eq('id', id)
    .select(hostelSelect)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  return mapHostel(data, null);
}

async function clearWardenAssignments(wardenId, exceptHostelId = null) {
  let query = supabase.from('hostels').update({ warden: null }).eq('warden', wardenId);
  if (exceptHostelId) query = query.neq('id', exceptHostelId);
  const { error } = await query;
  throwIfError(error);
}

async function createVisit(input) {
  if (!PURPOSES.includes(input.purpose)) {
    const e = new Error('Invalid purpose');
    e.statusCode = 400;
    throw e;
  }
  const payload = {
    faculty: input.faculty,
    hostel: input.hostel,
    purpose: input.purpose,
    purpose_detail: input.purposeDetail || null,
    check_in: toIsoOrNull(input.checkIn) || new Date().toISOString(),
    status: input.status || 'active',
    faculty_remarks: input.facultyRemarks || null,
    form_submissions: [],
  };
  const { data, error } = await supabase.from('visits').insert(payload).select(visitSelectBase).single();
  throwIfError(error);
  return mapVisit(data, null, null);
}

async function findVisitById(id, options = {}) {
  const select = options.includeRelations ? visitSelectJoined : visitSelectBase;
  const { data, error } = await supabase.from('visits').select(select).eq('id', id).maybeSingle();
  throwIfError(error);
  if (!data) return null;

  if (!options.includeRelations) return mapVisit(data, null, null);

  let hostel = null;
  if (data.hostel_data) {
    let warden = null;
    if (options.includeWardenInHostel && data.hostel_data.warden) {
      warden = await findUserById(data.hostel_data.warden);
    }
    hostel = mapHostel(
      {
        id: data.hostel_data.id,
        name: data.hostel_data.name,
        type: data.hostel_data.type,
        capacity: data.hostel_data.capacity || 0,
        location: data.hostel_data.location,
        warden: data.hostel_data.warden,
        is_active: true,
      },
      warden
    );
  }
  const faculty = data.faculty_user
    ? {
        _id: data.faculty_user.id,
        name: data.faculty_user.name,
        email: data.faculty_user.email,
        department: data.faculty_user.department || '',
        phone: data.faculty_user.phone || '',
      }
    : null;

  return mapVisit(data, faculty, hostel);
}

async function findOneVisit(filter = {}, options = {}) {
  let query = supabase.from('visits').select(options.includeRelations ? visitSelectJoined : visitSelectBase);
  if (filter.id) query = query.eq('id', filter.id);
  if (filter.faculty) query = query.eq('faculty', filter.faculty);
  if (filter.hostel) query = query.eq('hostel', filter.hostel);
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.fromCheckIn) query = query.gte('check_in', toIsoOrNull(filter.fromCheckIn));
  if (filter.toCheckIn) query = query.lte('check_in', toIsoOrNull(filter.toCheckIn));
  const { data, error } = await query.order('check_in', { ascending: false }).limit(1).maybeSingle();
  throwIfError(error);
  if (!data) return null;

  if (!options.includeRelations) return mapVisit(data, null, null);
  return findVisitById(data.id, options);
}

async function updateVisitById(id, updates, options = {}) {
  const payload = {};
  if (updates.checkOut !== undefined) payload.check_out = toIsoOrNull(updates.checkOut);
  if (updates.duration !== undefined) payload.duration = asInt(updates.duration);
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.facultyRemarks !== undefined) payload.faculty_remarks = updates.facultyRemarks;
  if (updates.wardenRemarks !== undefined) payload.warden_remarks = updates.wardenRemarks;
  if (updates.isVerified !== undefined) payload.is_verified = !!updates.isVerified;
  if (updates.formSubmissions !== undefined) payload.form_submissions = updates.formSubmissions;

  const { data, error } = await supabase.from('visits').update(payload).eq('id', id).select(visitSelectBase).maybeSingle();
  throwIfError(error);
  if (!data) return null;
  if (!options.includeRelations) return mapVisit(data, null, null);
  return findVisitById(id, options);
}

function applyVisitFilters(query, filter = {}) {
  let q = query;
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.hostel) q = q.eq('hostel', filter.hostel);
  if (filter.faculty) q = q.eq('faculty', filter.faculty);
  if (filter.fromCheckIn) q = q.gte('check_in', toIsoOrNull(filter.fromCheckIn));
  if (filter.toCheckIn) q = q.lte('check_in', toIsoOrNull(filter.toCheckIn));
  return q;
}

async function listVisits(filter = {}, { page = 1, limit = 20, includeRelations = true } = {}) {
  let query = supabase
    .from('visits')
    .select(includeRelations ? visitSelectJoined : visitSelectBase, { count: 'exact' })
    .order('check_in', { ascending: false });
  query = applyVisitFilters(query, filter);
  query = addRange(query, page, limit);
  const { data, error, count } = await query;
  throwIfError(error);
  if (!includeRelations) {
    return { total: count || 0, visits: (data || []).map((row) => mapVisit(row, null, null)) };
  }

  const wardenIds = [...new Set((data || []).map((v) => v.hostel_data?.warden).filter(Boolean))];
  const wardensById = await getUsersByIds(wardenIds);

  const visits = (data || []).map((row) => {
    const faculty = row.faculty_user
      ? {
          _id: row.faculty_user.id,
          name: row.faculty_user.name,
          email: row.faculty_user.email,
          department: row.faculty_user.department || '',
          phone: row.faculty_user.phone || '',
        }
      : null;
    const hostel = row.hostel_data
      ? mapHostel(
          {
            id: row.hostel_data.id,
            name: row.hostel_data.name,
            type: row.hostel_data.type,
            capacity: row.hostel_data.capacity || 0,
            location: row.hostel_data.location,
            warden: row.hostel_data.warden,
            is_active: true,
          },
          wardensById[row.hostel_data.warden] || null
        )
      : null;
    return mapVisit(row, faculty, hostel);
  });
  return { total: count || 0, visits };
}

async function countVisits(filter = {}) {
  let query = supabase.from('visits').select('id', { head: true, count: 'exact' });
  query = applyVisitFilters(query, filter);
  const { count, error } = await query;
  throwIfError(error);
  return count || 0;
}

function groupBy(items, keyFn) {
  const out = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(item);
  });
  return out;
}

async function getDashboardStats(hostelId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const filter = hostelId ? { hostel: hostelId } : {};

  const [activeCount, todayCount, monthCount, todayVisits] = await Promise.all([
    countVisits({ ...filter, status: 'active' }),
    countVisits({ ...filter, fromCheckIn: today }),
    countVisits({ ...filter, fromCheckIn: monthStart }),
    listVisits({ ...filter, fromCheckIn: today }, { page: 1, limit: 5000, includeRelations: true }),
  ]);

  const grouped = groupBy(todayVisits.visits, (v) => v.hostel?._id || 'unknown');
  const hostelWise = [...grouped.entries()].map(([id, visits]) => ({
    _id: id,
    hostelName: visits[0]?.hostel?.name || 'Unknown',
    type: visits[0]?.hostel?.type || '',
    count: visits.length,
  }));
  hostelWise.sort((a, b) => b.count - a.count);

  return { activeCount, todayCount, monthCount, hostelWise };
}

async function getDailyReport(dateStr, hostelId = null, sortBy = 'checkIn', order = 'desc') {
  const date = new Date(dateStr);
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const filter = { fromCheckIn: date, toCheckIn: next };
  if (hostelId) filter.hostel = hostelId;
  const { visits } = await listVisits(filter, { page: 1, limit: 5000, includeRelations: true });

  const sorter = {
    checkIn: (v) => +new Date(v.checkIn),
    duration: (v) => v.duration || 0,
    purpose: (v) => v.purpose || '',
    faculty: (v) => v.faculty?.name || '',
    hostel: (v) => v.hostel?.name || '',
  };
  const fn = sorter[sortBy] || sorter.checkIn;
  visits.sort((a, b) => {
    const av = fn(a);
    const bv = fn(b);
    if (typeof av === 'string') return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return order === 'asc' ? av - bv : bv - av;
  });

  const durations = visits.filter((v) => v.duration);
  const avgDuration = durations.length
    ? Number((durations.reduce((sum, v) => sum + v.duration, 0) / durations.length).toFixed(1))
    : 0;

  return {
    visits,
    stats: {
      totalVisits: visits.length,
      completed: visits.filter((v) => v.status === 'completed').length,
      active: visits.filter((v) => v.status === 'active').length,
      avgDuration,
    },
  };
}

async function getMonthlyReport(month, year, hostelId = null) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const filter = { fromCheckIn: start, toCheckIn: end };
  if (hostelId) filter.hostel = hostelId;
  const { visits } = await listVisits(filter, { page: 1, limit: 10000, includeRelations: false });

  const grouped = groupBy(visits, (v) => new Date(v.checkIn).toISOString().slice(0, 10));
  const dailyBreakdown = [...grouped.entries()]
    .map(([d, rows]) => ({
      _id: d,
      count: rows.length,
      completed: rows.filter((v) => v.status === 'completed').length,
    }))
    .sort((a, b) => a._id.localeCompare(b._id));

  return { total: visits.length, dailyBreakdown };
}

async function getReportByHostel({ from, to, hostelId = null, sortBy = 'totalVisits', order = 'desc' } = {}) {
  const filter = {};
  if (from) filter.fromCheckIn = new Date(from);
  if (to) filter.toCheckIn = new Date(to);
  if (hostelId) filter.hostel = hostelId;
  const { visits } = await listVisits(filter, { page: 1, limit: 10000, includeRelations: true });

  const grouped = groupBy(visits, (v) => v.hostel?._id || 'unknown');
  const data = [...grouped.values()].map((rows) => {
    const durations = rows.filter((v) => v.duration);
    return {
      _id: rows[0]?.hostel?._id || null,
      hostelName: rows[0]?.hostel?.name || 'Unknown',
      type: rows[0]?.hostel?.type || '',
      totalVisits: rows.length,
      completedVisits: rows.filter((v) => v.status === 'completed').length,
      avgDuration: durations.length
        ? Number((durations.reduce((s, v) => s + v.duration, 0) / durations.length).toFixed(1))
        : 0,
    };
  });

  const validSorts = ['totalVisits', 'completedVisits', 'avgDuration'];
  const key = validSorts.includes(sortBy) ? sortBy : 'totalVisits';
  data.sort((a, b) => (order === 'asc' ? a[key] - b[key] : b[key] - a[key]));
  return data;
}

async function getReportByFaculty({
  from,
  to,
  hostelId = null,
  department,
  sortBy = 'totalVisits',
  order = 'desc',
} = {}) {
  const filter = {};
  if (from) filter.fromCheckIn = new Date(from);
  if (to) filter.toCheckIn = new Date(to);
  if (hostelId) filter.hostel = hostelId;
  const { visits } = await listVisits(filter, { page: 1, limit: 10000, includeRelations: true });

  const grouped = groupBy(visits, (v) => v.faculty?._id || 'unknown');
  let data = [...grouped.values()].map((rows) => {
    const durations = rows.filter((v) => v.duration);
    return {
      _id: rows[0]?.faculty?._id || null,
      facultyName: rows[0]?.faculty?.name || 'Unknown',
      email: rows[0]?.faculty?.email || '',
      department: rows[0]?.faculty?.department || '',
      totalVisits: rows.length,
      completedVisits: rows.filter((v) => v.status === 'completed').length,
      avgDuration: durations.length
        ? Number((durations.reduce((s, v) => s + v.duration, 0) / durations.length).toFixed(1))
        : 0,
      lastVisit: rows.reduce((max, v) => {
        if (!max) return v.checkIn;
        return new Date(v.checkIn) > new Date(max) ? v.checkIn : max;
      }, null),
    };
  });

  if (department) {
    const d = department.toLowerCase();
    data = data.filter((r) => (r.department || '').toLowerCase().includes(d));
  }

  const validSorts = ['totalVisits', 'completedVisits', 'avgDuration', 'lastVisit'];
  const key = validSorts.includes(sortBy) ? sortBy : 'totalVisits';
  data.sort((a, b) => {
    if (key === 'lastVisit') {
      const av = a.lastVisit ? +new Date(a.lastVisit) : 0;
      const bv = b.lastVisit ? +new Date(b.lastVisit) : 0;
      return order === 'asc' ? av - bv : bv - av;
    }
    return order === 'asc' ? a[key] - b[key] : b[key] - a[key];
  });
  return data;
}

async function updateVisitForm(visitId, formType, data) {
  const visit = await findVisitById(visitId, { includeRelations: false });
  if (!visit) return null;
  const current = Array.isArray(visit.formSubmissions) ? [...visit.formSubmissions] : [];
  const idx = current.findIndex((f) => f.formType === formType);
  const payload = { formType, data, submittedAt: new Date().toISOString() };
  if (idx >= 0) current[idx] = payload;
  else current.push(payload);
  return updateVisitById(visitId, { formSubmissions: current }, { includeRelations: false });
}

module.exports = {
  initialize,
  testConnection,
  ensureAdminFromEnv,
  findUserById,
  findUserByEmail,
  listUsers,
  createUser,
  updateUserById,
  listHostels,
  findHostelById,
  createHostel,
  updateHostelById,
  clearWardenAssignments,
  createVisit,
  findVisitById,
  findOneVisit,
  updateVisitById,
  listVisits,
  countVisits,
  getDashboardStats,
  getDailyReport,
  getMonthlyReport,
  getReportByHostel,
  getReportByFaculty,
  updateVisitForm,
};
