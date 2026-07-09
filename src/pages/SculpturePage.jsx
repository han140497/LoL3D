import { useState } from 'react';
import { SCULPTURE_STYLES, EVENT_TYPES, INSTAGRAM, formatINR } from '../lib/constants.js';
import { logEvent } from '../lib/analytics.js';
import { insertSculptureRequest, uploadSculpturePhoto } from '../lib/supabaseClient.js';
import InstagramButton from '../components/shared/InstagramButton.jsx';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-brand-500';

const MAX_PHOTO_MB = 10;

// Simple line-art preview of what each sculpture style looks like.
const STYLE_ART = {
  'chibi': (
    <>
      <circle cx="24" cy="15" r="11" />
      <rect x="17" y="28" width="14" height="13" rx="6" />
      <circle cx="20" cy="14" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="28" cy="14" r="1.4" fill="currentColor" stroke="none" />
      <path d="M21 19q3 2.5 6 0" />
    </>
  ),
  'cartoon-mini': (
    <>
      <circle cx="24" cy="11" r="7" />
      <path d="M18 20h12v12a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" />
      <path d="M18 22l-5 6M30 22l5 6" />
      <path d="M21 35v7M27 35v7" />
      <circle cx="21.5" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="26.5" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  'realistic-bust': (
    <>
      <ellipse cx="24" cy="12" rx="6.5" ry="8" />
      <path d="M21 19.5v4M27 19.5v4" />
      <path d="M10 36q14-12 28 0v2H10z" />
      <rect x="17" y="40" width="14" height="4" rx="1" />
    </>
  ),
  'full-figurine': (
    <>
      <circle cx="24" cy="7" r="4.5" />
      <path d="M24 12v13M24 15l-7 6M24 15l7 6M24 25l-5 13M24 25l5 13" />
      <ellipse cx="24" cy="42" rx="11" ry="3" />
    </>
  ),
  'pet': (
    <>
      <ellipse cx="27" cy="30" rx="11" ry="8" />
      <circle cx="13" cy="22" r="6.5" />
      <path d="M9 17l-1.5-5L13 15M17 17l1.5-5L13 15" />
      <path d="M37 26q5-3 4-8" />
      <path d="M20 37v5M32 37v5" />
      <circle cx="11.5" cy="21" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="21" r="1" fill="currentColor" stroke="none" />
    </>
  ),
};

function StyleArt({ styleId, selected }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`h-16 w-16 shrink-0 transition-colors ${selected ? 'text-brand-600' : 'text-slate-400'}`}
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {STYLE_ART[styleId]}
    </svg>
  );
}

export default function SculpturePage() {
  const [style, setStyle] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [form, setForm] = useState({ name: '', contact: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return setPhotoError('Please upload a photo (JPG, PNG, WEBP, or HEIC).');
    }
    if (file.size > MAX_PHOTO_MB * 1e6) {
      return setPhotoError(`Photo is too large — max ${MAX_PHOTO_MB} MB.`);
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!style) return setError('Pick a style first — that tells us how to sculpt you.');
    if (!photo) return setError('Add a photo — it’s the reference we model from.');
    setSubmitting(true);
    setError(null);
    try {
      const uploaded = await uploadSculpturePhoto(photo);
      if (!uploaded.ok) throw new Error('Photo upload failed — please try again.');
      const saved = await insertSculptureRequest({
        name: form.name,
        contact: form.contact,
        style: style.id,
        notes: form.notes || null,
        photo_path: uploaded.path,
        session_id: sessionStorage.getItem('lol3d_session'),
        metadata: { photo_name: photo.name, style_name: style.name },
      });
      if (!saved.ok) throw new Error('Could not send your request. Please try again.');
      logEvent(EVENT_TYPES.QUOTE_CLICK, {
        targetId: 'sculpture',
        targetName: 'Sculpture request submitted',
        metadata: { location: 'sculpture_form', style: style.id },
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
        <div className="text-5xl">🗿</div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Request received!</h1>
        <p className="mt-3 text-slate-600">
          Thanks, {form.name.split(' ')[0] || 'friend'} — we've got your photo and your{' '}
          <span className="text-slate-900">{style.name}</span> pick. We'll create a 3D model preview
          and reach out to you before anything is printed, usually within 2–3 days.
        </p>
        <p className="mt-6 text-sm text-slate-500">Sneak peeks of sculpts in progress:</p>
        <div className="mt-3 flex justify-center">
          <InstagramButton location="sculpture_confirmation" label={`Follow ${INSTAGRAM.handle}`} variant="ghost" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Get Yourself Sculpted in 3D</h1>
      <p className="mt-2 max-w-xl text-slate-500">
        Send us a photo — of you, a friend, or your pet — pick a style, and we'll sculpt a custom
        3D model and print it. You approve the digital preview before we print anything.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        {/* Step 1 — style */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1 · Pick a style</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Sculpture style">
            {SCULPTURE_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={style?.id === s.id}
                onClick={() => setStyle(s)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  style?.id === s.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <StyleArt styleId={s.id} selected={style?.id === s.id} />
                <span>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{s.blurb}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-600">from {formatINR(s.priceFrom)}</p>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2 — photo */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900">2 · Add a photo</h2>
          <p className="mt-1 text-sm text-slate-500">
            A clear, well-lit photo works best. Front-facing for busts; full body for figurines.
          </p>
          <label
            htmlFor="photo"
            className="mt-4 flex cursor-pointer items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500 transition-colors hover:border-brand-500 hover:text-slate-600"
          >
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="Your uploaded reference" className="h-24 w-24 rounded-xl object-cover" />
                <span className="text-slate-900">
                  {photo.name} ({(photo.size / 1e6).toFixed(1)} MB)
                  <span className="block text-xs text-slate-500">Tap to replace</span>
                </span>
              </>
            ) : (
              <span>📸 Upload a photo — JPG/PNG/WEBP/HEIC, max {MAX_PHOTO_MB} MB</span>
            )}
          </label>
          <input id="photo" type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
          {photoError && <p className="mt-1.5 text-xs text-red-600">{photoError}</p>}
        </section>

        {/* Step 3 — details */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">3 · Your details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-600">Your name</label>
              <input id="name" required value={form.name} onChange={set('name')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact" className="mb-1.5 block text-sm font-medium text-slate-600">Phone, email, or Instagram</label>
              <input id="contact" required value={form.contact} onChange={set('contact')} className={inputClass} placeholder="9876543210 or @you" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-600">Anything we should know? (optional)</label>
            <textarea id="notes" rows={3} value={form.notes} onChange={set('notes')} className={inputClass} placeholder="Size, colors, pose ideas, deadline…" />
          </div>
        </section>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Sending your photo…' : 'Request my sculpture'}
        </button>
        <p className="-mt-6 text-center text-xs text-slate-500">
          No payment now — we'll share the 3D preview and final price before you commit.
        </p>
      </form>
    </main>
  );
}
