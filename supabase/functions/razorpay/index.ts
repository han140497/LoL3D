// LoL3D Razorpay Edge Function
// Deploy: Supabase Dashboard → Edge Functions → Deploy new function →
//         name it "razorpay" and paste this file.
// Secrets (Edge Functions → Secrets): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
//
// Two actions:
//   create_order     — recomputes the amount from DB prices + shipping,
//                      creates a Razorpay order, returns its id
//   verify_and_place — checks the payment signature, then inserts the
//                      order row as 'paid' using the service role
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// ---- shipping rules: KEEP IN SYNC with src/lib/constants.js + shipping.js
const SHIPPING = {
  ORIGIN_PINCODE: '500001',
  FREE_ABOVE: 1999,
  RATES: { local: 49, zone: 79, national: 119 },
};

function shippingCost(pincode: string, subtotal: number): number | null {
  if (!/^[1-8][0-9]{5}$/.test(pincode)) return null;
  if (subtotal >= SHIPPING.FREE_ABOVE) return 0;
  if (pincode.slice(0, 3) === SHIPPING.ORIGIN_PINCODE.slice(0, 3)) return SHIPPING.RATES.local;
  if (pincode[0] === SHIPPING.ORIGIN_PINCODE[0]) return SHIPPING.RATES.zone;
  return SHIPPING.RATES.national;
}

type CartItem = { slug: string; material: string; qty: number };

// Server-side price computation — the client's prices are never trusted.
async function computeTotals(admin: ReturnType<typeof createClient>, items: CartItem[], pincode: string) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Cart is empty');
  const { data: products, error } = await admin
    .from('products')
    .select('slug, name, price_base, materials')
    .in('slug', items.map((i) => i.slug))
    .eq('active', true);
  if (error) throw new Error(error.message);

  const lines = items.map((item) => {
    const product = products?.find((p) => p.slug === item.slug);
    if (!product) throw new Error(`Product not available: ${item.slug}`);
    const material = (product.materials as { type: string; surcharge: number }[])
      .find((m) => m.type === item.material);
    if (!material) throw new Error(`Material ${item.material} not available for ${item.slug}`);
    const qty = Math.min(Math.max(Math.trunc(item.qty), 1), 50);
    const unitPrice = Number(product.price_base) + Number(material.surcharge ?? 0);
    return { slug: product.slug, name: product.name, material: material.type, unitPrice, qty };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const shipping = shippingCost(pincode, subtotal);
  if (shipping === null) throw new Error('Invalid PIN code');
  return { lines, subtotal, shipping, total: subtotal + shipping };
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'Razorpay secrets not configured' }, 500);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const body = await req.json();

    if (body.action === 'create_order') {
      const totals = await computeTotals(admin, body.items, body.pincode);
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totals.total * 100), // paise
          currency: 'INR',
          payment_capture: 1,
        }),
      });
      const order = await res.json();
      if (!res.ok) return json({ error: order.error?.description ?? 'Could not create payment order' }, 400);
      return json({ order_id: order.id, amount: order.amount, key_id: keyId, total: totals.total });
    }

    if (body.action === 'verify_and_place') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer, items, session_id } = body;

      const expected = await hmacHex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
      if (expected !== razorpay_signature) return json({ error: 'Payment verification failed' }, 400);

      // Resolve the signed-in customer (if any) from their JWT — the client
      // can't claim someone else's account.
      let userId: string | null = null;
      const token = req.headers.get('Authorization')?.replace('Bearer ', '');
      if (token) {
        const { data } = await admin.auth.getUser(token);
        userId = data.user?.id ?? null;
      }

      const totals = await computeTotals(admin, items, customer.pincode);
      const { error } = await admin.from('orders').insert({
        status: 'paid',
        items: totals.lines,
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping,
        total: totals.total,
        customer_name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        address_line1: customer.line1,
        address_line2: customer.line2 || null,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        payment_method: 'razorpay',
        payment_ref: razorpay_payment_id,
        session_id: session_id ?? null,
        user_id: userId,
        metadata: { razorpay_order_id },
      });
      if (error) return json({ error: `Payment received but order save failed: ${error.message}` }, 500);
      return json({ ok: true, total: totals.total });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 400);
  }
});
