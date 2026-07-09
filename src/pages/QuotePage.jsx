import { useState } from 'react';
import { EVENT_TYPES, INSTAGRAM } from '../lib/constants.js';
import { logEvent } from '../lib/analytics.js';
import { insertQuoteRequest, uploadQuoteFile } from '../lib/supabaseClient.js';
import InstagramButton from '../components/shared/InstagramButton.jsx';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-brand-500';

const ACCEPTED_EXTENSIONS = ['.stl', '.obj', '.3mf', '.step', '.stp'];
const MAX_FILE_MB = 50;

export default function QuotePage() {
  const [form, setForm] = useState({ name: '', contact: '', idea: '' });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    setFileError(null);
    if (!selected) return setFile(null);
    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setFile(null);
      return setFileError(`Please upload a 3D model file (${ACCEPTED_EXTENSIONS.join(', ')}).`);
    }
    if (selected.size > MAX_FILE_MB * 1e6) {
      setFile(null);
      return setFileError(`File is too large — max ${MAX_FILE_MB} MB. For bigger models, share a link in the description.`);
    }
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let filePath = null;
      if (file) {
        const uploaded = await uploadQuoteFile(file);
        if (!uploaded.ok) throw new Error('File upload failed — please try again or share a link instead.');
        filePath = uploaded.path;
      }
      const saved = await insertQuoteRequest({
        name: form.name,
        contact: form.contact,
        idea: form.idea,
        file_path: filePath,
        session_id: sessionStorage.getItem('lol3d_session'),
        metadata: file ? { file_name: file.name, file_size: file.size } : {},
      });
      if (!saved.ok) throw new Error('Could not send your request. Please try again.');

      logEvent(EVENT_TYPES.QUOTE_CLICK, {
        targetId: 'custom',
        targetName: 'Quote request submitted',
        metadata: { location: 'quote_form', has_file: Boolean(file) },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Request received!</h1>
        <p className="mt-3 text-slate-600">
          Thanks, {form.name.split(' ')[0] || 'friend'} — we'll get back to you within a day with a
          price and timeline.
        </p>
        <p className="mt-6 text-sm text-slate-500">
          While you wait, see what's coming off the printers:
        </p>
        <div className="mt-3 flex justify-center">
          <InstagramButton location="quote_confirmation" label={`Follow ${INSTAGRAM.handle}`} variant="ghost" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Custom Print Quote</h1>
      <p className="mt-2 text-slate-500">
        For anything not in the catalog — your own design, a repair part, a one-off gift.
        Upload an STL if you have one, or just describe the idea.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-600">
            Your name
          </label>
          <input id="name" required value={form.name} onChange={set('name')} className={inputClass} placeholder="Jane Maker" />
        </div>
        <div>
          <label htmlFor="contact" className="mb-1.5 block text-sm font-medium text-slate-600">
            Phone, email, or Instagram handle
          </label>
          <input id="contact" required value={form.contact} onChange={set('contact')} className={inputClass} placeholder="9876543210 or @janemaker" />
        </div>
        <div>
          <label htmlFor="idea" className="mb-1.5 block text-sm font-medium text-slate-600">
            What should we print?
          </label>
          <textarea id="idea" required rows={5} value={form.idea} onChange={set('idea')} className={inputClass} placeholder="Describe the piece: size, color, material (PLA/PETG), quantity, deadline…" />
        </div>
        <div>
          <label htmlFor="stl" className="mb-1.5 block text-sm font-medium text-slate-600">
            3D model file (optional)
          </label>
          <label
            htmlFor="stl"
            className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500 transition-colors hover:border-brand-500 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
            {file ? (
              <span className="text-slate-900">{file.name} ({(file.size / 1e6).toFixed(1)} MB)</span>
            ) : (
              <span>Upload STL / OBJ / 3MF / STEP — max {MAX_FILE_MB} MB</span>
            )}
          </label>
          <input id="stl" type="file" accept={ACCEPTED_EXTENSIONS.join(',')} onChange={handleFile} className="sr-only" />
          {fileError && <p className="mt-1.5 text-xs text-red-600">{fileError}</p>}
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send quote request'}
        </button>
        <p className="text-center text-xs text-slate-500">
          Prefer DMs? Message {INSTAGRAM.handle} directly — same team, same day.
        </p>
      </form>
    </main>
  );
}
