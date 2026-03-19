'use client';
import { useState, useEffect, useCallback } from 'react';
import withAuth from '../../../utils/withAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { StatCard, Spinner, EmptyState } from '../../../components/common/index';
import { adminService, getErr } from '../../../services/index';
import { useAuth } from '../../../context/index';
import { fmtDuration, fmtDateTime } from '../../../utils/constants';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const CHART_STYLE = {
  contentStyle: {
    borderRadius: '12px', border: 'none',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    fontSize: '12px', fontFamily: 'Plus Jakarta Sans',
  },
};

// Admin sees all 4 tabs; warden sees only the 2 that are scoped to their hostel
const ADMIN_TABS = [
  { id: 'daily',      label: '📅 Daily' },
  { id: 'monthly',    label: '📆 Monthly' },
  { id: 'by-hostel',  label: '🏠 By Hostel' },
  { id: 'by-faculty', label: '👩‍🏫 By Faculty' },
];
const WARDEN_TABS = [
  { id: 'daily',      label: '📅 Daily' },
  { id: 'monthly',    label: '📆 Monthly' },
  { id: 'by-faculty', label: '👩‍🏫 By Faculty' },
];

const SORT_OPTIONS = {
  daily: [
    { value: 'checkIn',  label: 'Check-in Time' },
    { value: 'duration', label: 'Duration' },
    { value: 'purpose',  label: 'Purpose' },
  ],
  'by-hostel': [
    { value: 'totalVisits',     label: 'Total Visits' },
    { value: 'completedVisits', label: 'Completed' },
    { value: 'avgDuration',     label: 'Avg Duration' },
  ],
  'by-faculty': [
    { value: 'totalVisits',     label: 'Total Visits' },
    { value: 'completedVisits', label: 'Completed' },
    { value: 'avgDuration',     label: 'Avg Duration' },
    { value: 'lastVisit',       label: 'Last Visit' },
  ],
};

