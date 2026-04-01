-- External Calendar Events Migration
-- Stores synced events from external calendars (Google, Outlook, Apple, iCal)
-- Also ensures calendar_connections table exists for FK reference

-- First, ensure calendar_connections table exists (in case 0024 hasn't run yet)
create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft', 'zoho', 'apple', 'generic_ical')),
  provider_account_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text default 'primary',
  calendar_name text,
  is_active boolean not null default true,
  sync_enabled boolean not null default true,
  last_synced_at timestamptz,
  last_sync_error text,
  scope text,
  auth_method text default 'oauth' check (auth_method in ('oauth', 'api_key', 'ical_url')),
  sync_direction text default 'import' check (sync_direction in ('import', 'export', 'bidirectional')),
  sync_range_days int default 90,
  webhook_url text,
  webhook_channel_id text,
  sync_token text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.calendar_connections is 'External calendar connections (Google, Outlook, Zoho, etc.) for members';

-- Create index if not exists
create index if not exists idx_calendar_connections_member on public.calendar_connections (member_id, is_active);

-- Create trigger if not exists (safely)
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_calendar_connections_updated_at'
  ) then
    create trigger set_calendar_connections_updated_at
    before update on public.calendar_connections
    for each row execute function public.set_updated_at();
  end if;
end
$$;

-- Now create the external_calendar_events table
create table if not exists public.external_calendar_events (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.calendar_connections (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  
  -- External event identification
  external_event_id text not null,
  external_calendar_id text,
  
  -- Event details
  title text not null,
  description text,
  location text,
  
  -- Timing
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  is_all_day boolean not null default false,
  
  -- Recurrence
  recurrence_rule text,
  recurring_event_id text,
  
  -- Attendees (stored as JSON for flexibility)
  attendees jsonb default '[]',
  organizer jsonb,
  
  -- Event status and metadata
  status text default 'confirmed' check (status in ('confirmed', 'tentative', 'cancelled')),
  visibility text default 'default' check (visibility in ('default', 'public', 'private', 'confidential')),
  
  -- Sync metadata
  external_created_at timestamptz,
  external_updated_at timestamptz,
  last_synced_at timestamptz not null default timezone('utc', now()),
  
  -- Internal tracking
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  -- Ensure unique events per connection
  unique(connection_id, external_event_id)
);

comment on table public.external_calendar_events is 'Synced events from external calendar providers';

-- Indexes for performance
create index if not exists idx_external_events_connection on public.external_calendar_events (connection_id);
create index if not exists idx_external_events_member on public.external_calendar_events (member_id, starts_at);
create index if not exists idx_external_events_time_range on public.external_calendar_events (starts_at, ends_at);
create index if not exists idx_external_events_external_id on public.external_calendar_events (connection_id, external_event_id);

-- Trigger for updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_external_calendar_events_updated_at'
  ) then
    create trigger set_external_calendar_events_updated_at
    before update on public.external_calendar_events
    for each row execute function public.set_updated_at();
  end if;
end
$$;

-- RLS Policies for calendar_connections (if not already enabled)
alter table public.calendar_connections enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Members view own calendar connections" on public.calendar_connections;
drop policy if exists "Members insert own calendar connections" on public.calendar_connections;
drop policy if exists "Members update own calendar connections" on public.calendar_connections;
drop policy if exists "Members delete own calendar connections" on public.calendar_connections;

-- Create policies
create policy "Members view own calendar connections"
  on public.calendar_connections
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members insert own calendar connections"
  on public.calendar_connections
  for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update own calendar connections"
  on public.calendar_connections
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "Members delete own calendar connections"
  on public.calendar_connections
  for delete
  to authenticated
  using (member_id = auth.uid());

-- RLS Policies for external calendar events
alter table public.external_calendar_events enable row level security;

drop policy if exists "Members view own external events" on public.external_calendar_events;
drop policy if exists "System can insert external events" on public.external_calendar_events;
drop policy if exists "System can update external events" on public.external_calendar_events;
drop policy if exists "System can delete external events" on public.external_calendar_events;

create policy "Members view own external events"
  on public.external_calendar_events
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "System can insert external events"
  on public.external_calendar_events
  for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "System can update external events"
  on public.external_calendar_events
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "System can delete external events"
  on public.external_calendar_events
  for delete
  to authenticated
  using (member_id = auth.uid());

-- Add OAuth token columns to calendar_connections
alter table public.calendar_connections
  add column if not exists access_token text,
  add column if not exists refresh_token text,
  add column if not exists scope text,
  add column if not exists auth_method text default 'oauth' check (auth_method in ('oauth', 'api_key', 'ical_url'));

-- Add sync configuration and incremental sync token columns
alter table public.calendar_connections
  add column if not exists sync_direction text default 'import' check (sync_direction in ('import', 'export', 'bidirectional')),
  add column if not exists sync_range_days int default 90,
  add column if not exists sync_token text,
  add column if not exists webhook_url text,
  add column if not exists webhook_channel_id text;
