alter table public.profiles
add column if not exists email text;

update public.profiles
set email = lower(auth_users.email)
from auth.users as auth_users
where auth_users.id = profiles.id
  and auth_users.email is not null
  and (profiles.email is null or profiles.email <> lower(auth_users.email));

alter table public.profiles
alter column email set not null;

create unique index if not exists idx_profiles_email on public.profiles (email);

alter table public.profiles
add column if not exists onboarding_status text not null default 'invited';

alter table public.profiles
drop constraint if exists profiles_onboarding_status_check;

alter table public.profiles
add constraint profiles_onboarding_status_check
check (onboarding_status in ('invited', 'profile_pending', 'active'));

alter table public.profiles
add column if not exists migration_source text;

alter table public.profiles
add column if not exists migration_batch_id text;

alter table public.profiles
add column if not exists invited_at timestamptz;

alter table public.profiles
add column if not exists onboarding_completed_at timestamptz;

update public.profiles
set onboarding_status = 'active'
where onboarding_status is null
   or id in (
     select user_id
     from public.user_roles
     where role = 'administrator'
   );

create index if not exists idx_profiles_onboarding_status
on public.profiles (onboarding_status);

alter table public.invites
add column if not exists user_id uuid references public.profiles (id) on delete set null;

alter table public.invites
add column if not exists invite_type text not null default 'cohort_migration';

alter table public.invites
drop constraint if exists invites_invite_type_check;

alter table public.invites
add constraint invites_invite_type_check
check (invite_type in ('application_approval', 'cohort_migration'));

alter table public.invites
add column if not exists delivery_method text not null default 'supabase_invite';

alter table public.invites
drop constraint if exists invites_delivery_method_check;

alter table public.invites
add constraint invites_delivery_method_check
check (delivery_method in ('supabase_invite', 'manual_reset'));

create index if not exists idx_invites_user_id on public.invites (user_id);
create index if not exists idx_invites_type on public.invites (invite_type);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;
