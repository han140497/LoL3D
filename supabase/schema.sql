-- LoL3D — Supabase schema
-- Run this once in the Supabase Dashboard → SQL Editor.

-- ============================================================
-- 1. Click / interaction logging
-- ============================================================
create table if not exists public.click_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_type  text not null check (event_type in (
                'product_click', 'instagram_click', 'quote_click',
                'category_click', 'page_view'
              )),
  target_id   text,          -- product slug, IG handle, or button location
  target_name text,          -- human-readable label
  category    text,          -- functional | cosplay | decor | minis
  page_path   text,          -- route where the interaction happened
  session_id  text,          -- anonymous per-visit id (sessionStorage)
  device_type text,          -- mobile | tablet | desktop
  referrer    text,
  metadata    jsonb default '{}'::jsonb
);

create index if not exists click_events_created_at_idx on public.click_events (created_at desc);
create index if not exists click_events_type_idx       on public.click_events (event_type);

-- ============================================================
-- 2. Product catalog
-- ============================================================
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  slug        text unique not null,
  name        text not null,
  description text not null default '',
  category    text not null check (category in ('functional', 'cosplay', 'decor', 'minis')),
  price_base  numeric(10,2) not null,
  dimensions  text,          -- e.g. '220 × 140 × 90 mm'
  materials   jsonb not null default '[{"type":"PLA","surcharge":0}]'::jsonb,
  image_url   text,
  featured    boolean not null default false,
  active      boolean not null default true
);

create index if not exists products_category_idx on public.products (category) where active;

-- ============================================================
-- 3. Row Level Security — the anon (public website) key may
--    ONLY insert click events and ONLY read active products.
--    It can never read, edit, or delete analytics rows.
-- ============================================================
alter table public.click_events enable row level security;
alter table public.products     enable row level security;

create policy "anon can log clicks"
  on public.click_events for insert
  to anon
  with check (true);

create policy "anon can read active products"
  on public.products for select
  to anon
  using (active = true);

-- You (via the Dashboard / service role) retain full access automatically.

