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
                'category_click', 'page_view',
                'add_to_cart', 'begin_checkout', 'purchase'
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
  category    text not null,  -- matches a public.categories row (admin-managed)
  price_base  numeric(10,2) not null,
  dimensions  text,          -- e.g. '220 × 140 × 90 mm'
  materials   jsonb not null default '[{"type":"PLA","surcharge":0}]'::jsonb,
  image_url   text,
  featured    boolean not null default false,
  active      boolean not null default true
);

create index if not exists products_category_idx on public.products (category) where active;

-- ============================================================
-- 3. Orders (domestic / India-only shipping)
-- ============================================================
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text not null default 'placed'
                 check (status in ('placed', 'paid', 'printing', 'shipped', 'delivered', 'cancelled')),
  items          jsonb not null,      -- [{slug, name, material, unitPrice, qty}]
  subtotal       numeric(10,2) not null,
  shipping_cost  numeric(10,2) not null,
  total          numeric(10,2) not null,
  customer_name  text not null,
  phone          text not null,
  email          text,
  address_line1  text not null,
  address_line2  text,
  city           text not null,
  state          text not null,
  pincode        text not null check (pincode ~ '^[1-8][0-9]{5}$'),
  payment_method text,                -- razorpay | payment_link_requested
  payment_ref    text,                -- Razorpay payment id
  session_id     text,
  user_id        uuid references auth.users (id), -- set when a customer is signed in
  metadata       jsonb default '{}'::jsonb
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ============================================================
-- 4. Custom quote requests (with optional STL upload)
-- ============================================================
create table if not exists public.quote_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  status       text not null default 'new'
               check (status in ('new', 'quoted', 'accepted', 'declined')),
  name         text not null,
  contact      text not null,
  idea         text not null,
  file_path    text,                  -- path in the quote-uploads storage bucket
  session_id   text,
  metadata     jsonb default '{}'::jsonb
);

-- Storage bucket for STL/3MF/OBJ/STEP uploads attached to quote requests.
insert into storage.buckets (id, name, public, file_size_limit)
values ('quote-uploads', 'quote-uploads', false, 52428800) -- 50 MB
on conflict (id) do nothing;

-- ============================================================
-- 5. Accounts — customer profiles + admin flag
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  full_name  text,
  is_admin   boolean not null default false
);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER so RLS policies can check adminship without recursion.
create or replace function public.is_admin()
returns boolean
language sql security definer stable set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- TO GRANT ADMIN ACCESS: each admin must sign up on the site first
-- (the trigger above creates their profile row), then run:
--   update public.profiles set is_admin = true
--   where id in (select id from auth.users
--                where email in ('admin1@example.com', 'admin2@example.com'));
-- Verify with:
--   select p.is_admin, u.email from public.profiles p
--   join auth.users u on u.id = p.id;

-- ============================================================
-- 6. Row Level Security
--    Visitors (anon + signed-in customers): INSERT events/orders/
--    quotes, READ products. Customers additionally read THEIR OWN
--    orders and profile. Admins read everything + update orders.
-- ============================================================
alter table public.click_events   enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.quote_requests enable row level security;
alter table public.profiles       enable row level security;

create policy "visitors can log clicks"
  on public.click_events for insert
  to anon, authenticated
  with check (true);

create policy "visitors can read active products"
  on public.products for select
  to anon, authenticated
  using (active = true);

create policy "visitors can place orders"
  on public.orders for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "visitors can request quotes"
  on public.quote_requests for insert
  to anon, authenticated
  with check (true);

create policy "visitors can upload quote files"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'quote-uploads');

create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "users read own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

create policy "admins read all orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

create policy "admins update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin());

create policy "admins read analytics"
  on public.click_events for select
  to authenticated
  using (public.is_admin());

create policy "admins read quote requests"
  on public.quote_requests for select
  to authenticated
  using (public.is_admin());

create policy "admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- You (via the Dashboard / service role) retain full access automatically.
--
-- MIGRATION NOTE: if you ran an older version of this schema, also run:
--   alter table public.click_events drop constraint click_events_event_type_check;
--   alter table public.click_events add constraint click_events_event_type_check
--     check (event_type in ('product_click','instagram_click','quote_click',
--       'category_click','page_view','add_to_cart','begin_checkout','purchase'));
--   alter table public.orders add column if not exists user_id uuid references auth.users (id);
--   drop policy if exists "anon can log clicks" on public.click_events;
--   drop policy if exists "anon can place orders" on public.orders;
--   drop policy if exists "anon can request quotes" on public.quote_requests;
--   drop policy if exists "anon can upload quote files" on storage.objects;
--   (then re-run section 6 above)

