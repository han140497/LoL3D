create table store_settings (
  id int primary key default 1 check (id = 1),
  upi_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table store_settings enable row level security;

create policy "Anyone can read settings"
  on store_settings for select
  using (true);

create policy "Only admins can update settings"
  on store_settings for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Only admins can insert settings"
  on store_settings for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Insert initial row so it can be updated
insert into store_settings (id, upi_id) values (1, '') on conflict do nothing;
