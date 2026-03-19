'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

const AuthContext = createContext(null);
const VisitContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('hvms_token');
    const u = localStorage.getItem('hvms_user');
    if (t && u) {
      setUser(JSON.parse(u));
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('hvms_token', token);
    localStorage.setItem('hvms_user', JSON.stringify(u));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data.data;
      setUser(u);
      localStorage.setItem('hvms_user', JSON.stringify(u));
      return u;
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function VisitProvider({ children }) {
  const [activeVisit, setActiveVisit] = useState(null);
  useEffect(() => {
    const v = localStorage.getItem('hvms_av');
    if (v) setActiveVisit(JSON.parse(v));
  }, []);
  const setVisit = (v) => {
    setActiveVisit(v);
    if (v) localStorage.setItem('hvms_av', JSON.stringify(v));
    else localStorage.removeItem('hvms_av');
  };
  return <VisitContext.Provider value={{ activeVisit, setVisit }}>{children}</VisitContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const useVisit = () => useContext(VisitContext);
