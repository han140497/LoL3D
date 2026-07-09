import { SHIPPING } from './constants.js';

export function isValidPincode(pincode) {
  // Indian PIN codes: 6 digits, first digit 1-8 (9 is army post, 0 unused)
  return /^[1-8][0-9]{5}$/.test(pincode);
}

/**
 * Tiered domestic shipping based on delivery PIN code distance from ours:
 * same city → local rate, same postal zone → zone rate, else national.
 * Free above the configured subtotal. Returns null for invalid PINs.
 */
export function computeShipping(pincode, subtotal) {
  if (!isValidPincode(pincode)) return null;

  if (subtotal >= SHIPPING.FREE_ABOVE) {
    return { cost: 0, tier: 'free', label: 'Free shipping' };
  }
  if (pincode.slice(0, 3) === SHIPPING.ORIGIN_PINCODE.slice(0, 3)) {
    return { cost: SHIPPING.RATES.local, tier: 'local', label: 'Local delivery' };
  }
  if (pincode[0] === SHIPPING.ORIGIN_PINCODE[0]) {
    return { cost: SHIPPING.RATES.zone, tier: 'zone', label: 'Zonal shipping' };
  }
  return { cost: SHIPPING.RATES.national, tier: 'national', label: 'Pan-India shipping' };
}