-- ============================================================
-- 4. Seed catalog (edit freely in the Table Editor afterwards)
--    Samples modeled on popular printables.com designs — check each
--    model's license before selling prints (many are non-commercial).
-- ============================================================
insert into public.products (slug, name, description, category, price_base, dimensions, materials, featured) values
  -- Functional Prints
  ('phone-dock-mk2',       'Modular Phone Dock MK2',            'Adjustable-angle charging dock with cable routing. Fits phones up to 8 mm thick with a case.', 'functional', 18.00, '110 × 80 × 95 mm',  '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":4}]', true),
  ('cable-organizer-set',  'Desk Cable Organizer Set',          'Set of 6 snap-in cable clips plus an under-desk raceway. Keeps your setup clean.',              'functional', 12.00, '90 × 25 × 20 mm',   '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":3}]', false),
  ('headphone-stand',      'Curved Headphone Stand',            'Weighted single-piece stand with a smooth curved arm. Fits all full-size headphones.',          'functional', 16.00, '120 × 100 × 260 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":4}]', false),
  ('gridfinity-starter',   'Gridfinity Storage Starter Kit',    'Modular drawer-organization system: 2 baseplates plus 12 assorted bins. The workshop favorite.', 'functional', 32.00, '42 mm grid, fits 2 standard drawers', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":8}]', true),
  ('controller-wall-mount','Game Controller Wall Mount (Pair)', 'Low-profile wall hooks for Xbox / PS5 / Switch Pro controllers. Screws and anchors included.',  'functional', 10.00, '70 × 45 × 60 mm each', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":2}]', false),
  ('collapsible-basket',   'Print-in-Place Collapsible Basket', 'Folds flat, pops open to hold fruit, keys, or desk clutter. Printed as one moving piece — no assembly.', 'functional', 14.00, '180 mm diameter, folds to 25 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":4}]', false),
  -- Cosplay & Props
  ('mando-helmet',         'Mandalorian-Style Helmet',          'Wearable full-scale helmet, printed in sections and ready to sand and paint. Padding kit included.', 'cosplay', 145.00, '260 × 230 × 300 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":25}]', true),
  ('energy-sword-prop',    'Energy Sword Prop',                 'Two-piece collapsible prop sword with internal LED channel. Convention-safe foam-hybrid option available.', 'cosplay', 68.00, '840 × 120 × 40 mm', '[{"type":"PLA","surcharge":0}]', false),
  ('plague-doctor-mask',   'Plague Doctor Mask',                'Articulated-beak wearable mask with adjustable strap mounts. Sanded smooth, primer-ready.',     'cosplay', 55.00, '190 × 160 × 280 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":12}]', false),
  ('scifi-blaster',        'Sci-Fi Blaster Prop',               'Screen-inspired blaster with moving trigger and removable power cell. Orange-tip compliant.',   'cosplay', 48.00, '310 × 60 × 200 mm', '[{"type":"PLA","surcharge":0}]', true),
  ('armor-bracer-set',     'Fantasy Armor Bracer Set',          'Pair of forearm bracers with strap channels, printed to your measurements. Great paint canvas.', 'cosplay', 42.00, 'Custom-sized to forearm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":10}]', false),
  -- Home Decor
  ('geo-planter-trio',     'Geometric Planter Trio',            'Three low-poly planters with hidden drainage trays. Great for succulents.',                     'decor', 28.00, '120 × 120 × 100 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":6}]', true),
  ('moon-lamp',            'Lunar Surface Lamp',                'Lithophane moon lamp with touch-dimmable warm LED base. USB-C powered.',                        'decor', 42.00, '150 mm diameter',    '[{"type":"PLA","surcharge":0}]', true),
  ('flexi-dragon',         'Articulated Flexi Dragon',          'The internet-famous print-in-place dragon — fully articulated, satisfying to fidget with. Multiple colors.', 'decor', 22.00, '400 mm long articulated', '[{"type":"PLA","surcharge":0}]', true),
  ('voronoi-lampshade',    'Voronoi Pendant Lampshade',         'Organic lattice shade that throws dramatic patterned shadows. Fits standard E26/E27 pendants.', 'decor', 34.00, '200 mm diameter',    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":8}]', false),
  ('spiral-vase-set',      'Spiral Vase Set (3)',               'Three vase-mode twisted vases in graduated heights. Watertight PETG option for fresh flowers.', 'decor', 26.00, '80–200 mm tall',     '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":6}]', false),
  ('low-poly-bust',        'Low-Poly Animal Bust',              'Faceted wall-mount bust — choose deer, fox, or bear. A modern trophy, no animals involved.',    'decor', 30.00, '250 × 180 × 200 mm', '[{"type":"PLA","surcharge":0}]', false),
  -- Miniature Gaming
  ('dragon-mini-28mm',     'Ancient Dragon Miniature',          'High-detail 28 mm-scale dragon for tabletop campaigns. Printed in gray resin-look PLA, primer-ready.', 'minis', 24.00, '95 × 80 × 70 mm', '[{"type":"PLA","surcharge":0}]', true),
  ('dungeon-tile-set',     'Modular Dungeon Tile Set',          '24-piece interlocking dungeon tile starter set, OpenLOCK compatible.',                          'minis', 55.00, '50 × 50 mm per tile', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":8}]', false),
  ('adventurer-party',     'Adventurer Party Pack (5 minis)',   'Fighter, wizard, rogue, cleric, and ranger at 28 mm scale. Bases included, ready to prime.',    'minis', 35.00, '28 mm scale, 25 mm bases', '[{"type":"PLA","surcharge":0}]', true),
  ('tavern-furniture',     'Tavern Furniture Pack',             'Tables, chairs, barrels, and a bar counter — 18 scatter-terrain pieces for town encounters.',   'minis', 28.00, '28 mm scale set',    '[{"type":"PLA","surcharge":0}]', false),
  ('hex-terrain-starter',  'Hex Terrain Starter Box',           'Magnetized hex terrain: grass, water, and mountain tiles for wargames and hex crawls. 30 hexes.', 'minis', 62.00, '50 mm hexes, magnetized', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":10}]', false)
on conflict (slug) do nothing;
