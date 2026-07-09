import { createContext, useContext, useEffect, useState } from 'react';
import { logEvent } from '../lib/analytics.js';
import { EVENT_TYPES } from '../lib/constants.js';

const STORAGE_KEY = 'lol3d_cart';

// Safe default so components using the cart never crash if rendered
// outside the provider (e.g. during hot-reload re-ordering).
const noop = () => {};
const CartContext = createContext({
  items: [], count: 0, subtotal: 0,
  addItem: noop, setQty: noop, removeItem: noop, clearCart: noop,
});

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

// A cart line is { slug, name, category, unitPrice, material, qty }.
// The same product in two materials is two separate lines.
const lineKey = (line) => `${line.slug}::${line.material}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, material, qty = 1) => {
    const unitPrice = Number(product.price_base) + Number(material.surcharge ?? 0);
    const line = {
      slug: product.slug,
      name: product.name,
      category: product.category,
      material: material.type,
      unitPrice,
      qty,
    };
    setItems((prev) => {
      const existing = prev.find((l) => lineKey(l) === lineKey(line));
      if (existing) {
        return prev.map((l) => (lineKey(l) === lineKey(line) ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, line];
    });
    logEvent(EVENT_TYPES.ADD_TO_CART, {
      targetId: product.slug,
      targetName: product.name,
      category: product.category,
      metadata: { material: material.type, unit_price: unitPrice, qty },
    });
  };

  const setQty = (slug, material, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((l) => !(l.slug === slug && l.material === material))
        : prev.map((l) => (l.slug === slug && l.material === material ? { ...l, qty } : l)),
    );
  };

  const removeItem = (slug, material) => setQty(slug, material, 0);
  const clearCart = () => setItems([]);

  const count = items.reduce((n, l) => n + l.qty, 0);
  const subtotal = items.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, setQty, removeItem, clearCart, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
