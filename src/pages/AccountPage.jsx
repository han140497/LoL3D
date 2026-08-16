import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase, notifyOrder } from '../lib/supabaseClient.js';
import { formatINR } from '../lib/constants.js';

const STATUS_STYLES = {
  placed: 'bg-slate-200 text-slate-600',
  paid: 'bg-emerald-100 text-emerald-700',
  printing: 'bg-brand-100 text-brand-600',
  shipped: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  reported: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-slate-200 text-slate-600',
};

const QUOTE_STATUS_STYLES = {
  new: 'bg-slate-200 text-slate-600',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-600',
};

export default function AccountPage() {
  const { user, profile, loading, configured, signOut } = useAuth();
  const [orders, setOrders] = useState(null);
  const [quotes, setQuotes] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [reporting, setReporting] = useState(null); // id of order being reported

  useEffect(() => {
    if (!user) return;
    
    supabase
      .from('orders')
      .select('id, created_at, status, payment_status, items, total')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []));

    supabase
      .from('quote_requests')
      .select('id, created_at, status, idea')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setQuotes(data ?? []));

    supabase
      .from('store_settings')
      .select('upi_id')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data?.upi_id) setUpiId(data.upi_id);
      });
  }, [user]);

  const reportPayment = async (orderId) => {
    setReporting(orderId);
    const res = await notifyOrder(orderId, 'payment_reported');
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'reported' } : o)));
    } else {
      alert('Could not report payment. Please try again or contact support.');
    }
    setReporting(null);
  };

  if (!configured) return <Navigate to="/login" replace />;
  if (loading) return <main className="px-4 py-24 text-center text-slate-500">Loading…</main>;
  if (!user) return <Navigate to="/login" replace />;

  if (!user) return <Navigate to="/login" replace />;

  const pendingOrders = orders?.filter((o) => o.payment_status === 'pending' && o.status !== 'cancelled') ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {pendingOrders.length > 0 && upiId && (
        <div className="mb-8 rounded-xl bg-amber-50 p-4 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-amber-800">Action Required: Payment Pending</h3>
            <p className="text-sm text-amber-700 mt-1">
              You have {pendingOrders.length} order(s) waiting for payment. Please complete payment so we can begin printing.
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById(`order-${pendingOrders[0].id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Pay Now
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Hi, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="mt-1 text-slate-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.is_admin && (
            <Link
              to="/admin"
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-red-400 hover:text-red-700"
          >
            Sign out
          </button>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">Orders</h2>
      {orders === null ? (
        <p className="mt-4 text-slate-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">No orders yet — your future prints will show up here.</p>
          <Link
            to="/catalog"
            className="mt-4 inline-block rounded-full bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600"
          >
            Browse the Catalog
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id} id={`order-${order.id}`} className={`rounded-2xl border ${order.payment_status === 'pending' ? 'border-amber-300 ring-1 ring-amber-300' : 'border-slate-200'} bg-white p-5 transition-shadow`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-500">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}#{order.id.slice(0, 8)}
                </span>
                <div className="flex gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.placed}`}>
                    {order.status}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${PAYMENT_STYLES[order.payment_status] ?? PAYMENT_STYLES.pending}`}>
                    Payment: {order.payment_status}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-slate-900">
                {order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
              </p>
              <p className="mt-1 font-bold text-slate-900">{formatINR(order.total)}</p>

              {order.payment_status === 'pending' && order.status !== 'cancelled' && upiId && (
                <div className="mt-6 rounded-xl bg-slate-50 p-5 border border-slate-200 text-center sm:text-left sm:flex sm:items-start sm:justify-between sm:gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900">Complete your payment via UPI</h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Scan the QR code or click the button below to pay {formatINR(order.total)}. 
                      Once done, click "I have paid" to notify us.
                    </p>
                    <div className="mt-4 font-mono text-sm font-semibold text-brand-700 bg-brand-50 inline-block px-3 py-1.5 rounded-lg border border-brand-200">
                      {upiId}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
                      <a
                        href={`upi://pay?pa=${upiId}&pn=LoL3D&am=${order.total}&tr=${order.id}`}
                        className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                      >
                        Pay on Phone
                      </a>
                      <button
                        type="button"
                        onClick={() => reportPayment(order.id)}
                        disabled={reporting === order.id}
                        className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {reporting === order.id ? 'Reporting…' : 'I have paid'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 sm:mt-0 shrink-0 mx-auto sm:mx-0 bg-white p-2 rounded-xl border border-slate-200 inline-block">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=LoL3D&am=${order.total}&tr=${order.id}`)}`} 
                      alt="UPI QR Code" 
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-12 text-xl font-semibold text-slate-900">Custom Print Requests</h2>
      {quotes === null ? (
        <p className="mt-4 text-slate-500">Loading requests…</p>
      ) : quotes.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">No custom print requests yet.</p>
          <Link
            to="/quote"
            className="mt-4 inline-block rounded-full bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600"
          >
            Submit an Idea
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {quotes.map((q) => (
            <li key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-500">
                  {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}#{q.id.slice(0, 8)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${QUOTE_STATUS_STYLES[q.status] ?? QUOTE_STATUS_STYLES.new}`}>
                  {q.status}
                </span>
              </div>
              <p className="mt-2 text-slate-700 text-sm line-clamp-2">{q.idea}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
