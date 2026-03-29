alter table public.profiles
  add column if not exists profile_status text not null default 'active'
    check (profile_status in ('active', 'inactive')),
  add column if not exists availability_status text not null default 'available'
    check (availability_status in ('available', 'unavailable'));

alter table public.cohort_member_profiles
  add column if not exists relevant_projects jsonb not null default '[]'::jsonb;
