-- Migration 012 — direct image upload for products (replaces pasting an Image URL link).
-- Run this once in Supabase Dashboard → SQL Editor.

-- 1. Public bucket for product photos — these are shown to every visitor on
--    the storefront, so (unlike sculpture-photos/quote-uploads) it's public.
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-images', 'product-images', true, 10485760) -- 10 MB
on conflict (id) do nothing;

create policy "admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy "admins delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- 2. Full gallery per product. image_url stays in sync as images[1] (the
--    primary photo) so every page that already reads image_url keeps working.
alter table public.products add column if not exists images text[] not null default '{}';
