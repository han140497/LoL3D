# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # vite build && cp dist/index.html dist/404.html
npm run preview    # preview the production build locally
```

No test suite or linter is configured. There are no `npm test`/`npm run lint` scripts.

There is no `--offline`/mock flag: the app is offline-first by construction. Run `npm run dev` with no `.env.local` (or an unconfigured one) to develop against local seed data — see "Offline-first fallback pattern" below.

### Deploying

Deploys are **manual, not git-triggered** — the Cloudflare Pages project (`lol3d`) has no Git provider connected, so pushing to `main` does not deploy the site:

```bash
npm run build
npx wrangler pages deploy dist --project-name=lol3d --branch=main
```

`--branch=main` is required to land on production (`lol3d.in`); any other value creates a preview-only deployment. The custom domain can lag a minute or two behind the `*.pages.dev` URL after a deploy — that's propagation, not failure.

## Architecture

Vite + React (JS, not TS) + Tailwind CSS v4, backed by Supabase (Postgres + Auth + Storage + Edge Functions). E-commerce storefront for a 3D-printing business (LoL3D), India-only.

### Offline-first fallback pattern

Every Supabase-touching function in `src/lib/supabaseClient.js` checks `isSupabaseConfigured` (set from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`) and falls back to a local/offline behavior instead of throwing:
- Catalog reads fall back to `src/data/products.js` (mirrors the SQL seed) and `CATEGORIES` in `src/lib/constants.js`.
- Writes (orders, quote requests, sculpture requests, uploads) log to the console and return `{ ok: true, offline: true }`.
- `/admin` renders with labeled sample data (see `src/lib/adminData.js`).

When adding a new Supabase call, follow this same pattern — check `isSupabaseConfigured` and provide an offline path — rather than letting the call throw when unconfigured.

### Data flow / state

- `CatalogContext` (`src/context/CatalogContext.jsx`) — products + categories, fetched once via `fetchProducts`/`fetchCategories`.
- `CartContext` (`src/context/CartContext.jsx`) — cart persisted to `localStorage`.
- `AuthContext` (`src/context/AuthContext.jsx`) — Supabase Auth session + `profiles` row (`full_name`, `is_admin`).
- **Auth-lock deadlock gotcha**: inside `onAuthStateChange`, Supabase holds an internal auth lock for the duration of the callback. Any `supabase.*` call awaited *inside* that callback deadlocks sign-in. The existing `claim_guest_orders` RPC call is wrapped in `setTimeout(..., 0)` specifically to escape the callback — follow this pattern for any new logic that needs to run on `SIGNED_IN`.

### Commerce flow

- Prices are INR. Shipping is domestic (India-only), tiered by PIN-code distance from `SHIPPING.ORIGIN_PINCODE` (`src/lib/constants.js`), computed in `src/lib/shipping.js`, free above `SHIPPING.FREE_ABOVE`.
- Checkout inserts into `orders` (anon key is insert-only, enforced by RLS — never read-back after insert for guests).
- Payments: Razorpay, verified server-side in the `razorpay` Edge Function (`supabase/functions/razorpay/index.ts`), which **recomputes amounts from database prices** — client-submitted totals are never trusted — verifies the payment signature, then inserts the order as `paid`. Without a configured key, checkout falls back to "payment link requested" for manual UPI collection. Logic lives in `src/lib/payments.js`.
- Pricing calculator (`src/lib/pricing.js`) mirrors an external `pricing_calculator.xlsx` — the rate constants in `PRICING` (`src/lib/constants.js`) must be kept in sync with that sheet manually.
- Order/quote/sculpture-request emails go through `order-notify` / `quote-notify` Edge Functions via Resend; without `RESEND_API_KEY` set, flows still complete and the admin UI just notes the email wasn't sent.
- Custom sculptures (`/sculptures`): photo upload → `sculpture-photos` bucket, style pick, request lands in `sculpture_requests`, worked from the admin Requests tab through statuses `new → modeling → preview_sent → confirmed → printed`. No payment up front.
- Custom work (`/quote`): optional STL/OBJ/3MF/STEP upload → `quote-uploads` bucket, request lands in `quote_requests`.

