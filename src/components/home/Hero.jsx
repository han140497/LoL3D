import { Link } from 'react-router-dom';
import { BRAND, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';
import InstagramButton from '../shared/InstagramButton.jsx';

export default function Hero() {
  const trackBrowse = () =>
    logEvent(EVENT_TYPES.CATEGORY_CLICK, {
      targetId: 'all',
      targetName: 'Browse the Catalog',
      metadata: { location: 'hero' },
    });

  return (
    <section className="relative overflow-hidden">
      {/* Layer-line backdrop — horizontal strata like a print in progress */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"
            style={{ top: `${8 + i * 8}%` }}
          />
        ))}
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
          {BRAND.fullName}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Your ideas,{' '}
          <span className="bg-gradient-to-r from-brand-400 to-orange-300 bg-clip-text text-transparent">
            built layer by layer.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-300">
          Functional parts, cosplay armor, home decor, and tabletop miniatures — printed to order
          in PLA or PETG and finished by hand.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/catalog"
            onClick={trackBrowse}
            className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Browse the Catalog
          </Link>
          <InstagramButton location="hero" label="See our latest prints" />
        </div>
      </div>
    </section>
  );
}
