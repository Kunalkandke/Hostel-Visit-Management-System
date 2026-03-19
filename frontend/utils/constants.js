export const PURPOSES = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'student_meeting', label: 'Student Meeting' },
  { value: 'routine_check', label: 'Routine Check' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' },
];

export const getPurpose = (v) => PURPOSES.find(p => p.value === v)?.label || v;

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDuration = (m) => {
  if (!m && m !== 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
};

export const initials = (name = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

export const roleColor = {
  admin: 'badge-admin',
  faculty: 'badge-faculty',
  warden: 'badge-warden',
};

export const purposeIcon = {
  inspection: '🔍',
  student_meeting: '🤝',
  routine_check: '📋',
  emergency: '🚨',
  other: '📌',
};
