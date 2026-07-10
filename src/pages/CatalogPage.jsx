import { useParams, useSearchParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import CategoryFilter from '../components/catalog/CategoryFilter.jsx';
import ProductGrid from '../components/catalog/ProductGrid.jsx';

export default function CatalogPage() {
  const { category } = useParams();
  const [params] = useSearchParams();
  const { products, categories, loading } = useCatalog();

  const query = (params.get('q') ?? '').trim().toLowerCase();
  const activeCategory = categories.find((c) => c.id === category);

  let visible = activeCategory
    ? products.filter((p) => p.category === activeCategory.id)
    : products;

  if (query) {
    visible = visible.filter((p) =>
      [p.name, p.description, p.category].join(' ').toLowerCase().includes(query),
    );
  }

  const heading = query
    ? `Results for “${params.get('q').trim()}”`
    : activeCategory
      ? activeCategory.name
      : 'All Prints';

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">{heading}</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        {query
          ? `${visible.length} print${visible.length === 1 ? '' : 's'} found`
          : activeCategory
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
