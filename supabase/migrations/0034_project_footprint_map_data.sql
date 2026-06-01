-- 0034 · continental footprint map data for LEAP

alter table public.project_countries
  add column if not exists country_code text;

update public.project_countries
set country_code = case country
  when 'Angola' then 'AGO'
  when 'Benin' then 'BEN'
  when 'Cameroon' then 'CMR'
  when 'Congo' then 'COG'
  when 'Côte d''Ivoire' then 'CIV'
  when 'Egypt' then 'EGY'
  when 'Ethiopia' then 'ETH'
  when 'Ghana' then 'GHA'
  when 'Guinea' then 'GIN'
  when 'Kenya' then 'KEN'
  when 'Liberia' then 'LBR'
  when 'Malawi' then 'MWI'
  when 'Mauritania' then 'MRT'
  when 'Mauritius' then 'MUS'
  when 'Morocco' then 'MAR'
  when 'Mozambique' then 'MOZ'
  when 'Namibia' then 'NAM'
  when 'Nigeria' then 'NGA'
  when 'Senegal' then 'SEN'
  when 'Seychelles' then 'SYC'
  when 'South Africa' then 'ZAF'
  when 'Tanzania' then 'TZA'
  when 'Togo' then 'TGO'
  else country_code
end
where country_code is null;

create table if not exists public.project_footprint_hubs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  hub_type text not null
    check (hub_type in ('convening', 'partner', 'secretariat')),
  label text not null,
  city text,
  country_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  phase_label text,
  description text,
  related_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, hub_type, label)
);

create index if not exists idx_project_footprint_hubs_project_id
  on public.project_footprint_hubs (project_id);

alter table public.project_footprint_hubs enable row level security;

create policy "project_footprint_hubs_public_read"
  on public.project_footprint_hubs
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_footprint_hubs.project_id
        and (projects.status = 'published'
             or public.current_user_has_role('administrator'))
    )
  );

create policy "project_footprint_hubs_admin_manage"
  on public.project_footprint_hubs
  for all
  to authenticated
  using (public.current_user_has_role('administrator'))
  with check (public.current_user_has_role('administrator'));

insert into public.project_footprint_hubs (
  project_id,
  hub_type,
  label,
  city,
  country_code,
  latitude,
  longitude,
  phase_label,
  description,
  sort_order
)
select
  p.id,
  'secretariat',
  'PATNA Secretariat',
  'Victoria',
  'SYC',
  -4.6191,
  55.4513,
  'Phase III',
  'PATNA''s public secretariat base in Seychelles anchors ongoing coordination, partnership development, and programme delivery across the active workplan.',
  10
from public.projects p
where p.slug = 'patna-phase-iii-2026'
on conflict (project_id, hub_type, label) do update set
  city = excluded.city,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  phase_label = excluded.phase_label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.project_footprint_hubs (
  project_id,
  hub_type,
  label,
  city,
  country_code,
  latitude,
  longitude,
  phase_label,
  description,
  sort_order
)
select
  p.id,
  'partner',
  'African Union and regional coordination',
  'Addis Ababa',
  'ETH',
  9.045,
  38.92,
  'Phase III',
  'PATNA''s current workplan links technical evidence to continental policy coordination with African Union and regional maritime stakeholders.',
  20
from public.projects p
where p.slug = 'patna-phase-iii-2026'
on conflict (project_id, hub_type, label) do update set
  city = excluded.city,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  phase_label = excluded.phase_label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.project_footprint_hubs (
  project_id,
  hub_type,
  label,
  city,
  country_code,
  latitude,
  longitude,
  phase_label,
  description,
  sort_order
)
select
  p.id,
  'convening',
  'Dakar Francophone Regional Workshop',
  'Dakar',
  'SEN',
  14.7167,
  -17.4677,
  'Phase II',
  'Dakar marked PATNA''s public launch and brought together 25 African IMO Member States around multilingual alignment on the Net Zero Framework.',
  10
from public.projects p
where p.slug = 'dakar-francophone-workshop-2025'
on conflict (project_id, hub_type, label) do update set
  city = excluded.city,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  phase_label = excluded.phase_label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.project_footprint_hubs (
  project_id,
  hub_type,
  label,
  city,
  country_code,
  latitude,
  longitude,
  phase_label,
  description,
  sort_order
)
select
  p.id,
  'convening',
  'African Strategic Summit',
  'Abuja',
  'NGA',
  9.0765,
  7.3986,
  'Phase II',
  'The Abuja Summit deepened negotiation readiness and helped convert technical evidence into a stronger shared African position on shipping decarbonisation.',
  10
from public.projects p
where p.slug = 'african-strategic-summit-abuja-2025'
on conflict (project_id, hub_type, label) do update set
  city = excluded.city,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  phase_label = excluded.phase_label,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.project_footprint_hubs (
  project_id,
  hub_type,
  label,
  city,
  country_code,
  latitude,
  longitude,
  phase_label,
  description,
  sort_order
)
select
  p.id,
  'convening',
  'Africa Climate Summit II',
  'Addis Ababa',
  'ETH',
  8.9806,
  38.7578,
  'Phase II',
  'At ACS2, PATNA connected maritime decarbonisation to climate finance, African resilience, and just-transition narratives in a wider continental forum.',
  10
from public.projects p
where p.slug = 'africa-climate-summit-ii-2025'
on conflict (project_id, hub_type, label) do update set
  city = excluded.city,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  phase_label = excluded.phase_label,
  description = excluded.description,
  sort_order = excluded.sort_order;
