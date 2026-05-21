-- 0049 · Project knowledge graph + gated publication management
--
-- Adds normalized project relationship tables for LEAP-style workstreams,
-- activities, contributors, institutional partners, events, and publications.
-- Also standardises publication content types and prepares publication files
-- to be served through application routes instead of public bucket URLs.

-- ─── Roles and publication management helpers ───────────────────────────────

insert into public.roles (role, description)
values (
  'publisher',
  'Can create and manage PATNA publications and publication files without full administrator access.'
)
on conflict (role) do update set
  description = excluded.description;

create or replace function public.current_user_can_manage_publications()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_has_role('administrator')
    or public.current_user_has_role('publisher')
    or public.current_user_is_super_admin();
$$;

-- ─── Standardise publication/content types ──────────────────────────────────

alter table public.content_items
  drop constraint if exists content_items_content_type_check;

alter table public.content_items
  add constraint content_items_content_type_check
  check (
    content_type in (
      'report',
      'brief',
      'case_study',
      'article',
      'workshop_proceedings',
      'blog',
      'news',
      'event_output',
      'learning_note',
      'tool'
    )
  );

-- Give publishers the same publication CRUD access as admins, while keeping
-- project/admin management administrator-only.
drop policy if exists "content_admin_manage" on public.content_items;
create policy "content_publication_manager_manage"
on public.content_items
for all
to authenticated
using (public.current_user_can_manage_publications())
with check (public.current_user_can_manage_publications());

drop policy if exists "content_attachments_admin_manage" on public.content_attachments;
create policy "content_attachments_publication_manager_manage"
on public.content_attachments
for all
to authenticated
using (public.current_user_can_manage_publications())
with check (public.current_user_can_manage_publications());

drop policy if exists "content_tag_map_admin_manage" on public.content_tag_map;
create policy "content_tag_map_publication_manager_manage"
on public.content_tag_map
for all
to authenticated
using (public.current_user_can_manage_publications())
with check (public.current_user_can_manage_publications());

drop policy if exists "content_public_and_member_visibility" on public.content_items;
create policy "content_public_and_member_visibility"
on public.content_items
for select
to anon, authenticated
using (
  (publish_status = 'published' and visibility = 'public')
  or (
    publish_status = 'published'
    and visibility = 'members'
    and auth.role() = 'authenticated'
  )
  or public.current_user_can_manage_publications()
);

drop policy if exists "content_attachments_visibility" on public.content_attachments;
create policy "content_attachments_visibility"
on public.content_attachments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = content_attachments.content_id
      and (
        (content_items.publish_status = 'published' and content_items.visibility = 'public')
        or (
          content_items.publish_status = 'published'
          and content_items.visibility = 'members'
          and auth.role() = 'authenticated'
        )
        or public.current_user_can_manage_publications()
      )
  )
);

drop policy if exists "content_gallery_public_read" on public.content_gallery;
create policy "content_gallery_visibility"
on public.content_gallery
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = content_gallery.content_id
      and (
        (content_items.publish_status = 'published' and content_items.visibility = 'public')
        or (
          content_items.publish_status = 'published'
          and content_items.visibility = 'members'
          and auth.role() = 'authenticated'
        )
        or public.current_user_can_manage_publications()
      )
  )
);

drop policy if exists "content_gallery_admin_manage" on public.content_gallery;
create policy "content_gallery_publication_manager_manage"
on public.content_gallery
for all
to authenticated
using (public.current_user_can_manage_publications())
with check (public.current_user_can_manage_publications());

-- ─── Publication storage: private bucket, app-routed access ─────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'publications',
  'publications',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "publications_public_read" on storage.objects;

drop policy if exists "publications_admin_insert" on storage.objects;
create policy "publications_publication_manager_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'publications'
  and public.current_user_can_manage_publications()
);

drop policy if exists "publications_admin_update" on storage.objects;
create policy "publications_publication_manager_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'publications'
  and public.current_user_can_manage_publications()
)
with check (
  bucket_id = 'publications'
  and public.current_user_can_manage_publications()
);

drop policy if exists "publications_admin_delete" on storage.objects;
create policy "publications_publication_manager_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'publications'
  and public.current_user_can_manage_publications()
);

-- ─── Project base extensions ────────────────────────────────────────────────

alter table public.projects
  add column if not exists short_title text,
  add column if not exists project_code text,
  add column if not exists parent_project_id uuid references public.projects (id) on delete set null,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists geographic_scope text;

