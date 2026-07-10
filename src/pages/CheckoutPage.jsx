import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatINR, INDIAN_STATES, EVENT_TYPES } from '../lib/constants.js';
import { computeShipping, isValidPincode } from '../lib/shipping.js';
import { logEvent } from '../lib/analytics.js';
import { insertOrder, notifyOrder } from '../lib/supabaseClient.js';
import { isPaymentConfigured, payWithRazorpay } from '../lib/payments.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-brand-500';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // { total, paid }

  const [form, setForm] = useState({
    name: profile?.full_name ?? '', phone: '', email: user?.email ?? '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  });
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Profile loads async after mount — fill name/email once it arrives,
  // without overwriting anything the customer already typed.
  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || (profile?.full_name ?? ''),
      email: f.email || (user?.email ?? ''),
    }));
  }, [user, profile]);

  const shipping = computeShipping(form.pincode, subtotal);
  const total = subtotal + (shipping?.cost ?? 0);
  const pincodeInvalid = form.pincode.length === 6 && !isValidPincode(form.pincode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shipping) return;
    setPlacing(true);
    setError(null);

    try {
      if (isPaymentConfigured) {
        // Paid path: the Edge Function computes the real amount from DB
        // prices, verifies the payment, and saves the order server-side.
        const result = await payWithRazorpay({
          items,
          customer: {
            name: form.name, phone: form.phone, email: form.email,
            line1: form.line1, line2: form.line2, city: form.city,
            state: form.state, pincode: form.pincode,
          },
        });
        if (!result.paid) {
          setPlacing(false);
          return; // checkout dismissed — keep the cart intact
        }
        logEvent(EVENT_TYPES.PURCHASE, {
          targetId: result.paymentId,
          targetName: 'Order paid',
          metadata: { total: result.total, item_count: items.length, paid: true },
        });
        if (result.orderId) notifyOrder(result.orderId, 'confirmation').catch(() => {});
        clearCart();
        setDone({ total: result.total, paid: true });
        return;
      }

      // Pay-later fallback: record the order, collect via UPI link manually.
      // The id is generated here so the confirmation email can reference it
      // (the anon role can insert orders but never read them back).
      const orderId = crypto.randomUUID();
      const saved = await insertOrder({
        id: orderId,
        status: 'placed',
        items,
        subtotal,
        shipping_cost: shipping.cost,
        total,
        customer_name: form.name,
        phone: form.phone,
        email: form.email || null,
        address_line1: form.line1,
        address_line2: form.line2 || null,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        payment_method: 'payment_link_requested',
        payment_ref: null,
        session_id: sessionStorage.getItem('lol3d_session'),
        user_id: user?.id ?? null,
      });
      if (!saved.ok) throw new Error('Could not save your order. Please try again.');
      notifyOrder(orderId, 'confirmation').catch(() => {});

      logEvent(EVENT_TYPES.PURCHASE, {
        targetId: 'order',
        targetName: 'Order placed',
        metadata: { total, shipping: shipping.cost, item_count: items.length, paid: false },
      });
      clearCart();
      setDone({ total, paid: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <div className="text-5xl">📦</div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Order placed!</h1>
        <p className="mt-3 text-slate-600">
          {done.paid
            ? `Payment of ${formatINR(done.total)} received — we're firing up the printers. You'll get shipping updates on WhatsApp/SMS.`
            : `Your order for ${formatINR(done.total)} is in. We'll send you a UPI payment link on WhatsApp/SMS to confirm it.`}
        </p>
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="mt-8 rounded-full bg-brand-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Keep Browsing
        </button>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Nothing to check out yet.</h1>
        <Link to="/catalog" className="mt-4 inline-block text-brand-600 hover:text-brand-700">
          ← Back to the catalog
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
      <p className="mt-2 text-slate-500">Domestic shipping only — we currently deliver across India.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-5">
        {/* Address + payment */}
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-3">
          <h2 className="text-lg font-semibold text-slate-900">Delivery address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-600">Full name</label>
              <input id="name" required value={form.name} onChange={set('name')} className={inputClass} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-600">Phone (for delivery updates)</label>
              <input id="phone" required type="tel" pattern="[6-9][0-9]{9}" title="10-digit Indian mobile number" value={form.phone} onChange={set('phone')} className={inputClass} autoComplete="tel-national" placeholder="9876543210" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-600">Email (for order confirmation & tracking updates)</label>
            <input id="email" required type="email" value={form.email} onChange={set('email')} className={inputClass} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="line1" className="mb-1.5 block text-sm font-medium text-slate-600">Address line 1</label>
            <input id="line1" required value={form.line1} onChange={set('line1')} className={inputClass} autoComplete="address-line1" placeholder="Flat / house no., building, street" />
          </div>
          <div>
            <label htmlFor="line2" className="mb-1.5 block text-sm font-medium text-slate-600">Address line 2 (optional)</label>
            <input id="line2" value={form.line2} onChange={set('line2')} className={inputClass} autoComplete="address-line2" placeholder="Area, landmark" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-slate-600">City</label>
              <input id="city" required value={form.city} onChange={set('city')} className={inputClass} autoComplete="address-level2" />
            </div>
            <div>
              <label htmlFor="state" className="mb-1.5 block text-sm font-medium text-slate-600">State / UT</label>
              <select id="state" required value={form.state} onChange={set('state')} className={inputClass}>
                <option value="" disabled>Select…</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pincode" className="mb-1.5 block text-sm font-medium text-slate-600">PIN code</label>
              <input id="pincode" required inputMode="numeric" maxLength={6} value={form.pincode} onChange={set('pincode')} className={inputClass} autoComplete="postal-code" placeholder="500001" />
              {pincodeInvalid && <p className="mt-1 text-xs text-red-600">That doesn't look like a valid Indian PIN code.</p>}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={placing || !shipping}
            className="w-full rounded-full bg-brand-500 py-3.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {placing
              ? 'Processing…'
              : isPaymentConfigured
                ? `Pay ${shipping ? formatINR(total) : ''} — UPI / Card / Netbanking`
                : `Place Order${shipping ? ` · ${formatINR(total)}` : ''}`}
          </button>
          <p className="text-center text-xs text-slate-500">
            {isPaymentConfigured
              ? 'Secure payment via Razorpay — UPI, cards, netbanking, and wallets.'
              : "We'll send a UPI payment link on WhatsApp/SMS to confirm your order."}
          </p>
        </form>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((line) => (
              <li key={`${line.slug}-${line.material}`} className="flex justify-between gap-2 text-slate-600">
                <span className="min-w-0 truncate">{line.name} ({line.material}) × {line.qty}</span>
                <span className="shrink-0 font-medium text-slate-900">{formatINR(line.unitPrice * line.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="font-medium text-slate-900">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Shipping{shipping ? ` — ${shipping.label}` : ''}</dt>
              <dd className="font-medium text-slate-900">
                {shipping ? (shipping.cost === 0 ? 'FREE' : formatINR(shipping.cost)) : 'Enter PIN code'}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="text-xl font-bold text-slate-900">{shipping ? formatINR(total) : '—'}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
