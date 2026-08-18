-- Filament brand/type library used by the price calculator.
-- Each row is one spool option (brand + type + optional colour).
-- Products reference this via filament_id (nullable) to drive material cost.

create table if not exists filaments (
  id           uuid primary key default gen_random_uuid(),
  brand        text not null,
  type         text not null,
  color        text,
  price_per_kg numeric(10,2) not null check (price_per_kg >= 0),
  active       boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now()
);

-- Let admins manage the filament catalogue.
alter table filaments enable row level security;

create policy "Admins can manage filaments"
  on filaments for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Anyone can read active filaments"
  on filaments for select
  using (active = true);

-- Optional: link a product to a specific filament spool.
-- Nullable so existing products keep working with the default rate.
alter table products add column if not exists filament_id uuid references filaments(id) on delete set null;

-- Seed a few common options so the page isn't empty.
insert into filaments (brand, type, color, price_per_kg, notes) values
  ('Generic / Unknown', 'PLA',  null, 1200, 'Default rate'),
  ('Generic / Unknown', 'PETG', null, 1400, 'Default rate'),
  ('eSUN',              'PLA+', null, 1350, null),
  ('eSUN',              'PETG', null, 1500, null),
  ('Bambu Lab',         'PLA Basic', null, 1600, null),
  ('Bambu Lab',         'PETG HF',  null, 1800, null),
  ('Polymaker',         'PolyLite PLA', null, 1250, null),
  ('Polymaker',         'PolyLite PETG', null, 1450, null)
on conflict do nothing;
