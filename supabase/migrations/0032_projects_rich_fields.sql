-- ─────────────────────────────────────────────────────────────────────────────
-- 0032 · Rich fields for the projects table + community workspace link
-- Adds all fields required by the redesigned /projects marketing page,
-- individual project detail pages, and admin CRUD.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend the projects table ─────────────────────────────────────────────────

alter table public.projects
  -- Page section classification (determines card layout zone)
  add column if not exists section text not null default 'other'
    check (section in ('flagship', 'convening', 'other')),

  -- Work-type classification (what kind of project this is)
  add column if not exists project_type text
    check (project_type in ('flagship_programme', 'convening', 'technical_analysis', 'capacity_building')),

  -- Display labels (editorial, not linked to status enum)
  add column if not exists status_label   text,    -- "Active", "Completed", "Upcoming", "Ongoing"
  add column if not exists period_label   text,    -- "2025 – ongoing", "1–2 March 2025 · Abuja"
  add column if not exists partner_line   text,    -- "In partnership with UCL Energy Institute · Supported by MOWCA"
  add column if not exists external_url   text,    -- link to thepatna.org or external project page

  -- Rich content arrays stored as jsonb (display strings, not taxonomy references)
  add column if not exists deliverables jsonb not null default '[]'::jsonb,
  add column if not exists tags         jsonb not null default '[]'::jsonb,

  -- Small card icon selector (for convening/other cards)
  add column if not exists icon_type text,    -- globe | team | layers | calendar | chart | check

  -- Editorial ordering within sections
  add column if not exists sort_order integer not null default 0,

  -- Community workspace link — FK on projects, not spaces (spaces are community-owned)
  add column if not exists linked_space_id uuid
    references public.spaces (id) on delete set null,

  -- Cover image (mirrors content_items pattern)
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text;

-- 2. New table: project_countries ─────────────────────────────────────────────
-- Separate table rather than jsonb so countries carry phase labels and sort
-- order, and so future features (country filtering, SVG map) can query cleanly.

create table if not exists public.project_countries (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  country     text not null,
  phase_label text,           -- "Phase I", "Phase II"
  sort_order  integer not null default 0,
  created_at  timestamptz not null default timezone('utc', now()),
  unique (project_id, country)
);

-- 3. Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_projects_section_sort
  on public.projects (status, section, sort_order);

create index if not exists idx_projects_linked_space
  on public.projects (linked_space_id)
  where linked_space_id is not null;

create index if not exists idx_project_countries_project_id
  on public.project_countries (project_id);

-- 4. RLS for project_countries ─────────────────────────────────────────────────

alter table public.project_countries enable row level security;

create policy "project_countries_public_read"
  on public.project_countries
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_countries.project_id
        and (projects.status = 'published'
             or public.current_user_has_role('administrator'))
    )
  );

create policy "project_countries_admin_manage"
  on public.project_countries
  for all
  to authenticated
  using (public.current_user_has_role('administrator'))
  with check (public.current_user_has_role('administrator'));

-- 5. Seed projects ─────────────────────────────────────────────────────────────
-- Idempotent: ON CONFLICT (slug) DO UPDATE preserves the id and created_at.
-- The three rows already in patna-data.js are seeded here and enriched;
-- five new rows covering the convenings section are also added.

insert into public.projects
  (title, slug, summary, status, featured, section, project_type,
   status_label, period_label, partner_line, external_url,
   deliverables, tags, sort_order)
