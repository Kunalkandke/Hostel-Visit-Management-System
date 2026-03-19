'use client';
import { useState } from 'react';
import withAuth from '../../utils/withAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/index';
import { authService, getErr } from '../../services/index';
import { initials, roleColor } from '../../utils/constants';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await authService.updateProfile(form);
      const updated = res.data.data;
      setUser(updated);
      localStorage.setItem('hvms_user', JSON.stringify(updated));
      toast.success('Profile updated successfully');
    } catch (err) { toast.error(getErr(err)); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) return toast.error('All fields required');
    if (pwd.newPassword !== pwd.confirm) return toast.error('Passwords do not match');
    if (pwd.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setChanging(true);
    try {
      await authService.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password changed successfully');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(getErr(err)); }
    finally { setChanging(false); }
  };

  const roleBadgeClass = { admin: 'badge-admin', faculty: 'badge-faculty', warden: 'badge-warden' };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">Manage your account details and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Avatar card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
              {initials(user?.name)}
            </div>
            <h2 className="font-bold text-slate-900 text-base">{user?.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">{user?.email}</p>
            <span className={`badge ${roleBadgeClass[user?.role]} mx-auto`}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            {user?.department && (
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">{user.department}</p>
            )}
            {user?.assignedHostel && (
              <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                <p className="text-xs font-semibold text-amber-700">🏠 {user.assignedHostel.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1 w-fit">
            {[['profile', '👤 Profile Info'], ['security', '🔐 Security']].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${tab === t ? 'bg-navy-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="card animate-fade-up">
              <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span>Personal Information</span>
              </h3>
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" required />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input className="input bg-slate-50 cursor-not-allowed" value={user?.email} disabled
                      title="Email cannot be changed" />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input className="input" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input className="input" value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" />
                  </div>
                </div>

                <div className="divider" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</p>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{user?.role}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Member Since</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <><span className="spinner" />Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className="card animate-fade-up">
              <h3 className="font-bold text-slate-900 mb-1">Change Password</h3>
              <p className="text-sm text-slate-400 mb-6">Use a strong password with letters, numbers, and symbols.</p>

              <form onSubmit={changePassword} className="space-y-5 max-w-md">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input" value={pwd.currentPassword}
                    onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })}
                    placeholder="Enter current password" autoComplete="current-password" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" value={pwd.newPassword}
                    onChange={e => setPwd({ ...pwd, newPassword: e.target.value })}
                    placeholder="Min. 8 characters" autoComplete="new-password" />
                  {pwd.newPassword && (
                    <div className="mt-2 flex gap-1.5">
                      {[
                        pwd.newPassword.length >= 8,
                        /[A-Z]/.test(pwd.newPassword),
                        /[0-9]/.test(pwd.newPassword),
                        /[^A-Za-z0-9]/.test(pwd.newPassword),
                      ].map((ok, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">Must be 8+ chars with uppercase, number, and symbol</p>
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className={`input ${pwd.confirm && pwd.confirm !== pwd.newPassword ? 'input-error' : ''}`}
                    value={pwd.confirm}
                    onChange={e => setPwd({ ...pwd, confirm: e.target.value })}
                    placeholder="Re-enter new password" autoComplete="new-password" />
                  {pwd.confirm && pwd.confirm !== pwd.newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700 font-semibold mb-1">🔐 Security Tips</p>
                  <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
                    <li>Never share your password with anyone</li>
                    <li>Use a unique password not used elsewhere</li>
                    <li>Change your password periodically</li>
                  </ul>
                </div>

                <button type="submit" disabled={changing} className="btn-primary">
                  {changing ? <><span className="spinner" />Changing...</> : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ProfilePage);
