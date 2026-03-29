create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  space_type text not null
    check (space_type in ('cohort', 'constituency', 'working_group', 'geography')),
  description text,
  visibility text not null
    check (visibility in ('public_members', 'private', 'invite_only')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.space_memberships (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('member', 'moderator', 'lead')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (space_id, user_id)
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_space_memberships_user_id on public.space_memberships (user_id);
create index if not exists idx_threads_space_id on public.threads (space_id);
create index if not exists idx_comments_thread_id on public.comments (thread_id);

create trigger set_threads_updated_at
before update on public.threads
for each row
execute function public.set_updated_at();

create trigger set_comments_updated_at
before update on public.comments
for each row
execute function public.set_updated_at();