values
  -- ── Flagship: Phase III 2026 ──────────────────────────────────────────────
  (
    '2026 Shipping Decarbonisation Africa Regional Workplan',
    'patna-phase-iii-2026',
    'PATNA''s active 2026 programme with UCL, coordinating six working groups across evidence, diplomacy, port readiness, and implementation. Five structured workstreams with Key Results tied to IMO outcome timelines through 2028.',
    'published', true,
    'flagship', 'flagship_programme',
    'Active', '2026 – ongoing',
    'In partnership with UCL Energy Institute · Supported by MOWCA, AAMA, AMAG',
    null,
    '["Six active working groups across diplomacy, evidence, port readiness, and capacity building","UCL Energy Institute as technical research backbone","Explicit Key Results horizon through 2028","Resource mobilisation and PATNA institutional sustainability workstream","Fellowship Programme and Data Platform launching 2026","Multilingual outputs in English, French, Portuguese, and Arabic"]'::jsonb,
    '["5 workstreams","UCL partnership","KR-linked","2028 horizon","Multilingual outputs"]'::jsonb,
    10
  ),
  -- ── Flagship: LEAP Phase II ───────────────────────────────────────────────
  (
    'Leading Effective Afrocentric Participation (LEAP) — Phase II',
    'leap-phase-ii',
    'LEAP Phase II marks a decisive shift from supporting six countries to building a continent-wide, evidence-based coalition. Delivers the permanent PATNA secretariat, 19-country engagement, and the technical tools African delegations need to shape IMO guidelines, fund governance, and reward mechanisms for net-zero shipping.',
    'published', false,
    'flagship', 'flagship_programme',
    'Completed', '2025',
    'In partnership with UCL Energy Institute · Supported by MOWCA, AAMA, AMAG',
    'https://thepatna.org/projects/leading-effective-afrocentric-participation-leap-phase-ii/',
    '["Socioeconomic impact analysis — quantifying NZF effects on food security, trade, and GDP across 19 African nations","Ports readiness feasibility study — assessing Africa''s 50+ major ports for green shipping transition","Revenue readiness budget — a concrete proposal for African states in Just Transition Fund negotiations","Permanent PATNA secretariat — institutionalised hub for African maritime climate expertise","Strategic negotiating toolkit — briefings and evidence packages for IMO delegations","French and Portuguese translations of all key outputs, operationalising language justice"]'::jsonb,
    '["Socioeconomic modelling","Ports infrastructure","Just transition","19 countries","Multilingual outputs"]'::jsonb,
    20
  ),
  -- ── Flagship: LEAP Phase I ────────────────────────────────────────────────
  (
    'Leading Effective Afrocentric Participation (LEAP) — Phase I',
    'leap-phase-i',
    'LEAP Phase I laid the analytical and institutional foundations for African leadership in maritime decarbonisation. Working with six case study countries, the project produced the first independent, Africa-generated evidence base for IMO negotiations — equipping delegations to shift from reactive to proactive engagement at the IMO.',
    'published', false,
    'flagship', 'flagship_programme',
    'Completed', '2023 – 2024',
    'In partnership with UCL Energy Institute · PI: Dr Dola Oluteye · Co-PI: Prof. Tristan Smith',
    'https://thepatna.org/projects/leading-effective-afrocentric-participation-leap-project-phase-i/',
    '["Six national shipping GHG emissions inventories (Nigeria, Ghana, Liberia, Malawi, Namibia, Kenya)","Country-specific economic potential and transition readiness assessments","Comprehensive Impact Assessment (CIA) analysis for each case country","Independent cost-impact case studies on IMO mid-term measures","Pan-African landscape analysis and stakeholder mapping report","First Afrocentric in-region convening — establishing the coalition for PATNA"]'::jsonb,
    '["Emissions inventories","CIA analysis","6 case countries","Network building"]'::jsonb,
    30
  ),
  -- ── Convening: Dakar Francophone Regional Workshop ────────────────────────
  (
    'Dakar Francophone Regional Workshop',
    'dakar-francophone-workshop-2025',
    'PATNA''s formal public launch. Over 100 participants from 25 African IMO Member States gathered for three days of high-level panels on the IMO Net Zero Framework, climate financing, and just transition. Delivered in English, French, Portuguese, and Arabic. The Workshop adopted 15 resolutions to guide Africa''s engagement at MEPC 84.',
    'published', false,
    'convening', 'convening',
    'Completed', '4–6 August 2025 · Dakar, Senegal',
    'Co-organised with Government of Senegal, MOWCA, AAMA, AMAG, MOESNA, IMO',
    null,
    '[]'::jsonb,
    '["25 member states","15 resolutions","Multilingual","PATNA launch"]'::jsonb,
    10
  ),
  -- ── Convening: African Strategic Summit ───────────────────────────────────
  (
    'African Strategic Summit on Shipping Decarbonisation',
    'african-strategic-summit-abuja-2025',
    'The Abuja Summit convened African maritime policymakers, negotiators, and industry leaders to build a unified continental position on shipping decarbonisation. A key milestone in LEAP Phase II, the Summit strengthened negotiation capacity and reinforced the link between regional alignment and effective influence at global IMO processes.',
    'published', false,
    'convening', 'convening',
    'Completed', '1–2 March 2025 · Abuja, Nigeria',
    'A LEAP Phase II convening milestone',
    null,
    '[]'::jsonb,
    '["Negotiation capacity","Regional alignment","Policy leadership"]'::jsonb,
    20
  ),
  -- ── Convening: ACS2 ───────────────────────────────────────────────────────
  (
    'Africa Climate Summit II (ACS2)',
    'africa-climate-summit-ii-2025',
    'Under the theme "Accelerating Global Climate Solutions: Financing for Africa''s Resilient and Green Development," PATNA co-facilitated two sessions in the Africa Ocean-Climate Solutions Pavilion — reframing maritime decarbonisation as a question of African industrialisation, resilience, and just transition.',
    'published', false,
    'convening', 'convening',
    'Completed', '8–10 September 2025 · Addis Ababa, Ethiopia',
    'PATNA co-facilitated the Africa Ocean-Climate Solutions Pavilion',
    null,
    '[]'::jsonb,
    '["Ocean-climate nexus","Just transition","Climate finance"]'::jsonb,
    30
  ),
  -- ── Convening: Town Hall ──────────────────────────────────────────────────
  (
    'PATNA End-of-Year Town Hall',
    'patna-town-hall-december-2025',
    'PATNA''s inaugural member-driven consultative forum. Live polling and breakout discussions mapped Africa''s priorities for the NZF, identified key evidence gaps, and co-designed the 2026 programme of work. Members spanning the continent and diaspora confirmed regional coordination as the highest-priority capacity gap.',
    'published', false,
    'convening', 'convening',
    'Completed', '18 December 2025 · Virtual',
    null,
    null,
    '[]'::jsonb,
    '["Member consultation","2026 planning","NZF analysis"]'::jsonb,
    40
  ),
  -- ── Convening: IMO MEPC Engagement ───────────────────────────────────────
  (
    'IMO MEPC & ISWG-GHG Technical Engagement',
    'imo-mepc-iswg-ghg-engagement',
    'Throughout 2024–2025, PATNA provided sustained technical support to African delegations at IMO MEPC sessions and ISWG-GHG intersessional working groups. This includes preparation of briefings, analysis of regulatory proposals, and translation of complex technical debates into decision-ready intelligence for national capitals.',
    'published', false,
    'convening', 'convening',
    'Ongoing', '2024 – present · IMO, London',
    'Ongoing through MEPC 84 and beyond',
    null,
    '[]'::jsonb,
    '["IMO submissions","Delegation support","Policy briefings"]'::jsonb,
    50
  )
