# LoL3D — Layer on Layer 3D

E-commerce storefront for the LoL3D 3D-printing business. Vite + React + Tailwind CSS v4, with Supabase for the product catalog and click analytics.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

The site runs fully **offline by default**: the catalog is served from `src/data/products.js` and analytics events are logged to the browser console. To connect the real backend, copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon key (ask Han for access, or see below to spin up your own).

## Project layout

```
supabase/schema.sql       Database schema + RLS policies + seed data (run once in Supabase SQL Editor)
src/lib/analytics.js      Click tracker — logEvent() with offline retry queue
src/lib/supabaseClient.js Supabase adapter with local-seed fallback
src/lib/constants.js      Brand, Instagram handle, categories, event types
src/data/products.js      Local catalog fallback (mirrors the SQL seed)
src/components/layout/    Navbar, Footer, MobileMenu
src/components/catalog/   ProductGrid, ProductCard, ProductDetail
src/components/shared/    InstagramButton, TrackedLink — self-tracking wrappers
```

## Commerce

Prices are INR; shipping is **domestic (India) only**, tiered by PIN code distance from `SHIPPING.ORIGIN_PINCODE` in `src/lib/constants.js` (set this to the PIN you ship from), with free shipping above the configured subtotal. Cart state lives in localStorage (`src/context/CartContext.jsx`). Orders are inserted into the Supabase `orders` table (insert-only for the anon key).

Payments use Razorpay (UPI / cards / netbanking / wallets): set `VITE_RAZORPAY_KEY_ID` in `.env.local`. Without it, orders are recorded as "payment link requested" and you follow up manually. Before going live with real payments, add server-side order creation + signature verification (Supabase Edge Function) — see the note in `src/lib/payments.js`.

Custom work goes through `/quote`, which accepts an optional STL/OBJ/3MF/STEP upload into the `quote-uploads` storage bucket and records the request in `quote_requests`.

## Accounts & admin

Supabase Auth (email + password). Customers get order history at `/account`; orders placed while signed in carry their `user_id`. The admin dashboard at `/admin` shows sales analytics (revenue by day, top sellers, AOV, recent orders) and customer analytics (sessions, conversion, most-clicked products, traffic sources incl. Instagram UTM, devices) for the last 30 days.

Admin access is a flag on `profiles`: sign up on the site, then in the Supabase SQL editor run
`update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOU');`
RLS gives admins read access to orders/events/quotes; customers can only read their own rows. Without Supabase configured, `/admin` renders with labeled sample data.

## Analytics rules

Every product click, Instagram link, category link, and "Get a Quote" button must log an event. Don't attach raw `onClick` logging by hand — use the shared `InstagramButton` / `TrackedLink` components, or call `logEvent(EVENT_TYPES.X, {...})` from `src/lib/analytics.js`. Events are insert-only for the public anon key (enforced by Supabase RLS), so analytics data can't be read or modified from the browser.

## Deploying

The repo is Vercel-ready (`vercel.json` handles SPA routing, so deep links like `/product/flexi-dragon` work when shared on Instagram). Import the GitHub repo at [vercel.com/new](https://vercel.com/new) — every push to `main` auto-deploys. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings to enable live data.

Point the Instagram bio link at the deployed site with `?utm_source=instagram&utm_medium=bio` — UTM params are captured per visit and attached to every analytics event, so quote requests can be attributed to IG.

## Categories

`functional` (Functional Prints) · `cosplay` (Cosplay & Props) · `decor` (Home Decor) · `minis` (Miniature Gaming)
