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
