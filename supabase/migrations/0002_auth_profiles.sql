create table if not exists public.roles (
  role text primary key,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  title text,
  first_name text,
  surname text,
  role_title text,
  country_of_residence text,
  organisation_name text,
  professional_bio text check (char_length(coalesce(professional_bio, '')) <= 1200),
  visibility_setting text not null default 'members_only'
    check (visibility_setting in ('members_only', 'limited', 'hidden')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null references public.roles (role) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create index if not exists idx_user_roles_role on public.user_roles (role);
create index if not exists idx_profiles_country on public.profiles (country_of_residence);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
