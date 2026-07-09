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
// Sample data — lets the dashboard render before Supabase is connected.
// ---------------------------------------------------------------------------
function sampleData() {
  // Deterministic pseudo-random so the demo is stable between reloads.
  let seed = 42;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const orders = [];
  const events = [];
  const now = Date.now();
  const devices = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
  const sources = ['instagram', 'instagram', 'direct', 'direct', 'other referrer'];
  const statuses = ['paid', 'paid', 'placed', 'shipped', 'delivered'];

  for (let d = 0; d < DAYS; d++) {
    const dayMs = now - d * 86400000;
    const orderCount = Math.floor(rand() * 4);
    for (let i = 0; i < orderCount; i++) {
      const product = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
      const qty = rand() > 0.8 ? 2 : 1;
      const price = Number(product.price_base);
      orders.push({
        id: `sample-${d}-${i}`,
        created_at: new Date(dayMs).toISOString(),
        status: statuses[Math.floor(rand() * statuses.length)],
        items: [{ name: product.name, qty, unitPrice: price, material: 'PLA' }],
        total: price * qty + 99,
        customer_name: 'Sample Customer',
        city: ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Pune'][Math.floor(rand() * 5)],
      });
    }
    const sessionCount = 4 + Math.floor(rand() * 10);
    for (let s = 0; s < sessionCount; s++) {
      const sessionId = `s-${d}-${s}`;
      const device = devices[Math.floor(rand() * devices.length)];
      const source = sources[Math.floor(rand() * sources.length)];
      const meta = source === 'instagram' ? { utm_source: 'instagram' } : {};
      const push = (event_type, target_name) =>
        events.push({ event_type, target_name, session_id: sessionId, device_type: device, metadata: meta, referrer: source === 'other referrer' ? 'google.com' : '' });
      push('page_view');
      if (rand() > 0.3) push('product_click', PRODUCTS[Math.floor(rand() * PRODUCTS.length)].name);
      if (rand() > 0.6) push('add_to_cart');
      if (rand() > 0.75) push('instagram_click');
      if (rand() > 0.9) { push('begin_checkout'); push('purchase'); }
    }
  }
  orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return aggregate(orders, events, 7);
}

// ---------------------------------------------------------------------------
// Public API — { sample: bool, ...metrics }
// ---------------------------------------------------------------------------
export async function fetchDashboardData() {
  if (!isSupabaseConfigured) {
    return { sample: true, ...sampleData() };
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
