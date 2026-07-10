import { createContext, useContext, useEffect, useState } from 'react';
import { fetchProducts, fetchCategories } from '../lib/supabaseClient.js';
import { CATEGORIES } from '../lib/constants.js';

const CatalogContext = createContext({ products: [], categories: CATEGORIES, loading: true });

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProducts(), fetchCategories()]).then(([productData, categoryData]) => {
      if (!cancelled) {
        setProducts(productData);
        setCategories(categoryData);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CatalogContext.Provider value={{ products, categories, loading }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}
