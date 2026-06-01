-- ─────────────────────────────────────────────────────────────────────────────
-- 0022 · Spaces enhancements + seed data
-- Adds lead/partner fields, updated_at trigger, space_tag_map join table,
-- thematic domain tags, and seeds the working group spaces.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend spaces table ──────────────────────────────────────────────────────

alter table public.spaces
  add column if not exists lead_name   text,
  add column if not exists partner_org text,
  add column if not exists updated_at  timestamptz not null default timezone('utc', now());

drop trigger if exists set_spaces_updated_at on public.spaces;
create trigger set_spaces_updated_at
before update on public.spaces
for each row
execute function public.set_updated_at();

-- 2. Space ↔ tag join table ───────────────────────────────────────────────────

create table if not exists public.space_tag_map (
  space_id uuid not null references public.spaces (id) on delete cascade,
  tag_id   uuid not null references public.domain_tags (id) on delete cascade,
  primary key (space_id, tag_id)
);

create index if not exists idx_space_tag_map_space_id on public.space_tag_map (space_id);
create index if not exists idx_space_tag_map_tag_id   on public.space_tag_map (tag_id);

-- 3. RLS for space_tag_map ────────────────────────────────────────────────────

alter table public.space_tag_map enable row level security;

drop policy if exists "Authenticated members can read space tag map" on public.space_tag_map;
create policy "Authenticated members can read space tag map"
  on public.space_tag_map for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins can manage space tag map" on public.space_tag_map;
create policy "Admins can manage space tag map"
  on public.space_tag_map for all
  using (public.current_user_has_role('administrator'));

-- 4. Seed thematic domain_tags ────────────────────────────────────────────────
-- Uses ON CONFLICT DO NOTHING so re-running the migration is safe.

insert into public.domain_tags (name, slug, category) values
  ('SIDS',                      'sids',                      'constituency'),
  ('LDCs',                      'ldcs',                      'constituency'),
  ('RECs',                      'recs',                      'constituency'),
  ('African Union',             'african-union',             'constituency'),
  ('Hydrocarbon Dependent',     'hydrocarbon-dependent',     'domain'),
  ('Clean Fuels',               'clean-fuels',               'domain'),
  ('Maritime',                  'maritime',                  'domain'),
  ('Decarbonisation',           'decarbonisation',           'domain'),
  ('Climate Finance',           'climate-finance',           'domain'),
  ('Energy Transition',         'energy-transition',         'domain'),
  ('IMO MEPC',                  'imo-mepc',                  'process'),
  ('ISWG-GHG',                  'iswg-ghg',                  'process'),
  ('Our Ocean Conference',      'our-ocean-conference',      'process'),
  ('Language & Translation',    'language-translation',      'domain')
on conflict (slug) do nothing;

-- 5. Seed working group spaces ────────────────────────────────────────────────
-- We use a DO $$ block so we can capture the inserted IDs and wire up tags.

do $$
declare
  v_space_id uuid;

  -- tag IDs
  t_sids              uuid;
  t_ldcs              uuid;
  t_recs              uuid;
  t_african_union     uuid;
  t_hydrocarbon       uuid;
  t_clean_fuels       uuid;
  t_maritime          uuid;
  t_decarbonisation   uuid;
  t_climate_finance   uuid;
  t_energy_transition uuid;
  t_imo_mepc          uuid;
  t_iswg              uuid;
  t_our_ocean         uuid;
  t_language          uuid;
