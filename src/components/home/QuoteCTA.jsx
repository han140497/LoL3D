import { Link } from 'react-router-dom';
import { EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';

export default function QuoteCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-600/20 to-orange-900/20 px-6 py-12 text-center sm:px-12">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Have something custom in mind?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Send us your idea, an STL file, or even a sketch — we'll get back to you with a price
          and timeline, usually within a day.
        </p>
        <Link
          to="/quote"
          onClick={() =>
            logEvent(EVENT_TYPES.QUOTE_CLICK, {
              targetId: 'home_banner',
              targetName: 'Get a Quote',
              metadata: { location: 'home_banner' },
            })
          }
          className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Get a Quote
        </Link>
      </div>
    </section>
  );
}
