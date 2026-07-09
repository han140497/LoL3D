-- Migration 003 — let admins delete requests (and their uploaded files).
-- Run once in Supabase Dashboard → SQL Editor.

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
