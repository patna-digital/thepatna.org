alter table public.calendar_connections
  add column if not exists access_role text;

alter table public.bookings
  add column if not exists guest_emails jsonb not null default '[]'::jsonb;
