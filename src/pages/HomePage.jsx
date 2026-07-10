import { Link } from 'react-router-dom';
import Hero from '../components/home/Hero.jsx';
import InstaFeedSection from '../components/home/InstaFeedSection.jsx';
import QuoteCTA from '../components/home/QuoteCTA.jsx';
import ProductGrid from '../components/catalog/ProductGrid.jsx';
import { EVENT_TYPES, SCULPTURE_STYLES, formatINR } from '../lib/constants.js';
import { logEvent } from '../lib/analytics.js';
import { useCatalog } from '../context/CatalogContext.jsx';

// Marketplace-style home: the entire catalog is on the page, grouped by
// category, with featured items first in each section.
function CategorySection({ category, products, loading }) {
  const items = [...products]
    .filter((p) => p.category === category.id)
    .sort((a, b) => Number(b.featured) - Number(a.featured));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{category.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{category.blurb}</p>
        </div>
        <Link
          to={`/catalog/${category.id}`}
          className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
          onClick={() =>
            logEvent(EVENT_TYPES.CATEGORY_CLICK, {
              targetId: category.id,
              targetName: category.name,
              category: category.id,
              metadata: { location: 'home_section_header' },
            })
          }
        >
          See all →
        </Link>
      </div>
      <div className="mt-5">
        <ProductGrid products={items} loading={loading} />
      </div>
    </section>
  );
}

function SculptureCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-brand-50 p-8 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-600">New</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Become a 3D sculpture
            </h2>
            <p className="mt-2 text-slate-600">
              Upload a photo, pick a style — chibi, cartoon miniature, realistic bust, and more —
              and we'll sculpt a custom 3D model of you (or your pet) and print it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SCULPTURE_STYLES.map((s) => (
                <span key={s.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {s.name} · from {formatINR(s.priceFrom)}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/sculptures"
            onClick={() =>
              logEvent(EVENT_TYPES.CATEGORY_CLICK, {
                targetId: 'sculpture',
                targetName: 'Custom Sculptures',
                metadata: { location: 'home_sculpture_cta' },
              })
            }
            className="rounded-full bg-brand-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Start with a photo →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { products, categories, loading } = useCatalog();

  return (
    <main>
      <Hero />
      {categories.map((cat, i) => (
        <div key={cat.id}>
          <CategorySection category={cat} products={products} loading={loading} />
          {/* Break up the scroll: sculpture CTA after the first section, Insta feed after the second */}
          {i === 0 && <SculptureCTA />}
          {i === 1 && <InstaFeedSection />}
        </div>
      ))}
      <QuoteCTA />
    </main>
  );
}
