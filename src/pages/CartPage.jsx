import { Link, useNavigate } from 'react-router-dom';
import { formatINR, SHIPPING, EVENT_TYPES } from '../lib/constants.js';
import { logEvent } from '../lib/analytics.js';
import { useCart } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import ProductImage from '../components/shared/ProductImage.jsx';

function QtyControl({ line, setQty }) {
  return (
    <div className="flex items-center rounded-full border border-white/15">
      <button
        type="button"
        onClick={() => setQty(line.slug, line.material, line.qty - 1)}
        className="px-3 py-1 text-slate-300 hover:text-white"
        aria-label={`Decrease quantity of ${line.name}`}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-white">{line.qty}</span>
      <button
        type="button"
        onClick={() => setQty(line.slug, line.material, line.qty + 1)}
        className="px-3 py-1 text-slate-300 hover:text-white"
        aria-label={`Increase quantity of ${line.name}`}
      >
        +
      </button>
    </div>
  );
}

export default function CartPage() {
  const { items, setQty, removeItem, subtotal, count } = useCart();
  const { products } = useCatalog();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-white">Your cart is empty</h1>
        <p className="mt-3 text-slate-400">Every piece is printed to order, just for you.</p>
        <Link
          to="/catalog"
          className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Browse the Catalog
        </Link>
      </main>
    );
  }

  const freeShippingGap = SHIPPING.FREE_ABOVE - subtotal;

  const handleCheckout = () => {
    logEvent(EVENT_TYPES.BEGIN_CHECKOUT, {
      targetId: 'cart',
      targetName: 'Proceed to Checkout',
      metadata: { subtotal, item_count: count },
    });
    navigate('/checkout');
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">
        Your Cart <span className="text-lg font-normal text-slate-400">({count} item{count === 1 ? '' : 's'})</span>
      </h1>

      <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {items.map((line) => {
          const product = products.find((p) => p.slug === line.slug);
          return (
            <li key={`${line.slug}-${line.material}`} className="flex items-center gap-4 py-4">
              <Link to={`/product/${line.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10">
                {product && <ProductImage product={product} />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${line.slug}`} className="font-semibold text-white hover:text-brand-400">
                  {line.name}
                </Link>
                <p className="mt-0.5 text-sm text-slate-400">
                  {line.material} · {formatINR(line.unitPrice)} each
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(line.slug, line.material)}
                  className="mt-1 text-xs text-slate-500 underline-offset-2 hover:text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
              <QtyControl line={line} setQty={setQty} />
              <span className="w-24 text-right font-bold text-white">
                {formatINR(line.unitPrice * line.qty)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-col items-end gap-2">
        <p className="text-lg text-slate-300">
          Subtotal: <span className="ml-2 text-2xl font-bold text-white">{formatINR(subtotal)}</span>
        </p>
        <p className="text-sm text-slate-500">
          {freeShippingGap > 0
            ? `Add ${formatINR(freeShippingGap)} more for free shipping · shipping calculated at checkout`
            : 'You get free shipping! 🎉'}
        </p>
        <button
          type="button"
          onClick={handleCheckout}
          className="mt-3 rounded-full bg-brand-500 px-10 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Proceed to Checkout
        </button>
      </div>
    </main>
  );
}
