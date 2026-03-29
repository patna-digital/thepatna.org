create table if not exists public.cohort_member_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  source_cohort_id uuid references public.cohorts (id) on delete set null,
  source_submitted_at timestamptz,
  middle_names text,
  gender text,
  languages text[] not null default '{}',
  domain_knowledge text,
  focus_area text,
  notable_work text,
  opportunity_interest text,
  additional_comments text,
  headshot_url text,
  cv_url text,
  nda_url text,
  code_of_conduct_url text,
  raw_responses jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_cohort_member_profiles_source_cohort
on public.cohort_member_profiles (source_cohort_id);

create trigger set_cohort_member_profiles_updated_at
before update on public.cohort_member_profiles
for each row
execute function public.set_updated_at();
