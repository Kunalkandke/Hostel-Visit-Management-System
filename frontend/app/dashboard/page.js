'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useVisit } from '../../context/index';
import withAuth from '../../utils/withAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Spinner, Modal, EmptyState } from '../../components/common/index';
import { adminService, visitService, getErr } from '../../services/index';
import { fmtDateTime, fmtDuration, getPurpose } from '../../utils/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import VisitFormModal from '../../components/VisitFormModal';

function Dashboard() {
  const { user } = useAuth();
  const { activeVisit, setVisit } = useVisit();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [endModal, setEndModal] = useState(false);
  const [endRemarks, setEndRemarks] = useState('');
  const [ending, setEnding] = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [completedVisit, setCompletedVisit] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user.role !== 'faculty') {
        const [s, a] = await Promise.all([adminService.getDashboardStats(), visitService.getActiveVisits()]);
        setStats(s.data.data);
        setActive(a.data.data);
      } else {
        const r = await visitService.getMyVisits({ status: 'active', limit: 1 });
        if (r.data.data.visits[0]) setVisit(r.data.data.visits[0]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const doEndVisit = async () => {
    setEnding(true);
    try {
      await visitService.endVisit(activeVisit._id, { facultyRemarks: endRemarks });
      const ended = { ...activeVisit, checkOut: new Date(), status: 'completed' };
      setVisit(null);
      setEndModal(false);
      setCompletedVisit(ended);
      setFormModal(true);
      toast.success('Visit ended. Warden notified via email.');
      loadData();
    } catch (e) { toast.error(getErr(e)); }
    finally { setEnding(false); }
  };

  const chartData = stats?.hostelWise?.map(h => ({
    name: h.hostelName?.split(' ').slice(-2).join(' ') || h.hostelName,
    visits: h.count,
  })) || [];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
  };
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{today}</p>
          <h1 className="page-title">
            {user.role === 'faculty' ? (() => { const h = new Date().getHours(); const g = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night'; return `Good ${g}, ${user.name.split(' ')[0]} 👋`; })() : 'Dashboard Overview'}
          </h1>
          <p className="page-sub">
            {user.role === 'admin' && 'System-wide visit activity and statistics'}
            {user.role === 'warden' && 'Live activity for your assigned hostel'}
            {user.role === 'faculty' && 'Manage your hostel visits from here'}
          </p>
        </div>
        {user.role === 'faculty' && !activeVisit && (
          <button onClick={() => router.push('/visits/start')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Start Visit
          </button>
        )}
      </div>

      {loading ? <Spinner text="Loading dashboard..." /> : (
        <div className="space-y-6">

          {/* ── FACULTY ── */}
          {user.role === 'faculty' && (
            <>
              {activeVisit ? (
                <div className="rounded-2xl overflow-hidden shadow-card animate-fade-up"
                  style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%)' }}>
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Visit In Progress</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white">{activeVisit.hostel?.name}</h2>
                        <p className="text-emerald-100 text-sm mt-0.5">
                          {getPurpose(activeVisit.purpose)} · Started {fmtDateTime(activeVisit.checkIn)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setEndModal(true)}
                      className="btn bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 text-sm shadow-sm shrink-0">
                      End Visit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card border-2 border-dashed border-slate-200 text-center py-10 animate-fade-up">
                  <div className="text-4xl mb-3">🏫</div>
                  <h3 className="font-bold text-slate-700 mb-1">No Active Visit</h3>
                  <p className="text-sm text-slate-400 mb-4">Start a visit to log your hostel check-in</p>
                  <button onClick={() => router.push('/visits/start')} className="btn-primary">
                    Start a Visit
                  </button>
                </div>
              )}

              <FacultyStats />
            </>
          )}

          {/* ── ADMIN / WARDEN ── */}
          {user.role !== 'faculty' && stats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Active Visits" value={stats.activeCount} icon="🟢" color="green" sub="Currently inside hostels" />
                <StatCard label="Visits Today" value={stats.todayCount} icon="📅" color="blue" sub="Total check-ins today" />
                <StatCard label="This Month" value={stats.monthCount} icon="📊" color="violet" sub="Month-to-date total" />
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="card animate-fade-up">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-slate-900">Today's Visits by Hostel</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Real-time check-in distribution</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barSize={40} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1e3a8a" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', fontSize: '13px', fontFamily: 'Plus Jakarta Sans' }} />
                      <Bar dataKey="visits" fill="url(#barGrad)" radius={[8, 8, 0, 0]} name="Visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Active visits table */}
              {active.length > 0 && (
                <div className="card animate-fade-up">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Currently Inside</h3>
                    <span className="badge-active">{active.length} active</span>
                  </div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Faculty</th><th>Hostel</th><th>Purpose</th><th>Check-in</th></tr></thead>
                      <tbody>
                        {active.map(v => (
                          <tr key={v._id}>
                            <td>
                              <div className="font-semibold text-slate-900">{v.faculty?.name}</div>
                              <div className="text-xs text-slate-400">{v.faculty?.department}</div>
                            </td>
                            <td className="text-slate-600">{v.hostel?.name}</td>
                            <td><span className="badge-active">{getPurpose(v.purpose)}</span></td>
                            <td className="text-xs text-slate-500">{fmtDateTime(v.checkIn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {active.length === 0 && chartData.length === 0 && (
                <EmptyState icon="🏫" title="No activity today" subtitle="Visits will appear here once faculty start checking in." />
              )}
            </>
          )}
        </div>
      )}

      {/* End Visit Modal */}
      <Modal open={endModal} onClose={() => setEndModal(false)} title="End Hostel Visit">
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
            Ending visit at <strong>{activeVisit?.hostel?.name}</strong>. The warden will be notified via email.
          </div>
          <div>
            <label className="label">Remarks (Optional)</label>
            <textarea className="textarea" rows={3} placeholder="Any observations or notes..."
              value={endRemarks} onChange={e => setEndRemarks(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setEndModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={doEndVisit} disabled={ending} className="btn-danger flex-1">
              {ending ? <><span className="spinner" /> Ending...</> : 'End Visit'}
            </button>
          </div>
        </div>
      </Modal>
      <VisitFormModal
        open={formModal}
        onClose={() => setFormModal(false)}
        visit={completedVisit || {}}
      />
    </DashboardLayout>
  );
}

function FacultyStats() {
  const [total, setTotal] = useState(null);
  const [month, setMonth] = useState(null);
  useEffect(() => {
    visitService.getMyVisits({ limit: 1 }).then(r => setTotal(r.data.data.pagination.total)).catch(() => {});
    const now = new Date();
    visitService.getMyVisits({ from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), limit: 1 })
      .then(r => setMonth(r.data.data.pagination.total)).catch(() => {});
  }, []);
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Total My Visits" value={total} icon="📋" color="blue" sub="All time" />
      <StatCard label="This Month" value={month} icon="📅" color="green" sub="Current month" />
    </div>
  );
}

export default withAuth(Dashboard);