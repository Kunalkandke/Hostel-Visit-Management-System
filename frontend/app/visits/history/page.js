'use client';
import { useState, useEffect, useCallback } from 'react';
import withAuth from '../../../utils/withAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Modal, Pagination, EmptyState, Spinner } from '../../../components/common/index';
import { visitService, hostelService, getErr } from '../../../services/index';
import { useAuth } from '../../../context/index';
import { fmtDateTime, fmtDuration, getPurpose } from '../../../utils/constants';
import toast from 'react-hot-toast';

function VisitHistoryPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [pg, setPg] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', hostelId: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);
  const [wardenRemarks, setWardenRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchVisits = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const fn = user.role === 'admin' ? visitService.getAllVisits : visitService.getMyVisits;
      const res = await fn({ ...filters, page, limit: 12 });
      setVisits(res.data.data.visits);
      setPg(res.data.data.pagination);
    } catch (e) { toast.error(getErr(e)); }
    finally { setLoading(false); }
  }, [filters, user.role]);

  useEffect(() => { hostelService.getAll().then(r => setHostels(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { fetchVisits(1); }, [fetchVisits]);

  const doVerify = async () => {
    setVerifying(true);
    try {
      await visitService.verifyVisit(verifyModal._id, { wardenRemarks });
      toast.success('Visit verified!');
      setVerifyModal(null);
      setWardenRemarks('');
      fetchVisits(pg.page);
    } catch (e) { toast.error(getErr(e)); }
    finally { setVerifying(false); }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{user.role === 'admin' ? 'All Visits' : 'My Visit History'}</h1>
        <p className="page-sub">{pg.total} total records</p>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className="label">Status</label>
            <select className="select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option><option value="active">Active</option><option value="completed">Completed</option>
            </select></div>
          <div><label className="label">Hostel</label>
            <select className="select" value={filters.hostelId} onChange={e => setFilters({ ...filters, hostelId: e.target.value })}>
              <option value="">All Hostels</option>
              {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select></div>
          <div><label className="label">From</label>
            <input type="date" className="input" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></div>
          <div><label className="label">To</label>
            <input type="date" className="input" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => setFilters({ status: '', hostelId: '', from: '', to: '' })} className="btn-ghost text-xs">Clear Filters</button>
        </div>
      </div>

      {loading ? <Spinner text="Loading visits..." /> : visits.length === 0 ? (
        <EmptyState icon="📋" title="No visits found" subtitle="Try adjusting your filters" />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr>
                {user.role === 'admin' && <th>Faculty</th>}
                <th>Hostel</th><th>Purpose</th><th>Check-in</th><th>Check-out</th><th>Duration</th><th>Status</th><th>Verified</th><th></th>
              </tr></thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v._id}>
                    {user.role === 'admin' && <td><div className="font-semibold text-slate-900">{v.faculty?.name}</div><div className="text-xs text-slate-400">{v.faculty?.department}</div></td>}
                    <td><div className="font-medium">{v.hostel?.name}</div><div className="text-xs text-slate-400 capitalize">{v.hostel?.type}</div></td>
                    <td className="text-slate-600 text-sm">{getPurpose(v.purpose)}</td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(v.checkIn)}</td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">{v.checkOut ? fmtDateTime(v.checkOut) : '—'}</td>
                    <td className="font-medium text-slate-700">{fmtDuration(v.duration)}</td>
                    <td><span className={v.status === 'active' ? 'badge-active' : 'badge-completed'}>{v.status}</span></td>
                    <td className="text-center">{v.isVerified ? <span className="text-emerald-500 font-bold text-lg">✓</span> : <span className="text-slate-300">—</span>}</td>
                    <td>
                      <button onClick={() => setDetail(v)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pg.page} pages={pg.pages} total={pg.total} onPage={fetchVisits} />
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Visit Details" maxWidth="max-w-lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Hostel', detail.hostel?.name], ['Type', detail.hostel?.type], ['Purpose', getPurpose(detail.purpose)],
                ['Status', detail.status], ['Check-in', fmtDateTime(detail.checkIn)], ['Check-out', fmtDateTime(detail.checkOut)],
                ['Duration', fmtDuration(detail.duration)], ['Verified', detail.isVerified ? '✓ Yes' : '✗ No']
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold">{k}</p>
                  <p className="font-bold text-slate-800 mt-0.5 capitalize text-sm">{v || '—'}</p>
                </div>
              ))}
            </div>
            {detail.facultyRemarks && <div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><p className="text-xs font-bold text-blue-600 mb-1">Faculty Remarks</p><p className="text-sm text-blue-900">{detail.facultyRemarks}</p></div>}
            {detail.wardenRemarks && <div className="p-3 bg-amber-50 rounded-xl border border-amber-100"><p className="text-xs font-bold text-amber-600 mb-1">Warden Remarks</p><p className="text-sm text-amber-900">{detail.wardenRemarks}</p></div>}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(VisitHistoryPage);
