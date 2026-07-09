import { Link } from 'react-router-dom';
import Hero from '../components/home/Hero.jsx';
import InstaFeedSection from '../components/home/InstaFeedSection.jsx';
import QuoteCTA from '../components/home/QuoteCTA.jsx';
import ProductGrid from '../components/catalog/ProductGrid.jsx';
import { CATEGORIES, EVENT_TYPES } from '../lib/constants.js';
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
          <h2 className="text-xl font-bold text-white sm:text-2xl">{category.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{category.blurb}</p>
        </div>
        <Link
          to={`/catalog/${category.id}`}
          className="shrink-0 text-sm font-semibold text-brand-400 hover:text-brand-500"
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

export default function HomePage() {
  const { products, loading } = useCatalog();

  return (
    <main>
      <Hero />
      {CATEGORIES.map((cat, i) => (
        <div key={cat.id}>
          <CategorySection category={cat} products={products} loading={loading} />
          {/* Break up the scroll: Insta feed after the second section */}
          {i === 1 && <InstaFeedSection />}
        </div>
      ))}
      <QuoteCTA />
    </main>
  );
}
