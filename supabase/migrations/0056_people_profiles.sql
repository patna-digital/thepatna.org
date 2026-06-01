-- ─────────────────────────────────────────────────────────────────────────────
-- 0056 · Website people profiles (Board, Secretariat, Research Contributors)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table if not exists public.people_profiles (
  id                uuid        primary key default gen_random_uuid(),

  -- Which section of the About page this person belongs to
  section           text        not null
    check (section in ('board', 'secretariat', 'research')),

  -- Core identity
  full_name         text        not null,
  title             text,                          -- role / title line
  organisation      text,                          -- affiliation / org name
  bio               text,

  -- Photo
  photo_url         text,
  photo_storage_path text,

  -- Contact / social
  email             text,
  linkedin_url      text,

  -- Display
  display_order     integer     not null default 0,
  is_active         boolean     not null default true,

  -- Optional link to a member account (future feature — not required)
  linked_member_id  uuid        references public.profiles (id) on delete set null,

  -- Audit
  created_by_user_id uuid       references public.profiles (id) on delete set null,
  updated_by_user_id uuid       references public.profiles (id) on delete set null,
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now())
);

create index if not exists idx_people_profiles_section_order
  on public.people_profiles (section, display_order);

create trigger set_people_profiles_updated_at
  before update on public.people_profiles
  for each row execute function public.set_updated_at();

-- ── 2. RLS ────────────────────────────────────────────────────────────────────

alter table public.people_profiles enable row level security;

-- Public read for active profiles (used on the marketing site)
create policy "Public read for active people profiles"
  on public.people_profiles for select
  using (is_active = true);

-- Admins full access
create policy "Admins manage people profiles"
  on public.people_profiles for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

-- ── 3. Storage bucket for profile photos ─────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'people-photos',
  'people-photos',
  true,
  5242880,   -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Public read for people photos"
  on storage.objects for select
  using (bucket_id = 'people-photos');

create policy "Admins upload people photos"
  on storage.objects for insert
  with check (
    bucket_id = 'people-photos'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

create policy "Admins update people photos"
  on storage.objects for update
  using (
    bucket_id = 'people-photos'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

create policy "Admins delete people photos"
  on storage.objects for delete
  using (
    bucket_id = 'people-photos'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('administrator', 'super_admin')
    )
  );

-- ── 4. Seed from current website data ────────────────────────────────────────

-- Board of Directors
insert into public.people_profiles (section, full_name, title, organisation, bio, display_order) values
(
  'board',
  'Dr Dola Oluteye',
  'Founder / Co-Chair of the Board',
  'The PATNA Initiative | UCL Energy Institute, London',
  'Founder of PATNA and Co-Chair of the Board. Dr Oluteye leads UCL''s engagement with African maritime energy transition research and serves as Principal Investigator of the LEAP Project Series. She designed PATNA''s evidence framework and has directed the analytical programme across all three LEAP phases, from the first national shipping emissions inventories to the continental coordination architecture of ORCA Africa 2026. Her work bridges academic rigour and policy relevance at the IMO, the AU, and across African delegations.',
  0
),
(
  'board',
  'Ambassador Nancy Karigithu',
  'Co-Chair of the Board',
  'The PATNA Initiative',
  'Ambassador Karigithu is a preeminent leader in the global maritime sector, currently serving as Kenya''s Special Envoy and Advisor for Maritime and Blue Economy. With nearly four decades of experience, she was the founding Principal Secretary of Kenya''s State Department for Shipping and Maritime Affairs and the first Director General of the Kenya Maritime Authority. Her extensive international governance experience includes chairing the IMO Technical Cooperation Committee and serving on the boards of the World Maritime University (WMU) and the IMO International Maritime Law Institute (IMLI). A champion for gender diversity and seafarers'' welfare, she provides PATNA with high-level strategic oversight and institutional stewardship within the global maritime landscape.',
  1
),
(
  'board',
  'Dr Harry Conway',
  'Board Member',
  'The PATNA Initiative',
  'Dr Conway is a leading expert in environmental politics and maritime regulation, currently serving as the Chair of the IMO''s Marine Environment Protection Committee (MEPC). Under his leadership, the landmark 2023 IMO GHG Strategy was unanimously adopted. As the Alternate Permanent Representative of Liberia and a former Chair of the Africa Maritime Advisory Group (AMAG), he brings unparalleled expertise in international negotiation and regulatory standards. Dr Conway is also an adjunct lecturer at the World Maritime University and has been a key contributor to the African Union''s 2050 Integrated Maritime Strategy.',
  2
),
(
  'board',
  'Maj Gen Oyefosebi Gbolahan (Rt)',
  'Board Member',
  'The PATNA Initiative',
  'A veteran of the Nigerian Army with extensive experience in strategy, intelligence, and international relations, Maj Gen Oyefesobi provides PATNA with vital expertise in security and organisational management. His distinguished career includes serving as the Deputy Chief of Defence Intelligence and as a Defence Adviser at the Nigeria High Commission in London, where he regularly interfaced with IMO representatives. He holds advanced degrees in political science and strategy and is a fellow of several prestigious management and security institutes, bringing a disciplined, strategic lens to the organisation''s governance.',
  3
);

-- Secretariat
insert into public.people_profiles (section, full_name, title, organisation, email, bio, display_order) values
(
  'secretariat',
  'Aisha Datubo',
  'Operations Coordinator',
  'PATNA Secretariat',
  'operations@thepatna.org',
  'Aisha Datubo manages the internal operations and human resources for the PATNA Secretariat. She ensures organisational efficiency and provides high-level administrative support to the leadership team, coordinating the day-to-day functions that enable the network''s pan-African mission.',
  0
),
(
  'secretariat',
  'Annette Wangari',
  'Secretariat Coordinator',
  'PATNA Secretariat',
  'contact@thepatna.org',
  'Annette Wangari is a maritime lawyer and a graduate of the World Maritime University (WMU). She leads Secretariat coordination, leveraging her legal expertise to manage the network''s diverse activities and facilitate collaboration between African delegations, researchers, and technical experts.',
  1
),
(
  'secretariat',
  'Fitzroy Meyer-Petgrave',
  'Senior Research Associate',
  'PATNA Secretariat',
  'research@thepatna.org',
  'Fitzroy Meyer-Petgrave is a data scientist specialising in research, analytics, and intelligence for climate action to deliver measurable outcomes. With a Master''s in Data Science and over a decade of experience in business management, he bridges data gaps to drive evidence-based value for PATNA''s maritime decarbonisation and policy research.',
  2
);

-- Research Contributors (UCL)
insert into public.people_profiles (section, full_name, title, organisation, bio, display_order) values
(
  'research',
  'Dr Dolapo Oluteye',
  'PATNA Founder and UCL Energy Institute researcher',
  'UCL Energy Institute',
  'Principal Investigator of the LEAP series. Leads technical strategy and analytical framework design.',
  0
),
(
  'research',
  'Assoc. Prof. Tristan Smith',
  'Co-Investigator',
  'UCL Energy Institute',
  'Co-Investigator of the LEAP series. Leads UCL''s shipping decarbonisation modelling programme.',
  1
),
(
  'research',
  'Marie Fricaudet',
  'Researcher',
  'UCL Energy Institute',
  'Researcher responsible for emissions inventories, lifecycle assessment, and country-level impact modelling.',
  2
),
(
  'research',
  'Fitzroy Meyer-Petgrave',
  'Senior Research Associate',
  'PATNA Initiative',
  'MSc Data Science – Senior Research Associate with the LEAP project series and the PATNA Initiative. Works with principal investigator Dr Dola.',
  3
);
