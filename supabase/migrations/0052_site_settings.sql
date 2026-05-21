-- Site-wide settings table (key/value store)
create table if not exists site_settings (
  key        text        primary key,
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed the home featured members setting
insert into site_settings (key, value)
values (
  'home_featured_members',
  '{"mode": "default", "member_ids": []}'::jsonb
)
on conflict (key) do nothing;

alter table site_settings enable row level security;

-- Only admins/super_admins can read or write
create policy "Admins can manage site settings"
  on site_settings
  for all
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );
