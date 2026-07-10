-- Migration 004 — categories become data (admin-manageable).
-- Run once in Supabase Dashboard → SQL Editor.

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

-- Products may now belong to any category row (was a hardcoded check).
alter table public.products drop constraint if exists products_category_check;

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
