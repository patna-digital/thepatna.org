alter table public.content_items
add column if not exists created_by_user_id uuid references public.profiles (id) on delete set null,
add column if not exists updated_by_user_id uuid references public.profiles (id) on delete set null;

update public.content_items
set created_by_user_id = coalesce(created_by_user_id, author_id),
    updated_by_user_id = coalesce(updated_by_user_id, author_id)
where author_id is not null
  and (created_by_user_id is null or updated_by_user_id is null);

alter table public.events
add column if not exists created_by_user_id uuid references public.profiles (id) on delete set null,
add column if not exists updated_by_user_id uuid references public.profiles (id) on delete set null,
add column if not exists display_date text,
add column if not exists schedule_status text not null default 'tbc'
  check (schedule_status in ('past', 'upcoming', 'tbc')),
add column if not exists organising_institutions text[] not null default '{}',
add column if not exists patna_involvement text,
add column if not exists themes text[] not null default '{}',
add column if not exists official_link text;

update public.events
set display_date = case
    when starts_at is not null and ends_at is not null and starts_at::date <> ends_at::date
      then to_char(starts_at at time zone 'utc', 'DD Month YYYY') || ' to ' || to_char(ends_at at time zone 'utc', 'DD Month YYYY')
    when starts_at is not null
      then to_char(starts_at at time zone 'utc', 'DD Month YYYY')
    else display_date
  end
where display_date is null;

update public.events
set schedule_status = case
    when starts_at is not null and starts_at < timezone('utc', now()) then 'past'
    when starts_at is not null and starts_at >= timezone('utc', now()) then 'upcoming'
    else 'tbc'
  end
where schedule_status is null or schedule_status = 'tbc';

create index if not exists idx_events_schedule_status on public.events (schedule_status, starts_at);
create index if not exists idx_events_created_by_user_id on public.events (created_by_user_id);
create index if not exists idx_events_updated_by_user_id on public.events (updated_by_user_id);
create index if not exists idx_content_items_created_by_user_id on public.content_items (created_by_user_id);
create index if not exists idx_content_items_updated_by_user_id on public.content_items (updated_by_user_id);
