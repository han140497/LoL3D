import { useEffect, useState } from 'react';
import { supabase, notifyOrder } from '../../lib/supabaseClient.js';
import { formatINR } from '../../lib/constants.js';

const STATUSES = ['placed', 'printing', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  placed: 'bg-slate-200 text-slate-600',
  printing: 'bg-brand-100 text-brand-600',
  shipped: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function OrderCard({ order, upiId, onStatusChange, onPaymentStatusChange }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const setStatus = async (status) => {
    if (status === order.status) return;
    if (status === 'cancelled' && !window.confirm(`Cancel order #${order.id.slice(0, 8)}?`)) return;
    setBusy(true);
    setNote(null);
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (error) {
      setBusy(false);
      return setNote(`❌ ${error.message}`);
    }
    onStatusChange(order.id, status);
    // Email the customer about the new status
    const result = await notifyOrder(order.id, 'status');
    setBusy(false);
    if (result.emailed) setNote('✓ Status saved · customer emailed');
    else if (result.reason === 'no_email_on_order') setNote('✓ Status saved · no email on this order');
    else if (result.reason === 'email_not_configured') setNote('✓ Status saved · email not set up yet (add RESEND_API_KEY)');
    else setNote(`✓ Status saved · email failed: ${result.reason ?? 'unknown'}`);
  };

  const setPaymentStatus = async (payment_status) => {
    if (payment_status === order.payment_status) return;
    
    if (payment_status === 'paid') {
      if (!window.confirm(`Confirm payment received for order #${order.id.slice(0, 8)}? This will email a receipt to the customer.`)) {
        return;
      }
    }
    
    setBusy(true);
    setNote(null);
    const { error } = await supabase.from('orders').update({ payment_status }).eq('id', order.id);
    if (error) {
      setBusy(false);
      return setNote(`❌ ${error.message}`);
    }
    onPaymentStatusChange(order.id, payment_status);
    
    if (payment_status === 'paid') {
      const result = await notifyOrder(order.id, 'payment_confirmed');
      if (result.emailed) setNote('✓ Payment status saved · receipt emailed');
      else if (result.reason === 'no_email_on_order') setNote('✓ Payment status saved · no email on this order');
      else setNote(`✓ Payment status saved · email failed: ${result.reason ?? 'unknown'}`);
    } else {
      setNote('✓ Payment status saved');
    }
    setBusy(false);
  };

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {order.customer_name}
            <span className="ml-2 text-sm font-normal text-slate-500">
              {order.phone}{order.email ? ` · ${order.email}` : ''}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}#{order.id.slice(0, 8)}
            {' · '}{order.payment_method === 'razorpay' ? `Paid online (${order.payment_ref})` : 'Payment link requested'}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status]}`}>
          {order.status}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {(order.items ?? []).map((i) => `${i.name} (${i.material}) × ${i.qty}`).join(', ')}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ''}, {order.city}, {order.state} — {order.pincode}
      </p>
      <p className="mt-1 font-bold text-slate-900">
        {formatINR(order.total)}
        <span className="ml-2 text-xs font-normal text-slate-500">
          (incl. {Number(order.shipping_cost) === 0 ? 'free shipping' : `${formatINR(order.shipping_cost)} shipping`})
        </span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-2">Fulfillment:</span>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${
              order.status === s
                ? STATUS_STYLES[s]
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-2">Payment:</span>
        {['pending', 'reported', 'paid', 'refunded'].map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => setPaymentStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${
              order.payment_status === s
                ? (s === 'paid' ? 'bg-emerald-100 text-emerald-700' : s === 'refunded' ? 'bg-orange-100 text-orange-700' : s === 'reported' ? 'bg-blue-100 text-blue-700 border border-blue-200 ring-1 ring-blue-300' : 'bg-amber-100 text-amber-700')
                : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            {s === 'reported' ? 'Customer Reported' : s}
          </button>
        ))}
        {order.payment_status === 'pending' && upiId && (
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="ml-auto rounded-full bg-brand-50 text-brand-600 px-3 py-1 text-xs font-semibold hover:bg-brand-100"
          >
            Show Payment QR
          </button>
        )}
      </div>

      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <h3 className="text-lg font-semibold text-slate-900">Payment QR</h3>
            <p className="mt-1 text-sm text-slate-500">
              Screenshot or copy this to send to {order.customer_name.split(' ')[0]}.
            </p>
            <div className="mt-5 flex justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=LoL3D&am=${order.total}&tr=${order.id}`)}`} 
                alt="UPI QR Code" 
                className="w-48 h-48 rounded-xl border border-slate-200 shadow-sm"
              />
            </div>
            <p className="mt-4 text-xs font-mono text-slate-500 bg-slate-50 p-2 rounded-lg break-all">
              upi://pay?pa={upiId}&pn=LoL3D&am={order.total}&tr={order.id}
            </p>
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="mt-6 rounded-full bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ongoing'); // ongoing | all
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error: e }) => (e ? setError(e.message) : setOrders(data)));
      
    // Fetch UPI ID from settings
    supabase
      .from('store_settings')
      .select('upi_id')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data?.upi_id) setUpiId(data.upi_id);
      });
  }, []);

  const handleStatusChange = (id, status) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const handlePaymentStatusChange = (id, payment_status) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_status } : o)));

  if (error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }
  if (!orders) return <p className="text-slate-500">Loading orders…</p>;

  const visible = filter === 'ongoing'
    ? orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
    : orders;

  return (
    <div>
      <div className="flex gap-2">
        {['ongoing', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            {f === 'ongoing' ? `Ongoing (${orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length})` : `All (${orders.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          {filter === 'ongoing' ? 'No ongoing orders — everything is delivered. 🎉' : 'No orders yet.'}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              upiId={upiId}
              onStatusChange={handleStatusChange}
              onPaymentStatusChange={handlePaymentStatusChange}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
