import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { formatINR } from '../lib/constants.js';

const STATUS_STYLES = {
  placed: 'bg-slate-500/20 text-slate-300',
  paid: 'bg-emerald-500/20 text-emerald-300',
  printing: 'bg-brand-500/20 text-brand-400',
  shipped: 'bg-sky-500/20 text-sky-300',
  delivered: 'bg-emerald-500/20 text-emerald-300',
  cancelled: 'bg-red-500/20 text-red-300',
};

export default function AccountPage() {
  const { user, profile, loading, configured, signOut } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('id, created_at, status, items, total')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  if (!configured) return <Navigate to="/login" replace />;
  if (loading) return <main className="px-4 py-24 text-center text-slate-400">Loading…</main>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Hi, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="mt-1 text-slate-400">{user.email}</p>
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
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-red-400 hover:text-red-300"
          >
            Sign out
          </button>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-white">Your orders</h2>
      {orders === null ? (
        <p className="mt-4 text-slate-400">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-ink-900 p-8 text-center">
          <p className="text-slate-400">No orders yet — your future prints will show up here.</p>
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
            <li key={order.id} className="rounded-2xl border border-white/10 bg-ink-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-400">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}#{order.id.slice(0, 8)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.placed}`}>
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-white">
                {order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
              </p>
              <p className="mt-1 font-bold text-white">{formatINR(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
