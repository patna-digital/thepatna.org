alter table public.external_calendar_events
  add column if not exists conference_url text,
  add column if not exists conference_provider text,
  add column if not exists conference_data jsonb;
