import { INSTAGRAM, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Self-tracking Instagram link. Every render site passes a `location`
 * (e.g. "navbar", "footer", "hero") so the analytics show which IG
 * placement actually drives clicks.
 */
export default function InstagramButton({ location, label, variant = 'solid', className = '' }) {
  const handleClick = () => {
    logEvent(EVENT_TYPES.INSTAGRAM_CLICK, {
      targetId: INSTAGRAM.handle,
      targetName: label ?? `Instagram (${location})`,
      metadata: { location },
    });
  };

  const base =
    'inline-flex items-center gap-2 rounded-full font-semibold transition-colors duration-150';
  const variants = {
    solid:
      'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 text-white px-4 py-2 text-sm hover:opacity-90',
    ghost:
      'text-slate-300 hover:text-white px-3 py-2 text-sm',
    icon:
      'text-slate-300 hover:text-white p-2',
  };

  return (
    <a
      href={INSTAGRAM.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${base} ${variants[variant]} ${className}`}
      aria-label={label ?? `LoL3D on Instagram, ${INSTAGRAM.handle}`}
    >
      <InstagramIcon className="h-4 w-4 shrink-0" />
      {variant !== 'icon' && <span>{label ?? INSTAGRAM.handle}</span>}
    </a>
  );
}
