import { Link } from 'react-router-dom';
import { BRAND, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import InstagramButton from '../shared/InstagramButton.jsx';

/**
 * Slim marketplace-style promo banner — products start immediately below,
 * so this stays short like Amazon/Myntra hero strips.
 */
export default function Hero() {
  const trackBrowse = () =>
    logEvent(EVENT_TYPES.CATEGORY_CLICK, {
      targetId: 'all',
      targetName: 'Shop All Prints',
      metadata: { location: 'hero_banner' },
    });

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-brand-500/25 to-transparent"
            style={{ top: `${15 + i * 14}%` }}
          />
        ))}
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">
            {BRAND.fullName}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Your ideas,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-orange-300 bg-clip-text text-transparent">
              built layer by layer.
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-slate-300">
            Printed to order in PLA or PETG, finished by hand, shipped to your door.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/catalog"
            onClick={trackBrowse}
            className="rounded-full bg-brand-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Shop All Prints
          </Link>
          <InstagramButton location="hero" label="Shop our Insta" />
        </div>
      </div>
    </section>
  );
}
