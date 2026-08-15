-- Migration 014 — Promotional campaigns system
-- Adds: campaigns table, RLS, first-order eligibility policy, Independence Day seed

-- ============================================================
-- 1. Campaigns table
-- ============================================================
create table if not exists public.campaigns (
  id               serial primary key,
  name             text not null,
  description      text,
  banner_text      text,
  discount_percent integer not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  first_order_only boolean not null default false,
  requires_signup  boolean not null default false,
  active           boolean not null default true,
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.campaigns enable row level security;

-- Anyone can read currently-active campaigns (for banners, discount logic)
create policy "public read active campaigns"
  on public.campaigns for select
  using (
    active = true
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );

-- Admins have full access
create policy "admins manage campaigns"
  on public.campaigns for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 2. Let authenticated users count their own orders
--    (needed to determine first-order eligibility)
-- ============================================================
drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- 3. Seed: India's Independence Day campaign (Aug 15 IST)
-- ============================================================
insert into public.campaigns (
  name,
  description,
  banner_text,
  discount_percent,
  first_order_only,
  requires_signup,
  starts_at,
  ends_at
) values (
  'India''s Independence Day',
  '20% off for every new customer, celebrating India''s 80th Independence Day.',
  'Happy Independence Day! 🇮🇳 Get 20% off your first order — today only!',
  20,
  true,
  true,
  '2026-08-15 00:00:00+05:30',
  '2026-08-16 00:00:00+05:30'
) on conflict do nothing;
