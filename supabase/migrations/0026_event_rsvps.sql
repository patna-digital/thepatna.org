create table if not exists public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'going'
    check (status in ('going')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (event_id, user_id)
);

create index if not exists idx_event_rsvps_user_id on public.event_rsvps (user_id, created_at desc);
create index if not exists idx_event_rsvps_event_id on public.event_rsvps (event_id, created_at desc);

create trigger set_event_rsvps_updated_at
before update on public.event_rsvps
for each row
execute function public.set_updated_at();

alter table public.event_rsvps enable row level security;

create policy "event_rsvps_self_or_admin_read"
on public.event_rsvps
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "event_rsvps_self_or_admin_insert"
on public.event_rsvps
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "event_rsvps_self_or_admin_update"
on public.event_rsvps
for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
)
with check (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "event_rsvps_self_or_admin_delete"
on public.event_rsvps
for delete
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);
