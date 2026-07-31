// Category-tinted placeholder art shown only when no image is available.
// Priority order:
//   1. product.image_url  (remote URL stored in Supabase)
//   2. /products/<slug>/hero.webp  (local static file in public/)
//   3. Category-tinted placeholder SVG  (fallback when both above fail)
import { useState } from 'react';

const CATEGORY_ART = {
  functional: {
    from: '#f97316',
    to: '#7c2d12',
    icon: 'M8 10h10M8 16h10M8 22h16M8 10v12M18 10v6',
  },
  cosplay: {
    from: '#a855f7',
    to: '#4c1d95',
    icon: 'M16 6l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  },
  decor: {
    from: '#14b8a6',
    to: '#134e4a',
    icon: 'M10 24V14l6-6 6 6v10M13 24v-6h6v6',
  },
  minis: {
    from: '#e11d48',
    to: '#4c0519',
    icon: 'M16 5l9 5v10l-9 5-9-5V10z M16 5v20 M7 10l18 10 M25 10L7 20',
  },
};

export default function ProductImage({ product, className = '' }) {
  // Prefer the DB-stored URL, then fall back to the local static asset.
  const initialSrc = product.image_url || (product.slug ? `/products/${product.slug}/hero.webp` : null);
  const [errored, setErrored] = useState(false);

  if (initialSrc && !errored) {
    return (
      <img
        src={initialSrc}
        alt={product.name}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
        onError={() => setErrored(true)}
      />
    );
  }

  // Placeholder: category-tinted gradient with an icon.
  const art = CATEGORY_ART[product.category] ?? CATEGORY_ART.functional;
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${art.from}14, ${art.to}30)` }}
      role="img"
      aria-label={`${product.name} — photo coming soon`}
    >
      <svg viewBox="0 0 32 32" className="h-16 w-16 opacity-60" fill="none" stroke={art.from} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={art.icon} />
      </svg>
    </div>
  );
}
