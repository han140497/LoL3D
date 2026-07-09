import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Without credentials the app runs in offline mode: the catalog falls back
// to the local seed data and analytics events log to the console instead.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false }, // public storefront, no user accounts
    })
  : null;

// Insert-only writes (RLS allows anon insert, never read-back).
// In offline mode these log to the console so the flows stay testable.
export async function insertOrder(order) {
  if (!isSupabaseConfigured) {
    console.info('[LoL3D order · offline]', order);
    return { ok: true, offline: true };
  }
  const { error } = await supabase.from('orders').insert(order);
  if (error) {
    console.error('[LoL3D] order insert failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function insertQuoteRequest(request) {
  if (!isSupabaseConfigured) {
    console.info('[LoL3D quote · offline]', request);
    return { ok: true, offline: true };
  }
  const { error } = await supabase.from('quote_requests').insert(request);
  if (error) {
    console.error('[LoL3D] quote insert failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function uploadQuoteFile(file) {
  if (!isSupabaseConfigured) {
    console.info('[LoL3D upload · offline]', file.name, `${(file.size / 1e6).toFixed(1)} MB`);
    return { ok: true, offline: true, path: `offline/${file.name}` };
  }
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from('quote-uploads').upload(path, file);
  if (error) {
    console.error('[LoL3D] file upload failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, path };
}

export async function fetchProducts() {
  if (!isSupabaseConfigured) {
    const { PRODUCTS } = await import('../data/products.js');
    return PRODUCTS;
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false });
  if (error) {
    console.error('[LoL3D] product fetch failed, using local seed:', error.message);
    const { PRODUCTS } = await import('../data/products.js');
    return PRODUCTS;
  }
  return data;
}
