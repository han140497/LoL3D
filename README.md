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

Payments use Razorpay (UPI / cards / netbanking / wallets) with server-side verification. Setup: (1) deploy `supabase/functions/razorpay/index.ts` as an Edge Function named `razorpay` (Dashboard → Edge Functions), (2) set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as Edge Function secrets, (3) put the public key id in `.env.local` as `VITE_RAZORPAY_KEY_ID` and rebuild. The function recomputes amounts from database prices (client totals are never trusted), verifies the payment signature, and inserts the order as `paid` — keep its shipping constants in sync with `src/lib/constants.js`. Without a key configured, orders fall back to "payment link requested" for manual UPI collection.

Custom work goes through `/quote`, which accepts an optional STL/OBJ/3MF/STEP upload into the `quote-uploads` storage bucket and records the request in `quote_requests`.

Custom sculptures go through `/sculptures`: the customer uploads a photo (→ `sculpture-photos` bucket), picks a style (chibi, cartoon miniature, realistic bust, full-body, pet), and gets a confirmation; requests land in `sculpture_requests` and are worked from the admin Requests tab (statuses: new → modeling → preview_sent → confirmed → printed). No payment up front — price is confirmed with the 3D preview.

The admin console (`/admin`) has five tabs: **Overview** (analytics), **Orders** (ongoing orders with a status pipeline — changing status emails the customer), **Products** (add/edit listings, toggle featured/live), **Categories** (add/hide categories; nav, homepage, and filters follow the table), and **Requests** (sculptures + quotes, with signed-URL file access). Existing databases need migrations 002–004 run once each.

**Order emails** go through the `order-notify` Edge Function (deploy it like the razorpay one) using [Resend](https://resend.com): set the `RESEND_API_KEY` secret, and `EMAIL_FROM` (e.g. `LoL3D <orders@lol3d.in>`) once the domain is verified in Resend. Customers get a confirmation when an order is placed (both paid and pay-later paths) and an update email whenever an admin changes the order status. Checkout requires an email address. Without `RESEND_API_KEY`, everything still works — the admin UI just notes that the email wasn't sent.

## Accounts & admin

Supabase Auth (email + password). Customers get order history at `/account`; orders placed while signed in carry their `user_id`. The admin dashboard at `/admin` shows sales analytics (revenue by day, top sellers, AOV, recent orders) and customer analytics (sessions, conversion, most-clicked products, traffic sources incl. Instagram UTM, devices) for the last 30 days.

Admin access is a flag on `profiles`: sign up on the site, then in the Supabase SQL editor run
`update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOU');`
RLS gives admins read access to orders/events/quotes; customers can only read their own rows. Without Supabase configured, `/admin` renders with labeled sample data.

## Analytics rules

Every product click, Instagram link, category link, and "Get a Quote" button must log an event. Don't attach raw `onClick` logging by hand — use the shared `InstagramButton` / `TrackedLink` components, or call `logEvent(EVENT_TYPES.X, {...})` from `src/lib/analytics.js`. Events are insert-only for the public anon key (enforced by Supabase RLS), so analytics data can't be read or modified from the browser.

## Deploying

**Hosting: Cloudflare Pages** at **https://lol3d.in**. Build settings: build command `npm run build`, output directory `dist`. Environment variables (Pages project → Settings → Environment variables — set for Production, then redeploy):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co   ← the API URL, NOT the dashboard link
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_RAZORPAY_KEY_ID=<rzp key id, when payments go live>
```

`public/_redirects` provides the SPA fallback so deep links like `/product/flexi-dragon` load the app (the `404.html` copy in the build output is a belt-and-braces fallback for other static hosts). If the Pages project is connected to this GitHub repo, every push to `main` deploys automatically.

Point the Instagram bio link at the deployed site with `?utm_source=instagram&utm_medium=bio` — UTM params are captured per visit and attached to every analytics event, so quote requests can be attributed to IG.

## Categories

`functional` (Functional Prints) · `cosplay` (Cosplay & Props) · `decor` (Home Decor) · `minis` (Miniature Gaming)
