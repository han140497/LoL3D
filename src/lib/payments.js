import { BRAND } from './constants.js';

// Razorpay checkout — one integration covers UPI, cards, netbanking, and
// wallets for domestic (India) payments. Needs VITE_RAZORPAY_KEY_ID from
// dashboard.razorpay.com (test keys work with fake payments end-to-end).
//
// TODO before going live: create the Razorpay order server-side (Supabase
// Edge Function) and verify the payment signature there. Client-side-only
// checkout is fine for testing but amounts must be verified on a server
// you trust before treating an order as paid.
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const isPaymentConfigured = Boolean(RAZORPAY_KEY);

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

/**
 * Opens Razorpay checkout for `amount` rupees. Resolves with
 * { paid: true, paymentId } on success, { paid: false } if dismissed.
 */
export async function payWithRazorpay({ amount, customer }) {
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY,
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      name: BRAND.name,
      description: `${BRAND.fullName} order`,
      prefill: {
        name: customer.name,
        email: customer.email || undefined,
        contact: customer.phone,
      },
      notes: { pincode: customer.pincode },
      theme: { color: '#f97316' },
      handler: (response) => resolve({ paid: true, paymentId: response.razorpay_payment_id }),
      modal: { ondismiss: () => resolve({ paid: false }) },
    });
    rzp.on('payment.failed', (response) =>
      reject(new Error(response.error?.description ?? 'Payment failed')),
    );
    rzp.open();
  });
}