create unique index if not exists idx_projects_project_code_unique
  on public.projects (project_code)
  where project_code is not null;

create index if not exists idx_projects_parent_project_id
  on public.projects (parent_project_id)
  where parent_project_id is not null;

alter table public.project_countries
  add column if not exists country_class text
    check (country_class in ('A', 'B', 'C', 'D', 'E')),
  add column if not exists priority_focus text,
  add column if not exists engagement_role text;

-- ─── Canonical institutional partners and external contributors ─────────────

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  acronym text,
  organization_type text not null default 'other'
    check (
      organization_type in (
        'patna',
        'government',
        'intergovernmental',
        'regional_body',
        'research',
        'university',
        'ngo',
        'funder',
        'coalition',
        'private_sector',
        'other'
      )
    ),
  website_url text,
  country_code text,
  country text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (name)
);

create table if not exists public.external_contributors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  email text,
  role_title text,
  organization_id uuid references public.organizations (id) on delete set null,
  organization_name text,
  country text,
  bio text,
  profile_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_external_contributors_organization_id
  on public.external_contributors (organization_id)
  where organization_id is not null;

-- ─── Structured project delivery model ──────────────────────────────────────

create table if not exists public.project_workstreams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  code text,
  title text not null,
  summary text,
  objective text,
  methodology text,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'paused', 'cancelled')),
  starts_on date,
  ends_on date,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, code)
);

create table if not exists public.project_activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workstream_id uuid references public.project_workstreams (id) on delete cascade,
  code text,
  title text not null,
  activity_type text not null default 'other'
    check (
      activity_type in (
        'research',
        'convening',
        'publication',
        'negotiation_support',
        'capacity_building',
        'coordination',
        'fellowship',
        'milestone',
        'other'
      )
    ),
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'paused', 'cancelled')),
  summary text,
  notes text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, code)
);

create table if not exists public.project_contributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workstream_id uuid references public.project_workstreams (id) on delete cascade,
  activity_id uuid references public.project_activities (id) on delete cascade,
  member_profile_id uuid references public.profiles (id) on delete cascade,
  external_contributor_id uuid references public.external_contributors (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  contribution_type text not null default 'other'
    check (
      contribution_type in (
        'lead',
        'technical',
        'policy',
        'coordination',
        'facilitation',
        'research',
        'communications',
        'reviewer',
        'participant',
        'other'
      )
    ),
  role_label text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (member_profile_id is not null and external_contributor_id is null)
    or (member_profile_id is null and external_contributor_id is not null)
  )
);

