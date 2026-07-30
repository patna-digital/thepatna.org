-- 0058 · Staff role + daily remote working log
--
-- Introduces a "staff" role (independent of member/administrator — a user can
-- hold any combination), a line-manager relationship on profiles, and a
-- daily_work_logs table capturing one morning check-in + evening check-out
-- row per staff member per day.

-- ─── Staff role ──────────────────────────────────────────────────────────────

insert into public.roles (role, description)
values (
  'staff',
  'Completes daily remote working check-ins/check-outs.'
)
on conflict (role) do update set
  description = excluded.description;

-- ─── Line manager ────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists line_manager_id uuid references public.profiles (id) on delete set null;

create index if not exists idx_profiles_line_manager on public.profiles (line_manager_id);

-- ─── Daily work logs ─────────────────────────────────────────────────────────

create table if not exists public.daily_work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null default (timezone('utc', now()))::date,

  -- Morning check-in
  checkin_time time,
  priority_1 text,
  priority_2 text,
  priority_3 text,
  meetings_planned text,
  availability_today text check (availability_today in ('normal', 'different')),
  availability_note text,
  support_required boolean,
  support_details text,
  risks_blockers boolean,
  risks_details text,
  checkin_submitted_at timestamptz,

  -- Evening check-out
  checkout_time time,
  work_completed text,
  priorities_progress text check (priorities_progress in ('all', 'mostly', 'partially', 'not_completed')),
  priorities_progress_comment text,
  projects_worked_on text[] not null default '{}',
  projects_worked_on_other text,
  outstanding_actions text,
  issues_encountered boolean,
  issues_details text,
  tomorrow_priorities text,
  wellbeing text check (wellbeing in ('excellent', 'good', 'okay', 'under_pressure', 'contact_me')),
  wellbeing_comment text,
  checkout_submitted_at timestamptz,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),

  unique (user_id, log_date)
);

create index if not exists idx_daily_work_logs_user_date
  on public.daily_work_logs (user_id, log_date desc);

create index if not exists idx_daily_work_logs_date
  on public.daily_work_logs (log_date desc);

create trigger set_daily_work_logs_updated_at
before update on public.daily_work_logs
for each row execute function public.set_updated_at();

alter table public.daily_work_logs enable row level security;

create policy "daily_work_logs_select"
  on public.daily_work_logs
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_has_role('administrator')
  );

create policy "daily_work_logs_insert_own"
  on public.daily_work_logs
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_has_role('staff')
  );

create policy "daily_work_logs_update_owner_recent"
  on public.daily_work_logs
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and log_date >= (current_date - 1)
  )
  with check (
    user_id = auth.uid()
    and log_date >= (current_date - 1)
  );

create policy "daily_work_logs_update_admin"
  on public.daily_work_logs
  for update
  to authenticated
  using (public.current_user_has_role('administrator'))
  with check (public.current_user_has_role('administrator'));

create policy "daily_work_logs_delete_admin"
  on public.daily_work_logs
  for delete
  to authenticated
  using (public.current_user_has_role('administrator'));
