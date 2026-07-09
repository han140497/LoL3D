import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EVENT_TYPES, INSTAGRAM } from '../lib/constants.js';
import { logEvent } from '../lib/analytics.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import InstagramButton from '../components/shared/InstagramButton.jsx';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-brand-500';

export default function QuotePage() {
  const [params] = useSearchParams();
  const { products } = useCatalog();
  const [submitted, setSubmitted] = useState(false);

  const prefillSlug = params.get('print');
  const prefill = products.find((p) => p.slug === prefillSlug);

  const [form, setForm] = useState({
    name: '',
    contact: '',
    idea: prefill ? `I'd like to order: ${prefill.name} (${params.get('material') ?? 'PLA'})` : '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    logEvent(EVENT_TYPES.QUOTE_CLICK, {
      targetId: prefillSlug ?? 'custom',
      targetName: 'Quote request submitted',
      category: prefill?.category,
      metadata: {
        location: 'quote_form',
        name: form.name,
        contact: form.contact,
        idea: form.idea,
      },
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-3xl font-bold text-white">Request received!</h1>
        <p className="mt-3 text-slate-300">
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
      <h1 className="text-3xl font-bold text-white">Get a Quote</h1>
      <p className="mt-2 text-slate-400">
        Tell us what you want printed — a catalog piece, your own STL, or just an idea.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
            Your name
          </label>
          <input id="name" required value={form.name} onChange={set('name')} className={inputClass} placeholder="Jane Maker" />
        </div>
        <div>
          <label htmlFor="contact" className="mb-1.5 block text-sm font-medium text-slate-300">
            Email or Instagram handle
          </label>
          <input id="contact" required value={form.contact} onChange={set('contact')} className={inputClass} placeholder="jane@example.com or @janemaker" />
        </div>
        <div>
          <label htmlFor="idea" className="mb-1.5 block text-sm font-medium text-slate-300">
            What should we print?
          </label>
          <textarea id="idea" required rows={5} value={form.idea} onChange={set('idea')} className={inputClass} placeholder="Describe the piece, size, color, material (PLA/PETG), and quantity…" />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Send quote request
        </button>
        <p className="text-center text-xs text-slate-500">
          Prefer DMs? Message {INSTAGRAM.handle} directly — same team, same day.
        </p>
      </form>
    </main>
  );
}
