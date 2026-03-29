create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  requester_email text not null,
  organisation text,
  country text,
  request_type text not null
    check (request_type in ('briefing', 'analysis', 'coordination', 'convening', 'other')),
  decision_context text,
  timeline text,
  details text not null,
  status text not null default 'new'
    check (status in ('new', 'in_review', 'meeting', 'active', 'closed')),
  assigned_to_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.partnership_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organisation text not null,
  org_type text,
  focus_areas text,
  support_type text,
  budget_range text,
  success_definition text,
  status text not null default 'new'
    check (status in ('new', 'in_review', 'active', 'closed')),
  assigned_to_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.collaboration_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organisation text,
  collaboration_type text,
  proposal text not null,
  status text not null default 'new'
    check (status in ('new', 'in_review', 'active', 'closed')),
  assigned_to_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_service_requests_updated_at
before update on public.service_requests
for each row
execute function public.set_updated_at();

create trigger set_partnership_leads_updated_at
before update on public.partnership_leads
for each row
execute function public.set_updated_at();

create trigger set_collaboration_leads_updated_at
before update on public.collaboration_leads
for each row
execute function public.set_updated_at();
