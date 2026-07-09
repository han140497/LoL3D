import { useParams } from 'react-router-dom';
import { CATEGORIES } from '../lib/constants.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import CategoryFilter from '../components/catalog/CategoryFilter.jsx';
import ProductGrid from '../components/catalog/ProductGrid.jsx';

export default function CatalogPage() {
  const { category } = useParams();
  const { products, loading } = useCatalog();

  const activeCategory = CATEGORIES.find((c) => c.id === category);
  const visible = activeCategory
    ? products.filter((p) => p.category === activeCategory.id)
    : products;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">
        {activeCategory ? activeCategory.name : 'All Prints'}
      </h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        {activeCategory
          ? activeCategory.blurb
          : 'Everything we print, in one place. Same catalog as our Instagram.'}
      </p>
      <div className="mt-6">
        <CategoryFilter />
      </div>
      <div className="mt-8">
        <ProductGrid products={visible} loading={loading} />
      </div>
    </main>
  );
}