begin

  -- Resolve tag IDs
  select id into t_sids              from public.domain_tags where slug = 'sids';
  select id into t_ldcs              from public.domain_tags where slug = 'ldcs';
  select id into t_recs              from public.domain_tags where slug = 'recs';
  select id into t_african_union     from public.domain_tags where slug = 'african-union';
  select id into t_hydrocarbon       from public.domain_tags where slug = 'hydrocarbon-dependent';
  select id into t_clean_fuels       from public.domain_tags where slug = 'clean-fuels';
  select id into t_maritime          from public.domain_tags where slug = 'maritime';
  select id into t_decarbonisation   from public.domain_tags where slug = 'decarbonisation';
  select id into t_climate_finance   from public.domain_tags where slug = 'climate-finance';
  select id into t_energy_transition from public.domain_tags where slug = 'energy-transition';
  select id into t_imo_mepc          from public.domain_tags where slug = 'imo-mepc';
  select id into t_iswg              from public.domain_tags where slug = 'iswg-ghg';
  select id into t_our_ocean         from public.domain_tags where slug = 'our-ocean-conference';
  select id into t_language          from public.domain_tags where slug = 'language-translation';

  -- ── 1. Microeconomic Impact Assessment ──────────────────────────────────────
  insert into public.spaces (name, slug, space_type, description, lead_name, partner_org, visibility)
  values (
    'Microeconomic Impact Assessment',
    'microeconomic-impact-assessment',
    'working_group',
    'Coordinating evidence synthesis and analysis on the microeconomic impacts of maritime decarbonisation, with a focus on SIDS and LDCs.',
    'Professor Wisdom Akpalu',
    'UCL',
    'invite_only'
  )
  on conflict (slug) do nothing
  returning id into v_space_id;

  if v_space_id is not null then
    insert into public.space_tag_map (space_id, tag_id) values
      (v_space_id, t_sids),
      (v_space_id, t_ldcs),
      (v_space_id, t_hydrocarbon),
      (v_space_id, t_decarbonisation),
      (v_space_id, t_climate_finance)
    on conflict do nothing;
  end if;

  -- ── 2. African Common Position ────────────────────────────────────────────
  insert into public.spaces (name, slug, space_type, description, lead_name, partner_org, visibility)
  values (
    'African Common Position',
    'african-common-position',
    'working_group',
    'Developing and coordinating a unified African position on maritime decarbonisation in partnership with the African Union Commission.',
    'Dr Dola',
    'African Union Commission',
    'invite_only'
  )
  on conflict (slug) do nothing
  returning id into v_space_id;

  if v_space_id is not null then
    insert into public.space_tag_map (space_id, tag_id) values
      (v_space_id, t_african_union),
      (v_space_id, t_recs),
      (v_space_id, t_sids),
      (v_space_id, t_ldcs),
      (v_space_id, t_decarbonisation)
    on conflict do nothing;
  end if;

  -- ── 3. Our Ocean Conference (Kenya) ───────────────────────────────────────
  insert into public.spaces (name, slug, space_type, description, lead_name, partner_org, visibility)
  values (
    'Our Ocean Conference (Kenya)',
    'our-ocean-conference-kenya',
    'working_group',
    'Coordination space for PATNA engagement at the Our Ocean Conference in Kenya, including side events, statements, and coalition building.',
    null,
    null,
    'invite_only'
  )
  on conflict (slug) do nothing
  returning id into v_space_id;

  if v_space_id is not null then
    insert into public.space_tag_map (space_id, tag_id) values
      (v_space_id, t_our_ocean),
      (v_space_id, t_sids),
      (v_space_id, t_clean_fuels),
      (v_space_id, t_maritime)
    on conflict do nothing;
  end if;

  -- ── 4. IMO Meeting Support (MEPC, ISWG) ──────────────────────────────────
  insert into public.spaces (name, slug, space_type, description, lead_name, partner_org, visibility)
  values (
    'IMO Meeting Support',
    'imo-meeting-support',
    'working_group',
    'Shared drafting, briefing, and coordination for IMO sessions including MEPC and the ISWG-GHG intersessionals.',
    null,
    'IMO',
    'invite_only'
  )
  on conflict (slug) do nothing
  returning id into v_space_id;

  if v_space_id is not null then
    insert into public.space_tag_map (space_id, tag_id) values
      (v_space_id, t_imo_mepc),
      (v_space_id, t_iswg),
      (v_space_id, t_sids),
      (v_space_id, t_ldcs),
      (v_space_id, t_maritime),
      (v_space_id, t_decarbonisation)
    on conflict do nothing;
  end if;

  -- ── 5. Language Translations ──────────────────────────────────────────────
  insert into public.spaces (name, slug, space_type, description, lead_name, partner_org, visibility)
  values (
    'Language Translations',
    'language-translations',
    'working_group',
    'Volunteer translation coordination for PATNA materials in English, French, Arabic, and Portuguese.',
    null,
    null,
    'invite_only'
  )
  on conflict (slug) do nothing
  returning id into v_space_id;

  if v_space_id is not null then
    insert into public.space_tag_map (space_id, tag_id) values
      (v_space_id, t_language)
    on conflict do nothing;
  end if;

  -- ── 6. General / Announcements ────────────────────────────────────────────
  insert into public.spaces (name, slug, space_type, description, lead_name, partner_org, visibility)
  values (
    'General / Announcements',
    'general-announcements',
    'working_group',
    'Network-wide announcements, updates, and general discussion for all PATNA members.',
    null,
    null,
    'public_members'
  )
  on conflict (slug) do nothing
  returning id into v_space_id;

end $$;
