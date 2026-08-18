import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { formatINR } from '../../lib/constants.js';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500';

const EMPTY = { brand: '', type: '', color: '', price_per_kg: '', notes: '' };

const COMMON_TYPES = ['PLA', 'PLA+', 'PLA Basic', 'PLA Matte', 'PETG', 'PETG HF', 'ABS', 'ASA', 'TPU', 'SILK PLA', 'Wood PLA', 'Carbon Fibre PLA'];

function FilamentForm({ filament, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    filament
      ? { brand: filament.brand, type: filament.type, color: filament.color ?? '', price_per_kg: String(filament.price_per_kg), notes: filament.notes ?? '' }
      : EMPTY
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand.trim()) return setError('Brand is required.');
    if (!form.type.trim()) return setError('Type is required.');
    const price = Number(form.price_per_kg);
    if (!Number.isFinite(price) || price <= 0) return setError('Enter a valid price per kg.');
    setBusy(true);
    setError(null);
    const row = {
      brand: form.brand.trim(),
      type: form.type.trim(),
      color: form.color.trim() || null,
      price_per_kg: price,
      notes: form.notes.trim() || null,
    };
    const query = filament
      ? supabase.from('filaments').update(row).eq('id', filament.id)
      : supabase.from('filaments').insert({ ...row, active: true });
    const { error: saveError } = await query;
    setBusy(false);
    if (saveError) return setError(saveError.message);
    onSaved();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border p-5 ${filament ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200 bg-white'}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{filament ? `Editing: ${filament.brand} ${filament.type}` : 'Add filament'}</h3>
        {filament && (
          <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-900">
            Cancel
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Brand</label>
          <input
            required
            placeholder="e.g. eSUN, Bambu Lab, Polymaker"
            value={form.brand}
            onChange={set('brand')}
            className={inputClass}
            list="brand-suggestions"
          />
          <datalist id="brand-suggestions">
            {['Generic / Unknown', 'eSUN', 'Bambu Lab', 'Polymaker', 'Creality', 'Hatchbox', 'Sunlu', 'Prusament', 'Fiberlogy', 'Jayo', 'Eryone'].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Type / Material</label>
          <input
            required
            placeholder="e.g. PLA, PETG, ABS"
            value={form.type}
            onChange={set('type')}
            className={inputClass}
            list="type-suggestions"
          />
          <datalist id="type-suggestions">
            {COMMON_TYPES.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Colour (optional)</label>
          <input
            placeholder="e.g. White, Black, Galaxy"
            value={form.color}
            onChange={set('color')}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Purchase price (₹ / kg)</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            placeholder="1200"
            value={form.price_per_kg}
            onChange={set('price_per_kg')}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-500">Notes (optional)</label>
        <input
          placeholder="e.g. bought from Amazon, lot #3"
          value={form.notes}
          onChange={set('notes')}
          className={inputClass}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? 'Saving…' : filament ? 'Save changes' : 'Add filament'}
        </button>
      </div>
    </form>
  );
}

export default function FilamentsAdmin() {
  const [filaments, setFilaments] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    supabase
      .from('filaments')
      .select('*')
      .order('brand')
      .order('type')
      .then(({ data, error: e }) => (e ? setError(e.message) : setFilaments(data)));
  };

  useEffect(load, []);

  const toggleActive = async (f) => {
    const { error: e } = await supabase.from('filaments').update({ active: !f.active }).eq('id', f.id);
    if (e) return setError(e.message);
    setFilaments((prev) => prev.map((x) => (x.id === f.id ? { ...x, active: !x.active } : x)));
  };

  const deleteFilament = async (f) => {
    if (!window.confirm(`Delete ${f.brand} ${f.type}? This cannot be undone.`)) return;
    const { error: e } = await supabase.from('filaments').delete().eq('id', f.id);
    if (e) return setError(e.message);
    setFilaments((prev) => prev.filter((x) => x.id !== f.id));
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">Could not load filaments</p>
        <p className="mt-1">{error}</p>
        <p className="mt-2 text-xs">
          Run <code className="rounded bg-red-100 px-1">supabase/migrations/016_filaments.sql</code> in the Supabase SQL editor first.
        </p>
      </div>
    );
  }

  if (!filaments) return <p className="text-slate-500">Loading filaments…</p>;

  const active = filaments.filter((f) => f.active);
  const inactive = filaments.filter((f) => !f.active);

  return (
    <div className="space-y-6">
      <FilamentForm
        key={editing?.id ?? 'new'}
        filament={editing}
        onSaved={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Filament library</h3>
          <p className="text-sm text-slate-500">{active.length} active · {inactive.length} hidden</p>
        </div>

        <p className="mt-1 text-xs text-slate-400">
          These spools appear in the product calculator so you can pick the exact material cost per product.
        </p>

        {filaments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No filaments yet — add your first one above.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Brand</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Colour</th>
                  <th className="pb-2 pr-4 font-medium">₹ / kg</th>
                  <th className="pb-2 pr-4 font-medium">Notes</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filaments.map((f) => (
                  <tr key={f.id} className={f.active ? '' : 'opacity-40'}>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{f.brand}</td>
                    <td className="py-2.5 pr-4 text-slate-700">{f.type}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{f.color ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-semibold text-slate-900">{formatINR(f.price_per_kg)}</td>
                    <td className="py-2.5 pr-4 text-slate-400 text-xs">{f.notes ?? ''}</td>
                    <td className="py-2.5 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(f)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${f.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                      >
                        {f.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditing(f); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFilament(f)}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
