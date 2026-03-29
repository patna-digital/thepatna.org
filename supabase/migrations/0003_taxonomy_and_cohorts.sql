create table if not exists public.domain_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category text not null
    check (category in ('domain', 'geography', 'constituency', 'process')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_tags (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tag_id uuid not null references public.domain_tags (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, tag_id)
);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_cohorts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, cohort_id)
);

create unique index if not exists idx_user_cohorts_primary
on public.user_cohorts (user_id)
where is_primary;

create table if not exists public.cohort_leads (
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lead_role text not null check (lead_role in ('lead', 'co_lead', 'deputy')),
  start_date date not null,
  end_date date,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (cohort_id, user_id, start_date)
);