on conflict (slug) do update set
  section       = excluded.section,
  project_type  = excluded.project_type,
  status_label  = excluded.status_label,
  period_label  = excluded.period_label,
  partner_line  = excluded.partner_line,
  external_url  = excluded.external_url,
  deliverables  = excluded.deliverables,
  tags          = excluded.tags,
  sort_order    = excluded.sort_order,
  status        = excluded.status,
  summary       = excluded.summary,
  updated_at    = timezone('utc', now());

-- 6. Seed project_countries ────────────────────────────────────────────────────

insert into public.project_countries (project_id, country, phase_label, sort_order)
select p.id, c.country, c.phase_label, c.sort_order
from public.projects p
cross join (
  values
    ('Nigeria',      'Phase I',  1),
    ('Ghana',        'Phase I',  2),
    ('Kenya',        'Phase I',  3),
    ('Namibia',      'Phase I',  4),
    ('Liberia',      'Phase I',  5),
    ('Malawi',       'Phase I',  6)
) as c (country, phase_label, sort_order)
where p.slug = 'leap-phase-i'
on conflict (project_id, country) do nothing;

insert into public.project_countries (project_id, country, phase_label, sort_order)
select p.id, c.country, c.phase_label, c.sort_order
from public.projects p
cross join (
  values
    ('Nigeria',       'Phase II', 1),
    ('Ghana',         'Phase II', 2),
    ('Kenya',         'Phase II', 3),
    ('Namibia',       'Phase II', 4),
    ('Liberia',       'Phase II', 5),
    ('Malawi',        'Phase II', 6),
    ('Senegal',       'Phase II', 7),
    ('Côte d''Ivoire','Phase II', 8),
    ('Cameroon',      'Phase II', 9),
    ('Tanzania',      'Phase II', 10),
    ('South Africa',  'Phase II', 11),
    ('Mozambique',    'Phase II', 12),
    ('Angola',        'Phase II', 13),
    ('Ethiopia',      'Phase II', 14),
    ('Morocco',       'Phase II', 15),
    ('Egypt',         'Phase II', 16),
    ('Mauritius',     'Phase II', 17),
    ('Guinea',        'Phase II', 18),
    ('Togo',          'Phase II', 19)
) as c (country, phase_label, sort_order)
where p.slug = 'leap-phase-ii'
on conflict (project_id, country) do nothing;