-- ============================================================
-- 7. Seed catalog (edit freely in the Table Editor afterwards)
--    Samples modeled on popular printables.com designs — check each
--    model's license before selling prints (many are non-commercial).
-- ============================================================
insert into public.products (slug, name, description, category, price_base, dimensions, materials, featured) values
  -- Functional Prints
  ('phone-dock-mk2',       'Modular Phone Dock MK2',            'Adjustable-angle charging dock with cable routing. Fits phones up to 8 mm thick with a case.', 'functional', 499.00, '110 × 80 × 95 mm',  '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":100}]', true),
  ('cable-organizer-set',  'Desk Cable Organizer Set',          'Set of 6 snap-in cable clips plus an under-desk raceway. Keeps your setup clean.',              'functional', 349.00, '90 × 25 × 20 mm',   '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":80}]', false),
  ('headphone-stand',      'Curved Headphone Stand',            'Weighted single-piece stand with a smooth curved arm. Fits all full-size headphones.',          'functional', 449.00, '120 × 100 × 260 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":100}]', false),
  ('gridfinity-starter',   'Gridfinity Storage Starter Kit',    'Modular drawer-organization system: 2 baseplates plus 12 assorted bins. The workshop favorite.', 'functional', 899.00, '42 mm grid, fits 2 standard drawers', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":200}]', true),
  ('controller-wall-mount','Game Controller Wall Mount (Pair)', 'Low-profile wall hooks for Xbox / PS5 / Switch Pro controllers. Screws and anchors included.',  'functional', 299.00, '70 × 45 × 60 mm each', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":60}]', false),
  ('collapsible-basket',   'Print-in-Place Collapsible Basket', 'Folds flat, pops open to hold fruit, keys, or desk clutter. Printed as one moving piece — no assembly.', 'functional', 399.00, '180 mm diameter, folds to 25 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":100}]', false),
  -- Cosplay & Props
  ('mando-helmet',         'Mandalorian-Style Helmet',          'Wearable full-scale helmet, printed in sections and ready to sand and paint. Padding kit included.', 'cosplay', 3999.00, '260 × 230 × 300 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":700}]', true),
  ('energy-sword-prop',    'Energy Sword Prop',                 'Two-piece collapsible prop sword with internal LED channel. Convention-safe foam-hybrid option available.', 'cosplay', 1899.00, '840 × 120 × 40 mm', '[{"type":"PLA","surcharge":0}]', false),
  ('plague-doctor-mask',   'Plague Doctor Mask',                'Articulated-beak wearable mask with adjustable strap mounts. Sanded smooth, primer-ready.',     'cosplay', 1499.00, '190 × 160 × 280 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":350}]', false),
  ('scifi-blaster',        'Sci-Fi Blaster Prop',               'Screen-inspired blaster with moving trigger and removable power cell. Orange-tip compliant.',   'cosplay', 1299.00, '310 × 60 × 200 mm', '[{"type":"PLA","surcharge":0}]', true),
  ('armor-bracer-set',     'Fantasy Armor Bracer Set',          'Pair of forearm bracers with strap channels, printed to your measurements. Great paint canvas.', 'cosplay', 1199.00, 'Custom-sized to forearm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":280}]', false),
  -- Home Decor
  ('geo-planter-trio',     'Geometric Planter Trio',            'Three low-poly planters with hidden drainage trays. Great for succulents.',                     'decor', 799.00, '120 × 120 × 100 mm', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":180}]', true),
  ('moon-lamp',            'Lunar Surface Lamp',                'Lithophane moon lamp with touch-dimmable warm LED base. USB-C powered.',                        'decor', 1199.00, '150 mm diameter',    '[{"type":"PLA","surcharge":0}]', true),
  ('flexi-dragon',         'Articulated Flexi Dragon',          'The internet-famous print-in-place dragon — fully articulated, satisfying to fidget with. Multiple colors.', 'decor', 599.00, '400 mm long articulated', '[{"type":"PLA","surcharge":0}]', true),
  ('voronoi-lampshade',    'Voronoi Pendant Lampshade',         'Organic lattice shade that throws dramatic patterned shadows. Fits standard E26/E27 pendants.', 'decor', 949.00, '200 mm diameter',    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":220}]', false),
  ('spiral-vase-set',      'Spiral Vase Set (3)',               'Three vase-mode twisted vases in graduated heights. Watertight PETG option for fresh flowers.', 'decor', 749.00, '80–200 mm tall',     '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":180}]', false),
  ('low-poly-bust',        'Low-Poly Animal Bust',              'Faceted wall-mount bust — choose deer, fox, or bear. A modern trophy, no animals involved.',    'decor', 849.00, '250 × 180 × 200 mm', '[{"type":"PLA","surcharge":0}]', false),
  -- Miniature Gaming
  ('dragon-mini-28mm',     'Ancient Dragon Miniature',          'High-detail 28 mm-scale dragon for tabletop campaigns. Printed in gray resin-look PLA, primer-ready.', 'minis', 649.00, '95 × 80 × 70 mm', '[{"type":"PLA","surcharge":0}]', true),
  ('dungeon-tile-set',     'Modular Dungeon Tile Set',          '24-piece interlocking dungeon tile starter set, OpenLOCK compatible.',                          'minis', 1499.00, '50 × 50 mm per tile', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":350}]', false),
  ('adventurer-party',     'Adventurer Party Pack (5 minis)',   'Fighter, wizard, rogue, cleric, and ranger at 28 mm scale. Bases included, ready to prime.',    'minis', 999.00, '28 mm scale, 25 mm bases', '[{"type":"PLA","surcharge":0}]', true),
  ('tavern-furniture',     'Tavern Furniture Pack',             'Tables, chairs, barrels, and a bar counter — 18 scatter-terrain pieces for town encounters.',   'minis', 799.00, '28 mm scale set',    '[{"type":"PLA","surcharge":0}]', false),
  ('hex-terrain-starter',  'Hex Terrain Starter Box',           'Magnetized hex terrain: grass, water, and mountain tiles for wargames and hex crawls. 30 hexes.', 'minis', 1699.00, '50 mm hexes, magnetized', '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":400}]', false)
on conflict (slug) do nothing;

-- ============================================================
-- 8. Custom sculpture requests (photo → style → we model it)
-- ============================================================
create table if not exists public.sculpture_requests (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status     text not null default 'new'
             check (status in ('new', 'modeling', 'preview_sent', 'confirmed', 'printed', 'declined')),
  name       text not null,
  contact    text not null,
  style      text not null,   -- chibi | cartoon-mini | realistic-bust | full-figurine | pet
  notes      text,
  photo_path text not null,   -- path in the sculpture-photos bucket
  session_id text,
  metadata   jsonb default '{}'::jsonb
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('sculpture-photos', 'sculpture-photos', false, 10485760) -- 10 MB
on conflict (id) do nothing;

alter table public.sculpture_requests enable row level security;

create policy "visitors can request sculptures"
  on public.sculpture_requests for insert
  to anon, authenticated
  with check (true);

create policy "visitors can upload sculpture photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'sculpture-photos');

create policy "admins read sculpture requests"
  on public.sculpture_requests for select
  to authenticated
  using (public.is_admin());

create policy "admins update sculpture requests"
  on public.sculpture_requests for update
  to authenticated
  using (public.is_admin());

-- Admins can view uploaded files (signed URLs) from both buckets.
create policy "admins read uploaded files"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('sculpture-photos', 'quote-uploads') and public.is_admin());

-- ============================================================
-- 9. Admin product management (add/edit listings from /admin)
-- ============================================================
create policy "admins read all products"
  on public.products for select
  to authenticated
  using (public.is_admin());

create policy "admins insert products"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update products"
  on public.products for update
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 10. Admin request cleanup (delete requests + their files)
-- ============================================================
create policy "admins delete sculpture requests"
  on public.sculpture_requests for delete
  to authenticated
  using (public.is_admin());

create policy "admins delete quote requests"
  on public.quote_requests for delete
  to authenticated
  using (public.is_admin());

create policy "admins delete uploaded files"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('sculpture-photos', 'quote-uploads') and public.is_admin());

-- ============================================================
-- 11. Categories (admin-manageable)
-- ============================================================
create table if not exists public.categories (
  id         text primary key,        -- slug, used in URLs and product rows
  created_at timestamptz not null default now(),
  name       text not null,
  blurb      text not null default '',
  sort       int  not null default 100,
  active     boolean not null default true
);

insert into public.categories (id, name, blurb, sort) values
  ('functional', 'Functional Prints', 'Brackets, mounts, organizers, and replacement parts that just work.', 10),
  ('cosplay',    'Cosplay & Props',   'Wearable armor, helmets, and screen-accurate props ready to finish.', 20),
  ('decor',      'Home Decor',        'Planters, lamps, and sculptural pieces for modern spaces.',           30),
  ('minis',      'Miniature Gaming',  'High-detail minis and terrain for your tabletop campaigns.',          40)
on conflict (id) do nothing;

alter table public.categories enable row level security;

create policy "visitors read active categories"
  on public.categories for select
  to anon, authenticated
  using (active);

create policy "admins read all categories"
  on public.categories for select
  to authenticated
  using (public.is_admin());

create policy "admins insert categories"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update categories"
  on public.categories for update
  to authenticated
  using (public.is_admin());