create table if not exists public.project_organization_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workstream_id uuid references public.project_workstreams (id) on delete cascade,
  activity_id uuid references public.project_activities (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  relationship_type text not null default 'institutional_partner'
    check (
      relationship_type in (
        'lead',
        'research_partner',
        'strategic_partner',
        'funder',
        'implementing_partner',
        'institutional_partner',
        'host',
        'co_organizer',
        'supporter',
        'participant',
        'other'
      )
    ),
  label text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_content_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workstream_id uuid references public.project_workstreams (id) on delete cascade,
  activity_id uuid references public.project_activities (id) on delete cascade,
  content_id uuid not null references public.content_items (id) on delete cascade,
  relationship_type text not null default 'reference'
    check (
      relationship_type in (
        'deliverable',
        'report',
        'brief',
        'tool',
        'evidence',
        'output',
        'reference',
        'planned_product',
        'other'
      )
    ),
  label text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_event_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  workstream_id uuid references public.project_workstreams (id) on delete cascade,
  activity_id uuid references public.project_activities (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  relationship_type text not null default 'participation'
    check (
      relationship_type in (
        'convening',
        'launch',
        'validation',
        'presentation',
        'negotiation_session',
        'participation',
        'output_source',
        'other'
      )
    ),
  label text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_project_workstreams_project_sort
  on public.project_workstreams (project_id, sort_order);
create index if not exists idx_project_activities_project_sort
  on public.project_activities (project_id, sort_order);
create index if not exists idx_project_activities_workstream
  on public.project_activities (workstream_id, sort_order)
  where workstream_id is not null;
create index if not exists idx_project_contributions_project_sort
  on public.project_contributions (project_id, sort_order);
create index if not exists idx_project_contributions_member
  on public.project_contributions (member_profile_id)
  where member_profile_id is not null;
create index if not exists idx_project_org_links_project_sort
  on public.project_organization_links (project_id, sort_order);
create index if not exists idx_project_content_links_project_sort
  on public.project_content_links (project_id, sort_order);
create index if not exists idx_project_event_links_project_sort
  on public.project_event_links (project_id, sort_order);

create trigger set_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

create trigger set_external_contributors_updated_at
before update on public.external_contributors
for each row
execute function public.set_updated_at();

create trigger set_project_workstreams_updated_at
before update on public.project_workstreams
for each row
execute function public.set_updated_at();

create trigger set_project_activities_updated_at
before update on public.project_activities
for each row
execute function public.set_updated_at();

-- ─── Project graph RLS ──────────────────────────────────────────────────────

create or replace function public.project_is_readable(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where projects.id = p_project_id
      and (
        projects.status = 'published'
        or public.current_user_has_role('administrator')
      )
  );
$$;

alter table public.organizations enable row level security;
alter table public.external_contributors enable row level security;
alter table public.project_workstreams enable row level security;
alter table public.project_activities enable row level security;
alter table public.project_contributions enable row level security;
alter table public.project_organization_links enable row level security;
alter table public.project_content_links enable row level security;
alter table public.project_event_links enable row level security;

create policy "organizations_public_read_active"
on public.organizations
for select
to anon, authenticated
using (is_active or public.current_user_has_role('administrator'));

create policy "organizations_admin_manage"
on public.organizations
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "external_contributors_public_read"
on public.external_contributors
for select
to anon, authenticated
using (is_public or public.current_user_has_role('administrator'));

create policy "external_contributors_admin_manage"
on public.external_contributors
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_workstreams_visible"
on public.project_workstreams
for select
to anon, authenticated
using (public.project_is_readable(project_id));

create policy "project_workstreams_admin_manage"
on public.project_workstreams
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_activities_visible"
on public.project_activities
for select
to anon, authenticated
using (public.project_is_readable(project_id));

create policy "project_activities_admin_manage"
on public.project_activities
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_contributions_visible"
on public.project_contributions
for select
to anon, authenticated
using (public.project_is_readable(project_id));

create policy "project_contributions_admin_manage"
on public.project_contributions
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_organization_links_visible"
on public.project_organization_links
for select
to anon, authenticated
using (public.project_is_readable(project_id));

create policy "project_organization_links_admin_manage"
on public.project_organization_links
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_content_links_visible"
on public.project_content_links
for select
to anon, authenticated
using (public.project_is_readable(project_id));

create policy "project_content_links_admin_manage"
on public.project_content_links
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_event_links_visible"
on public.project_event_links
for select
to anon, authenticated
using (public.project_is_readable(project_id));

create policy "project_event_links_admin_manage"
on public.project_event_links
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

-- ─── LEAP canonical organizations ───────────────────────────────────────────

insert into public.organizations (
  name,
  slug,
  acronym,
  organization_type,
  country,
  description
)
values
  ('PATNA Initiative', 'patna-initiative', 'PATNA', 'patna', null, 'Professional African Technical Network Advisory and secretariat for African maritime decarbonisation coordination.'),
  ('UCL Energy Institute', 'ucl-energy-institute', 'UCL EI', 'research', 'United Kingdom', 'Technical research partner across the LEAP project series.'),
  ('International Maritime Organization', 'international-maritime-organization', 'IMO', 'intergovernmental', 'United Kingdom', 'United Nations specialized agency and primary negotiation forum for shipping decarbonisation.'),
  ('Association of African Maritime Administrations', 'association-of-african-maritime-administrations', 'AAMA', 'regional_body', null, 'Regional maritime administration association supporting African maritime coordination.'),
  ('Maritime Organization of West and Central Africa', 'maritime-organization-of-west-and-central-africa', 'MOWCA', 'regional_body', null, 'Regional maritime organization engaged in West and Central African maritime policy coordination.'),
  ('African Maritime Advisory Group', 'african-maritime-advisory-group', 'AMAG', 'coalition', null, 'African maritime advisory and coordination partner.'),
  ('Government of Senegal', 'government-of-senegal', null, 'government', 'Senegal', 'Host and strategic partner for the Dakar Maritime Decarbonisation Workshop.'),
  ('ORCA Africa', 'orca-africa', 'ORCA', 'funder', null, 'Programme/funding channel supporting Phase III implementation.'),
  ('United Nations Foundation', 'united-nations-foundation', 'UNF', 'funder', 'United States', 'Partner and funding-facilitation channel for maritime decarbonisation work.'),
  ('Climate Champions Team', 'climate-champions-team', 'CCT', 'ngo', null, 'Non-state partner connected to LEAP Phase I policy support.'),
  ('University of Nairobi', 'university-of-nairobi', null, 'university', 'Kenya', 'In-region academic partner in LEAP Phase I.'),
  ('University of Liberia', 'university-of-liberia', null, 'university', 'Liberia', 'In-region academic partner in LEAP Phase I.'),
  ('University of Lagos', 'university-of-lagos', null, 'university', 'Nigeria', 'In-region academic partner in LEAP Phase I.'),
  ('Namibia University of Science and Technology', 'namibia-university-of-science-and-technology', 'NUST', 'university', 'Namibia', 'In-region academic partner in LEAP Phase I.'),
  ('University of Malawi', 'university-of-malawi', null, 'university', 'Malawi', 'In-region academic partner in LEAP Phase I.'),
  ('MTCC Africa', 'mtcc-africa', 'MTCC Africa', 'regional_body', null, 'Maritime technology cooperation centre and LEAP network partner.'),
  ('Food and Agriculture Organization consultants', 'fao-consultants', 'FAO', 'intergovernmental', null, 'Consultants contributing socioeconomic and food-security analysis in Phase II.'),
  ('6PAC', 'six-pac', '6PAC', 'coalition', null, 'Pacific and Caribbean technical exchange partner for ACP+ coordination.')
on conflict (slug) do update set
  acronym = excluded.acronym,
  organization_type = excluded.organization_type,
  country = excluded.country,
  description = excluded.description,
  updated_at = timezone('utc', now());

-- ─── LEAP project metadata, workstreams, typologies, and links ──────────────

update public.projects
set
  short_title = 'LEAP Phase I',
  project_code = 'LEAP-I',
  start_date = coalesce(start_date, date '2024-06-01'),
  end_date = coalesce(end_date, date '2025-02-28'),
  geographic_scope = 'Six African case-study countries',
  period_label = coalesce(period_label, 'Mid-2024 – Early 2025')
where slug = 'leap-phase-i';

update public.projects
set
  short_title = 'LEAP Phase II',
  project_code = 'LEAP-II',
  start_date = coalesce(start_date, date '2025-01-01'),
  end_date = coalesce(end_date, date '2026-12-31'),
  geographic_scope = 'Pan-African, including Francophone expansion',
  period_label = coalesce(period_label, 'Early 2025 – 2026')
where slug = 'leap-phase-ii';

update public.projects
set
  short_title = 'LEAP Phase III',
  project_code = 'LEAP-III',
  start_date = coalesce(start_date, date '2026-01-01'),
  end_date = coalesce(end_date, date '2026-12-31'),
  geographic_scope = 'Continental Africa with ACP+ inter-regional exchange',
  period_label = coalesce(period_label, 'January – December 2026')
where slug = 'patna-phase-iii-2026';

update public.projects child
set parent_project_id = parent.id
from public.projects parent
where child.slug in ('leap-phase-i', 'leap-phase-ii', 'patna-phase-iii-2026')
  and parent.slug = 'patna-phase-iii-2026'
  and child.slug <> parent.slug
  and child.parent_project_id is null;

insert into public.project_workstreams (
  project_id,
  code,
  title,
  summary,
  objective,
  methodology,
  status,
  sort_order
)
select p.id, ws.code, ws.title, ws.summary, ws.objective, ws.methodology, ws.status, ws.sort_order
from public.projects p
cross join (
  values
    ('WS1', 'National Shipping Emission Inventories', 'Country-level inventories for Ghana, Nigeria, Namibia, Malawi, Kenya, and Liberia.', 'Create first-generation national maritime emissions evidence for African delegations.', 'Port call data and AIS records were consolidated into country-specific inventory reports and spreadsheets.', 'completed', 10),
    ('WS2', 'Economic Potential & Investment Opportunity Analysis', 'Assessment of transition potential, barriers, investment opportunities, and revenue implications.', 'Map in-region strengths, weaknesses, and investment opportunities for shipping decarbonisation.', 'Literature review, in-country expertise, and concise regional synthesis.', 'completed', 20),
    ('WS3', 'Interpretation of Global Models', 'Africa-centred interpretation of DNV/UNCTAD Comprehensive Impact Assessment findings.', 'Translate complex global modelling into usable policy briefs for negotiators.', 'Policy translation and targeted interpretation for the six case countries.', 'completed', 30),
    ('WS4', 'Case Studies on Economic Impact of IMO Measures', 'Commodity case studies applying four IMO policy scenarios across six countries.', 'Estimate vessel-side and cargo-side cost exposure for priority import and export commodities.', 'Scenario modelling using candidate IMO measures and ship speed assumptions.', 'completed', 40),
    ('WSA', 'Landscape Analysis & Network Mapping', 'Mapping of African networks, policies, institutions, and partner strategies ahead of MEPC cycles.', 'Strengthen the political and institutional network around African IMO participation.', 'Stakeholder mapping, partner strategy, and coordinated policy support.', 'completed', 50),
    ('WSB', 'In-Region Convening & Network Building', 'Workshops and consultations across case-study states.', 'Validate data, build consensus, and connect regulators, universities, and industry stakeholders.', 'In-country workshops and consultation-based validation.', 'completed', 60)
) as ws(code, title, summary, objective, methodology, status, sort_order)
where p.slug = 'leap-phase-i'
on conflict (project_id, code) do update set
  title = excluded.title,
  summary = excluded.summary,
  objective = excluded.objective,
  methodology = excluded.methodology,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.project_workstreams (
  project_id,
  code,
  title,
  summary,
  objective,
  methodology,
  status,
  sort_order
)
select p.id, ws.code, ws.title, ws.summary, ws.objective, ws.methodology, ws.status, ws.sort_order
from public.projects p
cross join (
  values
    ('WSA', 'Diplomatic Capacity Building', 'Secretariat formalisation, Francophone workshop delivery, and multilingual LEAP materials.', 'Deepen Africa''s diplomatic readiness and reduce linguistic participation barriers.', 'Regional convenings, translation, and structured negotiation support.', 'completed', 10),
    ('WSB', 'Policy & Technical Analysis', 'Socioeconomic analysis, Francophone technical studies, and ports readiness feasibility work.', 'Build evidence for just transition finance, port readiness, and African-focused policy positions.', 'Partner-led analysis, technical replication, and budget proposal development.', 'active', 20),
    ('WSC', 'Regional & International Engagement', 'Representation at Abuja, ACS2, AAMA, MEPC/ES.2, ISWG-GHG, and COP30.', 'Integrate maritime decarbonisation into wider African climate and development narratives.', 'Event participation, session facilitation, and delegate support.', 'active', 30),
    ('WSD', 'Sustainable Institutional Development', 'PATNA NGO registration, governance, regional coordinators, and fundraising capability.', 'Move PATNA from project network to durable institutional home.', 'Secretariat development, governance design, and funding pipeline work.', 'active', 40)
) as ws(code, title, summary, objective, methodology, status, sort_order)
where p.slug = 'leap-phase-ii'
on conflict (project_id, code) do update set
  title = excluded.title,
  summary = excluded.summary,
  objective = excluded.objective,
  methodology = excluded.methodology,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.project_workstreams (
  project_id,
  code,
  title,
  summary,
  objective,
  methodology,
  status,
  sort_order
)
select p.id, ws.code, ws.title, ws.summary, ws.objective, ws.methodology, ws.status, ws.sort_order
from public.projects p
cross join (
  values
    ('WS1', 'Continental Technical Coordination & IMO Negotiation Support', 'Africa-wide coordination rhythm and rapid-response negotiator support system.', 'Deliver technical packs, speaking notes, submission support, and ACP+ exchange ahead of IMO cycles.', 'Cycle-anchored coordination with 72-hour rapid-response briefs and buddy-system exchange.', 'active', 10),
    ('WS2', 'Africa-Wide NZF Evidence & Modelling Package', 'Four NZF modules covering affordability, typology, reward design, and fund governance.', 'Create Africa-specific technical and economic evidence for confident negotiating positions.', 'Evidence modules validated with countries and RECs, then packaged into briefs and submission-ready text.', 'active', 20),
    ('WS3', 'Port Readiness Feasibility & Investable Pipeline Scoping', 'Port and corridor case studies, roadmaps, and a readiness toolkit.', 'Translate NZF outcomes into financeable African port and corridor priorities.', 'Transparent case-study selection, feasibility analysis, and toolkit synthesis.', 'planned', 30),
    ('WS4', 'Fellowship, Coaching & Negotiation Capacity Building', 'Recruitment, training, mentoring, and deployment of PATNA fellows into delegation support roles.', 'Build a sustained bench of African technical negotiation capacity.', 'Training modules, embedded support, mentoring logs, and quarterly evaluation.', 'planned', 40),
    ('WS5', 'Resource Mobilisation & Delegation Capacity Sustainability', 'Fundraising pack, partnership pipeline, multilingual knowledge products, and engagement rhythms.', 'Secure sustained capacity and funding beyond 2028.', 'Pipeline tracking, proposal packaging, partnership development, and multilingual outreach.', 'planned', 50)
) as ws(code, title, summary, objective, methodology, status, sort_order)
where p.slug = 'patna-phase-iii-2026'
on conflict (project_id, code) do update set
  title = excluded.title,
  summary = excluded.summary,
  objective = excluded.objective,
  methodology = excluded.methodology,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.project_activities (
  project_id,
  workstream_id,
  code,
  title,
  activity_type,
  status,
  summary,
  location,
  starts_at,
  ends_at,
  sort_order
)
select p.id, ws.id, a.code, a.title, a.activity_type, a.status, a.summary, a.location, a.starts_at::timestamptz, a.ends_at::timestamptz, a.sort_order
from public.projects p
cross join (
  values
    ('WS1', '2026-CYCLE-1', 'Cycle 1 Africa pack', 'negotiation_support', 'planned', 'Coordination pack ahead of ISWG-GHG 21 and MEPC 84.', 'London, UK', '2026-04-01', '2026-05-01', 10),
    ('WS2', 'NZF-MODULE-1', 'NZF impact assessment for Africa', 'research', 'planned', 'Affordability and food-security impact assessment module.', null, '2026-03-01', '2026-06-30', 20),
    ('WS2', 'TYPOLOGY-V1', 'Africa country typology and inventory tool v1', 'research', 'planned', 'Class-type typology and baseline inventory tool for African countries.', null, '2026-05-01', '2026-06-30', 30),
    ('WS3', 'PORT-CASE-STUDIES', 'Port readiness case study drafting', 'research', 'planned', 'Two to three port and corridor studies with investable roadmaps.', null, '2026-07-01', '2026-10-31', 40),
    ('WS4', 'FELLOWS-ONBOARDING', 'PATNA fellows onboarding', 'fellowship', 'planned', 'Recruitment and onboarding of at least five fellows.', null, '2026-05-01', '2026-06-30', 50),
    ('WS5', 'FUNDRAISING-PACK', 'Fundraising pack suite v1', 'coordination', 'planned', 'Proposal and partnership materials for sustained capacity beyond 2028.', null, '2026-07-01', '2026-11-30', 60)
) as a(workstream_code, code, title, activity_type, status, summary, location, starts_at, ends_at, sort_order)
join public.project_workstreams ws on ws.project_id = p.id and ws.code = a.workstream_code
where p.slug = 'patna-phase-iii-2026'
on conflict (project_id, code) do update set
  workstream_id = excluded.workstream_id,
  title = excluded.title,
  activity_type = excluded.activity_type,
  status = excluded.status,
  summary = excluded.summary,
  location = excluded.location,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

insert into public.project_organization_links (
  project_id,
  workstream_id,
  organization_id,
  relationship_type,
  label,
  sort_order
)
select p.id, null, o.id, link.relationship_type, link.label, link.sort_order
from public.projects p
join (
  values
    ('leap-phase-i', 'patna-initiative', 'lead', 'Lead organisation', 10),
    ('leap-phase-i', 'ucl-energy-institute', 'research_partner', 'Research partner', 20),
    ('leap-phase-i', 'university-of-nairobi', 'institutional_partner', 'In-region partner', 30),
    ('leap-phase-i', 'university-of-liberia', 'institutional_partner', 'In-region partner', 40),
    ('leap-phase-i', 'university-of-lagos', 'institutional_partner', 'In-region partner', 50),
    ('leap-phase-i', 'namibia-university-of-science-and-technology', 'institutional_partner', 'In-region partner', 60),
    ('leap-phase-i', 'university-of-malawi', 'institutional_partner', 'In-region partner', 70),
    ('leap-phase-i', 'mtcc-africa', 'institutional_partner', 'In-region partner', 80),
    ('leap-phase-ii', 'patna-initiative', 'lead', 'Lead organisation and secretariat', 10),
    ('leap-phase-ii', 'ucl-energy-institute', 'research_partner', 'Research partner', 20),
    ('leap-phase-ii', 'association-of-african-maritime-administrations', 'strategic_partner', 'Strategic partner', 30),
    ('leap-phase-ii', 'maritime-organization-of-west-and-central-africa', 'strategic_partner', 'Strategic partner', 40),
    ('leap-phase-ii', 'government-of-senegal', 'host', 'Dakar host government', 50),
    ('leap-phase-ii', 'international-maritime-organization', 'strategic_partner', 'IMO context and engagement', 60),
    ('patna-phase-iii-2026', 'patna-initiative', 'lead', 'Secretariat and delivery lead', 10),
    ('patna-phase-iii-2026', 'ucl-energy-institute', 'research_partner', 'Lead technical partner', 20),
    ('patna-phase-iii-2026', 'orca-africa', 'funder', 'Programme/funder channel', 30),
    ('patna-phase-iii-2026', 'united-nations-foundation', 'funder', 'UNF-facilitated co-funding channel', 40),
    ('patna-phase-iii-2026', 'six-pac', 'strategic_partner', 'ACP+ exchange partner', 50)
) as link(project_slug, org_slug, relationship_type, label, sort_order)
  on link.project_slug = p.slug
join public.organizations o on o.slug = link.org_slug
where not exists (
  select 1
  from public.project_organization_links existing
  where existing.project_id = p.id
    and existing.organization_id = o.id
    and existing.relationship_type = link.relationship_type
    and existing.workstream_id is null
    and existing.activity_id is null
);

update public.project_countries
set
  country_class = class_map.country_class,
  priority_focus = class_map.priority_focus,
  engagement_role = class_map.engagement_role
from public.projects p
join (
  values
    ('Mauritius', 'A', 'Coastal vulnerability lens; equitable transition safeguards; resilience in NZF discussions', 'example country typology'),
    ('São Tomé & Príncipe', 'A', 'Coastal vulnerability lens; equitable transition safeguards; resilience in NZF discussions', 'example country typology'),
    ('Seychelles', 'A', 'Coastal vulnerability lens; equitable transition safeguards; resilience in NZF discussions', 'example country typology'),
    ('DRC', 'B', 'Affordability, access to finance, implementation readiness, revenue-use pipelines', 'development-constrained country typology'),
    ('Ethiopia', 'B', 'Affordability, access to finance, implementation readiness, revenue-use pipelines', 'development-constrained country typology'),
    ('Malawi', 'B', 'Affordability, access to finance, implementation readiness, revenue-use pipelines', 'development-constrained country typology'),
    ('The Gambia', 'B', 'Affordability, access to finance, implementation readiness, revenue-use pipelines', 'development-constrained country typology'),
    ('Senegal', 'B', 'Affordability, access to finance, implementation readiness, revenue-use pipelines', 'development-constrained country typology'),
    ('Tanzania', 'B', 'Affordability, access to finance, implementation readiness, revenue-use pipelines', 'development-constrained country typology'),
    ('Togo', 'B', 'Affordability, access to finance, implementation readiness, revenue-use pipelines', 'development-constrained country typology'),
    ('Kenya', 'C', 'Minimising transport cost increases, freight connectivity, predictable compliance design', 'trade-sensitive country typology'),
    ('Ghana', 'C', 'Minimising transport cost increases, freight connectivity, predictable compliance design', 'trade-sensitive country typology'),
    ('Nigeria', 'D', 'Managed transition, industrial diversification, ZNZ fuel/port energy investment pathways', 'hydrocarbon-dependent country typology'),
    ('Angola', 'D', 'Managed transition, industrial diversification, ZNZ fuel/port energy investment pathways', 'hydrocarbon-dependent country typology'),
    ('Namibia', 'E', 'Food-security-informed NZF design; mitigation of second-order price impacts', 'net food-importing vulnerable state typology')
) as class_map(country, country_class, priority_focus, engagement_role)
  on true
where project_countries.project_id = p.id
  and p.slug = 'patna-phase-iii-2026'
  and project_countries.country = class_map.country;

insert into public.project_event_links (
  project_id,
  event_id,
  relationship_type,
  label,
  sort_order
)
select p.id, e.id, link.relationship_type, link.label, link.sort_order
from public.projects p
join (
  values
    ('leap-phase-i', 'african-strategic-summit-abuja-2025', 'presentation', 'Phase I evidence presented; Phase II launched', 10),
    ('leap-phase-ii', 'african-strategic-summit-abuja-2025', 'convening', 'African Strategic Summit on Shipping Decarbonisation', 10),
    ('leap-phase-ii', 'dakar-maritime-decarbonisation-workshop', 'convening', 'Dakar Maritime Decarbonisation Workshop', 20),
    ('leap-phase-ii', 'africa-climate-summit-ii-2025', 'participation', 'PATNA at Africa Climate Summit II', 30),
    ('patna-phase-iii-2026', 'iswg-ghg-21', 'negotiation_session', 'ISWG-GHG 21 planned participation', 10),
    ('patna-phase-iii-2026', 'mepc-84-marine-environment-protection-committee-84th-session', 'negotiation_session', 'MEPC 84 planned participation', 20),
    ('patna-phase-iii-2026', 'our-ocean-conference-2026', 'participation', 'Our Ocean Conference 2026 planned participation', 30),
    ('patna-phase-iii-2026', 'iswg-ghg-22', 'negotiation_session', 'ISWG-GHG 22 planned participation', 40),
    ('patna-phase-iii-2026', 'mepc-85-marine-environment-protection-committee-85th-session', 'negotiation_session', 'MEPC 85 planned participation', 50)
) as link(project_slug, event_slug, relationship_type, label, sort_order)
  on link.project_slug = p.slug
join public.events e on e.slug = link.event_slug
where not exists (
  select 1
  from public.project_event_links existing
  where existing.project_id = p.id
    and existing.event_id = e.id
    and existing.relationship_type = link.relationship_type
);

insert into public.project_content_links (
  project_id,
  content_id,
  relationship_type,
  label,
  sort_order
)
select p.id, c.id, link.relationship_type, link.label, link.sort_order
from public.projects p
join (
  values
    ('leap-phase-i', 'Ghana''s International Shipping Emissions Inventory Report', 'report', 'Ghana Case Study Report', 10),
    ('leap-phase-i', 'An Africa-centric analysis of the UNCTAD Comprehensive Impact Assessment of candidate GHG reduction mid-term measures', 'report', 'LEAP I Study Report', 20),
    ('leap-phase-i', 'Complementary Quantitative Stakeholders'' Analysis: The Case Study of Malawi', 'report', 'Malawi Case Study Report', 30),
    ('leap-phase-i', 'Impact Assessment of the IMO candidate mid-term GHG reduction measures — Nigeria Case Study', 'report', 'Nigeria Case Study Report', 40),
    ('leap-phase-i', 'Impact Assessment: Liberia Case Study', 'report', 'Liberia Case Study Report', 50),
    ('leap-phase-i', 'Complementary Quantitative Stakeholders'' Analysis: The Case Study of Namibia', 'report', 'Namibia Case Study Report', 60),
    ('leap-phase-ii', 'Abuja Summit Report: African Strategic Summit on Shipping Decarbonisation', 'planned_product', 'Abuja Summit Report', 10),
    ('leap-phase-ii', 'Dakar Workshop Report: Advancing Africa''s Maritime Sector to Net-Zero', 'planned_product', 'Dakar Workshop Report', 20),
    ('leap-phase-ii', 'Report of MEPC/ES.2 (2nd Extraordinary Session)', 'report', 'MEPC/ES.2 meeting report', 30),
    ('leap-phase-ii', 'The Path to Maritime Net-Zero (ISWG-GHG 20 Readout)', 'brief', 'ISWG-GHG 20 Readout', 40),
    ('patna-phase-iii-2026', 'NZF Impact Assessment for Africa', 'planned_product', 'NZF Impact Assessment for Africa', 10),
    ('patna-phase-iii-2026', 'Africa Country Typology v1 + Baseline Emissions Inventory Tool', 'planned_product', 'Typology and inventory tool', 20),
    ('patna-phase-iii-2026', 'ZNZ Reward Design Options for Africa', 'planned_product', 'ZNZ options paper', 30),
    ('patna-phase-iii-2026', 'Just Transition Fund Governance & Revenue-Use Principles', 'planned_product', 'Fund governance brief', 40),
    ('patna-phase-iii-2026', 'Port Readiness Toolkit v1', 'planned_product', 'Port readiness toolkit', 50)
) as link(project_slug, content_title, relationship_type, label, sort_order)
  on link.project_slug = p.slug
join public.content_items c on lower(c.title) = lower(link.content_title)
where not exists (
  select 1
  from public.project_content_links existing
  where existing.project_id = p.id
    and existing.content_id = c.id
    and existing.relationship_type = link.relationship_type
);
