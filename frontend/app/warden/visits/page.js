'use client';
import { useState, useEffect, useCallback } from 'react';
import withAuth from '../../../utils/withAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Modal, Pagination, EmptyState, Spinner } from '../../../components/common/index';
import VisitFormModal from '../../../components/VisitFormModal';
import { visitService, getErr } from '../../../services/index';
import api from '../../../services/api';
import { fmtDateTime, fmtDuration, getPurpose } from '../../../utils/constants';
import toast from 'react-hot-toast';

function WardenVisitsPage() {
  const [tab, setTab] = useState('active');
  const [active, setActive] = useState([]);
  const [all, setAll] = useState([]);
  const [pg, setPg] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [verifyModal, setVerifyModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [formVisit, setFormVisit] = useState(null);
  const [formModal, setFormModal] = useState(false);

  const fetchActive = async () => {
    setLoading(true);
    try { const r = await visitService.getActiveVisits(); setActive(r.data.data); }
    catch (e) { toast.error(getErr(e)); }
    finally { setLoading(false); }
  };

  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const r = await visitService.getMyVisits({ page, limit: 12 });
      setAll(r.data.data.visits); setPg(r.data.data.pagination);
    } catch (e) { toast.error(getErr(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { tab === 'active' ? fetchActive() : fetchAll(1); }, [tab]);

  const doVerify = async () => {
    setVerifying(true);
    try {
      await visitService.verifyVisit(verifyModal._id, { wardenRemarks: remarks });
      toast.success('Visit verified!');
      setVerifyModal(null); setRemarks('');
      tab === 'active' ? fetchActive() : fetchAll(pg.page);
    } catch (e) { toast.error(getErr(e)); }
    finally { setVerifying(false); }
  };

  const openForms = async (visit) => {
    try {
      const res = await api.get(`/visits/${visit._id}/forms`);
      setFormVisit({
        ...res.data.data.visit,
        id: visit._id,
        formSubmissions: res.data.data.forms,
      });
    } catch {
      setFormVisit({ ...visit, id: visit._id, formSubmissions: [] });
    }
    setFormModal(true);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Hostel Visits</h1>
        <p className="page-sub">Monitor and verify visits to your assigned hostel</p>
      </div>

      <div className="flex gap-2 mb-5">
        {[
          ['active',  `🟢 Active${tab === 'active' && active.length > 0 ? ` (${active.length})` : ''}`],
          ['all',     '📋 All Visits'],
        ].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-blue-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── ACTIVE TAB ── */}
          {tab === 'active' && (
            active.length === 0 ? <EmptyState icon="🏠" title="No active visits" subtitle="Your hostel has no visitors right now." /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {active.map(v => (
                  <div key={v._id} className="card border-l-4 border-emerald-400 hover:shadow-card-hover transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{v.faculty?.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{v.faculty?.department}</p>
                      </div>
                      <span className="badge-active">Live</span>
                    </div>
                    <div className="space-y-1.5 text-sm mb-4">
                      <div className="flex justify-between"><span className="text-slate-400">Purpose</span><span className="font-semibold">{getPurpose(v.purpose)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Check-in</span><span className="font-semibold text-xs">{fmtDateTime(v.checkIn)}</span></div>
                      {v.faculty?.phone && <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-semibold">{v.faculty.phone}</span></div>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openForms(v)} className="btn-secondary flex-1 text-sm py-2">
                        📋 Forms
                      </button>
                      {v.status === 'completed' && !v.isVerified && (
                        <button onClick={() => { setVerifyModal(v); setRemarks(''); }} className="btn-success flex-1 text-sm py-2">
                          ✓ Verify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── ALL TAB ── */}
          {tab === 'all' && (
            all.length === 0 ? <EmptyState icon="📋" title="No visits found" /> : (
              <div className="card">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Faculty</th><th>Purpose</th><th>Check-in</th><th>Duration</th><th>Status</th><th>Verified</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {all.map(v => (
                        <tr key={v._id}>
                          <td>
                            <div className="font-semibold">{v.faculty?.name}</div>
                            <div className="text-xs text-slate-400">{v.faculty?.department}</div>
                          </td>
                          <td className="text-slate-600">{getPurpose(v.purpose)}</td>
                          <td className="text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(v.checkIn)}</td>
                          <td>{fmtDuration(v.duration)}</td>
                          <td><span className={v.status === 'active' ? 'badge-active' : 'badge-completed'}>{v.status}</span></td>
                          <td className="text-center">{v.isVerified ? <span className="text-emerald-500 font-bold text-lg">✓</span> : '—'}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button onClick={() => openForms(v)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">
                                Forms
                              </button>
                              {!v.isVerified && v.status === 'completed' && (
                                <button onClick={() => { setVerifyModal(v); setRemarks(''); }} className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold">
                                  Verify
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={pg.page} pages={pg.pages} total={pg.total} onPage={fetchAll} />
              </div>
            )
          )}
        </>
      )}

      {/* Verify Modal */}
      <Modal open={!!verifyModal} onClose={() => setVerifyModal(null)} title="Verify Visit">
        {verifyModal && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Faculty</span><span className="font-bold">{verifyModal.faculty?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Purpose</span><span className="font-semibold">{getPurpose(verifyModal.purpose)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-semibold">{fmtDuration(verifyModal.duration)}</span></div>
            </div>
            <div>
              <label className="label">Your Remarks (Optional)</label>
              <textarea className="textarea" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add observations..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setVerifyModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={doVerify} disabled={verifying} className="btn-success flex-1">
                {verifying ? <><span className="spinner" />Verifying...</> : '✓ Verify Visit'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Forms Modal — readOnly for warden */}
      <VisitFormModal
        open={formModal}
        onClose={() => { setFormModal(false); setFormVisit(null); }}
        visit={formVisit || {}}
        readOnly={true}
      />
    </DashboardLayout>
  );
}

export default withAuth(WardenVisitsPage, ['warden']);