import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { SCULPTURE_STYLES } from '../../lib/constants.js';

const STATUS_STYLES = {
  new: 'bg-brand-100 text-brand-600',
  modeling: 'bg-sky-100 text-sky-700',
  preview_sent: 'bg-purple-100 text-purple-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  printed: 'bg-emerald-100 text-emerald-700',
  quoted: 'bg-sky-100 text-sky-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-500'}`}>
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
    <button type="button" onClick={open} disabled={busy} className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">
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

  // Deletes the request row, then best-effort removes its uploaded file.
  const deleteRequest = async ({ table, bucket, req, filePath, setList }) => {
    if (!window.confirm(`Delete this request from ${req.name}? This can't be undone.`)) return;
    const { error: e } = await supabase.from(table).delete().eq('id', req.id);
    if (e) {
      return setError(
        e.message.includes('policy') || e.message.includes('permission')
          ? `${e.message} — run supabase/migrations/003 in the SQL editor to enable deleting.`
          : e.message,
      );
    }
    if (filePath) await supabase.storage.from(bucket).remove([filePath]); // best effort
    setList((prev) => prev.filter((r) => r.id !== req.id));
  };

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error} — if this mentions a missing table, run supabase/migrations/002 in the SQL editor.
      </p>
    );
  }

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-semibold text-slate-900">Sculpture requests</h3>
        {!sculptures ? (
          <p className="mt-3 text-slate-500">Loading…</p>
        ) : sculptures.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">None yet — they'll appear here the moment someone uploads a photo.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sculptures.map((r) => (
              <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {r.name} <span className="ml-2 text-sm font-normal text-slate-500">{r.contact}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Style: <span className="font-semibold text-slate-900">{SCULPTURE_STYLES.find((s) => s.id === r.style)?.name ?? r.style}</span>
                  {r.notes && <span className="text-slate-500"> · “{r.notes}”</span>}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <FileLink bucket="sculpture-photos" path={r.photo_path} label="View photo →" />
                  {['modeling', 'preview_sent', 'confirmed', 'printed'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => advanceSculpture(r, s)}
                      className={`rounded-full px-2.5 py-1 text-xs capitalize ${r.status === s ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}
                    >
                      {s.replaceAll('_', ' ')}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => deleteRequest({ table: 'sculpture_requests', bucket: 'sculpture-photos', req: r, filePath: r.photo_path, setList: setSculptures })}
                    className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-semibold text-slate-900">Custom print quotes</h3>
        {!quotes ? (
          <p className="mt-3 text-slate-500">Loading…</p>
        ) : quotes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No quote requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {quotes.map((r) => (
              <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {r.name} <span className="ml-2 text-sm font-normal text-slate-500">{r.contact}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{r.idea}</p>
                <div className="mt-2 flex items-center gap-3">
                  <FileLink bucket="quote-uploads" path={r.file_path} label="Download model file →" />
                  <button
                    type="button"
                    onClick={() => deleteRequest({ table: 'quote_requests', bucket: 'quote-uploads', req: r, filePath: r.file_path, setList: setQuotes })}
                    className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
