import { Link } from 'react-router-dom';
import { BRAND, CATEGORIES, INSTAGRAM, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import InstagramButton from '../shared/InstagramButton.jsx';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <p className="text-lg font-extrabold text-slate-900">
              LoL<span className="text-brand-500">3D</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">{BRAND.tagline}</p>
            <div className="mt-4">
              <InstagramButton location="footer" label={INSTAGRAM.handle} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Catalog</p>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/catalog/${cat.id}`}
                    className="text-sm text-slate-600 hover:text-slate-900"
                    onClick={() =>
                      logEvent(EVENT_TYPES.CATEGORY_CLICK, {
                        targetId: cat.id,
                        targetName: cat.name,
                        category: cat.id,
                        metadata: { location: 'footer' },
                      })
                    }
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Custom work</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/sculptures"
                  className="text-sm text-slate-600 hover:text-slate-900"
                  onClick={() =>
                    logEvent(EVENT_TYPES.CATEGORY_CLICK, {
                      targetId: 'sculpture',
                      targetName: 'Custom Sculptures',
                      metadata: { location: 'footer' },
                    })
                  }
                >
                  Custom Sculptures
                </Link>
              </li>
              <li>
                <Link
                  to="/quote"
                  className="text-sm text-slate-600 hover:text-slate-900"
                  onClick={() =>
                    logEvent(EVENT_TYPES.QUOTE_CLICK, {
                      targetId: 'footer',
                      targetName: 'Get a Quote',
                      metadata: { location: 'footer' },
                    })
                  }
                >
                  Get a Quote
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} {BRAND.fullName}. Printed with pride, one layer at a time.
        </p>
      </div>
    </footer>
  );
}
