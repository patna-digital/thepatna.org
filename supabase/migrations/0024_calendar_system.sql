-- Calendar System Migration
-- Creates tables for external calendar connections, availability rules, bookings, and settings

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft', 'zoho', 'apple', 'generic_ical')),
  provider_account_email text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  calendar_id text default 'primary',
  calendar_name text,
  is_active boolean not null default true,
  sync_enabled boolean not null default true,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.calendar_connections is 'External calendar connections (Google, Outlook, Zoho, etc.) for members';

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  rule_type text not null check (rule_type in ('recurring', 'exception', 'buffer')),
  day_of_week int check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  effective_from date,
  effective_until date,
  timezone text not null default 'UTC',
  is_blocked boolean not null default false,
  label text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.availability_rules is 'Member availability rules for booking (recurring schedules and exceptions)';

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  booker_email text not null,
  booker_name text,
  booker_organisation text,
  booker_notes text,
  title text not null,
  description text,
  meeting_type text default 'one_on_one' check (meeting_type in ('one_on_one', 'group', 'consultation')),
  location_type text default 'video' check (location_type in ('video', 'phone', 'in_person')),
  location_details text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  host_calendar_event_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.bookings is 'Meeting bookings between members and external bookers';

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null,
  is_available boolean not null default true,
  is_blocked boolean not null default false,
  booking_id uuid references public.bookings (id) on delete set null,
  source_calendar_id uuid references public.calendar_connections (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.booking_slots is 'Generated time slots available for booking';

create table if not exists public.booking_settings (
  member_id uuid primary key references public.profiles (id) on delete cascade,
  public_booking_enabled boolean not null default false,
  public_booking_url_slug text unique,
  default_meeting_duration int not null default 30,
  minimum_notice_hours int not null default 24,
  maximum_booking_days_ahead int not null default 30,
  buffer_minutes_between_meetings int not null default 10,
  timezone text not null default 'UTC',
  available_days jsonb not null default '[1,2,3,4,5]',
  confirmation_message text,
  cancellation_policy text,
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.booking_settings is 'Per-member settings for public booking pages';

create table if not exists public.calendar_sync_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.calendar_connections (id) on delete cascade,
  sync_type text not null,
  status text not null check (status in ('success', 'partial', 'failed')),
  events_processed int default 0,
  events_created int default 0,
  events_updated int default 0,
  events_deleted int default 0,
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

comment on table public.calendar_sync_logs is 'Audit log for calendar synchronization operations';

-- Indexes for performance
create index idx_calendar_connections_member on public.calendar_connections (member_id, is_active);
create index idx_availability_rules_member on public.availability_rules (member_id, rule_type);
create index idx_booking_slots_member_date on public.booking_slots (member_id, slot_date);
create index idx_booking_slots_available on public.booking_slots (member_id, is_available, is_blocked) where is_available = true and is_blocked = false;
create index idx_bookings_host on public.bookings (host_id, status);
create index idx_bookings_slot on public.bookings (id);
create index idx_bookings_booker on public.bookings (booker_email);
create index idx_booking_settings_slug on public.booking_settings (public_booking_url_slug);

-- Triggers for updated_at
create trigger set_calendar_connections_updated_at
before update on public.calendar_connections
for each row execute function public.set_updated_at();

create trigger set_availability_rules_updated_at
before update on public.availability_rules
for each row execute function public.set_updated_at();

create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger set_booking_settings_updated_at
before update on public.booking_settings
for each row execute function public.set_updated_at();
