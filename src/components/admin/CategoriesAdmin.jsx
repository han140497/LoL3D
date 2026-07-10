import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500';

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState(null);
  const [form, setForm] = useState({ name: '', blurb: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    supabase
      .from('categories')
      .select('*')
      .order('sort')
      .then(({ data, error: e }) => (e ? setError(e.message) : setCategories(data)));
  };
  useEffect(load, []);

  const addCategory = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: insertError } = await supabase.from('categories').insert({
      id: slugify(form.name),
      name: form.name,
      blurb: form.blurb,
      sort: (categories?.length ?? 0) * 10 + 50,
    });
    setBusy(false);
    if (insertError) {
      return setError(
        insertError.message.includes('duplicate')
          ? 'A category with this name already exists.'
          : insertError.message,
      );
    }
    setForm({ name: '', blurb: '' });
    load();
  };

  const toggleActive = async (cat) => {
    const { error: e } = await supabase.from('categories').update({ active: !cat.active }).eq('id', cat.id);
    if (e) return setError(e.message);
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, active: !c.active } : c)));
  };

  if (error && !categories) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error} — if this mentions a missing table, run supabase/migrations/004 in the SQL editor.
      </p>
    );
  }
  if (!categories) return <p className="text-slate-500">Loading categories…</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={addCategory} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Add a category</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="c-name" className="mb-1 block text-xs font-medium text-slate-500">Name</label>
            <input id="c-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Keychains & Gifts" />
          </div>
          <div>
            <label htmlFor="c-blurb" className="mb-1 block text-xs font-medium text-slate-500">Short description (shown under the section title)</label>
            <input id="c-blurb" required value={form.blurb} onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))} className={inputClass} placeholder="Small prints, big smiles — gifts under ₹500." />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {form.name ? `URL will be /catalog/${slugify(form.name)}` : 'New categories appear in the nav, homepage, and filters immediately.'}
          </p>
          <button type="submit" disabled={busy} className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
            {busy ? 'Adding…' : 'Add category'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 ${cat.active ? '' : 'opacity-50'}`}>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{cat.name} <span className="ml-1 text-xs font-normal text-slate-400">/catalog/{cat.id}</span></p>
              <p className="text-sm text-slate-500">{cat.blurb}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleActive(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${cat.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}
            >
              {cat.active ? 'Live' : 'Hidden'}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Hiding a category removes it from the site navigation; its products stay but are only reachable by direct link. Products keep their category even while it's hidden.
      </p>
    </div>
  );
}
