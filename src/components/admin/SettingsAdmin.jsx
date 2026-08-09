import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-brand-500';

export default function SettingsAdmin() {
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    supabase.from('store_settings').select('upi_id').eq('id', 1).single()
      .then(({ data, error }) => {
        if (!error && data) setUpiId(data.upi_id || '');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from('store_settings').update({ upi_id: upiId, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      setTimeout(() => setMessage(null), 3000);
    }
    setSaving(false);
  };

  if (loading) return <p className="mt-3 text-slate-500">Loading settings…</p>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 max-w-2xl">
      <h3 className="text-lg font-semibold text-slate-900">Payment Settings</h3>
      <p className="mt-1 text-sm text-slate-500">Configure global payment options.</p>

      <form onSubmit={handleSave} className="mt-6 space-y-5">
        <div>
          <label htmlFor="upiId" className="mb-1.5 block text-sm font-medium text-slate-600">
            UPI ID / VPA
          </label>
          <input
            id="upiId"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className={inputClass}
            placeholder="e.g. name@upi"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            This UPI ID will be displayed to customers at checkout if Razorpay is not configured.
          </p>
        </div>

        {message && (
          <p className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
