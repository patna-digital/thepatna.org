-- 0053 · Notification System — F-10-1
-- Adds in-app notifications, per-user notification preferences, and admin broadcasts.

-- ─────────────────────────────────────────────
-- 1. notifications (in-app feed)
-- ─────────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  recipient_id uuid        not null references public.profiles(id) on delete cascade,
  type         text        not null check (type in ('mention', 'admin_broadcast', 'space_activity')),
  title        text        not null,
  body         text,
  link         text,
  metadata     jsonb       not null default '{}'::jsonb,
  is_read      boolean     not null default false,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_notifications_recipient_unread
  on public.notifications (recipient_id, is_read, created_at desc);

create index if not exists idx_notifications_recipient_feed
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

-- Members can only read their own notifications
create policy "notifications_member_read"
  on public.notifications
  for select
  to authenticated
  using (recipient_id = auth.uid());

-- Members can mark their own notifications as read
create policy "notifications_member_update"
  on public.notifications
  for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Inserts performed server-side via service role only (no direct client insert)


-- ─────────────────────────────────────────────
-- 2. notification_preferences (per-user settings)
-- ─────────────────────────────────────────────
create table if not exists public.notification_preferences (
  user_id                 uuid        primary key references public.profiles(id) on delete cascade,
  email_digest_enabled    boolean     not null default true,
  email_digest_frequency  text        not null default 'weekly'
                            check (email_digest_frequency in ('daily', 'weekly', 'never')),
  email_mentions_enabled  boolean     not null default true,
  email_broadcasts_enabled boolean    not null default true,
  inapp_mentions_enabled  boolean     not null default true,
  digest_day_of_week      smallint    not null default 1
                            check (digest_day_of_week between 0 and 6),
  digest_sent_at          timestamptz,
  updated_at              timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notif_prefs_member_own"
  on public.notification_preferences
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─────────────────────────────────────────────
-- 3. admin_broadcasts
-- ─────────────────────────────────────────────
create table if not exists public.admin_broadcasts (
  id                  uuid        primary key default gen_random_uuid(),
  sender_id           uuid        not null references public.profiles(id),
  subject             text        not null,
  body                text        not null,
  target_type         text        not null check (target_type in ('all', 'cohort', 'selected')),
  target_cohort_ids   uuid[]      not null default '{}'::uuid[],
  target_user_ids     uuid[]      not null default '{}'::uuid[],
  delivery_channels   text[]      not null default '{inapp}'::text[],
  recipient_count     integer     not null default 0,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.admin_broadcasts enable row level security;

create policy "broadcasts_admin_manage"
  on public.admin_broadcasts
  for all
  to authenticated
  using (
    public.current_user_has_role('administrator')
    or public.current_user_is_super_admin()
  )
  with check (
    public.current_user_has_role('administrator')
    or public.current_user_is_super_admin()
  );


-- ─────────────────────────────────────────────
-- 4. Helper view: resolves a broadcast's target_type → user ids
-- ─────────────────────────────────────────────
create or replace view public.admin_broadcast_recipients as
select
  b.id   as broadcast_id,
  p.id   as user_id,
  p.email
from public.admin_broadcasts b
join public.profiles p on (
  -- 'all': every active member
  ( b.target_type = 'all' and p.onboarding_status = 'active' )

  -- 'cohort': members in one of the target cohorts
  or ( b.target_type = 'cohort'
       and exists (
         select 1 from public.user_cohorts uc
         where uc.user_id = p.id
           and uc.cohort_id = any(b.target_cohort_ids)
       )
     )

  -- 'selected': explicitly listed users
  or ( b.target_type = 'selected'
       and p.id = any(b.target_user_ids)
     )
);


-- ─────────────────────────────────────────────
-- 5. RPC: bulk-insert in-app notifications for a broadcast
--    Called server-side (security definer) to avoid RLS blocking insert.
-- ─────────────────────────────────────────────
create or replace function public.create_broadcast_notifications(
  p_broadcast_id uuid,
  p_title        text,
  p_body         text,
  p_link         text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.notifications (recipient_id, type, title, body, link, metadata)
  select
    r.user_id,
    'admin_broadcast',
    p_title,
    p_body,
    p_link,
    jsonb_build_object(
      'broadcast_id', p_broadcast_id,
      'sender_id',    (select sender_id from public.admin_broadcasts where id = p_broadcast_id)
    )
  from public.admin_broadcast_recipients r
  where r.broadcast_id = p_broadcast_id;

  get diagnostics inserted_count = row_count;

  -- Update recipient_count on the broadcast record
  update public.admin_broadcasts
  set
    recipient_count = inserted_count,
    sent_at         = now()
  where id = p_broadcast_id;

  return inserted_count;
end;
$$;


-- ─────────────────────────────────────────────
-- 6. Cleanup function: remove notifications older than 90 days
--    Intended to be called by a Supabase cron job.
-- ─────────────────────────────────────────────
create or replace function public.cleanup_old_notifications()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.notifications
  where created_at < now() - interval '90 days';
$$;
