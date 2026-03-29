create table if not exists public.community_applications (
  id uuid primary key default gen_random_uuid(),
  submitted_by_email text not null,
  first_name text not null,
  surname text not null,
  country text,
  organisation text,
  role_title text,
  motivation_text text not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'interviewing', 'approved', 'waitlist', 'declined')),
  reviewed_by_user_id uuid references public.profiles (id) on delete set null,
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.application_cohort_interests (
  application_id uuid not null references public.community_applications (id) on delete cascade,
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (application_id, cohort_id)
);

create table if not exists public.application_tag_interests (
  application_id uuid not null references public.community_applications (id) on delete cascade,
  tag_id uuid not null references public.domain_tags (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (application_id, tag_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.community_applications (id) on delete set null,
  email text not null,
  invite_token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_community_applications_status on public.community_applications (status);
create index if not exists idx_invites_email on public.invites (email);

create trigger set_community_applications_updated_at
before update on public.community_applications
for each row
execute function public.set_updated_at();
