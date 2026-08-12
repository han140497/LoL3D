-- Migration 011 — Add 'reported' to payment_status
-- Run this once in Supabase Dashboard → SQL Editor.

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check 
  check (payment_status in ('pending', 'reported', 'paid', 'refunded'));
