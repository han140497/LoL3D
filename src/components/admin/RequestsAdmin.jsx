import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { SCULPTURE_STYLES } from '../../lib/constants.js';

const STATUS_STYLES = {
  new: 'bg-brand-500/20 text-brand-400',
  modeling: 'bg-sky-500/20 text-sky-300',
  preview_sent: 'bg-purple-500/20 text-purple-300',
  confirmed: 'bg-emerald-500/20 text-emerald-300',
  printed: 'bg-emerald-500/20 text-emerald-300',
  quoted: 'bg-sky-500/20 text-sky-300',
  accepted: 'bg-emerald-500/20 text-emerald-300',
  declined: 'bg-red-500/20 text-red-300',
};

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-white/5 text-slate-400'}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function FileLink({ bucket, path, label }) {
  const [busy, setBusy] = useState(false);
  if (!path) return null;
  const open = async () => {
    setBusy(true);
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    setBusy(false);
    if (error) return alert(`Could not open file: ${error.message}`);
    window.open(data.signedUrl, '_blank', 'noopener');
  };
  return (
    <button type="button" onClick={open} disabled={busy} className="text-xs font-semibold text-brand-400 hover:text-brand-500 disabled:opacity-50">
      {busy ? 'Opening…' : label}
    </button>
  );
}

export default function RequestsAdmin() {
  const [sculptures, setSculptures] = useState(null);
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.from('sculpture_requests').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data, error: e }) => (e ? setError(e.message) : setSculptures(data)));
    supabase.from('quote_requests').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data, error: e }) => (e ? setError(e.message) : setQuotes(data)));
  }, []);

  const advanceSculpture = async (req, status) => {
    const { error: e } = await supabase.from('sculpture_requests').update({ status }).eq('id', req.id);
    if (e) return setError(e.message);
    setSculptures((prev) => prev.map((r) => (r.id === req.id ? { ...r, status } : r)));
  };

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error} — if this mentions a missing table, run supabase/migrations/002 in the SQL editor.
      </p>
    );
  }

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-semibold text-white">Sculpture requests</h3>
        {!sculptures ? (
          <p className="mt-3 text-slate-400">Loading…</p>
        ) : sculptures.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">None yet — they'll appear here the moment someone uploads a photo.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sculptures.map((r) => (
              <li key={r.id} className="rounded-2xl border border-white/10 bg-ink-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    {r.name} <span className="ml-2 text-sm font-normal text-slate-400">{r.contact}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Style: <span className="font-semibold text-white">{SCULPTURE_STYLES.find((s) => s.id === r.style)?.name ?? r.style}</span>
                  {r.notes && <span className="text-slate-400"> · “{r.notes}”</span>}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <FileLink bucket="sculpture-photos" path={r.photo_path} label="View photo →" />
                  {['modeling', 'preview_sent', 'confirmed', 'printed'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => advanceSculpture(r, s)}
                      className={`rounded-full px-2.5 py-1 text-xs capitalize ${r.status === s ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      {s.replaceAll('_', ' ')}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-semibold text-white">Custom print quotes</h3>
        {!quotes ? (
          <p className="mt-3 text-slate-400">Loading…</p>
        ) : quotes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No quote requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {quotes.map((r) => (
              <li key={r.id} className="rounded-2xl border border-white/10 bg-ink-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    {r.name} <span className="ml-2 text-sm font-normal text-slate-400">{r.contact}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-300">{r.idea}</p>
                <div className="mt-2">
                  <FileLink bucket="quote-uploads" path={r.file_path} label="Download model file →" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
