import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BRAND, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import InstagramButton from '../shared/InstagramButton.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function AccountButton() {
  const { user } = useAuth();
  return (
    <Link
      to={user ? '/account' : '/login'}
      className="p-2 text-slate-600 transition-colors hover:text-slate-900"
      aria-label={user ? 'Your account' : 'Sign in'}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    </Link>
  );
}

function CartButton() {
  const { count } = useCart();
  return (
    <Link to="/cart" className="relative p-2 text-slate-600 transition-colors hover:text-slate-900" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1.5" />
        <circle cx="18" cy="21" r="1.5" />
        <path d="M2.5 3h2l2.5 12.5a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5 group" aria-label={`${BRAND.fullName} home`}>
      {/* Layer-stack mark: three offset layers, like a print in progress */}
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect x="4" y="20" width="24" height="6" rx="1.5" className="fill-brand-600" />
        <rect x="7" y="12" width="18" height="6" rx="1.5" className="fill-brand-500" />
        <rect x="10" y="4" width="12" height="6" rx="1.5" className="fill-brand-400" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">
        LoL<span className="text-brand-500">3D</span>
      </span>
    </Link>
  );
}

function SearchForm({ className = '', onSubmitted }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog');
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} role="search" className={`relative ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search prints… (e.g. dragon, planter)"
        aria-label="Search the catalog"
        className="w-full rounded-full border border-slate-200 bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-brand-500"
      />
    </form>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { categories } = useCatalog();

  const trackCategory = (cat, location) =>
    logEvent(EVENT_TYPES.CATEGORY_CLICK, {
      targetId: cat.id,
      targetName: cat.name,
      category: cat.id,
      metadata: { location },
    });

  const trackQuote = (location) =>
    logEvent(EVENT_TYPES.QUOTE_CLICK, {
      targetId: location,
      targetName: 'Get a Quote',
      metadata: { location },
    });

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <SearchForm className="hidden min-w-0 flex-1 md:block md:max-w-md" />

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <InstagramButton location="navbar" label="Shop our Insta" />
          <Link
            to="/quote"
            onClick={() => trackQuote('navbar')}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-500 hover:text-slate-900"
          >
            Custom Quote
          </Link>
          <AccountButton />
          <CartButton />
        </div>

        {/* Mobile: IG icon + account + cart always visible + hamburger */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <InstagramButton location="navbar-mobile" variant="icon" />
          <AccountButton />
          <CartButton />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="p-2 text-slate-600 hover:text-slate-900"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Category strip — always visible, like a marketplace department bar */}
      <div className="hidden border-t border-slate-100 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 sm:px-6 lg:px-8">
          <NavLink
            to="/catalog"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'}`
            }
          >
            All Prints
          </NavLink>
          {categories.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/catalog/${cat.id}`}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'}`
              }
              onClick={() => trackCategory(cat, 'navbar')}
            >
              {cat.name}
            </NavLink>
          ))}
          <NavLink
            to="/sculptures"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors ${isActive ? 'text-brand-600' : 'text-brand-600/80 hover:text-brand-600'}`
            }
            onClick={() => trackCategory({ id: 'sculpture', name: 'Custom Sculptures' }, 'navbar')}
          >
            ✨ Custom Sculptures
          </NavLink>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-slate-200 px-4 pb-5 pt-3 lg:hidden">
          <SearchForm className="mb-3" onSubmitted={() => setMenuOpen(false)} />
          <div className="flex flex-col gap-1">
            <NavLink
              to="/catalog"
              end
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => setMenuOpen(false)}
            >
              All Prints
            </NavLink>
            {categories.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/catalog/${cat.id}`}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  trackCategory(cat, 'mobile-menu');
                  setMenuOpen(false);
                }}
              >
                {cat.name}
              </NavLink>
            ))}
            <NavLink
              to="/sculptures"
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-slate-100"
              onClick={() => {
                trackCategory({ id: 'sculpture', name: 'Custom Sculptures' }, 'mobile-menu');
                setMenuOpen(false);
              }}
            >
              ✨ Custom Sculptures
            </NavLink>
            <div className="mt-3 flex items-center gap-3 px-3">
              <InstagramButton location="mobile-menu" label="Shop our Insta" />
              <Link
                to="/quote"
                onClick={() => {
                  trackQuote('mobile-menu');
                  setMenuOpen(false);
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-slate-900"
              >
                Custom Quote
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