function ReportsPage() {
  const { user } = useAuth();
  const isWarden = user?.role === 'warden';
  const TABS = isWarden ? WARDEN_TABS : ADMIN_TABS;

  const [tab, setTab] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [range, setRange] = useState({ from: '', to: '' });
  const [sortBy, setSortBy] = useState('totalVisits');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deptFilter, setDeptFilter] = useState('');

  // Reset sort when tab changes
  useEffect(() => {
    const defaults = { daily: 'checkIn', 'by-hostel': 'totalVisits', 'by-faculty': 'totalVisits', monthly: '' };
    setSortBy(defaults[tab] || 'totalVisits');
    setSortOrder('desc');
    setData(null);
  }, [tab]);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      const params = { sortBy, order: sortOrder };
      if (tab === 'daily') {
        res = await adminService.getDailyReport(date, params);
      } else if (tab === 'monthly') {
        res = await adminService.getMonthlyReport(month, year);
      } else if (tab === 'by-hostel') {
        res = await adminService.getByHostelReport({ ...range, ...params });
      } else {
        res = await adminService.getByFacultyReport({ ...range, ...params, department: deptFilter });
      }
      setData(res.data.data);
    } catch (e) {
      toast.error(getErr(e));
    } finally {
      setLoading(false);
    }
  }, [tab, date, month, year, range, sortBy, sortOrder, deptFilter]);

  // Auto-generate on tab change
  useEffect(() => { generate(); }, [tab]);

  const exportCSV = () => {
    if (!data) return;
    let rows = [], headers = [];
    if (tab === 'daily' && data.visits) {
      headers = ['Faculty', 'Department', 'Hostel', 'Purpose', 'Check-in', 'Check-out', 'Duration (min)', 'Status'];
      rows = data.visits.map(v => [
        v.faculty?.name, v.faculty?.department, v.hostel?.name,
        v.purpose, v.checkIn ? new Date(v.checkIn).toLocaleString() : '',
        v.checkOut ? new Date(v.checkOut).toLocaleString() : '',
        v.duration || '', v.status,
      ]);
    } else if (tab === 'by-hostel' && Array.isArray(data)) {
      headers = ['Hostel', 'Type', 'Total Visits', 'Completed', 'Avg Duration (min)'];
      rows = data.map(r => [r.hostelName, r.type, r.totalVisits, r.completedVisits, r.avgDuration || '']);
    } else if (tab === 'by-faculty' && Array.isArray(data)) {
      headers = ['Name', 'Email', 'Department', 'Total Visits', 'Completed', 'Avg Duration (min)', 'Last Visit'];
      rows = data.map(r => [r.facultyName, r.email, r.department, r.totalVisits, r.completedVisits, r.avgDuration || '', r.lastVisit ? new Date(r.lastVisit).toLocaleDateString() : '']);
    } else if (tab === 'monthly' && data.dailyBreakdown) {
      headers = ['Date', 'Total Visits', 'Completed'];
      rows = data.dailyBreakdown.map(r => [r._id, r.count, r.completed]);
    }
    if (!rows.length) return toast.error('No data to export');
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `hvms-${tab}-${date || new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const currentSortOptions = SORT_OPTIONS[tab] || [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-sub">
            {isWarden ? 'Visit insights for your assigned hostel' : 'System-wide visit data and trends'}
          </p>
        </div>
        <button onClick={exportCSV} disabled={!data} className="btn-secondary text-sm disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white border border-slate-200 rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters Card */}
      <div className="card mb-5">
        <div className="flex flex-wrap items-end gap-4">

          {/* Date picker for daily */}
          {tab === 'daily' && (
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          )}

          {/* Month/Year for monthly */}
          {tab === 'monthly' && (
            <>
              <div>
                <label className="label">Month</label>
                <select className="select" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" className="input w-28" value={year}
                  onChange={e => setYear(Number(e.target.value))} min="2020" max="2030" />
              </div>
            </>
          )}

          {/* Date range for hostel/faculty */}
          {(tab === 'by-hostel' || tab === 'by-faculty') && (
            <>
              <div>
                <label className="label">From Date</label>
                <input type="date" className="input" value={range.from}
                  onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
              </div>
              <div>
                <label className="label">To Date</label>
                <input type="date" className="input" value={range.to}
                  onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
              </div>
            </>
          )}

          {/* Department filter for faculty */}
          {tab === 'by-faculty' && (
            <div>
              <label className="label">Department</label>
              <input type="text" className="input w-44" placeholder="Filter by dept..."
                value={deptFilter} onChange={e => setDeptFilter(e.target.value)} />
            </div>
          )}

          {/* Sort options */}
          {currentSortOptions.length > 0 && (
            <div>
              <label className="label">Sort By</label>
              <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {currentSortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort order */}
          {currentSortOptions.length > 0 && (
            <div>
              <label className="label">Order</label>
              <select className="select w-36" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="desc">↓ Descending</option>
                <option value="asc">↑ Ascending</option>
              </select>
            </div>
          )}

          <button onClick={generate} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Generate
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <Spinner text="Generating report..." />
      ) : !data ? null : (
        <div className="space-y-5 animate-fade-up">

          {/* ── DAILY ── */}
          {tab === 'daily' && data.stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Visits" value={data.stats.totalVisits} icon="📋" color="blue" />
                <StatCard label="Completed" value={data.stats.completed} icon="✅" color="green" />
                <StatCard label="Active" value={data.stats.active} icon="🟢" color="amber" />
                <StatCard label="Avg Duration"
                  value={data.stats.avgDuration > 0 ? `${data.stats.avgDuration}m` : '—'}
                  icon="⏱" color="violet" />
              </div>
              {data.visits?.length > 0 ? (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Visits on {data.date}</h3>
                    <span className="badge-completed">{data.visits.length} records</span>
                  </div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr><th>Faculty</th><th>Hostel</th><th>Purpose</th><th>Check-in</th><th>Check-out</th><th>Duration</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {data.visits.map(v => (
                          <tr key={v._id}>
                            <td>
                              <div className="font-semibold">{v.faculty?.name}</div>
                              <div className="text-xs text-slate-400">{v.faculty?.department}</div>
                            </td>
                            <td className="text-slate-600">{v.hostel?.name}</td>
                            <td className="text-slate-600 capitalize">{v.purpose?.replace('_', ' ')}</td>
                            <td className="text-xs text-slate-500 whitespace-nowrap">
                              {v.checkIn ? new Date(v.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                            </td>
                            <td className="text-xs text-slate-500 whitespace-nowrap">
                              {v.checkOut ? new Date(v.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                            </td>
                            <td className="font-medium">{fmtDuration(v.duration)}</td>
                            <td>
                              <span className={v.status === 'active' ? 'badge-active' : 'badge-completed'}>
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState icon="📅" title="No visits on this date" subtitle="Try selecting a different date" />
              )}
            </>
          )}

          {/* ── MONTHLY ── */}
          {tab === 'monthly' && (
            <>
              <StatCard
                label={`Total — ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`}
                value={data.total} icon="📊" color="blue"
              />
              {data.dailyBreakdown?.length > 0 ? (
                <div className="card">
                  <h3 className="font-bold text-slate-900 mb-4">Daily Visit Trend</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.dailyBreakdown} margin={{ left: -20, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={d => d.slice(8)} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...CHART_STYLE} labelFormatter={l => `Date: ${l}`} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Plus Jakarta Sans' }} />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5}
                        dot={{ r: 4, fill: '#3b82f6' }} name="Total Visits" />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2}
                        dot={{ r: 3, fill: '#10b981' }} name="Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon="📈" title="No visits this month" />
              )}
            </>
          )}

          {/* ── BY HOSTEL ── */}
          {tab === 'by-hostel' && Array.isArray(data) && (
            data.length === 0 ? (
              <EmptyState icon="🏠" title="No hostel data found" subtitle="Try adjusting the date range" />
            ) : (
              <div className="space-y-5">
                <div className="card">
                  <h3 className="font-bold text-slate-900 mb-4">Visits by Hostel</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} barSize={44} margin={{ left: -20, right: 10 }}>
                      <defs>
                        <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1e3a8a" />
                        </linearGradient>
                        <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#065f46" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="hostelName" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        tickFormatter={n => n.split(' ').slice(-2).join(' ')} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...CHART_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Plus Jakarta Sans' }} />
                      <Bar dataKey="totalVisits" fill="url(#barBlue)" radius={[8, 8, 0, 0]} name="Total Visits" />
                      <Bar dataKey="completedVisits" fill="url(#barGreen)" radius={[8, 8, 0, 0]} name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Hostel</th><th>Type</th>
                          <th className="cursor-pointer" onClick={() => { setSortBy('totalVisits'); setSortOrder(s => s === 'desc' ? 'asc' : 'desc'); }}>
                            Total {sortBy === 'totalVisits' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                          </th>
                          <th className="cursor-pointer" onClick={() => { setSortBy('completedVisits'); setSortOrder(s => s === 'desc' ? 'asc' : 'desc'); }}>
                            Completed {sortBy === 'completedVisits' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                          </th>
                          <th className="cursor-pointer" onClick={() => { setSortBy('avgDuration'); setSortOrder(s => s === 'desc' ? 'asc' : 'desc'); }}>
                            Avg Duration {sortBy === 'avgDuration' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((r, i) => (
                          <tr key={i}>
                            <td className="font-semibold">{r.hostelName}</td>
                            <td><span className={`badge ${r.type === 'boys' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>{r.type}</span></td>
                            <td><span className="font-bold text-blue-700">{r.totalVisits}</span></td>
                            <td className="text-slate-600">{r.completedVisits}</td>
                            <td className="text-slate-600">{r.avgDuration ? `${r.avgDuration} min` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── BY FACULTY ── */}
          {tab === 'by-faculty' && Array.isArray(data) && (
            data.length === 0 ? (
              <EmptyState icon="👩‍🏫" title="No faculty data found" subtitle="Try adjusting the date range or department filter" />
            ) : (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Faculty Visit Summary</h3>
                  <span className="badge-completed">{data.length} faculty</span>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Faculty</th>
                        <th>Department</th>
                        <th className="cursor-pointer select-none" onClick={() => { setSortBy('totalVisits'); setSortOrder(s => s === 'desc' ? 'asc' : 'desc'); }}>
                          Total {sortBy === 'totalVisits' ? (sortOrder === 'desc' ? '↓' : '↑') : <span className="text-slate-300">↕</span>}
                        </th>
                        <th className="cursor-pointer select-none" onClick={() => { setSortBy('completedVisits'); setSortOrder(s => s === 'desc' ? 'asc' : 'desc'); }}>
                          Completed {sortBy === 'completedVisits' ? (sortOrder === 'desc' ? '↓' : '↑') : <span className="text-slate-300">↕</span>}
                        </th>
                        <th className="cursor-pointer select-none" onClick={() => { setSortBy('avgDuration'); setSortOrder(s => s === 'desc' ? 'asc' : 'desc'); }}>
                          Avg Duration {sortBy === 'avgDuration' ? (sortOrder === 'desc' ? '↓' : '↑') : <span className="text-slate-300">↕</span>}
                        </th>
                        <th className="cursor-pointer select-none" onClick={() => { setSortBy('lastVisit'); setSortOrder(s => s === 'desc' ? 'asc' : 'desc'); }}>
                          Last Visit {sortBy === 'lastVisit' ? (sortOrder === 'desc' ? '↓' : '↑') : <span className="text-slate-300">↕</span>}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <div className="font-semibold">{r.facultyName}</div>
                            <div className="text-xs text-slate-400">{r.email}</div>
                          </td>
                          <td className="text-slate-600">{r.department || '—'}</td>
                          <td><span className="font-bold text-blue-700">{r.totalVisits}</span></td>
                          <td className="text-slate-600">{r.completedVisits}</td>
                          <td className="text-slate-600">{r.avgDuration ? `${r.avgDuration} min` : '—'}</td>
                          <td className="text-xs text-slate-500">
                            {r.lastVisit ? new Date(r.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(ReportsPage, ['admin', 'warden']);