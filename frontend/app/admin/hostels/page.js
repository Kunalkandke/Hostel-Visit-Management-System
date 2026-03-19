'use client';
import { useState, useEffect, useCallback } from 'react';
import withAuth from '../../../utils/withAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Modal, EmptyState, Spinner, ConfirmDialog } from '../../../components/common/index';
import { hostelService, adminService, getErr } from '../../../services/index';
import toast from 'react-hot-toast';

// ⚠️ MUST be defined OUTSIDE the page component — defining inside causes re-mount
// on every keystroke and makes the keyboard lose focus
function HostelFields({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Hostel Name</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. Boys Hostel Block A"
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Location</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. North Campus, Building 3"
          value={data.location}
          onChange={e => onChange('location', e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="select" value={data.type} onChange={e => onChange('type', e.target.value)}>
            <option value="boys">👦 Boys</option>
            <option value="girls">👧 Girls</option>
          </select>
        </div>
        <div>
          <label className="label">Capacity</label>
          <input
            type="number"
            className="input"
            placeholder="150"
            min="1"
            value={data.capacity}
            onChange={e => onChange('capacity', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}

function AdminHostelsPage() {
  const [hostels, setHostels] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [wardenModal, setWardenModal] = useState(null);
  const [selectedWarden, setSelectedWarden] = useState('');
  const [form, setForm] = useState({ name: '', type: 'boys', capacity: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadHostels = useCallback(async () => {
    setLoading(true);
    try { const r = await hostelService.getAll(); setHostels(r.data.data); }
    catch (e) { toast.error(getErr(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadHostels();
    adminService.getUsers({ role: 'warden', isActive: 'true', limit: 100 })
      .then(r => setWardens(r.data.data.users)).catch(() => {});
  }, [loadHostels]);

  const handleFormChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEditChange = useCallback((key, value) => {
    setEditModal(prev => ({ ...prev, [key]: value }));
  }, []);

  const doCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await hostelService.create({ ...form, capacity: Number(form.capacity) });
      setCreateModal(false);
      setForm({ name: '', type: 'boys', capacity: '', location: '' });
      loadHostels();
      toast.success('Hostel created!');
    } catch (e) { toast.error(getErr(e)); }
    finally { setSaving(false); }
  };

  const doUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await hostelService.update(editModal._id, {
        name: editModal.name, type: editModal.type,
        capacity: Number(editModal.capacity), location: editModal.location,
      });
      setEditModal(null); loadHostels(); toast.success('Updated!');
    } catch (e) { toast.error(getErr(e)); }
    finally { setSaving(false); }
  };

  const doAssignWarden = async () => {
    if (!selectedWarden) return toast.error('Select a warden');
    setSaving(true);
    try {
      await hostelService.assignWarden(wardenModal._id, selectedWarden);
      setWardenModal(null); loadHostels(); toast.success('Warden assigned!');
    } catch (e) { toast.error(getErr(e)); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await hostelService.delete(confirmDelete._id);
      setConfirmDelete(null); loadHostels(); toast.success('Hostel deactivated');
    } catch (e) { toast.error(getErr(e)); }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="page-header mb-0">
          <h1 className="page-title">Hostel Management</h1>
          <p className="page-sub">{hostels.length} active hostels</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Hostel
        </button>
      </div>

      {loading ? <Spinner /> : hostels.length === 0 ? (
        <EmptyState icon="🏠" title="No hostels yet" action={<button onClick={() => setCreateModal(true)} className="btn-primary">Add First Hostel</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {hostels.map(h => (
            <div key={h._id} className="card hover:shadow-card-hover transition-shadow animate-fade-up">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${h.type === 'boys' ? 'bg-blue-50' : 'bg-pink-50'}`}>
                  {h.type === 'boys' ? '👦' : '👧'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 leading-tight">{h.name}</h3>
                  <span className={`badge text-xs mt-1 ${h.type === 'boys' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                    {h.type}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-slate-400">Capacity</span><span className="font-semibold">{h.capacity} students</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Location</span><span className="font-semibold text-right max-w-[55%] truncate text-xs">{h.location}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Warden</span>
                  {h.warden ? (
                    <span className="font-semibold text-emerald-700 text-xs">{h.warden.name}</span>
                  ) : (
                    <span className="text-amber-500 text-xs font-semibold">⚠ Unassigned</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 border-t border-slate-100 pt-3">
                <button onClick={() => setEditModal({ ...h })} className="btn-ghost btn-sm flex-1 text-blue-600">Edit</button>
                <button onClick={() => { setWardenModal(h); setSelectedWarden(h.warden?._id || ''); }} className="btn-ghost btn-sm flex-1 text-amber-600">Warden</button>
                <button onClick={() => setConfirmDelete(h)} className="btn-ghost btn-sm flex-1 text-red-500">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Add New Hostel">
        <form onSubmit={doCreate} className="space-y-4">
          <HostelFields data={form} onChange={handleFormChange} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <><span className="spinner" />Creating...</> : 'Create Hostel'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Hostel">
        {editModal && (
          <form onSubmit={doUpdate} className="space-y-4">
            <HostelFields data={editModal} onChange={handleEditChange} />
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <><span className="spinner" />Saving...</> : 'Save Changes'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!wardenModal} onClose={() => setWardenModal(null)} title="Assign Warden">
        {wardenModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Assign a warden to <strong>{wardenModal.name}</strong>.</p>
            <div><label className="label">Select Warden</label>
              <select className="select" value={selectedWarden} onChange={e => setSelectedWarden(e.target.value)}>
                <option value="">— Choose a warden —</option>
                {wardens.map(w => <option key={w._id} value={w._id}>{w.name} ({w.email})</option>)}
              </select></div>
            <div className="flex gap-3">
              <button onClick={() => setWardenModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={doAssignWarden} disabled={saving} className="btn-primary flex-1">{saving ? <><span className="spinner" />Assigning...</> : 'Assign'}</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={doDelete}
        title="Deactivate Hostel" message={`Deactivate "${confirmDelete?.name}"? This won't delete visit records.`} danger />
    </DashboardLayout>
  );
}

export default withAuth(AdminHostelsPage, ['admin']);
