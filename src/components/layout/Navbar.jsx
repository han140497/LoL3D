import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BRAND, CATEGORIES, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import InstagramButton from '../shared/InstagramButton.jsx';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group" aria-label={`${BRAND.fullName} home`}>
      {/* Layer-stack mark: three offset layers, like a print in progress */}
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect x="4" y="20" width="24" height="6" rx="1.5" className="fill-brand-600" />
        <rect x="7" y="12" width="18" height="6" rx="1.5" className="fill-brand-500" />
        <rect x="10" y="4" width="12" height="6" rx="1.5" className="fill-brand-400" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-white">
        LoL<span className="text-brand-500">3D</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const trackCategory = (cat) =>
    logEvent(EVENT_TYPES.CATEGORY_CLICK, {
      targetId: cat.id,
      targetName: cat.name,
      category: cat.id,
      metadata: { location: 'navbar' },
    });

  const trackQuote = () =>
    logEvent(EVENT_TYPES.QUOTE_CLICK, {
      targetId: 'navbar',
      targetName: 'Get a Quote',
      metadata: { location: 'navbar' },
    });

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-brand-400' : 'text-slate-300 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-950/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop links */}
        <div className="hidden items-center gap-6 lg:flex">
          {CATEGORIES.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/catalog/${cat.id}`}
              className={linkClass}
              onClick={() => trackCategory(cat)}
            >
              {cat.name}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <InstagramButton location="navbar" label="Shop our Insta" />
          <Link
            to="/quote"
            onClick={trackQuote}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile: IG icon always visible + hamburger */}
        <div className="flex items-center gap-1 lg:hidden">
          <InstagramButton location="navbar-mobile" variant="icon" />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="p-2 text-slate-300 hover:text-white"
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

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-white/10 px-4 pb-5 pt-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/catalog/${cat.id}`}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
                onClick={() => {
                  trackCategory(cat);
                  setMenuOpen(false);
                }}
              >
                {cat.name}
              </NavLink>
            ))}
            <div className="mt-3 flex items-center gap-3 px-3">
              <InstagramButton location="mobile-menu" label="Shop our Insta" />
              <Link
                to="/quote"
                onClick={() => {
                  trackQuote();
                  setMenuOpen(false);
                }}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
