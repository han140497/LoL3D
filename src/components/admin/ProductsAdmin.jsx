import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, uploadProductImage, deleteProductImage } from '../../lib/supabaseClient.js';
import { formatINR, PRICING } from '../../lib/constants.js';
import { calculateProductPrice } from '../../lib/pricing.js';
import { useCatalog } from '../../context/CatalogContext.jsx';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500';

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const EMPTY = {
  name: '', category: 'functional', petg_surcharge: '',
  filament_id: '', filament_weight_g: '', print_time_hours: '', labor_time_hours: '', markup_percent: '',
  price_override: '',
  dimensions: '', description: '', featured: false,
};

// One form for both adding and editing. `product` = null → add mode.
function ProductForm({ product, onSaved, onCancel }) {
  const { categories } = useCatalog();
  const [filaments, setFilaments] = useState([]);
  const [form, setForm] = useState(() => {
    if (!product) return EMPTY;
    const petg = (product.materials ?? []).find((m) => m.type === 'PETG');
    return {
      name: product.name,
      category: product.category,
      petg_surcharge: petg ? String(petg.surcharge) : '',
      filament_id: product.filament_id ?? '',
      filament_weight_g: product.filament_weight_g != null ? String(product.filament_weight_g) : '',
      print_time_hours: product.print_time_hours != null ? String(product.print_time_hours) : '',
      labor_time_hours: product.labor_time_hours ? String(product.labor_time_hours) : '',
      markup_percent: product.markup_override != null ? String(product.markup_override * 100) : '',
      // Existing products (seeded before the calculator existed, or manually
      // priced) show their current price as the override so it isn't lost.
      price_override: product.filament_weight_g == null ? String(product.price_base) : '',
      dimensions: product.dimensions ?? '',
      description: product.description ?? '',
      featured: product.featured,
    };
  });

  useEffect(() => {
    supabase.from('filaments').select('id, brand, type, color, price_per_kg').eq('active', true)
      .order('brand').order('type')
      .then(({ data }) => { if (data) setFilaments(data); });
  }, []);
  // Gallery photos: uploaded straight from disk instead of pasting a link.
  // The first one is the primary photo shown everywhere except the product page.
  const [images, setImages] = useState(() => {
    if (product?.images?.length) return product.images;
    if (product?.image_url) return [product.image_url];
    return [];
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    const results = await Promise.all(files.map(uploadProductImage));
    setUploading(false);
    const failed = results.find((r) => !r.ok);
    if (failed) return setError(`Image upload failed: ${failed.error}`);
    setImages((prev) => [...prev, ...results.map((r) => r.url)]);
  };

  const removeImage = (url) => {
    setImages((prev) => prev.filter((u) => u !== url));
    deleteProductImage(url); // best effort — don't block the UI on it
  };

  const makePrimary = (url) => {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  };

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const selectedFilament = filaments.find((f) => f.id === form.filament_id) ?? null;

  const calc = useMemo(() => calculateProductPrice({
    filamentWeightG: form.filament_weight_g,
    printTimeHours: form.print_time_hours,
    laborTimeHours: form.labor_time_hours || 0,
    markupPercent: form.markup_percent !== '' ? Number(form.markup_percent) / 100 : undefined,
    filamentCostPerKg: selectedFilament ? Number(selectedFilament.price_per_kg) : undefined,
  }), [form.filament_weight_g, form.print_time_hours, form.labor_time_hours, form.markup_percent, selectedFilament]);

  const finalPrice = form.price_override !== '' ? Number(form.price_override) : calc?.roundedPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalPrice || finalPrice <= 0) {
      setError('Enter filament weight + print time to auto-calculate a price, or set a manual price override.');
      return;
    }
    setBusy(true);
    setError(null);
    const materials = [{ type: 'PLA', surcharge: 0 }];
    if (form.petg_surcharge !== '') {
      materials.push({ type: 'PETG', surcharge: Number(form.petg_surcharge) });
    }
    const row = {
      name: form.name,
      category: form.category,
      price_base: finalPrice,
      filament_id: form.filament_id || null,
      filament_weight_g: form.filament_weight_g !== '' ? Number(form.filament_weight_g) : null,
      print_time_hours: form.print_time_hours !== '' ? Number(form.print_time_hours) : null,
      labor_time_hours: form.labor_time_hours !== '' ? Number(form.labor_time_hours) : 0,
      markup_override: form.markup_percent !== '' ? Number(form.markup_percent) / 100 : null,
      dimensions: form.dimensions || null,
      description: form.description,
      image_url: images[0] || null,
      images,
      featured: form.featured,
      materials,
    };
    // Slug is only set on create — existing product URLs stay stable.
    const query = product
      ? supabase.from('products').update(row).eq('id', product.id)
      : supabase.from('products').insert({ ...row, slug: slugify(form.name), active: true });
    const { error: saveError } = await query;
    setBusy(false);
    if (saveError) {
      return setError(
        saveError.message.includes('duplicate')
          ? 'A product with this name/slug already exists.'
          : saveError.message,
      );
    }
    if (!product) {
      setForm(EMPTY);
      setImages([]);
    }
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl border p-5 ${product ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{product ? `Editing: ${product.name}` : 'Add a product'}</h3>
        {product && (
          <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-900">
            Cancel
          </button>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="p-name" className="mb-1 block text-xs font-medium text-slate-500">Name</label>
          <input id="p-name" required placeholder="e.g. Curved Headphone Stand" value={form.name} onChange={set('name')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-category" className="mb-1 block text-xs font-medium text-slate-500">Category</label>
          <select id="p-category" value={form.category} onChange={set('category')} className={inputClass}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="p-petg" className="mb-1 block text-xs font-medium text-slate-500">PETG surcharge (₹, blank = no PETG option)</label>
          <input id="p-petg" type="number" min="0" placeholder="100" value={form.petg_surcharge} onChange={set('petg_surcharge')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-dimensions" className="mb-1 block text-xs font-medium text-slate-500">Dimensions</label>
          <input id="p-dimensions" placeholder="120 × 80 × 40 mm" value={form.dimensions} onChange={set('dimensions')} className={inputClass} />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Photos (optional — first one is the main photo; upload one or several)
        </label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50/40"
        >
          {uploading ? 'Uploading…' : 'Click to choose photos, or drag and drop — one or many'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          />
        </div>

        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 ? (
                  <span className="absolute left-1 top-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">Main</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makePrimary(url)}
                    className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Price calculator</p>
        <div className="mt-3">
          <label htmlFor="p-filament" className="mb-1 block text-xs font-medium text-slate-500">
            Filament brand &amp; type
            {selectedFilament && (
              <span className="ml-1 font-normal text-slate-400">— {formatINR(selectedFilament.price_per_kg)}/kg</span>
            )}
          </label>
          <select id="p-filament" value={form.filament_id} onChange={set('filament_id')} className={inputClass}>
            <option value="">— Use default rate ({formatINR(PRICING.filamentCostPerKg)}/kg) —</option>
            {filaments.map((f) => (
              <option key={f.id} value={f.id}>
                {f.brand} · {f.type}{f.color ? ` (${f.color})` : ''} — {formatINR(f.price_per_kg)}/kg
              </option>
            ))}
          </select>
          {filaments.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">
              No filaments in library yet — add some in the Filaments tab.
            </p>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="p-grams" className="mb-1 block text-xs font-medium text-slate-500">Filament used (g)</label>
            <input id="p-grams" type="number" min="0" step="0.1" placeholder="45" value={form.filament_weight_g} onChange={set('filament_weight_g')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-print-time" className="mb-1 block text-xs font-medium text-slate-500">Print time (hrs)</label>
            <input id="p-print-time" type="number" min="0" step="0.1" placeholder="3.5" value={form.print_time_hours} onChange={set('print_time_hours')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-labor-time" className="mb-1 block text-xs font-medium text-slate-500">Finishing/labor time (hrs — blank = ₹0, most products)</label>
            <input id="p-labor-time" type="number" min="0" step="0.1" placeholder="0" value={form.labor_time_hours} onChange={set('labor_time_hours')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="p-markup" className="mb-1 block text-xs font-medium text-slate-500">
              Markup % (blank = default {Math.round(PRICING.defaultMarkupPercent * 100)}%)
            </label>
            <input id="p-markup" type="number" min="0" step="1" placeholder={String(Math.round(PRICING.defaultMarkupPercent * 100))} value={form.markup_percent} onChange={set('markup_percent')} className={inputClass} />
          </div>
        </div>

        {calc ? (
          <p className="mt-3 text-sm text-slate-600">
            Material {formatINR(calc.materialCost)} + electricity {formatINR(calc.electricityCost)} + labor {formatINR(calc.laborCost)}
            {' '}+ waste {formatINR(calc.wasteCost)} + packaging {formatINR(calc.packagingCost)} = cost {formatINR(calc.totalCost)}.{' '}
            <span className="font-semibold text-slate-900">
              Suggested price at {Math.round(calc.markup * 100)}% markup: {formatINR(calc.roundedPrice)}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Enter filament weight and print time to see the suggested price.</p>
        )}

        <div className="mt-3">
          <label htmlFor="p-override" className="mb-1 block text-xs font-medium text-slate-500">
            Manual price override (₹, optional — leave blank to use the calculated price)
          </label>
          <input id="p-override" type="number" min="0" placeholder={calc ? String(calc.roundedPrice) : '499'} value={form.price_override} onChange={set('price_override')} className={inputClass} />
        </div>

        <p className="mt-2 text-sm font-semibold text-slate-900">
          Final price: {finalPrice ? formatINR(finalPrice) : '—'}
        </p>
      </div>

      <div className="mt-3">
        <label htmlFor="p-description" className="mb-1 block text-xs font-medium text-slate-500">Description</label>
        <textarea id="p-description" required placeholder="What is it, what's it good for?" rows={2} value={form.description} onChange={set('description')} className={inputClass} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.featured} onChange={set('featured')} className="accent-brand-500" />
          Featured (shows in the Insta grid)
        </label>
        <button type="submit" disabled={busy || uploading} className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
          {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

export default function ProductsAdmin() {
  const { categories } = useCatalog();
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null); // product being edited, or null
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
      <ProductForm
        key={editing?.id ?? 'new'}
        product={editing}
        onSaved={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4 font-medium">Product</th>
              <th className="pb-2 pr-4 font-medium">Category</th>
              <th className="pb-2 pr-4 font-medium">Price</th>
              <th className="pb-2 pr-4 font-medium">Featured</th>
              <th className="pb-2 pr-4 font-medium">Active</th>
              <th className="pb-2 font-medium"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'opacity-50'}>
                <td className="py-2.5 pr-4 text-slate-900">
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-slate-100" />
                    )}
                    {p.name}
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-slate-500">{categories.find((c) => c.id === p.category)?.name ?? p.category}</td>
                <td className="py-2.5 pr-4 text-slate-600">{formatINR(p.price_base)}</td>
                <td className="py-2.5 pr-4">
                  <button type="button" onClick={() => toggle(p, 'featured')} className={`rounded-full px-3 py-1 text-xs font-semibold ${p.featured ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}>
                    {p.featured ? '★ Featured' : 'Feature'}
                  </button>
                </td>
                <td className="py-2.5 pr-4">
                  <button type="button" onClick={() => toggle(p, 'active')} className={`rounded-full px-3 py-1 text-xs font-semibold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:text-slate-600'}`}>
                    {p.active ? 'Live' : 'Hidden'}
                  </button>
                </td>
                <td className="py-2.5">
                  <button
                    type="button"
                    onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                  >
                    Edit
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
