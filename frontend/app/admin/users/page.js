'use client';
import { useState, useEffect, useCallback } from 'react';
import withAuth from '../../../utils/withAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Modal, Pagination, EmptyState, Spinner, ConfirmDialog } from '../../../components/common/index';
import { adminService, hostelService, getErr } from '../../../services/index';
import { initials } from '../../../utils/constants';
import toast from 'react-hot-toast';

const ROLES = ['faculty', 'warden'];
const roleBadge = { admin: 'badge-admin', faculty: 'badge-faculty', warden: 'badge-warden' };
const EMPTY_FORM = { name: '', email: '', role: 'faculty', department: '', phone: '', assignedHostel: '' };

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [pg, setPg] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ role: '', isActive: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [newUserResult, setNewUserResult] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filters.role) params.role = filters.role;
      if (filters.isActive !== '') params.isActive = filters.isActive;
      const res = await adminService.getUsers(params);
      setUsers(res.data.data.users);
      setPg(res.data.data.pagination);
    } catch (e) { toast.error(getErr(e)); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);
  useEffect(() => { hostelService.getAll().then(r => setHostels(r.data.data)).catch(() => {}); }, []);

  const doCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    if (form.role === 'warden' && !form.assignedHostel) return toast.error('Select a hostel for this warden');
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone };
      if (form.role === 'warden') payload.assignedHostel = form.assignedHostel;
      else payload.department = form.department;
      const res = await adminService.createUser(payload);
      setNewUserResult(res.data.data);
      setCreateModal(false);
      setForm(EMPTY_FORM);
      fetchUsers(1);
      toast.success('User created & email sent!');
    } catch (e) { toast.error(getErr(e)); }
    finally { setSaving(false); }
  };

  const doUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await adminService.updateUser(editModal._id, { name: editModal.name, department: editModal.department, phone: editModal.phone });
      setEditModal(null); fetchUsers(pg.page); toast.success('User updated');
    } catch (e) { toast.error(getErr(e)); }
    finally { setSaving(false); }
  };

  const doToggle = async () => {
    try {
      await adminService.toggleStatus(confirmToggle._id, !confirmToggle.isActive);
      toast.success(`User ${!confirmToggle.isActive ? 'activated' : 'deactivated'}`);
      setConfirmToggle(null); fetchUsers(pg.page);
    } catch (e) { toast.error(getErr(e)); }
  };

  const doResetPwd = async (u) => {
    if (!confirm(`Reset password for ${u.name}? A new password will be emailed to them.`)) return;
    try { await adminService.resetPassword(u._id); toast.success(`Password reset & emailed to ${u.email}`); }
    catch (e) { toast.error(getErr(e)); }
  };

  const displayed = search.trim()
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">{pg.total} total users</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setCreateModal(true); }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      <div className="card mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Search</label>
            <input className="input" placeholder="Name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="select" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}>
              <option value="">All Roles</option>
              <option value="faculty">Faculty</option>
              <option value="warden">Warden</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={filters.isActive} onChange={e => setFilters({ ...filters, isActive: e.target.value })}>
              <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? <Spinner text="Loading users..." /> : displayed.length === 0 ? (
        <EmptyState icon="👥" title="No users found" subtitle="Add a faculty or warden using the button above" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>User</th><th>Role</th><th>Dept / Hostel</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {displayed.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                          style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${roleBadge[u.role] || 'badge-faculty'}`}>{u.role}</span></td>
                    <td className="text-slate-600 text-sm">
                      {u.role === 'warden'
                        ? (u.assignedHostel?.name || <span className="text-amber-500 text-xs">⚠ Unassigned</span>)
                        : (u.department || '—')}
                    </td>
                    <td className="text-slate-600 text-sm">{u.phone || '—'}</td>
                    <td>
                      <span className={u.isActive ? 'badge bg-emerald-50 text-emerald-700 border border-emerald-200' : 'badge-inactive'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEditModal({ ...u })} className="btn-ghost btn-sm text-blue-600 hover:bg-blue-50">Edit</button>
                        <button onClick={() => setConfirmToggle(u)} className={`btn-ghost btn-sm ${u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => doResetPwd(u)} className="btn-ghost btn-sm text-slate-500">Reset Pwd</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pg.page} pages={pg.pages} total={pg.total} onPage={fetchUsers} />
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Add New User" maxWidth="max-w-lg">
        <form onSubmit={doCreate} className="space-y-4">
          <div>
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(r => (
                <button type="button" key={r} onClick={() => setForm(prev => ({ ...prev, role: r, assignedHostel: '', department: '' }))}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${form.role === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {r === 'faculty' ? '👩‍🏫 Faculty' : '🏠 Warden'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Full Name *</label>
            <input type="text" className="input" placeholder="e.g. Dr. Priya Sharma" value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Email Address *</label>
            <input type="email" className="input" placeholder="user@college.edu.in" value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input" placeholder="+91 9876543210" value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} />
          </div>
          {form.role === 'faculty' ? (
            <div>
              <label className="label">Department</label>
              <input type="text" className="input" placeholder="e.g. Computer Science" value={form.department}
                onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))} />
            </div>
          ) : (
            <div>
              <label className="label">Assign Hostel *</label>
              <select className="select" value={form.assignedHostel}
                onChange={e => setForm(prev => ({ ...prev, assignedHostel: e.target.value }))} required>
                <option value="">— Select hostel —</option>
                {hostels.map(h => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.type}) {h.warden ? '• has warden' : '• no warden'}
                  </option>
                ))}
              </select>
              {hostels.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ Create a hostel first before adding a warden.</p>}
            </div>
          )}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-semibold">📧 Welcome email with credentials will be sent automatically.</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><span className="spinner" />Creating...</> : 'Create & Send Email'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Credentials display */}
      <Modal open={!!newUserResult} onClose={() => setNewUserResult(null)} title="✓ User Created">
        {newUserResult && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-800 font-medium">
              ✓ Account created. Welcome email sent to <strong>{newUserResult.user?.email}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl font-mono text-sm space-y-2 border border-slate-200">
              <div><span className="text-slate-500">Email: </span><span className="font-bold">{newUserResult.user?.email}</span></div>
              <div><span className="text-slate-500">Temp Password: </span><span className="font-extrabold text-red-600 text-lg tracking-widest">{newUserResult.tempPassword}</span></div>
            </div>
            <p className="text-xs text-slate-400">⚠ Save this — it won't be shown again. User must change it on first login.</p>
            <button onClick={() => setNewUserResult(null)} className="btn-primary w-full">Done</button>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit User">
        {editModal && (
          <form onSubmit={doUpdate} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={editModal.name || ''} onChange={e => setEditModal(p => ({ ...p, name: e.target.value }))} required />
            </div>
            {editModal.role !== 'warden' && (
              <div>
                <label className="label">Department</label>
                <input className="input" value={editModal.department || ''} onChange={e => setEditModal(p => ({ ...p, department: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="label">Phone</label>
              <input className="input" value={editModal.phone || ''} onChange={e => setEditModal(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <><span className="spinner" />Saving...</> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={doToggle}
        title={confirmToggle?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${confirmToggle?.isActive ? 'deactivate' : 'activate'} ${confirmToggle?.name}?`}
        danger={confirmToggle?.isActive} />
    </DashboardLayout>
  );
}

export default withAuth(AdminUsersPage, ['admin']);
