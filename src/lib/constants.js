export const BRAND = {
  name: 'LoL3D',
  fullName: 'Layer on Layer 3D',
  tagline: 'Built layer by layer. Made for you.',
};

export const INSTAGRAM = {
  handle: '@LoL___3D',
  url: 'https://instagram.com/LoL___3D',
};

export const CATEGORIES = [
  {
    id: 'functional',
    name: 'Functional Prints',
    blurb: 'Brackets, mounts, organizers, and replacement parts that just work.',
  },
  {
    id: 'cosplay',
    name: 'Cosplay & Props',
    blurb: 'Wearable armor, helmets, and screen-accurate props ready to finish.',
  },
  {
    id: 'decor',
    name: 'Home Decor',
    blurb: 'Planters, lamps, and sculptural pieces for modern spaces.',
  },
  {
    id: 'minis',
    name: 'Miniature Gaming',
    blurb: 'High-detail minis and terrain for your tabletop campaigns.',
  },
];

// Custom 3D sculpture commissions — customer uploads a photo, we model it.
export const SCULPTURE_STYLES = [
  { id: 'chibi', name: 'Chibi', blurb: 'Big head, tiny body — the cute collectible look.', priceFrom: 1499 },
  { id: 'cartoon-mini', name: 'Cartoon Miniature', blurb: 'Stylized cartoon version of you, desk-size.', priceFrom: 1799 },
  { id: 'realistic-bust', name: 'Realistic Bust', blurb: 'A detailed head-and-shoulders portrait sculpt.', priceFrom: 2499 },
  { id: 'full-figurine', name: 'Full-Body Figurine', blurb: 'You, head to toe — pose it how you like.', priceFrom: 2999 },
  { id: 'pet', name: 'Pet Figurine', blurb: 'Your dog, cat, or bird as a keepsake sculpt.', priceFrom: 1699 },
];

export const EVENT_TYPES = {
  PRODUCT_CLICK: 'product_click',
  INSTAGRAM_CLICK: 'instagram_click',
  QUOTE_CLICK: 'quote_click',
  CATEGORY_CLICK: 'category_click',
  PAGE_VIEW: 'page_view',
  ADD_TO_CART: 'add_to_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
};

// All prices are INR. Domestic (India-only) shipping.
export function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Shipping is tiered by how far the delivery PIN code is from ours.
// TODO: set ORIGIN_PINCODE to the PIN code you ship from.
export const SHIPPING = {
  ORIGIN_PINCODE: '500001',
  FREE_ABOVE: 1999, // order subtotal for free shipping
  RATES: {
    local: 49, // same city (first 3 PIN digits match)
    zone: 79, // same postal zone (first digit matches)
    national: 119, // rest of India
  },
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