### Product descriptions (rich text)

- Admins edit descriptions with a Quill WYSIWYG editor (`react-quill-new`, in `ProductsAdmin.jsx`); the customer-facing `ProductPage.jsx` renders the stored HTML through `DOMPurify.sanitize()` — never render `product.description` raw.
- **Controlled-editor gotcha**: `ReactQuill`'s `onChange` must feed Quill's HTML back into `value` unmodified. Post-processing the string before round-tripping it through the controlled `value` prop confuses Quill's internal reconciliation and silently drops characters while typing (observed: spaces vanishing mid-sentence). Any cleanup has to happen once, at save time — not in `onChange`.
- `normalizeQuillHtml()` (`src/lib/richText.js`) converts the literal `&nbsp;` entities Quill's HTML export inserts between ordinary words back to regular spaces — left alone, a non-breaking space blocks normal line-wrapping and long descriptions won't wrap at word boundaries. Applied once at save time (`ProductsAdmin.jsx`'s `handleSubmit`) and again defensively at render (`ProductPage.jsx`), since rows saved before this fix may already have it baked in.
- Some legacy descriptions have a raw `<table>` pasted directly into the HTML (predates the Quill editor, which has no table tool). `extractSpecTables()` (`src/lib/richText.js`) pulls any `<table>` out of the sanitized description and hands its rows to `SpecTable` (`src/components/shared/SpecTable.jsx`), which renders them as a borderless key/value list with a 2-line clamp + "View more" toggle per row — a bare `<table>` is never rendered directly, since it renders with unstyled borders and an unconstrained column width.
- The description container needs `min-w-0` on its CSS-grid ancestor (`ProductPage.jsx`) plus `break-words` on itself — without both, a single long unbroken token (a long word, a pasted URL) forces the grid column wider than its track and causes page-wide horizontal scroll.

### Analytics

Every product click, Instagram link, category link, and "Get a Quote" click must log an event via `logEvent(EVENT_TYPES.X, {...})` from `src/lib/analytics.js`, or by using the shared `InstagramButton`/`TrackedLink` components — don't wire raw `onClick` logging by hand. Events are insert-only for the anon key (RLS), so analytics data can't be read or altered from the browser. UTM params are captured per visit and attached to every event (used to attribute Instagram-bio traffic).

### Admin console (`/admin`)

Five tabs, each with its own component under `src/components/admin/`: **Overview** (analytics), **Orders** (status pipeline — changing status emails the customer), **Products** (`ProductsAdmin.jsx`), **Categories** (`CategoriesAdmin.jsx` — nav/homepage/filters all read from this table live), **Requests** (`RequestsAdmin.jsx` — sculptures + quotes, signed-URL file access). Admin access is a boolean flag on `profiles` (`is_admin`), granted manually via SQL — see README. RLS gives admins read access to orders/events/quotes; customers can only read their own rows.

### Database (`supabase/`)

- `supabase/schema.sql` is the base schema (run once, in the Supabase SQL editor); `supabase/migrations/NNN_*.sql` are additive migrations run once each, in order, against existing databases.
- Note: migrations `014_campaigns.sql` and `014_quote_requests_user_id.sql` share the numeric prefix `014` (both exist in the tree) — when adding a new migration, don't assume the highest existing number is unique; check the whole directory and both apply independently.
- Edge Functions live in `supabase/functions/*/index.ts` and are deployed individually via the Supabase Dashboard (not part of `npm run build`).

## Categories

Canonical category ids used across nav/filters/homepage: `functional`, `cosplay`, `figurines`, `decor`, `minis`. (The README lists only four — `figurines` was added later; `src/lib/constants.js` is the source of truth.)
