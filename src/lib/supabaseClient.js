import { createClient } from '@supabase/supabase-js';

// Guard against the most common misconfiguration: pasting the dashboard
// page link (supabase.com/dashboard/project/<ref>/…) instead of the API
// URL (https://<ref>.supabase.co). We extract the project ref and fix it.
function normalizeSupabaseUrl(raw) {
  if (!raw) return raw;
  const trimmed = raw.trim().replace(/\/+$/, '');
  const dashboard = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/);
  if (dashboard) {
    console.warn(
      `[LoL3D] VITE_SUPABASE_URL is a dashboard link — using https://${dashboard[1]}.supabase.co instead. Fix the env var.`,
    );
    return `https://${dashboard[1]}.supabase.co`;
  }
  return trimmed;
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Without credentials the app runs in offline mode: the catalog falls back
// to the local seed data and analytics events log to the console instead.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey) // default auth: sessions persist across reloads
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

async function uploadToBucket(bucket, file) {
  if (!isSupabaseConfigured) {
    console.info('[LoL3D upload · offline]', bucket, file.name, `${(file.size / 1e6).toFixed(1)} MB`);
    return { ok: true, offline: true, path: `offline/${file.name}` };
  }
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) {
    console.error('[LoL3D] file upload failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, path };
}

export const uploadQuoteFile = (file) => uploadToBucket('quote-uploads', file);
export const uploadSculpturePhoto = (file) => uploadToBucket('sculpture-photos', file);

export async function insertSculptureRequest(request) {
  if (!isSupabaseConfigured) {
    console.info('[LoL3D sculpture · offline]', request);
    return { ok: true, offline: true };
  }
  const { error } = await supabase.from('sculpture_requests').insert(request);
  if (error) {
    console.error('[LoL3D] sculpture request failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
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
