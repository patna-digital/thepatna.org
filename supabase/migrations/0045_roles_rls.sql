alter table public.roles enable row level security;

create policy "roles_public_read"
on public.roles
for select
to anon, authenticated
using (true);

create policy "roles_admin_manage"
on public.roles
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));
