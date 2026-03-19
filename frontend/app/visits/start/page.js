'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '../../../utils/withAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Modal } from '../../../components/common/index';
import { visitService, hostelService, getErr } from '../../../services/index';
import { useVisit } from '../../../context/index';
import { PURPOSES, fmtDateTime } from '../../../utils/constants';
import toast from 'react-hot-toast';

function StartVisitPage() {
  const router = useRouter();
  const { activeVisit, setVisit } = useVisit();
  const [hostels, setHostels] = useState([]);
  const [form, setForm] = useState({ hostelId: '', purpose: '', purposeDetail: '', facultyRemarks: '' });
  const [loading, setLoading] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true);
  const [done, setDone] = useState(null);
  const [endModal, setEndModal] = useState(false);
  const [endRemarks, setEndRemarks] = useState('');
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    hostelService.getAll().then(r => setHostels(r.data.data)).catch(() => {});
    // Always check server for active visit (don't rely only on context)
    visitService.getMyVisits({ status: 'active', limit: 1 })
      .then(r => {
        if (r.data.data.visits[0]) setVisit(r.data.data.visits[0]);
      })
      .catch(() => {})
      .finally(() => setCheckingActive(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.hostelId || !form.purpose) return toast.error('Select hostel and purpose');
    setLoading(true);
    try {
      const res = await visitService.startVisit(form);
      setVisit(res.data.data);
      setDone(res.data.data);
      toast.success('Visit started! Check-in recorded.');
    } catch (err) {
      // If backend returns "already have active visit" error
      if (err?.response?.data?.message?.includes('active visit')) {
        toast.error('You already have an active visit. End it first.');
        // Refresh active visit from server
        visitService.getMyVisits({ status: 'active', limit: 1 })
          .then(r => { if (r.data.data.visits[0]) setVisit(r.data.data.visits[0]); });
      } else {
        toast.error(getErr(err));
      }
    } finally { setLoading(false); }
  };

  const doEndVisit = async () => {
    setEnding(true);
    try {
      await visitService.endVisit(activeVisit._id, { facultyRemarks: endRemarks });
      setVisit(null);
      setEndModal(false);
      setEndRemarks('');
      toast.success('Visit ended. Warden notified via email.');
    } catch (e) { toast.error(getErr(e)); }
    finally { setEnding(false); }
  };

  // Loading check
  if (checkingActive) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  // ── ACTIVE VISIT EXISTS — show end visit UI ──
  if (activeVisit) return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <div className="page-header">
          <h1 className="page-title">Visit In Progress</h1>
          <p className="page-sub">You must end your current visit before starting a new one</p>
        </div>

        {/* Active visit card */}
        <div className="rounded-2xl overflow-hidden shadow-card animate-fade-up"
          style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%)' }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Active Visit</p>
                <h2 className="text-xl font-extrabold text-white">{activeVisit.hostel?.name}</h2>
              </div>
            </div>
            <div className="space-y-2 text-sm mb-6">
              {[
                ['Purpose', PURPOSES.find(p => p.value === activeVisit.purpose)?.label],
                ['Check-in Time', fmtDateTime(activeVisit.checkIn)],
                ['Status', 'Currently Inside'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-emerald-200">{k}</span>
                  <span className="font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEndModal(true)}
              className="w-full py-3 rounded-xl bg-white text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
            >
              End This Visit
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">
            ⚠ You cannot start a new visit while one is in progress. Please end your current visit first.
          </p>
        </div>

        <button onClick={() => router.push('/visits/history')} className="btn-secondary w-full mt-4">
          View Visit History
        </button>
      </div>

      {/* End Visit Modal */}
      <Modal open={endModal} onClose={() => setEndModal(false)} title="End Hostel Visit">
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
            Ending visit at <strong>{activeVisit.hostel?.name}</strong>. The warden will be notified via email.
          </div>
          <div>
            <label className="label">Remarks (Optional)</label>
            <textarea className="textarea" rows={3} placeholder="Any observations or notes..."
              value={endRemarks} onChange={e => setEndRemarks(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEndModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={doEndVisit} disabled={ending} className="btn-danger flex-1">
              {ending ? <><span className="spinner" />Ending...</> : 'End Visit'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );

  // ── SUCCESS SCREEN ──
  if (done) return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto animate-fade-up">
        <div className="card text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">Visit Started!</h2>
          <p className="text-sm text-slate-400 mb-7">Your check-in has been recorded.</p>
          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 mb-6 text-sm">
            {[
              ['Hostel', done.hostel?.name],
              ['Purpose', PURPOSES.find(p => p.value === done.purpose)?.label],
              ['Check-in', fmtDateTime(done.checkIn)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="btn-secondary flex-1">Dashboard</button>
            <button onClick={() => router.push('/visits/history')} className="btn-primary flex-1">View History</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  // ── START VISIT FORM ──
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <div className="page-header">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-3 font-medium">
            ← Back
          </button>
          <h1 className="page-title">Start Hostel Visit</h1>
          <p className="page-sub">Fill in the details to log your check-in</p>
        </div>

        <div className="card animate-fade-up">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">Select Hostel *</label>
              <select className="select" value={form.hostelId}
                onChange={e => setForm(prev => ({ ...prev, hostelId: e.target.value }))} required>
                <option value="">— Choose a hostel —</option>
                {hostels.map(h => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.type === 'boys' ? '👦 Boys' : '👧 Girls'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Visit Purpose *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PURPOSES.map(p => (
                  <button type="button" key={p.value}
                    onClick={() => setForm(prev => ({ ...prev, purpose: p.value }))}
                    className={`p-3 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
                      form.purpose === p.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    <div className="text-lg mb-1">
                      {{ inspection: '🔍', student_meeting: '🤝', routine_check: '📋', emergency: '🚨', other: '📌' }[p.value]}
                    </div>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {form.purpose === 'other' && (
              <div className="animate-fade-up">
                <label className="label">Describe Purpose</label>
                <input className="input" placeholder="Briefly describe the purpose..."
                  value={form.purposeDetail}
                  onChange={e => setForm(prev => ({ ...prev, purposeDetail: e.target.value }))} />
              </div>
            )}

            <div>
              <label className="label">Remarks (Optional)</label>
              <textarea className="textarea" rows={3} placeholder="Any additional notes..."
                value={form.facultyRemarks}
                onChange={e => setForm(prev => ({ ...prev, facultyRemarks: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading || !form.hostelId || !form.purpose} className="btn-primary flex-1">
                {loading ? <><span className="spinner" />Starting...</> : '▶ Start Visit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(StartVisitPage, ['faculty']);
