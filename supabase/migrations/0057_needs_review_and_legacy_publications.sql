-- 0057 · needs_review flag + legacy publications from www.thepatna.org/resources

-- ── 1. Add needs_review column ─────────────────────────────────────────────────
alter table public.content_items
  add column if not exists needs_review boolean not null default false;

-- ── 2. Seed 14 legacy publications from the old PATNA site ─────────────────────
-- ON CONFLICT strategy:
--   published_at   → always overwrite with old-site canonical date
--   needs_review   → always set true (body + cover images need migrating)
--   all other text → COALESCE(current, new) — fill only if currently NULL/empty
--   publish_status / workflow_status → upgrade draft→published, keep published
insert into public.content_items (
  title, slug, content_type,
  summary, meta_description,
  cover_image_url, cover_image_alt,
  publish_status, visibility, workflow_status,
  published_at, needs_review
)
values
  -- 1. AU STC 5th Ordinary Session Report (new)
  (
    'African Union Specialised Technical Committee on Transport & Energy: 5th Ordinary Session Report',
    'au-stc-5th-ordinary-session-report',
    'report',
    'Documents the 5th Ordinary Session of the African Union STC on Transport and Energy, covering adoption of the Continental Strategy for the Decarbonisation of Maritime Transport in Africa — the first African-owned, African-led framework specifically designed to reduce GHG emissions from the maritime sector.',
    'First African-owned framework to reduce maritime GHG emissions, covering the AU STC 5th session and Continental Decarbonisation Strategy.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/05/AU-STC-TE-Report-Cover_v1.jpg',
    'AU STC 5th Ordinary Session Report cover',
    'published', 'public', 'published',
    '2026-05-07T00:00:00Z', true
  ),
  -- 2. MEPC 84 Report (new)
  (
    'A Report on the 84th Session of IMO Marine Environment Protection Committee (MEPC 84)',
    'mepc-84-report',
    'report',
    'Comprehensive analysis of the 84th MEPC session held April 27–May 1, 2026, in London. Covers the disputed IMO Net-Zero Framework, maritime GHG reduction strategies, and marine plastic pollution regulations. Notable outcomes include a mandatory code for plastic pellets carriage and North East Atlantic adoption as an Emission Control Area.',
    'Analysis of MEPC 84 outcomes: disputed IMO Net-Zero Framework, maritime GHG strategies, and the new North East Atlantic Emission Control Area.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/05/Report-Cover-Page-MEPC84.jpg',
    'MEPC 84 Report cover',
    'published', 'public', 'published',
    '2026-05-05T00:00:00Z', true
  ),
  -- 3. ISWG-GHG 21 Report (new)
  (
    'IMO Intersessional Working Group on Greenhouse Gases (ISWG-GHG 21)',
    'iswg-ghg-21-intersessional-working-group-on-ghg-emissions-from-ships',
    'report',
    'Comprehensive synthesis of the 21st session of the IMO greenhouse gases working group. Analyses the evolving architecture of the IMO Net-Zero Framework across technical foundations, institutional mechanisms, and sustainability considerations. Documents consensus on onboard carbon capture systems while mapping coalition dynamics and ongoing disagreements on methane emissions.',
    'Synthesis of IMO ISWG-GHG 21 covering the Net-Zero Framework architecture, onboard carbon capture consensus, and coalition dynamics.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/04/IMO-ISWG-GHG-21.jpg',
    'ISWG-GHG 21 Report cover',
    'published', 'public', 'published',
    '2026-04-26T00:00:00Z', true
  ),
  -- 4. Defining Just and Equitable Transition for Africa (new)
  (
    'Defining Just and Equitable Transition for Africa',
    'defining-just-and-equitable-transition-for-africa',
    'report',
    'Documents survey findings from the Decarbonisation Workshop in Dakar, Senegal (August 4–6, 2025) with representatives from 25 African IMO member states. African stakeholders prioritise regional coordination, fair revenue distribution, and green infrastructure investment for an equitable maritime decarbonisation.',
    'Survey findings from the Dakar 2025 workshop: African IMO states prioritise regional coordination, fair revenue distribution, and green infrastructure.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/Defining-a-Just-and-Equitable-Transition-for-Africas-Maritime-Green-Transition-1.jpg',
    'Defining Just and Equitable Transition for Africa cover',
    'published', 'public', 'published',
    '2026-03-19T00:00:00Z', true
  ),
  -- 5. Kenya National Maritime GHG Emissions Inventory (new)
  (
    'Kenya''s National Maritime GHG Emissions Inventory',
    'kenya-national-maritime-ghg-emissions-inventory',
    'report',
    'Kenya''s inaugural voyage-based assessment of maritime GHG emissions using AIS-derived vessel activity data to measure energy consumption and CO₂ output from shipping operations at Kenyan ports. Methodology aligns with Fourth IMO GHG Study standards and aims to strengthen Kenya''s analytical foundation for IMO discussions.',
    'Kenya''s inaugural AIS-based maritime GHG emissions assessment, aligned with the Fourth IMO GHG Study methodology.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/Screenshot-2026-03-20-at-23.26.44.webp',
    'Kenya National Maritime GHG Emissions Inventory cover',
    'published', 'public', 'published',
    '2026-03-20T00:00:00Z', true
  ),
  -- 6. Impacts of IMO GHG Strategy on African Economies — Dakar survey (new)
  (
    'The Impacts of IMO''s Ship GHG Reduction Strategy on African Economies',
    'impacts-of-imo-ghg-strategy-on-african-economies',
    'report',
    'Analysis of 40+ maritime stakeholders from 25 countries across West, Central, Eastern, and Southern Africa conducted at the Dakar Maritime Decarbonisation Workshop. Stakeholders hold optimistic visions of unity and development while expressing deep concerns about unjust transition processes and overwhelming infrastructure deficits.',
    'Survey of 40+ stakeholders across 25 African countries on IMO decarbonisation strategy impacts, infrastructure gaps, and transition concerns.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/The-Impacts-of-IMOs-Ship-GHG-Reduction-Strategy-on-African-Economies.webp',
    'Impacts of IMO GHG Strategy on African Economies cover',
    'published', 'public', 'published',
    '2026-03-19T00:00:00Z', true
  ),
  -- 7. Dakar Workshop Report (updates 0050 slug)
  (
    'Dakar Decarbonization Workshop: Advancing Africa''s Maritime Sector to Net-Zero',
    'dakar-workshop-report-advancing-africas-maritime-sector-to-net-zero',
    'workshop_proceedings',
    'Documents the three-day workshop held August 4–6, 2025, in Dakar with over 100 participants from 25 African IMO Member States. Delegates adopted 15 resolutions on unity, capacity building, funding, and just transition. Key finding: 72% of participants judged African ports as unprepared for clean vessels.',
    'Report from the Dakar workshop with 100+ participants from 25 African IMO member states, producing 15 resolutions on maritime decarbonisation.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/03/Screenshot-2026-03-19-at-20.04.12.webp',
    'Dakar Decarbonization Workshop Report cover',
    'published', 'public', 'published',
    '2026-03-19T00:00:00Z', true
  ),
  -- 8. Namibia Case Study (updates 0050 slug)
  (
    'Complementary Quantitative Stakeholders'' Analysis: The Case Study of Namibia',
    'complementary-quantitative-stakeholders-analysis-namibia',
    'case_study',
    'Examines how IMO GHG reduction measures affect Namibia''s trade-dependent economy. Evaluates four leading policy scenarios across uranium exports, fish exports, and petroleum imports through 2050. All scenarios increase maritime transport costs, with petroleum imports experiencing the largest increases.',
    'IMO GHG policy scenario modelling for Namibia covering uranium exports, fish exports, and petroleum imports through 2050.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/02/Screenshot-2026-02-11-at-18.05.03.png',
    'Namibia Case Study cover',
    'published', 'public', 'published',
    '2026-02-11T00:00:00Z', true
  ),
  -- 9. Nigeria Case Study (updates 0050 slug)
  (
    'Impact Assessment of the IMO basket of candidate mid-term GHG reduction measures: The Nigeria Case Study',
    'impact-assessment-imo-candidate-mid-term-ghg-measures-nigeria-case-study',
    'case_study',
    'Examines how IMO proposals for GHG reduction would affect Nigeria''s economy across 2030, 2040, and 2050. Evaluates impacts on GDP, trade flows, consumer prices, and food security. All policy scenarios result in higher maritime logistics costs relative to baseline trends.',
    'How IMO GHG proposals affect Nigeria''s GDP, trade flows, consumer prices, and food security across 2030, 2040, and 2050.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/02/Nigeria-case-study-cover-image.jpg',
    'Nigeria Case Study cover',
    'published', 'public', 'published',
    '2026-02-11T00:00:00Z', true
  ),
  -- 10. Africa-centric UNCTAD CIA (updates 0050 slug)
  (
    'An Africa-centric analysis of the UNCTAD Comprehensive Impact Assessment of the basket of candidate GHG reduction mid-term measures',
    'africa-centric-analysis-unctad-comprehensive-impact-assessment-ghg-mid-term-measures',
    'report',
    'Examines how various policy scenarios could affect key economic indicators across six African case study countries: Ghana, Kenya, Liberia, Malawi, Namibia, and Nigeria. Policy designs incorporating levy mechanisms with revenue redistribution can partially mitigate GDP and trade impacts.',
    'Examines IMO policy scenarios on GDP, imports, exports, and consumer prices for six African countries with 2030–2050 projections.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/01/Screenshot-2026-01-08-at-17.55.36-scaled.png',
    'Africa-centric UNCTAD CIA cover',
    'published', 'public', 'published',
    '2026-01-02T00:00:00Z', true
  ),
  -- 11. Malawi Case Study (updates 0050 slug)
  (
    'Complementary Quantitative Stakeholders'' Analysis: The Case Study of Malawi',
    'complementary-quantitative-stakeholders-analysis-malawi',
    'case_study',
    'Examines how IMO GHG reduction policies affect land-locked, trade-dependent economies using Malawi as a case study. Models impacts on tobacco exports and petroleum and fertilizer imports. All policy scenarios increase logistics costs, with fertilizer and petroleum imports facing cost increases of up to 20%.',
    'IMO GHG cost modelling for a landlocked economy: Malawi''s tobacco exports face up to 6% increases; fertilizer imports up to 20%.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/01/malawi-case-study-cover-image.jpg',
    'Malawi Case Study cover',
    'published', 'public', 'published',
    '2026-01-15T00:00:00Z', true
  ),
  -- 12. 2025 Review & 2026 In-View (updates 0050 slug)
  (
    '2025 Review and 2026 In-View Report',
    '2025-review-and-2026-in-view-report',
    'report',
    'Reflects on PATNA''s 2025 accomplishments and establishes 2026 strategic objectives. Synthesises findings from the End-of-Year Town Hall evaluating African participation in IMO maritime decarbonization. Identifies obstacles including fragmented regional partnerships and uneven technical resources.',
    'PATNA''s year-end synthesis: African IMO positions driven by food security and implementation concerns, with 2026 strategic priorities.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2026/01/2025-Review-and-2026-In-View-Report.jpg',
    '2025 Review and 2026 In-View Report cover',
    'published', 'public', 'published',
    '2026-01-09T00:00:00Z', true
  ),
  -- 13. MEPC/ES.2 Extraordinary Session (updates 0050 slug)
  (
    'Report of the Second Extraordinary Session of the Marine Environment Protection Committee (MEPC/ES.2)',
    'report-of-mepc-es-2-second-extraordinary-session',
    'report',
    'Documents the IMO extraordinary session held October 14–17, 2025, where 135 countries gathered on maritime decarbonization. Centred on adopting a Net Zero Framework with a Greenhouse Gas Fuel-Intensity standard and IMO Net-Zero Fund. Session concluded without achieving its primary goal after voting to adjourn for one year.',
    '135 countries at the IMO extraordinary session; Net-Zero Framework vote adjourned after failure to achieve consensus on procedural implementation.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/10/MEPC-82_inside-pic_mediu-1.webp',
    'MEPC/ES.2 Extraordinary Session Report cover',
    'published', 'public', 'published',
    '2025-10-18T00:00:00Z', true
  ),
  -- 14. ACS2 — Ports, People & Pathways (updates 0050 slug)
  (
    'Ports, People, and Pathways: Africa''s Just Maritime Transition at Africa Climate Summit II (ACS2)',
    'patna-at-africa-climate-summit-2',
    'article',
    'Documents two sessions at Africa Climate Summit II (African Union HQ, Addis Ababa). PATNA positioned maritime decarbonization as an economic opportunity, emphasising Africa as a rule-shaper in climate negotiations. Africa contributes less than 4% of global maritime emissions while bearing disproportionate compliance costs.',
    'PATNA at Africa Climate Summit II: maritime decarbonisation as economic opportunity for Africa''s COP30 and IMO 2027 framework ambitions.',
    'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/a6fe0c8a-e39a-40b9-b336-12560e9398bb-1.webp',
    'ACS2 — Ports, People & Pathways cover',
    'published', 'public', 'published',
    '2025-09-21T00:00:00Z', true
  )
