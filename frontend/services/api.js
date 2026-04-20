import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hostel-visit-management-system.onrender.com/api/v1';

// Log the API URL being used (only in browser)
if (typeof window !== 'undefined') {
  console.log('🔗 API URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('hvms_token');
    if (t) cfg.headers['Authorization'] = `Bearer ${t}`;
  }
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && typeof window !== 'undefined') {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export default api;
