import { Link } from 'react-router-dom';
import { EVENT_TYPES, CATEGORIES, formatINR } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import ProductImage from '../shared/ProductImage.jsx';

export default function ProductCard({ product }) {
  const categoryName = CATEGORIES.find((c) => c.id === product.category)?.name;

  const handleClick = () =>
    logEvent(EVENT_TYPES.PRODUCT_CLICK, {
      targetId: product.slug,
      targetName: product.name,
      category: product.category,
      metadata: { price: product.price_base, location: 'product_card' },
    });

  return (
    <Link
      to={`/product/${product.slug}`}
      onClick={handleClick}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-ink-900 transition-all duration-200 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10"
    >
      <div className="relative aspect-square overflow-hidden">
        <ProductImage product={product} className="transition-transform duration-300 group-hover:scale-105" />
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-bold text-white">
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-400">{categoryName}</p>
        <h3 className="mt-1 font-semibold text-white group-hover:text-brand-400 transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-white">
            {formatINR(product.price_base)}
            <span className="ml-1 text-xs font-normal text-slate-400">from</span>
          </span>
          <span className="flex gap-1">
            {product.materials.map((m) => (
              <span key={m.type} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                {m.type}
              </span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}
