import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import QuotePage from './pages/QuotePage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import { logEvent } from './lib/analytics.js';
import { EVENT_TYPES } from './lib/constants.js';

// Log a page_view on every route change and reset scroll position.
function usePageTracking() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    logEvent(EVENT_TYPES.PAGE_VIEW, { targetId: pathname });
  }, [pathname]);
}

export default function App() {
  usePageTracking();

  return (
    <CatalogProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog/:category?" element={<CatalogPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/quote" element={<QuotePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </CartProvider>
    </CatalogProvider>
  );
}
