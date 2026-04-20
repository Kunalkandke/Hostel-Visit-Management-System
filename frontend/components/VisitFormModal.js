'use client';
import { useState, useCallback, useEffect } from 'react';
import { Modal } from './common/index';
import { generateAntiRaggingHTML, generateMessFeedbackHTML } from '../utils/formTemplates';
import api from '../services/api';
import toast from 'react-hot-toast';

const LOCS     = ['SRTH', 'SVH', 'TARA', 'SJB/SBP'];
const LOC_KEYS = ['srth', 'svh', 'tara', 'sjb'];

// Map hostel name to location key for auto-fill
function hostelToLocKey(name) {
  if (!name) return null;
  const n = name.toUpperCase();
  if (n.includes('SRTH')) return 'srth';
  if (n.includes('SVH'))  return 'svh';
  if (n.includes('TARA')) return 'tara';
  if (n.includes('SJB') || n.includes('SBP')) return 'sjb';
  return null;
}

// Build initial data — auto-fill hostel's time slot from visit checkIn
function buildInitialData(visit, existing) {
  if (existing) return existing; // load saved data

  const timeStr = visit.checkIn
    ? new Date(visit.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';
  const locKey = hostelToLocKey(visit.hostel?.name);
  const pre = {};
  if (locKey && timeStr) {
    // Convert to HH:MM 24h for <input type="time">
    const d = visit.checkIn ? new Date(visit.checkIn) : null;
    if (d) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      pre[`loc_${locKey}_time`] = `${hh}:${mm}`;
    }
  }
  return pre;
}

// ── Read-Only Field ──────────────────────────────────────────────────────────
function ROField({ label, value }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 flex-1">{value || '—'}</span>
    </div>
  );
}

