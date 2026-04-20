import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
};

export const visitService = {
  startVisit: (data) => api.post('/visits/start', data),
  endVisit: (id, data) => api.patch(`/visits/${id}/end`, data),
  getMyVisits: (p) => api.get('/visits/my', { params: p }),
  getActiveVisits: () => api.get('/visits/active'),
  getAllVisits: (p) => api.get('/visits', { params: p }),
  getVisitById: (id) => api.get(`/visits/${id}`),
  verifyVisit: (id, data) => api.patch(`/visits/${id}/verify`, data),
};

export const hostelService = {
  getAll: () => api.get('/hostels'),
  getById: (id) => api.get(`/hostels/${id}`),
  create: (data) => api.post('/hostels', data),
  update: (id, data) => api.put(`/hostels/${id}`, data),
  assignWarden: (id, wardenId) => api.patch(`/hostels/${id}/warden`, { wardenId }),
  delete: (id) => api.delete(`/hostels/${id}`),
};

export const adminService = {
  getUsers: (p) => api.get('/users', { params: p }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  resetPassword: (id) => api.patch(`/users/${id}/reset-password`),
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  getDailyReport: (date, extra = {}) => api.get('/reports/daily', { params: { date, ...extra } }),
  getMonthlyReport: (m, y) => api.get('/reports/monthly', { params: { month: m, year: y } }),
  getByHostelReport: (p) => api.get('/reports/by-hostel', { params: p }),
  getByFacultyReport: (p) => api.get('/reports/by-faculty', { params: p }),
};

export const getErr = (err) => {
  if (!err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK')) {
    return 'Cannot connect to server. Please check your internet connection or contact support.';
  }
  return err?.response?.data?.message || err?.message || 'Something went wrong';
};