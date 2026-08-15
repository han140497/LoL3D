import { Link, useNavigate } from 'react-router-dom';
import { formatINR, SHIPPING, EVENT_TYPES } from '../lib/constants.js';
import { logEvent } from '../lib/analytics.js';
import { useCart } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useCampaignDiscount } from '../lib/campaigns.js';
import ProductImage from '../components/shared/ProductImage.jsx';

function QtyControl({ line, setQty }) {
  return (
    <div className="flex items-center rounded-full border border-slate-300">
      <button
        type="button"
        onClick={() => setQty(line.slug, line.material, line.qty - 1)}
        className="px-3 py-1 text-slate-600 hover:text-slate-900"
        aria-label={`Decrease quantity of ${line.name}`}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-slate-900">{line.qty}</span>
      <button
        type="button"
        onClick={() => setQty(line.slug, line.material, line.qty + 1)}
        className="px-3 py-1 text-slate-600 hover:text-slate-900"
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
  const { campaign, eligible, discountPct } = useCampaignDiscount();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-3 text-slate-500">Every piece is printed to order, just for you.</p>
        <Link
          to="/catalog"
          className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Browse the Catalog
        </Link>
      </main>
    );
  }

  const discountAmount = eligible ? Math.round(subtotal * discountPct) : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const freeShippingGap = SHIPPING.FREE_ABOVE - discountedSubtotal;

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
      <h1 className="text-3xl font-bold text-slate-900">
        Your Cart <span className="text-lg font-normal text-slate-500">({count} item{count === 1 ? '' : 's'})</span>
      </h1>

      <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
        {items.map((line) => {
          const product = products.find((p) => p.slug === line.slug);
          return (
            <li key={`${line.slug}-${line.material}`} className="flex items-center gap-4 py-4">
              <Link to={`/product/${line.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                {product && <ProductImage product={product} />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${line.slug}`} className="font-semibold text-slate-900 hover:text-brand-600">
                  {line.name}
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">
                  {line.material} · {formatINR(line.unitPrice)} each
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(line.slug, line.material)}
                  className="mt-1 text-xs text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <QtyControl line={line} setQty={setQty} />
              <span className="w-24 text-right font-bold text-slate-900">
                {formatINR(line.unitPrice * line.qty)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Campaign discount banner in cart */}
      {campaign && !eligible && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <span className="text-lg">🇮🇳</span>
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{campaign.discount_percent}% Independence Day discount</span> is waiting for you —{' '}
            <Link to="/login" className="underline hover:text-orange-900">sign in</Link> to apply it to your first order.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col items-end gap-2">
        {eligible && discountAmount > 0 && (
          <div className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <p className="text-sm font-semibold text-emerald-800">
              🇮🇳 Independence Day — {campaign.discount_percent}% off first order
            </p>
            <p className="text-sm font-bold text-emerald-700">−{formatINR(discountAmount)}</p>
          </div>
        )}
        <p className="text-lg text-slate-600">
          Subtotal:{' '}
          {eligible && discountAmount > 0 ? (
            <>
              <span className="ml-1 text-base line-through text-slate-400">{formatINR(subtotal)}</span>
              <span className="ml-2 text-2xl font-bold text-slate-900">{formatINR(discountedSubtotal)}</span>
            </>
          ) : (
            <span className="ml-2 text-2xl font-bold text-slate-900">{formatINR(subtotal)}</span>
          )}
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
