import { Link } from 'react-router-dom';
import { CATEGORIES, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import { useCatalog } from '../../context/CatalogContext.jsx';

const TILE_STYLES = {
  functional: 'from-orange-500/20 to-orange-900/40 hover:border-orange-400/60',
  cosplay: 'from-purple-500/20 to-purple-900/40 hover:border-purple-400/60',
  decor: 'from-teal-500/20 to-teal-900/40 hover:border-teal-400/60',
  minis: 'from-rose-500/20 to-rose-900/40 hover:border-rose-400/60',
};

export default function CategoryShowcase() {
  const { products } = useCatalog();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">What do you want to make?</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const count = products.filter((p) => p.category === cat.id).length;
          return (
            <Link
              key={cat.id}
              to={`/catalog/${cat.id}`}
              onClick={() =>
                logEvent(EVENT_TYPES.CATEGORY_CLICK, {
                  targetId: cat.id,
                  targetName: cat.name,
                  category: cat.id,
                  metadata: { location: 'category_showcase' },
                })
              }
              className={`group rounded-2xl border border-white/10 bg-gradient-to-br p-6 transition-all duration-200 hover:-translate-y-1 ${TILE_STYLES[cat.id]}`}
            >
              <h3 className="text-lg font-bold text-white">{cat.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{cat.blurb}</p>
              <p className="mt-4 text-sm font-semibold text-white/70 group-hover:text-white">
                {count > 0 ? `${count} print${count === 1 ? '' : 's'} →` : 'Explore →'}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
