alter table public.profiles
add column if not exists is_super_admin boolean not null default false;

-- Seed the super admin by matching on auth.users email
update public.profiles
set is_super_admin = true
from auth.users
where auth.users.id = profiles.id
  and lower(auth.users.email) = 'thepatnadigital@gmail.com';

-- Helper function used in RLS and server-side checks
create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Prevent non-super-admins from promoting themselves to super admin
create policy "profiles_no_self_super_admin"
on public.profiles
for update
to authenticated
using (true)
with check (
  is_super_admin = (select is_super_admin from public.profiles where id = auth.uid())
  or public.current_user_is_super_admin()
);