on conflict (slug) do update set
  -- Always overwrite with the canonical old-site date
  published_at     = excluded.published_at,
  -- Always flag for review (body + cover images need updating)
  needs_review     = true,
  -- Fill missing text fields only
  title            = coalesce(nullif(trim(public.content_items.title), ''), excluded.title),
  summary          = coalesce(nullif(trim(public.content_items.summary), ''), excluded.summary),
  meta_description = coalesce(nullif(trim(public.content_items.meta_description), ''), excluded.meta_description),
  cover_image_url  = coalesce(nullif(trim(public.content_items.cover_image_url), ''), excluded.cover_image_url),
  cover_image_alt  = coalesce(nullif(trim(public.content_items.cover_image_alt), ''), excluded.cover_image_alt),
  -- Upgrade draft/in_review → published
  publish_status   = case
    when public.content_items.publish_status in ('draft') then 'published'
    else public.content_items.publish_status
  end,
  workflow_status  = case
    when public.content_items.workflow_status in ('not_started', 'planned', 'draft', 'in_review') then 'published'
    else public.content_items.workflow_status
  end,
  updated_at       = timezone('utc', now());

-- ── 3. Seed PDF attachments (skip if a primary attachment already exists) ───────
insert into public.content_attachments (
  content_id, file_url, original_url, file_type, title, source_kind, is_primary, sort_order, created_at
)
select
  c.id,
  a.file_url,
  a.file_url,
  'application/pdf',
  a.attach_title,
  'external',
  true,
  0,
  timezone('utc', now())
