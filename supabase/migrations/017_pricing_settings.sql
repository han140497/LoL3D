-- Expose all price-calculator rates in store_settings so they can be
-- edited from the admin UI without touching code.

alter table store_settings
  add column if not exists printer_power_kw          numeric(6,4) not null default 0.15,
  add column if not exists electricity_rate_per_kwh  numeric(8,2) not null default 8,
  add column if not exists labor_rate_per_hour        numeric(8,2) not null default 200,
  add column if not exists packaging_cost             numeric(8,2) not null default 30,
  add column if not exists waste_allowance_percent    numeric(6,4) not null default 0.08,
  add column if not exists default_markup_percent     numeric(6,4) not null default 0.60;
