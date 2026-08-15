import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-brand-500';

const EMPTY = {
  name: '',
  description: '',
  banner_text: '',
  discount_percent: 0,
  first_order_only: false,
  requires_signup: false,
  active: true,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: '',
};

function localToISO(local) {
  if (!local) return null;
  return new Date(local).toISOString();
}

function isoToLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 16);
}

function StatusBadge({ campaign }) {
  const now = new Date();
  const start = new Date(campaign.starts_at);
  const end = campaign.ends_at ? new Date(campaign.ends_at) : null;
  if (!campaign.active) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Inactive</span>;
  if (start > now) return <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Scheduled</span>;
  if (end && end < now) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Expired</span>;
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Live</span>;
}

function CampaignForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      discount_percent: Number(form.discount_percent),
      starts_at: localToISO(form.starts_at),
      ends_at: localToISO(form.ends_at),
    };
    let res;
    if (form.id) {
      const { id, created_at, ...rest } = payload;
      res = await supabase.from('campaigns').update(rest).eq('id', form.id);
    } else {
      const { id, created_at, ...rest } = payload;
      res = await supabase.from('campaigns').insert(rest);
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50 p-5">
      <h3 className="font-semibold text-slate-900">{form.id ? 'Edit campaign' : 'New campaign'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Campaign name</label>
          <input required value={form.name} onChange={set('name')} className={inputClass} placeholder="e.g. Summer Sale" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Description (internal note)</label>
          <input value={form.description} onChange={set('description')} className={inputClass} placeholder="Short note for your reference" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Banner text (shown to customers)</label>
          <input value={form.banner_text} onChange={set('banner_text')} className={inputClass} placeholder="e.g. 🎉 20% off today only!" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Discount %</label>
          <input type="number" min={0} max={100} required value={form.discount_percent} onChange={set('discount_percent')} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Starts at (local time)</label>
          <input type="datetime-local" required value={form.starts_at} onChange={set('starts_at')} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ends at (leave blank for no expiry)</label>
          <input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-wrap gap-5 border-t border-brand-200 pt-4">
        {[
          { key: 'first_order_only', label: 'First order only', hint: 'Apply discount only to customers with no previous orders' },
          { key: 'requires_signup', label: 'Require sign-up', hint: 'Block inquiry forms for guests' },
          { key: 'active', label: 'Active', hint: 'Unpublish to hide from customers' },
        ].map(({ key, label, hint }) => (
          <label key={key} className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={form[key]} onChange={set(key)} className="mt-0.5 h-4 w-4 accent-brand-500" />
            <span>
              <span className="text-sm font-medium text-slate-900">{label}</span>
              <span className="block text-xs text-slate-500">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50">
          {saving ? 'Saving…' : (form.id ? 'Update campaign' : 'Create campaign')}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CampaignsAdmin() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | { campaign object }

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setCampaigns(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    await supabase.from('campaigns').delete().eq('id', id);
    load();
  };

  const handleToggleActive = async (c) => {
    await supabase.from('campaigns').update({ active: !c.active }).eq('id', c.id);
    load();
  };

  const handleSaved = () => {
    setEditing(null);
    load();
  };

  if (loading) return <p className="text-sm text-slate-500">Loading campaigns…</p>;
  if (error) return <p className="text-sm text-red-700">Failed to load: {error}</p>;

  return (
    <div className="space-y-6">
      {editing === null && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{campaigns.length === 0 ? 'No campaigns yet.' : `${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}`}</p>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            + New campaign
          </button>
        </div>
      )}

      {editing === 'new' && (
        <CampaignForm onSave={handleSaved} onCancel={() => setEditing(null)} />
      )}

      {campaigns.length === 0 && editing === null && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-500">Create your first campaign to offer discounts and show banners to customers.</p>
        </div>
      )}

      <ul className="space-y-3">
        {campaigns.map((c) => (
          <li key={c.id}>
            {editing?.id === c.id ? (
              <CampaignForm
                initial={{ ...editing, starts_at: isoToLocal(editing.starts_at), ends_at: isoToLocal(editing.ends_at) }}
                onSave={handleSaved}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    <StatusBadge campaign={c} />
                    {c.first_order_only && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">First order only</span>
                    )}
                    {c.requires_signup && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Signup required</span>
                    )}
                  </div>
                  {c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}
                  {c.banner_text && <p className="mt-1 text-xs text-slate-400 italic">"{c.banner_text}"</p>}
                  <p className="mt-2 text-sm font-semibold text-brand-600">{c.discount_percent}% off</p>
                  <p className="text-xs text-slate-400">
                    {new Date(c.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {c.ends_at ? ` → ${new Date(c.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ' (no end date)'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${c.active ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                  >
                    {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
