import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { INSTAGRAM, formatINR } from '../lib/constants.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductImage from '../components/shared/ProductImage.jsx';
import InstagramButton from '../components/shared/InstagramButton.jsx';

export default function ProductPage() {
  const { slug } = useParams();
  const { products, categories, loading } = useCatalog();
  const { addItem } = useCart();
  const product = products.find((p) => p.slug === slug);
  const [material, setMaterial] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-slate-100" />
          <div className="space-y-4 py-8">
            <div className="h-8 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">We couldn't find that print.</h1>
        <Link to="/catalog" className="mt-4 inline-block text-brand-600 hover:text-brand-700">
          ← Back to the catalog
        </Link>
      </main>
    );
  }

  const categoryName = categories.find((c) => c.id === product.category)?.name;
  const selected = material ?? product.materials[0];
  const price = Number(product.price_base) + Number(selected.surcharge ?? 0);

  const handleAddToCart = () => {
    addItem(product, selected);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to={`/catalog/${product.category}`} className="text-sm text-slate-500 hover:text-slate-900">
        ← {categoryName}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-3xl border border-slate-200">
          <ProductImage product={product} />
        </div>

        <div className="py-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">{categoryName}</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-lg text-slate-600">{product.description}</p>

          <dl className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            <div className="flex justify-between">
              <dt className="text-slate-500">Dimensions</dt>
              <dd className="font-medium text-slate-900">{product.dimensions ?? 'Made to order'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Material</dt>
              <dd className="flex gap-2">
                {product.materials.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setMaterial(m)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      selected.type === m.type
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {m.type}
                    {Number(m.surcharge) > 0 && ` +${formatINR(m.surcharge)}`}
                  </button>
                ))}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-4">
              <dt className="text-slate-500">Price ({selected.type})</dt>
              <dd className="text-2xl font-bold text-slate-900">{formatINR(price)}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`rounded-full px-8 py-3 font-semibold text-white transition-colors ${
                justAdded ? 'bg-emerald-600' : 'bg-brand-500 hover:bg-brand-600'
              }`}
            >
              {justAdded ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            {justAdded && (
              <Link to="/cart" className="font-semibold text-brand-600 hover:text-brand-700">
                View Cart →
              </Link>
            )}
          </div>
          <p className="mt-4 flex items-center gap-1 text-sm text-slate-500">
            Printed to order · ships across India. Questions first?
            <InstagramButton location="product_page" label={`DM ${INSTAGRAM.handle}`} variant="ghost" className="!px-1 !py-0" />
          </p>
        </div>
      </div>
    </main>
  );
}
