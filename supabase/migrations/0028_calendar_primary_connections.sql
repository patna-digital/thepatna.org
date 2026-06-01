alter table public.calendar_connections
  add column if not exists is_primary_calendar boolean not null default false;

create index if not exists idx_calendar_connections_primary
  on public.calendar_connections (member_id, provider, is_primary_calendar)
  where is_active = true;