from (
  values
    ('au-stc-5th-ordinary-session-report',
      'https://thepatna.org/wp-content/uploads/2026/05/AU-STC-5th-Session-Report_v1.pdf',
      'Full Report (PDF)'),
    ('mepc-84-report',
      'https://thepatna.org/wp-content/uploads/2026/05/MEPC-84-Report_EN.pdf',
      'Full Report (PDF)'),
    ('iswg-ghg-21-intersessional-working-group-on-ghg-emissions-from-ships',
      'https://thepatna.org/wp-content/uploads/2026/04/ISWG-GHG-21-Report.pdf',
      'Full Report — English (PDF)'),
    ('defining-just-and-equitable-transition-for-africa',
      'https://thepatna.org/wp-content/uploads/2026/03/Defining-a-Just-and-Equitable-Transition-for-Africas-Maritime-Green-Transition.pdf',
      'Full Report (PDF)'),
    ('kenya-national-maritime-ghg-emissions-inventory',
      'https://thepatna.org/wp-content/uploads/2026/03/Kenya-National-Maritime-GHG-Emissions-Inventory.pdf',
      'Full Report (PDF)'),
    ('impacts-of-imo-ghg-strategy-on-african-economies',
      'https://thepatna.org/wp-content/uploads/2026/03/The-Impacts-of-IMOs-Ship-GHG-Reduction-Strategy-on-African-Economies-1.pdf',
      'Full Report (PDF)'),
    ('dakar-workshop-report-advancing-africas-maritime-sector-to-net-zero',
      'https://thepatna.org/wp-content/uploads/2026/03/Dakar-Workshop-Report-Draft.pdf',
      'Full Report (PDF)'),
    ('complementary-quantitative-stakeholders-analysis-namibia',
      'https://thepatna.org/wp-content/uploads/2026/02/Namibia-case-study.pdf',
      'Full Report (PDF)'),
    ('impact-assessment-imo-candidate-mid-term-ghg-measures-nigeria-case-study',
      'https://thepatna.org/wp-content/uploads/2026/02/Impact-Assessment-of-the-IMO-candidate-mid-term-GHG-reduction-measures-Nigeria-Case-Study.pdf',
      'Full Report (PDF)'),
    ('africa-centric-analysis-unctad-comprehensive-impact-assessment-ghg-mid-term-measures',
      'https://thepatna.org/wp-content/uploads/2026/01/An-Africa-centric-analysis-of-the-UNCTAD-Comprehensive-Impact-Assessment-of-the-basket-of-candidate-GHG-reduction-mid-term-measures.pdf',
      'Full Report (PDF)'),
    ('complementary-quantitative-stakeholders-analysis-malawi',
      'https://thepatna.org/wp-content/uploads/2026/01/Complementary-Quantitative-Stakeholders-Analysis-The-Case-Study-of-Malawi.pdf',
      'Full Report (PDF)'),
    ('2025-review-and-2026-in-view-report',
      'https://thepatna.org/wp-content/uploads/2026/01/2025-Review-and-2026-In-View-Report_Final.pdf',
      'Full Report (PDF)'),
    ('report-of-mepc-es-2-second-extraordinary-session',
      'https://drive.google.com/file/d/1vfT8Zns9pC9zY2RMVkk7vZd53YgiZP6U/view',
      'Full Report (PDF)')
) as a(slug, file_url, attach_title)
join public.content_items c on c.slug = a.slug
where not exists (
  select 1 from public.content_attachments ex
  where ex.content_id = c.id
    and ex.is_primary = true
);

-- French version of ISWG-GHG 21 (secondary, sort_order=1)
insert into public.content_attachments (
  content_id, file_url, original_url, file_type, title, source_kind, is_primary, sort_order, created_at
)
select
  c.id,
  'https://thepatna.org/wp-content/uploads/2026/04/Fr_ISWG-GHG-21-Report.pdf',
  'https://thepatna.org/wp-content/uploads/2026/04/Fr_ISWG-GHG-21-Report.pdf',
  'application/pdf',
  'Full Report — French (PDF)',
  'external',
  false,
  1,
  timezone('utc', now())
from public.content_items c
where c.slug = 'iswg-ghg-21-intersessional-working-group-on-ghg-emissions-from-ships'
  and not exists (
    select 1 from public.content_attachments ex
    where ex.content_id = c.id
      and ex.sort_order = 1
  );
