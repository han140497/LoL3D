-- Migration 002 — custom sculpture requests + admin product management.
-- Run this once in Supabase Dashboard → SQL Editor (safe to re-run).
-- For FRESH projects, skip this: schema.sql already includes everything.

-- ============================================================
-- 1. Custom sculpture requests (photo → style → we model it)
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
-- 2. Admin product management (add/edit listings from /admin)
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
