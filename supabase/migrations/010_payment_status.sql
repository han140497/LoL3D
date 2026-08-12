-- Migration 010 — Separate payment status from fulfillment status.
-- Run this once in Supabase Dashboard → SQL Editor.

-- 1. Add payment_status column to orders
alter table public.orders add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending', 'paid', 'refunded'));

-- 2. Backfill existing orders
-- Orders that were explicitly marked 'paid', 'printing', 'shipped', or 'delivered' are assumed paid.
update public.orders
set payment_status = 'paid'
where status in ('paid', 'printing', 'shipped', 'delivered');

-- 3. Move 'paid' fulfillment status to 'placed' (or 'printing' if preferred, but let's say 'placed')
update public.orders
set status = 'placed'
where status = 'paid';

-- 4. Update the status check constraint to remove 'paid'
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check 
  check (status in ('placed', 'printing', 'shipped', 'delivered', 'cancelled'));