// ── Anti-Ragging Form Fields ─────────────────────────────────────────────────
function AntiRaggingFields({ data, onChange, readOnly }) {
  const inp = (key, type='text', placeholder='') => readOnly
    ? <span className="text-sm font-medium text-slate-800">{data[key] || '—'}</span>
    : <input type={type} className="input text-xs py-1.5 w-full"
        placeholder={placeholder}
        value={data[key] || ''}
        onChange={e => onChange(key, e.target.value)} />;

  const sel = (key, opts) => readOnly
    ? <span className="text-sm font-medium text-slate-800">{data[key] || '—'}</span>
    : <select className="select" value={data[key] || ''} onChange={e => onChange(key, e.target.value)}>
        <option value="">Select...</option>
        {opts.map(o => <option key={o}>{o}</option>)}
      </select>;

  const ta = (key, rows, required, placeholder) => readOnly
    ? <div className="text-sm text-slate-800 bg-slate-50 rounded-lg p-2 min-h-12 border border-slate-100">{data[key] || '—'}</div>
    : <textarea className="textarea" rows={rows} required={required}
        placeholder={placeholder}
        value={data[key] || ''}
        onChange={e => onChange(key, e.target.value)} />;

  return (
    <div className="space-y-4">
      {/* Locations table */}
      <div>
        <label className="label">Locations Visited {!readOnly && <span className="text-slate-400 normal-case font-normal">(time auto-filled for visited hostel)</span>}</label>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase w-24">Hostel</th>
                <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase w-28">Time</th>
                <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {LOCS.map((loc, i) => (
                <tr key={loc} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 font-semibold text-slate-700">{loc}</td>
                  <td className="px-1.5 py-1.5">
                    {readOnly
                      ? <span className="text-sm">{data[`loc_${LOC_KEYS[i]}_time`] || '—'}</span>
                      : <input type="time" className="input text-xs py-1.5"
                          value={data[`loc_${LOC_KEYS[i]}_time`] || ''}
                          onChange={e => onChange(`loc_${LOC_KEYS[i]}_time`, e.target.value)} />
                    }
                  </td>
                  <td className="px-1.5 py-1.5">
                    {readOnly
                      ? <span className="text-sm">{data[`loc_${LOC_KEYS[i]}_remarks`] || '—'}</span>
                      : <input type="text" className="input text-xs py-1.5" placeholder="Remarks..."
                          value={data[`loc_${LOC_KEYS[i]}_remarks`] || ''}
                          onChange={e => onChange(`loc_${LOC_KEYS[i]}_remarks`, e.target.value)} />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Status of Discipline *</label>
          {sel('discipline_status', ['Excellent','Good','Satisfactory','Needs Improvement'])}
        </div>
        <div>
          <label className="label">Status of Cleanliness *</label>
          {sel('cleanliness_status', ['Excellent','Good','Satisfactory','Needs Improvement'])}
        </div>
        <div>
          <label className="label">Overall Environment *</label>
          {sel('environment_status', ['Excellent','Good','Satisfactory','Needs Improvement'])}
        </div>
        <div>
          <label className="label">Interacted with Senior Students?</label>
          {sel('senior_interaction', ['Yes','No'])}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Interacted with Fresher Students?</label>
          {sel('fresher_interaction', ['Yes','No'])}
        </div>
      </div>

      <div>
        <label className="label">Anti-Ragging Suggestions *</label>
        {ta('antiragging_suggestions', 3, true, 'Suggestions related to Anti-Ragging only...')}
      </div>
      <div>
        <label className="label">Any Other Suggestions (Optional)</label>
        {ta('other_suggestions', 2, false, 'Any other observations...')}
      </div>
    </div>
  );
}

// ── Mess Feedback Form Fields ────────────────────────────────────────────────
function MessFeedbackFields({ data, onChange, readOnly }) {
  const yn = (key, label, req) => (
    <div>
      <label className="label">{label}{req ? ' *' : ''}</label>
      {readOnly
        ? <span className="text-sm font-medium text-slate-800">{data[key] || '—'}</span>
        : <div className="flex gap-2">
            {['Yes','No'].map(v => (
              <button key={v} type="button"
                onClick={() => onChange(key, v)}
                className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all
                  ${data[key]===v
                    ? v==='Yes' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-600 text-white border-red-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {v}
              </button>
            ))}
          </div>
      }
    </div>
  );

  const ta = (key, rows, req, ph) => readOnly
    ? <div className="text-sm text-slate-800 bg-slate-50 rounded-lg p-2 min-h-12 border border-slate-100">{data[key] || '—'}</div>
    : <textarea className="textarea" rows={rows} required={req} placeholder={ph}
        value={data[key] || ''} onChange={e => onChange(key, e.target.value)} />;

  return (
    <div className="space-y-4">
      {/* Locations */}
      <div>
        <label className="label">Locations Visited {!readOnly && <span className="text-slate-400 normal-case font-normal">(time auto-filled for visited hostel)</span>}</label>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase w-24">Hostel</th>
                <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase w-28">Time</th>
                <th className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {LOCS.map((loc, i) => (
                <tr key={loc} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 font-semibold text-slate-700">{loc}</td>
                  <td className="px-1.5 py-1.5">
                    {readOnly
                      ? <span className="text-sm">{data[`loc_${LOC_KEYS[i]}_time`] || '—'}</span>
                      : <input type="time" className="input text-xs py-1.5"
                          value={data[`loc_${LOC_KEYS[i]}_time`] || ''}
                          onChange={e => onChange(`loc_${LOC_KEYS[i]}_time`, e.target.value)} />
                    }
                  </td>
                  <td className="px-1.5 py-1.5">
                    {readOnly
                      ? <span className="text-sm">{data[`loc_${LOC_KEYS[i]}_remarks`] || '—'}</span>
                      : <input type="text" className="input text-xs py-1.5" placeholder="Remarks..."
                          value={data[`loc_${LOC_KEYS[i]}_remarks`] || ''}
                          onChange={e => onChange(`loc_${LOC_KEYS[i]}_remarks`, e.target.value)} />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meal */}
      <div>
        <label className="label">Meal Inspected *</label>
        {readOnly
          ? <span className="text-sm font-medium text-slate-800">{data.meal_type || '—'}</span>
          : <div className="flex gap-2">
              {['Breakfast','Lunch','Dinner'].map(m => (
                <button key={m} type="button"
                  onClick={() => onChange('meal_type', m)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all
                    ${data.meal_type===m ? 'bg-blue-900 text-white border-blue-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {m}
                </button>
              ))}
            </div>
        }
      </div>

      <div className="grid grid-cols-2 gap-3">
        {yn('tasted_food',   'Tasted the food?',     true)}
        {yn('cleanliness',   'Dining hall clean?',    true)}
        {yn('plates_clean',  'Plates/Spoons clean?',  true)}
        {yn('food_hot',      'Food served hot?',      true)}
      </div>

      <div>
        <label className="label">Menu Items in the Meal</label>
        {ta('menu_items', 2, false, 'List menu items served...')}
      </div>
      <div>
        <label className="label">Detailed Remarks on Food Taste & Condition *</label>
        {ta('food_remarks', 3, true, 'Describe taste, quality, quantity...')}
      </div>

      <div>
        <label className="label">Overall Feedback *</label>
        {readOnly
          ? <span className="text-sm font-medium text-slate-800">{data.overall_feedback || '—'}</span>
          : <div className="flex gap-2">
              {['Satisfactory','Needs improvement'].map(v => (
                <button key={v} type="button"
                  onClick={() => onChange('overall_feedback', v)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all
                    ${data.overall_feedback===v
                      ? v==='Satisfactory' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-500 text-white border-amber-500'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {v}
                </button>
              ))}
            </div>
        }
      </div>
      <div>
        <label className="label">Areas of Improvement (Optional)</label>
        {ta('improvement_suggestions', 2, false, 'Suggest improvements...')}
      </div>
    </div>
  );
}

// ── Main VisitFormModal ──────────────────────────────────────────────────────
export default function VisitFormModal({ open, onClose, visit, readOnly = false }) {
  const [screen, setScreen]     = useState('select'); // 'select' | 'anti_ragging' | 'mess_feedback'
  const [formData, setFormData] = useState({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // When switching to a form, initialise with saved or auto-filled data
  const openForm = (type) => {
    const existing = visit?.formSubmissions?.find(f => f.formType === type)?.data;
    setFormData(buildInitialData(visit, existing));
    setSaved(!!existing);
    setScreen(type);
  };

  const handleChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const validate = () => {
    if (screen === 'anti_ragging') {
      if (!formData.discipline_status || !formData.cleanliness_status || !formData.environment_status)
        return 'Please fill discipline, cleanliness and environment status.';
      if (!formData.antiragging_suggestions)
        return 'Anti-ragging suggestions are required.';
    } else {
      if (!formData.meal_type)      return 'Select a meal (Breakfast/Lunch/Dinner).';
      if (!formData.tasted_food)    return 'Please answer Q1 (tasted food).';
      if (!formData.cleanliness)    return 'Please answer Q3 (cleanliness).';
      if (!formData.plates_clean)   return 'Please answer Q4 (plates clean).';
      if (!formData.food_hot)       return 'Please answer Q5 (food hot).';
      if (!formData.food_remarks)   return 'Detailed food remarks (Q6) are required.';
      if (!formData.overall_feedback) return 'Overall feedback (Q7) is required.';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      await api.post(`/visits/${visit.id || visit._id}/forms`, { formType: screen, data: formData });
      setSaved(true);
      toast.success('Form saved successfully!');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save form');
    } finally { setSaving(false); }
  };

  const getHTML = () => screen === 'anti_ragging'
    ? generateAntiRaggingHTML(visit, formData)
    : generateMessFeedbackHTML(visit, formData);

  const downloadPDF = () => {
    const win = window.open('', '_blank');
    if (!win) { toast.error('Allow popups to download PDF'); return; }
    win.document.write(getHTML());
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 800);
  };

  const downloadWord = async () => {
    if (!saved && !readOnly) {
      toast.error('Please save the form first before downloading Word.');
      return;
    }
    const visitId = visit.id || visit._id;
    if (!visitId) { toast.error('Visit ID missing'); return; }
    try {
      toast('Generating Word document...', { icon: '⏳' });
      const token = localStorage.getItem('hvms_token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/visits/${visitId}/forms/${screen}/download`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to generate document');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fn = screen === 'anti_ragging' ? 'AntiRagging_Form' : 'MessFeedback_Form';
      const faculty = (visit.faculty?.name || 'Faculty').replace(/\s+/g, '_');
      a.download = `MIT_${fn}_${faculty}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Word document downloaded!');
    } catch (e) {
      toast.error('Download failed: ' + e.message);
    }
  };

  const antiDone = !!visit?.formSubmissions?.find(f => f.formType === 'anti_ragging');
  const messDone = !!visit?.formSubmissions?.find(f => f.formType === 'mess_feedback');

  const titleMap = {
    select: 'Visit Report Forms',
    anti_ragging: '🛡️ Anti-Ragging Committee — Hostel Visit Report',
    mess_feedback: '🍽️ Mess Food Quality Inspection — Feedback Form',
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setScreen('select'); setFormData({}); setSaved(false); }}
      title={titleMap[screen]} maxWidth="max-w-2xl">

      {/* ── FORM SELECTION ── */}
      {screen === 'select' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 mb-3">
            {readOnly
              ? 'View and download submitted forms for this visit.'
              : 'Select a form to fill. Both forms can be submitted separately.'}
          </p>

          {[
            {
              type: 'anti_ragging', done: antiDone,
              icon: '🛡️', color: 'hover:border-red-300 hover:bg-red-50',
              title: 'Anti-Ragging Committee Form',
              sub: 'MIT Anti-Ragging Committee — Hostel Visit Report',
              desc: 'Locations, discipline, cleanliness, environment, anti-ragging observations',
            },
            {
              type: 'mess_feedback', done: messDone,
              icon: '🍽️', color: 'hover:border-amber-300 hover:bg-amber-50',
              title: 'Mess Food Quality Form',
              sub: 'Hostel Mess Food Quality Inspection Committee',
              desc: 'Food taste, cleanliness, quality, meal inspection, suggestions',
            },
          ].map(({ type, done, icon, color, title, sub, desc }) => (
            <button key={type} onClick={() => openForm(type)}
              className={`w-full text-left p-4 rounded-2xl border-2 border-slate-200 ${color} transition-all group`}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0">{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{title}</span>
                    {done && <span className="badge-active text-xs">Submitted ✓</span>}
                    {!done && !readOnly && <span className="badge-inactive text-xs">Not filled</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          ))}

          {readOnly && !antiDone && !messDone && (
            <p className="text-center text-sm text-slate-400 py-4">No forms submitted for this visit yet.</p>
          )}
        </div>
      )}

      {/* ── FORM FILL / VIEW ── */}
      {(screen === 'anti_ragging' || screen === 'mess_feedback') && (
        <div className="space-y-3">
          {/* Back + info */}
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <button onClick={() => { setScreen('select'); setFormData({}); setSaved(false); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <p className="text-xs text-slate-500">
                <span className="font-semibold">{visit.faculty?.name}</span>
                {' · '}{visit.hostel?.name}
                {' · '}{visit.checkIn ? new Date(visit.checkIn).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''}
                {readOnly && <span className="ml-2 badge-inactive text-xs">Read Only</span>}
              </p>
            </div>
          </div>

          {/* Auto-fill banner */}
          <div className="flex flex-wrap gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
            <span className="font-semibold">Auto-filled:</span>
            <span>📅 {visit.checkIn ? new Date(visit.checkIn).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}) : '—'}</span>
            <span>·</span>
            <span>⏰ {visit.checkIn ? new Date(visit.checkIn).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}) : '—'}</span>
            <span>·</span>
            <span>👤 {visit.faculty?.name}</span>
            <span>·</span>
            <span>🏛 {visit.faculty?.department}</span>
          </div>

          {readOnly && !visit?.formSubmissions?.find(f => f.formType === screen) && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
              ⚠ This form has not been submitted by the faculty yet.
            </div>
          )}

          {/* Scrollable form */}
          <div className="max-h-[48vh] overflow-y-auto pr-1 pb-1">
            {screen === 'anti_ragging'
              ? <AntiRaggingFields data={formData} onChange={handleChange} readOnly={readOnly} />
              : <MessFeedbackFields data={formData} onChange={handleChange} readOnly={readOnly} />
            }
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            {/* Save — only faculty (not readOnly) */}
            {!readOnly && (
              <button onClick={handleSave} disabled={saving || saved} className="btn-primary flex-1 min-w-[120px]">
                {saving ? <><span className="spinner"/>Saving...</> : saved ? '✓ Saved' : '💾 Save'}
              </button>
            )}
            {/* Download PDF — everyone */}
            <button onClick={downloadPDF} className="btn-secondary flex-1 min-w-[120px]">
              📄 PDF
            </button>
            {/* Download Word — everyone */}
            <button onClick={downloadWord} className="btn-secondary flex-1 min-w-[120px]">
              📝 Word (.doc)
            </button>
          </div>

          {!readOnly && (
            <p className="text-xs text-slate-400 text-center">
              Save the form first, then download. Saved forms are visible to warden and admin.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}