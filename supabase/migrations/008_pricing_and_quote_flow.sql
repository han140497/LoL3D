-- Migration 008 — automatic price calculator columns + fix the missing
-- admin-update policy on quote_requests (this is why the admin panel had
-- no way to advance a quote's status: RLS silently rejected the write).
-- Run once in Supabase Dashboard → SQL Editor.

-- ============================================================
-- 1. Price calculator inputs, stored per product so prices can be
--    recalculated later if rates change (see src/lib/constants.js PRICING).
-- ============================================================
alter table public.products add column if not exists filament_weight_g numeric(10,2);
alter table public.products add column if not exists print_time_hours  numeric(10,2);
alter table public.products add column if not exists labor_time_hours  numeric(10,2) not null default 0;
alter table public.products add column if not exists markup_override   numeric(5,4);

-- ============================================================
-- 2. Admins can update quote requests (advance status, record the
--    quoted price / message). Sculpture requests already had this;
--    quote_requests never did.
-- ============================================================
create policy "admins update quote requests"
  on public.quote_requests for update
  to authenticated
  using (public.is_admin());
