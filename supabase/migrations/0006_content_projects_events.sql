create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_type text not null
    check (content_type in ('blog', 'news', 'brief', 'report', 'event_output', 'learning_note')),
  summary text,
  body text,
  author_id uuid references public.profiles (id) on delete set null,
  publish_status text not null default 'draft'
    check (publish_status in ('draft', 'published')),
  visibility text not null default 'public'
    check (visibility in ('public', 'members', 'restricted')),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_attachments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items (id) on delete cascade,
  file_url text not null,
  file_type text,
  title text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_tag_map (
  content_id uuid not null references public.content_items (id) on delete cascade,
  tag_id uuid not null references public.domain_tags (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (content_id, tag_id)
);

create table if not exists public.content_cohort_relevance (
  content_id uuid not null references public.content_items (id) on delete cascade,
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (content_id, cohort_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  body text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  resource_title text not null,
  resource_url text,
  resource_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  body text,
  event_type text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  visibility text not null default 'public'
    check (visibility in ('public', 'members', 'restricted')),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_outputs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, content_id)
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  partner_group text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_content_items_visibility on public.content_items (visibility, publish_status);
create index if not exists idx_projects_status on public.projects (status, featured);
create index if not exists idx_events_status on public.events (status, starts_at);

create trigger set_content_items_updated_at
before update on public.content_items
for each row
execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();
