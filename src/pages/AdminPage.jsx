import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchDashboardData } from '../lib/adminData.js';
import { formatINR } from '../lib/constants.js';

const BAR = '#fb923c'; // single sequential hue — one series per chart, direct-labeled

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ink-900 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Revenue-by-day column chart: thin bars, rounded data ends, 2px gaps,
// per-bar hover tooltip, recessive baseline.
function RevenueChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const fmtDay = (day) =>
    new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div>
      <div className="flex h-40 items-end gap-0.5" role="img" aria-label="Daily revenue for the last 30 days">
        {data.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t transition-opacity group-hover:opacity-80"
              style={{
                height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 3 : 1)}%`,
                background: d.revenue > 0 ? BAR : 'rgba(255,255,255,0.08)',
              }}
            />
            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-ink-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
              {fmtDay(d.day)} · {formatINR(d.revenue)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between border-t border-white/10 pt-1 text-xs text-slate-500">
        <span>{fmtDay(data[0].day)}</span>
        <span>{fmtDay(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}

// Horizontal bar list: name + value in text tokens, single hue fill.
function BarList({ rows, valueFmt = (v) => v }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (rows.length === 0) return <p className="text-sm text-slate-500">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.name}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-slate-300">{row.name}</span>
            <span className="shrink-0 font-semibold text-white">{valueFmt(row.value)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-white/5">
            <div className="h-2 rounded-full" style={{ width: `${(row.value / max) * 100}%`, background: BAR }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const STATUS_STYLES = {
  placed: 'bg-slate-500/20 text-slate-300',
  paid: 'bg-emerald-500/20 text-emerald-300',
  printing: 'bg-brand-500/20 text-brand-400',
  shipped: 'bg-sky-500/20 text-sky-300',
  delivered: 'bg-emerald-500/20 text-emerald-300',
  cancelled: 'bg-red-500/20 text-red-300',
};

export default function AdminPage() {
  const { user, profile, loading, configured } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = !configured || Boolean(profile?.is_admin); // offline preview allowed

  useEffect(() => {
    if (!isAdmin) return;
    fetchDashboardData().then(setData).catch((e) => setError(e.message));
  }, [isAdmin]);

  if (configured) {
    if (loading || (user && !profile)) {
      return <main className="px-4 py-24 text-center text-slate-400">Loading…</main>;
    }
    if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />;
    if (!profile.is_admin) {
      return (
        <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-white">Admins only</h1>
          <p className="mt-3 text-slate-400">
            This account doesn't have dashboard access. If that's wrong, flip your
            <code className="mx-1 rounded bg-white/10 px-1">is_admin</code> flag in Supabase.
          </p>
          <Link to="/" className="mt-6 inline-block text-brand-400 hover:text-brand-500">← Back to the shop</Link>
        </main>
      );
    }
  }

  if (error) {
    return <main className="px-4 py-24 text-center text-red-300">Dashboard failed to load: {error}</main>;
  }
  if (!data) {
    return <main className="px-4 py-24 text-center text-slate-400">Crunching the numbers…</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-slate-400">Last {data.days} days</p>
        </div>
        {data.sample && (
          <p className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-300">
            Sample data — connect Supabase to see live numbers
          </p>
        )}
      </div>

      {/* KPI row */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Revenue" value={formatINR(data.revenue)} />
        <StatTile label="Orders" value={data.orderCount} />
        <StatTile label="Avg. order value" value={formatINR(data.aov)} />
        <StatTile label="Sessions" value={data.sessionCount} />
        <StatTile label="Conversion" value={`${data.conversion.toFixed(1)}%`} hint="purchases / sessions" />
        <StatTile label="Quote requests" value={data.quoteCount} />
      </div>

      {/* Sales analytics */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Revenue by day">
            <RevenueChart data={data.revenueByDay} />
          </Panel>
        </div>
        <Panel title="Top sellers (by revenue)">
          <BarList
            rows={data.topSellers.map((p) => ({ name: p.name, value: p.revenue }))}
            valueFmt={formatINR}
          />
        </Panel>
      </div>

      {/* Customer analytics */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Panel title="Most clicked products">
          <BarList rows={data.topClicked.map((p) => ({ name: p.name, value: p.clicks }))} />
        </Panel>
        <Panel title="Traffic source">
          <BarList rows={data.sourceSplit.map(([name, value]) => ({ name, value }))} />
        </Panel>
        <Panel title="Devices">
          <BarList rows={data.deviceSplit.map(([name, value]) => ({ name, value }))} />
        </Panel>
        <Panel title="Events">
          <BarList rows={data.eventCounts.map(([name, value]) => ({ name: name.replaceAll('_', ' '), value }))} />
        </Panel>
      </div>

      {/* Recent orders table */}
      <div className="mt-6">
        <Panel title="Recent orders">
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Customer</th>
                    <th className="pb-2 pr-4 font-medium">Items</th>
                    <th className="pb-2 pr-4 font-medium">City</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5 pr-4 text-slate-400">
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2.5 pr-4 text-white">{o.customer_name}</td>
                      <td className="max-w-56 truncate py-2.5 pr-4 text-slate-300">
                        {(o.items ?? []).map((i) => `${i.name} ×${i.qty}`).join(', ')}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400">{o.city}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[o.status] ?? STATUS_STYLES.placed}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-white">{formatINR(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}
