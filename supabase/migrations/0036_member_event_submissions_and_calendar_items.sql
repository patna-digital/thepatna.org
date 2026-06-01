-- 0036 · member event submissions + private member calendar items

create table if not exists public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text,
  summary text,
  body text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  display_date text,
  organising_institutions text[] not null default '{}',
  official_link text,
  patna_involvement text,
  themes text[] not null default '{}',
  submitted_by_user_id uuid not null references public.profiles (id) on delete cascade,
  submission_status text not null default 'submitted'
    check (submission_status in ('submitted', 'approved', 'rejected')),
  review_notes text,
  reviewed_by_user_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  approved_event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_event_submissions_submitter
  on public.event_submissions (submitted_by_user_id, created_at desc);

create index if not exists idx_event_submissions_status
  on public.event_submissions (submission_status, created_at desc);

create trigger set_event_submissions_updated_at
before update on public.event_submissions
for each row execute function public.set_updated_at();

alter table public.event_submissions enable row level security;

create policy "event_submissions_member_read_own"
  on public.event_submissions
  for select
  to authenticated
  using (
    submitted_by_user_id = auth.uid()
    or public.current_user_has_role('administrator')
  );

create policy "event_submissions_member_insert_own"
  on public.event_submissions
  for insert
  to authenticated
  with check (
    submitted_by_user_id = auth.uid()
    or public.current_user_has_role('administrator')
  );

create policy "event_submissions_admin_update"
  on public.event_submissions
  for update
  to authenticated
  using (public.current_user_has_role('administrator'))
  with check (public.current_user_has_role('administrator'));

create policy "event_submissions_admin_delete"
  on public.event_submissions
  for delete
  to authenticated
  using (public.current_user_has_role('administrator'));

create table if not exists public.member_calendar_items (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null
    check (item_type in ('task', 'meeting')),
  title text not null,
  notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_all_day boolean not null default false,
  location text,
  meeting_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_member_calendar_items_member_time
  on public.member_calendar_items (member_id, starts_at, ends_at);

create trigger set_member_calendar_items_updated_at
before update on public.member_calendar_items
for each row execute function public.set_updated_at();

alter table public.member_calendar_items enable row level security;

create policy "member_calendar_items_read_own"
  on public.member_calendar_items
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "member_calendar_items_insert_own"
  on public.member_calendar_items
  for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "member_calendar_items_update_own"
  on public.member_calendar_items
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "member_calendar_items_delete_own"
  on public.member_calendar_items
  for delete
  to authenticated
  using (member_id = auth.uid());
