import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { PRODUCTS } from '../data/products.js';

const DAYS = 30;

// ---------------------------------------------------------------------------
// Aggregation — turns raw orders + click events into dashboard-ready numbers.
// ---------------------------------------------------------------------------
function aggregate(orders, events, quoteCount) {
  const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return dayKey(d);
  });

  const revenueByDay = days.map((day) => ({
    day,
    revenue: orders
      .filter((o) => o.status !== 'cancelled' && dayKey(o.created_at) === day)
      .reduce((sum, o) => sum + Number(o.total), 0),
  }));

  const liveOrders = orders.filter((o) => o.status !== 'cancelled');
  const revenue = liveOrders.reduce((s, o) => s + Number(o.total), 0);

  const count = (arr, keyFn) => {
    const map = new Map();
    for (const item of arr) {
      const key = keyFn(item);
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const productClicks = count(events.filter((e) => e.event_type === 'product_click'), (e) => e.target_name ?? e.target_id);
  const topSellers = new Map();
  for (const o of liveOrders) {
    for (const item of o.items ?? []) {
      const entry = topSellers.get(item.name) ?? { qty: 0, revenue: 0 };
      entry.qty += item.qty;
      entry.revenue += item.unitPrice * item.qty;
      topSellers.set(item.name, entry);
    }
  }

  const sessions = new Set(events.map((e) => e.session_id).filter(Boolean));
  const purchases = events.filter((e) => e.event_type === 'purchase').length;

  return {
    days: DAYS,
    revenue,
    orderCount: liveOrders.length,
    aov: liveOrders.length ? revenue / liveOrders.length : 0,
    quoteCount,
    revenueByDay,
    topSellers: [...topSellers.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6),
    topClicked: productClicks.slice(0, 6).map(([name, clicks]) => ({ name, clicks })),
    eventCounts: count(events, (e) => e.event_type),
    deviceSplit: count(events, (e) => e.device_type),
    sourceSplit: count(events, (e) => e.metadata?.utm_source ?? (e.referrer ? 'other referrer' : 'direct')),
    sessionCount: sessions.size,
    conversion: sessions.size ? (purchases / sessions.size) * 100 : 0,
    recentOrders: orders.slice(0, 8),
  };
}

// ---------------------------------------------------------------------------
// Public API — { sample: bool, ...metrics }
// ---------------------------------------------------------------------------
export async function fetchDashboardData() {
  if (!isSupabaseConfigured) {
    return { sample: true, ...aggregate([], [], 0) };
  }
  const since = new Date(Date.now() - DAYS * 86400000).toISOString();
  const [ordersRes, eventsRes, quotesRes] = await Promise.all([
    supabase.from('orders').select('*').gte('created_at', since).order('created_at', { ascending: false }),
    supabase.from('click_events').select('event_type, target_name, target_id, session_id, device_type, referrer, metadata, created_at').gte('created_at', since),
    supabase.from('quote_requests').select('id', { count: 'exact', head: true }).gte('created_at', since),
  ]);
  if (ordersRes.error || eventsRes.error) {
    throw new Error(ordersRes.error?.message ?? eventsRes.error?.message);
  }
  return {
    sample: false,
    ...aggregate(ordersRes.data ?? [], eventsRes.data ?? [], quotesRes.count ?? 0),
  };
}
