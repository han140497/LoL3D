import { BRAND } from './constants.js';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

// Razorpay checkout — one integration covers UPI, cards, netbanking, and
// wallets for domestic (India) payments.
//
// The money-critical steps run in the `razorpay` Supabase Edge Function:
// it recomputes the amount from DATABASE prices (client totals are never
// trusted), creates the Razorpay order, verifies the payment signature,
// and inserts the order row as 'paid'. This file only opens the checkout
// window and relays results.
//
// Setup: deploy supabase/functions/razorpay/index.ts, set the
// RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET secrets, and put the public
// key id in .env.local as VITE_RAZORPAY_KEY_ID.
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const isPaymentConfigured = Boolean(RAZORPAY_KEY) && isSupabaseConfigured;

let scriptPromise;
function loadRazorpayScript() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load Razorpay'));
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

async function invokeRazorpayFn(payload) {
  const { data, error } = await supabase.functions.invoke('razorpay', { body: payload });
  if (error) {
    // FunctionsHttpError carries the response; surface the server's message.
    let message = 'Payment service unavailable — try again or choose pay-later.';
    try {
      const details = await error.context?.json();
      if (details?.error) message = details.error;
    } catch { /* keep generic message */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

/**
 * Full payment flow. `items` are cart lines ({slug, material, qty} is all
 * that's sent — prices come from the database). Resolves with
 * { paid: true, paymentId, total } after server-side verification,
 * or { paid: false } if the customer closes the checkout window.
 */
export async function payWithRazorpay({ items, customer }) {
  await loadRazorpayScript();

  const cartItems = items.map((l) => ({ slug: l.slug, material: l.material, qty: l.qty }));
  const order = await invokeRazorpayFn({
    action: 'create_order',
    items: cartItems,
    pincode: customer.pincode,
  });

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: 'INR',
      name: BRAND.name,
      description: `${BRAND.fullName} order`,
      prefill: {
        name: customer.name,
        email: customer.email || undefined,
        contact: customer.phone,
      },
      theme: { color: '#f97316' },
      handler: async (response) => {
        try {
          const placed = await invokeRazorpayFn({
            action: 'verify_and_place',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            customer,
            items: cartItems,
            session_id: sessionStorage.getItem('lol3d_session'),
          });
          resolve({ paid: true, paymentId: response.razorpay_payment_id, total: placed.total, orderId: placed.order_id });
        } catch (err) {
          reject(err);
        }
      },
      modal: { ondismiss: () => resolve({ paid: false }) },
    });
    rzp.on('payment.failed', (response) =>
      reject(new Error(response.error?.description ?? 'Payment failed')),
    );
    rzp.open();
  });
}
