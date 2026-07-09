import { Link } from 'react-router-dom';
import { INSTAGRAM, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import InstagramButton from '../shared/InstagramButton.jsx';
import ProductImage from '../shared/ProductImage.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';

/**
 * "Shop our Insta" — an IG-style grid of featured prints. The tiles mirror
 * what's posted on Instagram but link to the on-site product pages, where
 * people can actually order. Following the profile is the secondary action.
 */
export default function InstaFeedSection() {
  const { products } = useCatalog();
  const tiles = [...products]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);

  const trackTile = (product) =>
    logEvent(EVENT_TYPES.PRODUCT_CLICK, {
      targetId: product.slug,
      targetName: product.name,
      category: product.category,
      metadata: { location: 'insta_feed', price: product.price_base },
    });

  return (
    <section className="border-y border-white/10 bg-ink-900/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              As seen on {INSTAGRAM.handle}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Shop our Insta</h2>
            <p className="mt-2 max-w-lg text-slate-400">
              Every print on our feed is right here — tap a tile to see specs and order.
            </p>
          </div>
          <InstagramButton location="insta_feed" label="Follow us" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {tiles.map((product) => (
            <Link
              key={product.slug}
              to={`/product/${product.slug}`}
              onClick={() => trackTile(product)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
              aria-label={`${product.name} — view and order`}
            >
              <ProductImage product={product} className="transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs font-medium text-white">
                  {product.name} · ${Number(product.price_base).toFixed(0)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
