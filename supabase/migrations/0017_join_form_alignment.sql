alter table public.community_applications
  add column if not exists phone_number text,
  add column if not exists submitted_at timestamptz,
  add column if not exists source text,
  add column if not exists assigned_cohort_id uuid references public.cohorts (id) on delete set null,
  add column if not exists expertise_slugs text[] not null default '{}',
  add column if not exists expertise_other_text text,
  add column if not exists engagement_slugs text[] not null default '{}',
  add column if not exists engagement_other_text text,
  add column if not exists consent_data_storage boolean,
  add column if not exists consent_updates boolean;

update public.community_applications
set
  submitted_at = coalesce(submitted_at, created_at),
  source = coalesce(source, 'patna_web_form')
where submitted_at is null or source is null;

alter table public.community_applications
  alter column submitted_at set default timezone('utc', now()),
  alter column submitted_at set not null,
  alter column source set default 'patna_web_form',
  alter column source set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_applications_source_check'
  ) then
    alter table public.community_applications
      add constraint community_applications_source_check
      check (source in ('patna_web_form', 'wpforms_import'));
  end if;
end $$;

create index if not exists idx_community_applications_email_lower
  on public.community_applications (lower(submitted_by_email));

create index if not exists idx_community_applications_assigned_cohort_id
  on public.community_applications (assigned_cohort_id);
