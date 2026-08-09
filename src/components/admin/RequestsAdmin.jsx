import { useEffect, useState } from 'react';
import { supabase, notifyQuote, insertOrder } from '../../lib/supabaseClient.js';
import { SCULPTURE_STYLES, formatINR } from '../../lib/constants.js';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500';

// Client-side copies of the quote-notify Edge Function's message text, so
// the admin can copy/paste the same wording into WhatsApp or an Instagram
// DM when the customer's "contact" isn't an email address.
const QUOTE_MESSAGE = {
  quoted: (price, note) =>
    `Hi! Your custom print quote from LoL3D: ${price ? formatINR(price) : '(see attached)'}.${note ? ` ${note}` : ''} Reply to confirm and we'll get printing.`,
  accepted: (price, note) =>
    `Confirmed at ${price ? formatINR(price) : 'the quoted price'} — we're getting started!${note ? ` ${note}` : ''}`,
  declined: (_price, note) =>
    note || "Unfortunately we can't take this one on right now. Feel free to reach out with any questions.",
};

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
  const [quoteNotices, setQuoteNotices] = useState({}); // { [id]: status message string }
  const [quoteDrafts, setQuoteDrafts] = useState({});
  const [converting, setConverting] = useState(null); // req object
  const [convertForm, setConvertForm] = useState({ price: '', city: '', pincode: '' });
  const [convertError, setConvertError] = useState(null);

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

  const openQuoteDraft = (req) =>
    setQuoteDrafts((d) => ({
      ...d,
      [req.id]: {
        price: req.metadata?.quoted_price ? String(req.metadata.quoted_price) : '',
        note: req.metadata?.admin_message ?? '',
        open: true,
      },
    }));
  const closeQuoteDraft = (id) => setQuoteDrafts((d) => ({ ...d, [id]: { ...d[id], open: false } }));
  const setDraftField = (id, field) => (e) =>
    setQuoteDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: e.target.value } }));

  // Advances a quote request's status, saves the quoted price / note into
  // metadata, then asks the quote-notify Edge Function to email the
  // customer (it only sends if their "contact" field is an email address).
  const advanceQuote = async (req, status, { price, note } = {}) => {
    const metadata = { ...req.metadata };
    if (price !== undefined) metadata.quoted_price = price !== '' ? Number(price) : metadata.quoted_price;
    if (note !== undefined) metadata.admin_message = note;
    const { error: e } = await supabase.from('quote_requests').update({ status, metadata }).eq('id', req.id);
    if (e) return setError(e.message);
    const updated = { ...req, status, metadata };
    setQuotes((prev) => prev.map((r) => (r.id === req.id ? updated : r)));
    closeQuoteDraft(req.id);
    const result = await notifyQuote(req.id, 'status');
    setQuoteNotices((n) => ({
      ...n,
      [req.id]: result.emailed
        ? 'Emailed the customer ✓'
        : "Not emailed automatically (contact isn't an email) — use Copy message to send by phone/DM.",
    }));
  };

  const copyQuoteMessage = async (req) => {
    const build = QUOTE_MESSAGE[req.status];
    if (!build) return;
    const text = build(req.metadata?.quoted_price, req.metadata?.admin_message);
    await navigator.clipboard.writeText(text);
    setQuoteNotices((n) => ({ ...n, [req.id]: 'Copied to clipboard ✓' }));
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

  const handleConvert = async (e) => {
    e.preventDefault();
    setConvertError(null);
    if (!convertForm.price || isNaN(convertForm.price)) return setConvertError('Please enter a valid price');
    const price = Number(convertForm.price);
    const orderId = crypto.randomUUID();
    const item = {
      name: converting.type === 'quote' ? `Custom Print: ${converting.idea.slice(0, 30)}...` : `Custom Sculpture: ${converting.style}`,
      qty: 1,
      unitPrice: price,
      material: converting.type === 'quote' ? 'Custom' : 'Resin'
    };
    
    const saved = await insertOrder({
      id: orderId,
      status: 'paid',
      items: [item],
      subtotal: price,
      shipping_cost: 0,
      total: price,
      customer_name: converting.name,
      phone: converting.contact,
      email: null,
      address_line1: 'Custom Request',
      city: convertForm.city || 'Unknown',
      state: 'TBD',
      pincode: convertForm.pincode || '110001',
      payment_method: 'manual',
    });
    
    if (!saved.ok) {
      setConvertError(saved.error || 'Failed to create order');
      return;
    }
    
    setConverting(null);
    alert('Order created successfully!');
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
                  {r.status === 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setConverting({ ...r, type: 'sculpture' });
                        setConvertForm({ price: '', city: '', pincode: r.metadata?.pincode || '' });
                      }}
                      className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600"
                    >
                      Convert to Order
                    </button>
                  )}
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
                {r.metadata?.quoted_price != null && (
                  <p className="mt-1 text-sm text-slate-500">
                    Quoted: <span className="font-semibold text-slate-900">{formatINR(r.metadata.quoted_price)}</span>
                    {r.metadata?.admin_message && <span> · “{r.metadata.admin_message}”</span>}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <FileLink bucket="quote-uploads" path={r.file_path} label="Download model file →" />
                  <button
                    type="button"
                    onClick={() => openQuoteDraft(r)}
                    className={`rounded-full px-2.5 py-1 text-xs capitalize ${r.status === 'quoted' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceQuote(r, 'accepted')}
                    className={`rounded-full px-2.5 py-1 text-xs capitalize ${r.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}
                  >
                    Accepted
                  </button>
                  {r.status === 'accepted' && (
                    <button
                      type="button"
                      onClick={() => {
                        setConverting({ ...r, type: 'quote' });
                        setConvertForm({ price: r.metadata?.quoted_price || '', city: '', pincode: r.metadata?.pincode || '' });
                      }}
                      className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600"
                    >
                      Convert to Order
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => advanceQuote(r, 'declined')}
                    className={`rounded-full px-2.5 py-1 text-xs capitalize ${r.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}
                  >
                    Declined
                  </button>
                  {r.status !== 'new' && (
                    <button type="button" onClick={() => copyQuoteMessage(r)} className="rounded-full px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50">
                      Copy message
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteRequest({ table: 'quote_requests', bucket: 'quote-uploads', req: r, filePath: r.file_path, setList: setQuotes })}
                    className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
                {quoteNotices[r.id] && <p className="mt-1.5 text-xs text-slate-500">{quoteNotices[r.id]}</p>}
                {quoteDrafts[r.id]?.open && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                      <input
                        type="number" min="0" placeholder="Price ₹"
                        value={quoteDrafts[r.id].price}
                        onChange={setDraftField(r.id, 'price')}
                        className={inputClass}
                      />
                      <textarea
                        placeholder="Optional note to the customer (timeline, material, etc.)" rows={2}
                        value={quoteDrafts[r.id].note}
                        onChange={setDraftField(r.id, 'note')}
                        className={inputClass}
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => advanceQuote(r, 'quoted', { price: quoteDrafts[r.id].price, note: quoteDrafts[r.id].note })}
                        className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
                      >
                        Send quote
                      </button>
                      <button type="button" onClick={() => closeQuoteDraft(r.id)} className="text-xs text-slate-500 hover:text-slate-900">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {converting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Convert to Order</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a paid order for {converting.name}'s request. This will add to your dashboard stats.
            </p>
            <form onSubmit={handleConvert} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Final Price (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={convertForm.price}
                  onChange={(e) => setConvertForm({ ...convertForm, price: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Customer City (Optional)</label>
                  <input
                    value={convertForm.city}
                    onChange={(e) => setConvertForm({ ...convertForm, city: e.target.value })}
                    className={inputClass}
                    placeholder="For dashboard stats"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Delivery Pincode</label>
                  <input
                    required
                    value={convertForm.pincode}
                    onChange={(e) => setConvertForm({ ...convertForm, pincode: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. 110001"
                  />
                </div>
              </div>
              {convertError && <p className="text-sm text-red-600">{convertError}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConverting(null)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
