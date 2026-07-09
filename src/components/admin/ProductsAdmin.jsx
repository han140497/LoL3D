import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { CATEGORIES, formatINR } from '../../lib/constants.js';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500';

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const EMPTY = {
  name: '', category: 'functional', price_base: '', petg_surcharge: '',
  dimensions: '', description: '', image_url: '', featured: false,
};

function AddProductForm({ onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const materials = [{ type: 'PLA', surcharge: 0 }];
    if (form.petg_surcharge !== '') {
      materials.push({ type: 'PETG', surcharge: Number(form.petg_surcharge) });
    }
    const { error: insertError } = await supabase.from('products').insert({
      slug: slugify(form.name),
      name: form.name,
      category: form.category,
      price_base: Number(form.price_base),
      dimensions: form.dimensions || null,
      description: form.description,
      image_url: form.image_url || null,
      featured: form.featured,
      materials,
      active: true,
    });
    setBusy(false);
    if (insertError) {
      return setError(
        insertError.message.includes('duplicate')
          ? 'A product with this name/slug already exists.'
          : insertError.message,
      );
    }
    setForm(EMPTY);
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Add a product</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input required placeholder="Name" value={form.name} onChange={set('name')} className={inputClass} aria-label="Product name" />
        <select value={form.category} onChange={set('category')} className={inputClass} aria-label="Category">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input required type="number" min="1" placeholder="Base price (₹, PLA)" value={form.price_base} onChange={set('price_base')} className={inputClass} aria-label="Base price in rupees" />
        <input type="number" min="0" placeholder="PETG surcharge (₹, blank = no PETG)" value={form.petg_surcharge} onChange={set('petg_surcharge')} className={inputClass} aria-label="PETG surcharge" />
        <input placeholder="Dimensions (e.g. 120 × 80 × 40 mm)" value={form.dimensions} onChange={set('dimensions')} className={inputClass} aria-label="Dimensions" />
        <input placeholder="Image URL (optional)" value={form.image_url} onChange={set('image_url')} className={inputClass} aria-label="Image URL" />
      </div>
      <textarea required placeholder="Description" rows={2} value={form.description} onChange={set('description')} className={`${inputClass} mt-3`} aria-label="Description" />
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.featured} onChange={set('featured')} className="accent-brand-500" />
          Featured (shows in the Insta grid)
        </label>
        <button type="submit" disabled={busy} className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
          {busy ? 'Adding…' : 'Add product'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => (e ? setError(e.message) : setProducts(data)));
  };
  useEffect(load, []);

  const toggle = async (product, field) => {
    const { error: e } = await supabase
      .from('products')
      .update({ [field]: !product[field] })
      .eq('id', product.id);
    if (e) return setError(e.message);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [field]: !p[field] } : p)));
  };

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error} — if this mentions a missing policy, run supabase/migrations/002 in the SQL editor.
      </p>
    );
  }
  if (!products) return <p className="text-slate-500">Loading products…</p>;

  return (
    <div className="space-y-6">
      <AddProductForm onAdded={load} />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4 font-medium">Product</th>
              <th className="pb-2 pr-4 font-medium">Category</th>
              <th className="pb-2 pr-4 font-medium">Price</th>
              <th className="pb-2 pr-4 font-medium">Featured</th>
              <th className="pb-2 font-medium">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'opacity-50'}>
                <td className="py-2.5 pr-4 text-slate-900">{p.name}</td>
                <td className="py-2.5 pr-4 text-slate-500">{CATEGORIES.find((c) => c.id === p.category)?.name ?? p.category}</td>
                <td className="py-2.5 pr-4 text-slate-600">{formatINR(p.price_base)}</td>
                <td className="py-2.5 pr-4">
                  <button type="button" onClick={() => toggle(p, 'featured')} className={`rounded-full px-3 py-1 text-xs font-semibold ${p.featured ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}>
                    {p.featured ? '★ Featured' : 'Feature'}
                  </button>
                </td>
                <td className="py-2.5">
                  <button type="button" onClick={() => toggle(p, 'active')} className={`rounded-full px-3 py-1 text-xs font-semibold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}>
                    {p.active ? 'Live' : 'Hidden'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
