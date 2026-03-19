'use client';
import { useEffect } from 'react';

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} z-10 animate-fade-up overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <button onClick={onClose} className="btn-icon rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  const nums = [];
  const range = 2;
  for (let i = Math.max(1, page - range); i <= Math.min(pages, page + range); i++) nums.push(i);
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
      <p className="text-xs text-slate-400">{total ? `${total} total records · ` : ''}Page {page} of {pages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="btn btn-sm btn-secondary disabled:opacity-40 px-2.5">‹</button>
        {page > range + 1 && <><button onClick={() => onPage(1)} className="btn btn-sm btn-ghost px-2.5">1</button><span className="text-slate-300 text-xs px-1">…</span></>}
        {nums.map(n => (
          <button key={n} onClick={() => onPage(n)}
            className={`btn btn-sm px-2.5 ${n === page ? 'btn-primary' : 'btn-ghost'}`}>{n}</button>
        ))}
        {page < pages - range && <><span className="text-slate-300 text-xs px-1">…</span><button onClick={() => onPage(pages)} className="btn btn-sm btn-ghost px-2.5">{pages}</button></>}
        <button onClick={() => onPage(page + 1)} disabled={page === pages}
          className="btn btn-sm btn-secondary disabled:opacity-40 px-2.5">›</button>
      </div>
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-sm font-bold text-slate-600">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 'md', text }) {
  const sz = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-[3px]', lg: 'w-12 h-12 border-4' };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className={`${sz[size]} border-navy-800 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-400 font-medium">{text}</p>}
    </div>
  );
}

export function StatCard({ label, value, icon, sub, color = 'blue', trend }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  };
  const c = colors[color];
  return (
    <div className="card-stat">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${c.bg} border ${c.border}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className={danger ? 'btn-danger' : 'btn-primary'}>
          {loading ? <span className="flex items-center gap-2"><span className="spinner" />Working...</span> : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
