-- ─────────────────────────────────────────────────────────────────────────────
-- 0054 · Application task assignment + multi-cohort admin assignment
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend community_applications with assignment fields ───────────────────

alter table public.community_applications
  add column if not exists assigned_to_user_id uuid references public.profiles (id) on delete set null,
  add column if not exists assignment_notes     text,
  add column if not exists assigned_at          timestamptz;

create index if not exists idx_community_applications_assigned_to
  on public.community_applications (assigned_to_user_id)
  where assigned_to_user_id is not null;

-- ── 2. Admin-assigned cohorts per application (replaces single assigned_cohort_id) ──

create table if not exists public.application_assigned_cohorts (
  application_id uuid not null references public.community_applications (id) on delete cascade,
  cohort_id      uuid not null references public.cohorts (id) on delete cascade,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default timezone('utc', now()),

  primary key (application_id, cohort_id)
);

-- Only one cohort per application may be primary
create unique index if not exists uniq_application_primary_cohort
  on public.application_assigned_cohorts (application_id)
  where is_primary = true;

create index if not exists idx_application_assigned_cohorts_app
  on public.application_assigned_cohorts (application_id);

-- ── 3. Extend notifications type check to include task_assignment ─────────────

-- Drop and recreate type constraint to add new value (Postgres constraint alter)
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('mention', 'admin_broadcast', 'space_activity', 'task_assignment'));

-- ── 4. RLS policies ──────────────────────────────────────────────────────────

alter table public.application_assigned_cohorts enable row level security;

-- Admins can manage cohort assignments
create policy "Admins can manage application cohort assignments"
  on public.application_assigned_cohorts
  for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );
