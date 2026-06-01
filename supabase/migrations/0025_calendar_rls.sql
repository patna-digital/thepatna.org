-- Calendar System RLS Policies
-- Secures calendar tables with appropriate access controls

-- Calendar connections: members manage their own
alter table public.calendar_connections enable row level security;

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

-- Availability rules: members manage their own
alter table public.availability_rules enable row level security;

create policy "Members view own availability rules"
  on public.availability_rules
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members insert own availability rules"
  on public.availability_rules
  for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update own availability rules"
  on public.availability_rules
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "Members delete own availability rules"
  on public.availability_rules
  for delete
  to authenticated
  using (member_id = auth.uid());

-- Booking slots: viewable by others for booking, managed by owner
alter table public.booking_slots enable row level security;

create policy "Anyone can view available slots"
  on public.booking_slots
  for select
  to authenticated
  using (is_available = true and is_blocked = false);

create policy "Members view own booking slots"
  on public.booking_slots
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members insert own booking slots"
  on public.booking_slots
  for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update own booking slots"
  on public.booking_slots
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

create policy "Members delete own booking slots"
  on public.booking_slots
  for delete
  to authenticated
  using (member_id = auth.uid());

-- Bookings: host can manage, booker can view their own
alter table public.bookings enable row level security;

create policy "Hosts can view their bookings"
  on public.bookings
  for select
  to authenticated
  using (host_id = auth.uid());

create policy "Hosts can insert bookings"
  on public.bookings
  for insert
  to authenticated
  with check (host_id = auth.uid());

create policy "Hosts can update their bookings"
  on public.bookings
  for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "Hosts can delete their bookings"
  on public.bookings
  for delete
  to authenticated
  using (host_id = auth.uid());

-- Allow anon/anonymous bookers to create bookings (for public booking pages)
create policy "Anonymous users can create bookings"
  on public.bookings
  for insert
  to anon
  with check (true);

-- Booking settings: members manage own
alter table public.booking_settings enable row level security;

create policy "Members view own booking settings"
  on public.booking_settings
  for select
  to authenticated
  using (member_id = auth.uid());

create policy "Members insert own booking settings"
  on public.booking_settings
  for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update own booking settings"
  on public.booking_settings
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- Allow public to view booking settings for public booking pages
create policy "Public can view public booking settings"
  on public.booking_settings
  for select
  to anon
  using (public_booking_enabled = true);

create policy "Public can view public booking settings authenticated"
  on public.booking_settings
  for select
  to authenticated
  using (public_booking_enabled = true);

-- Calendar sync logs: only members can view their own
alter table public.calendar_sync_logs enable row level security;

create policy "Members view own calendar sync logs"
  on public.calendar_sync_logs
  for select
  to authenticated
  using (
    connection_id in (
      select id from public.calendar_connections where member_id = auth.uid()
    )
  );
