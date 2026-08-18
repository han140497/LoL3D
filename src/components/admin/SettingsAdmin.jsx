import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { PRICING } from '../../lib/constants.js';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-brand-500';

const DEFAULTS = {
  upi_id: '',
  printer_power_kw: PRICING.printerPowerKw,
  electricity_rate_per_kwh: PRICING.electricityRatePerKwh,
  labor_rate_per_hour: PRICING.laborRatePerHour,
  packaging_cost: PRICING.packagingCost,
  waste_allowance_percent: PRICING.wasteAllowancePercent * 100, // store as % in form
  default_markup_percent: PRICING.defaultMarkupPercent * 100,   // store as % in form
};

export default function SettingsAdmin() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    supabase.from('store_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            upi_id: data.upi_id ?? '',
            printer_power_kw: data.printer_power_kw ?? PRICING.printerPowerKw,
            electricity_rate_per_kwh: data.electricity_rate_per_kwh ?? PRICING.electricityRatePerKwh,
            labor_rate_per_hour: data.labor_rate_per_hour ?? PRICING.laborRatePerHour,
            packaging_cost: data.packaging_cost ?? PRICING.packagingCost,
            waste_allowance_percent: ((data.waste_allowance_percent ?? PRICING.wasteAllowancePercent) * 100).toFixed(1),
            default_markup_percent: ((data.default_markup_percent ?? PRICING.defaultMarkupPercent) * 100).toFixed(0),
          });
        }
        setLoading(false);
      });
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const electricityCostPerHour = (
    Number(form.printer_power_kw) * Number(form.electricity_rate_per_kwh)
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from('store_settings').update({
      upi_id: form.upi_id,
      printer_power_kw: Number(form.printer_power_kw),
      electricity_rate_per_kwh: Number(form.electricity_rate_per_kwh),
      labor_rate_per_hour: Number(form.labor_rate_per_hour),
      packaging_cost: Number(form.packaging_cost),
      waste_allowance_percent: Number(form.waste_allowance_percent) / 100,
      default_markup_percent: Number(form.default_markup_percent) / 100,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Settings saved.' });
      setTimeout(() => setMessage(null), 3000);
    }
    setSaving(false);
  };

  if (loading) return <p className="mt-3 text-slate-500">Loading settings…</p>;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-8">

      {/* Payment */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Payment</h3>
        <p className="mt-1 text-sm text-slate-500">UPI ID shown to customers at checkout if Razorpay isn't configured.</p>
        <div className="mt-5">
          <label htmlFor="upiId" className="mb-1.5 block text-sm font-medium text-slate-600">UPI ID / VPA</label>
          <input id="upiId" value={form.upi_id} onChange={set('upi_id')} className={inputClass} placeholder="e.g. name@upi" />
        </div>
      </div>

      {/* Calculator rates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Calculator rates</h3>
        <p className="mt-1 text-sm text-slate-500">
          These drive the automatic price calculator in Products. Changes apply to all new calculations immediately.
        </p>

        <div className="mt-5 space-y-5">

          {/* Electricity */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Electricity</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="printerPower" className="mb-1.5 block text-sm font-medium text-slate-600">
                  Printer power draw (kW)
                </label>
                <input
                  id="printerPower"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.printer_power_kw}
                  onChange={set('printer_power_kw')}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">Typical FDM printer: 0.10–0.30 kW</p>
              </div>
              <div>
                <label htmlFor="elecRate" className="mb-1.5 block text-sm font-medium text-slate-600">
                  Electricity rate (₹ / kWh)
                </label>
                <input
                  id="elecRate"
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.electricity_rate_per_kwh}
                  onChange={set('electricity_rate_per_kwh')}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">Check your electricity bill for the unit rate</p>
              </div>
            </div>
            {Number.isFinite(electricityCostPerHour) && electricityCostPerHour > 0 && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                At these rates: <span className="font-semibold">₹{electricityCostPerHour.toFixed(2)} per hour</span> of printing
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Labor & packaging */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Labor &amp; packaging</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="laborRate" className="mb-1.5 block text-sm font-medium text-slate-600">
                  Labor rate (₹ / hr)
                </label>
                <input
                  id="laborRate"
                  type="number"
                  min="0"
                  step="10"
                  value={form.labor_rate_per_hour}
                  onChange={set('labor_rate_per_hour')}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="packaging" className="mb-1.5 block text-sm font-medium text-slate-600">
                  Packaging cost (₹ flat per order)
                </label>
                <input
                  id="packaging"
                  type="number"
                  min="0"
                  step="1"
                  value={form.packaging_cost}
                  onChange={set('packaging_cost')}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Markup & waste */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Markup &amp; waste</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="markup" className="mb-1.5 block text-sm font-medium text-slate-600">
                  Default markup (%)
                </label>
                <input
                  id="markup"
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={form.default_markup_percent}
                  onChange={set('default_markup_percent')}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">Applied when no per-product markup is set</p>
              </div>
              <div>
                <label htmlFor="waste" className="mb-1.5 block text-sm font-medium text-slate-600">
                  Waste allowance (%)
                </label>
                <input
                  id="waste"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.waste_allowance_percent}
                  onChange={set('waste_allowance_percent')}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">% of material + electricity added for failed prints, support waste, etc.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {message && (
        <p className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
