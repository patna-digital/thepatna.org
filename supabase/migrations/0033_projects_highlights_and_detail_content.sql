-- 0033 · project highlights + richer default detail-page content

alter table public.projects
  add column if not exists highlights jsonb not null default '[]'::jsonb;

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"5","label":"core workstreams"},
      {"value":"25+","label":"countries engaged"},
      {"value":"2028","label":"key-result horizon"},
      {"value":"10+","label":"fellows and delegates targeted"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/IMG_5298.jpg?resize=800%2C600&ssl=1'),
  cover_image_alt = coalesce(cover_image_alt, 'Panel-style moment from PATNA public convening coverage.'),
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>Phase III is the delivery phase that turns LEAP's earlier research and coalition-building into an operating programme. Under the 2026 Shipping Decarbonisation Africa Regional Workplan, PATNA leads in-continent coordination while UCL Energy Institute remains the technical research backbone.</p>
    <p>The programme is designed around real IMO decision windows, combining diplomatic coordination, technical modelling, capacity building, and investable implementation pathways in one operating rhythm.</p>
    <h2>What the workplan is delivering</h2>
    <ul>
      <li>Continental technical coordination ahead of each ISWG-GHG and MEPC cycle.</li>
      <li>Africa-wide evidence on the Net Zero Framework, including reward design, fund governance, and compliance questions.</li>
      <li>Port readiness and corridor case studies that connect policy outcomes to financeable African priorities.</li>
      <li>A fellowship and coaching model that places trained PATNA members closer to real delegation support.</li>
      <li>A resource-mobilisation pipeline that helps PATNA sustain African technical coordination beyond a single grant cycle.</li>
    </ul>
    <h2>Why it matters</h2>
    <p>Phase III is where PATNA turns a strong evidence base and growing network into durable institutional capability. Success means Africa is better organised before negotiations, better equipped during them, and better positioned after them to shape implementation and finance pathways.</p>$$
  )
where slug = 'patna-phase-iii-2026';

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"19","label":"participating countries"},
      {"value":"25","label":"member states at Dakar"},
      {"value":"15","label":"resolutions adopted"},
      {"value":"4","label":"working languages at launch"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/a6fe0c8a-e39a-40b9-b336-12560e9398bb-1.webp?fit=1600%2C891&ssl=1'),
  cover_image_alt = coalesce(cover_image_alt, 'Delegates gathered during PATNA coverage at ACS2.'),
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>LEAP Phase II marked the shift from a six-country technical support effort to a continent-facing programme with political reach. It expanded the country base, widened the evidence agenda, and formalised PATNA as a permanent African secretariat rather than a temporary project network.</p>
    <h2>What changed in Phase II</h2>
    <ul>
      <li>The country base expanded to a broader Africa-wide coalition spanning 19 countries and key regional bodies.</li>
      <li>PATNA commissioned new socioeconomic analysis focused on trade, GDP, and food-security implications of the Net Zero Framework.</li>
      <li>Ports readiness entered the programme as a practical implementation question, linking diplomatic positions to infrastructure and finance planning.</li>
      <li>The Dakar Francophone Regional Workshop served as PATNA's public launch and a multilingual convening point for 25 African IMO Member States.</li>
    </ul>
    <h2>Why it mattered</h2>
    <p>Phase II helped replace broad concern with structured African positions, while also giving partners, delegates, and funders a more durable institutional home for this work.</p>$$
  )
where slug = 'leap-phase-ii';

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"6","label":"case-study countries"},
      {"value":"4","label":"core technical tasks"},
      {"value":"2024","label":"foundational delivery year"},
      {"value":"1","label":"Pan-African network launched"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/IMG_5165.jpg?resize=800%2C600&ssl=1'),
  cover_image_alt = coalesce(cover_image_alt, 'Delegates in session during PATNA-linked convening coverage.'),
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>LEAP Phase I was the foundation. It concentrated on six case-study countries and built the first Africa-generated evidence base that delegations could use in IMO greenhouse-gas negotiations.</p>
    <h2>What Phase I produced</h2>
    <ul>
      <li>National shipping emissions inventories for the six case-study countries.</li>
      <li>Economic potential and transition-readiness assessments focused on low-carbon shipping opportunities.</li>
      <li>Africa-centred interpretation of Comprehensive Impact Assessment findings and related IMO policy implications.</li>
      <li>Landscape analysis, stakeholder mapping, and an early in-region convening that seeded the broader PATNA network.</li>
    </ul>
    <h2>Why it mattered</h2>
    <p>Phase I helped delegations move from reacting to external analysis toward engaging with their own evidence base, while also creating the relationships that later became PATNA's operating network.</p>$$
  )
where slug = 'leap-phase-i';

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"25","label":"member states represented"},
      {"value":"100+","label":"participants convened"},
      {"value":"4","label":"working languages"},
      {"value":"15","label":"resolutions adopted"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://thepatna.org/wp-content/uploads/2025/09/Dakar.jpeg'),
  cover_image_alt = coalesce(cover_image_alt, 'Dakar Maritime Decarbonisation Workshop poster.'),
  deliverables = case
    when jsonb_typeof(deliverables) = 'array' and jsonb_array_length(deliverables) > 0 then deliverables
    else $$[
      "Adopted 15 resolutions to guide African engagement ahead of MEPC 84.",
      "Publicly launched PATNA as a permanent African secretariat.",
      "Created a multilingual forum for governments, experts, and maritime stakeholders to align around the Net Zero Framework."
    ]$$::jsonb
  end,
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>The Dakar Francophone Regional Workshop was a turning point for PATNA's public profile and for Africa's multilingual coordination around maritime decarbonisation. It convened African IMO Member States, regional actors, and technical stakeholders around the structure and implications of the Net Zero Framework.</p>
    <h2>What happened in Dakar</h2>
    <ul>
      <li>Delegates and stakeholders examined the practical implications of the Net Zero Framework for African states.</li>
      <li>The convening addressed MARPOL Annex VI awareness, regulatory readiness, and the implications of upcoming IMO guideline work.</li>
      <li>Interpretation and materials were structured across English, French, Portuguese, and Arabic to widen effective participation.</li>
    </ul>
    <h2>Why the workshop mattered</h2>
    <p>Dakar translated a growing network into visible continental coordination and created a clearer shared reference point for African participation ahead of MEPC 84.</p>$$
  )
where slug = 'dakar-francophone-workshop-2025';

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"2","label":"summit days"},
      {"value":"Africa-wide","label":"policy alignment"},
      {"value":"IMO","label":"negotiation focus"},
      {"value":"LEAP II","label":"programme milestone"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/abuja-summit.jpeg?fit=800%2C534&ssl=1'),
  cover_image_alt = coalesce(cover_image_alt, 'African Strategic Summit on Shipping Decarbonisation in Abuja.'),
  deliverables = case
    when jsonb_typeof(deliverables) = 'array' and jsonb_array_length(deliverables) > 0 then deliverables
    else $$[
      "Strengthened negotiation readiness among policymakers, negotiators, and sector stakeholders.",
      "Helped consolidate a stronger African position on shipping decarbonisation ahead of later convenings and IMO sessions.",
      "Reinforced the link between technical evidence and diplomatic coordination."
    ]$$::jsonb
  end,
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>The Abuja Strategic Summit focused on alignment: bringing African maritime policymakers, negotiators, and industry voices into a more coordinated conversation about shipping decarbonisation.</p>
    <h2>What the summit achieved</h2>
    <ul>
      <li>Created space for strategic discussion before higher-stakes regional and global engagements.</li>
      <li>Helped participants translate technical findings into negotiation language and political priorities.</li>
      <li>Strengthened the case for a more coordinated African position on decarbonisation, transition readiness, and equity.</li>
    </ul>
    <h2>Why it mattered</h2>
    <p>Abuja helped build the connective tissue between evidence, trust, and political confidence that later coalition moments relied on.</p>$$
  )
where slug = 'african-strategic-summit-abuja-2025';

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"2","label":"PATNA-facilitated sessions"},
      {"value":"Climate finance","label":"core framing"},
      {"value":"Ocean-climate","label":"policy bridge"},
      {"value":"Africa-wide","label":"public visibility"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/a6fe0c8a-e39a-40b9-b336-12560e9398bb-1.webp?fit=1600%2C891&ssl=1'),
  cover_image_alt = coalesce(cover_image_alt, 'Delegates and participants gathered during PATNA ACS2 coverage.'),
  deliverables = case
    when jsonb_typeof(deliverables) = 'array' and jsonb_array_length(deliverables) > 0 then deliverables
    else $$[
      "Positioned maritime decarbonisation within wider African resilience, finance, and industrialisation debates.",
      "Extended PATNA's visibility beyond maritime-only audiences into climate and development conversations.",
      "Strengthened the link between shipping policy and just-transition narratives."
    ]$$::jsonb
  end,
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>PATNA's presence at Africa Climate Summit II widened the frame for maritime decarbonisation by connecting it to African resilience, green development, climate finance, and industrial opportunity.</p>
    <h2>What happened</h2>
    <ul>
      <li>PATNA co-facilitated sessions in the Africa Ocean-Climate Solutions Pavilion.</li>
      <li>The organisation framed maritime transition as part of an Africa-led development and just-transition agenda.</li>
      <li>The convening helped socialise PATNA's evidence and positioning in a broader continental climate-policy audience.</li>
    </ul>
    <h2>Why it mattered</h2>
    <p>Events like ACS2 help PATNA reach decision-makers and partners who shape finance, infrastructure, and climate priorities beyond maritime-only forums.</p>$$
  )
where slug = 'africa-climate-summit-ii-2025';

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"1","label":"member-wide consultation"},
      {"value":"2026","label":"programme shaped"},
      {"value":"NZF","label":"priority focus"},
      {"value":"Africa-wide","label":"member participation"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/15cf7659-dca0-4889-8d2e-8edf829ca626.jpg?resize=800%2C450&ssl=1'),
  cover_image_alt = coalesce(cover_image_alt, 'Audience shot from PATNA public convening coverage.'),
  deliverables = case
    when jsonb_typeof(deliverables) = 'array' and jsonb_array_length(deliverables) > 0 then deliverables
    else $$[
      "Captured member insight on food security, implementation timelines, and Africa-specific evidence gaps.",
      "Confirmed regional coordination as a high-priority capacity need across the network.",
      "Directly informed the design and prioritisation of the 2026 workplan."
    ]$$::jsonb
  end,
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>The End-of-Year Town Hall was a member-driven checkpoint between LEAP Phase II and the 2026 delivery cycle. It gave PATNA a structured way to listen back to its network before converting 2025 momentum into the next phase of work.</p>
    <h2>What members surfaced</h2>
    <ul>
      <li>Food security remained a central concern in how African actors interpreted Net Zero Framework outcomes.</li>
      <li>Implementation timelines and readiness were more pressing than abstract legal uncertainty for many participants.</li>
      <li>Members pointed to persistent gaps in Africa-specific technical evidence and coordination support.</li>
    </ul>
    <h2>Why it mattered</h2>
    <p>The Town Hall translated consultation into programme design and directly shaped the structure of Phase III.</p>$$
  )
where slug = 'patna-town-hall-december-2025';

update public.projects
set
  highlights = case
    when jsonb_typeof(highlights) = 'array' and jsonb_array_length(highlights) > 0 then highlights
    else $$[
      {"value":"2024-present","label":"ongoing support window"},
      {"value":"IMO","label":"primary decision arena"},
      {"value":"Delegations","label":"briefing support"},
      {"value":"Guidelines","label":"focus of engagement"}
    ]$$::jsonb
  end,
  cover_image_url = coalesce(cover_image_url, 'https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/36cf1910-e710-4359-92a4-b276465f3689.jpg?resize=800%2C466&ssl=1'),
  cover_image_alt = coalesce(cover_image_alt, 'Roundtable exchange during PATNA convening coverage.'),
  deliverables = case
    when jsonb_typeof(deliverables) = 'array' and jsonb_array_length(deliverables) > 0 then deliverables
    else $$[
      "Prepared decision-ready briefings for African capitals and negotiators.",
      "Supported delegates as guideline discussions moved into reward design, fund architecture, compliance, and lifecycle questions.",
      "Converted fast-moving technical debates into usable African negotiation intelligence."
    ]$$::jsonb
  end,
  body = coalesce(
    nullif(body, ''),
    $$<h2>Overview</h2>
    <p>PATNA's IMO technical engagement is the continuous thread that connects evidence production to actual negotiating processes. Across MEPC sessions and ISWG-GHG intersessionals, the organisation supports African delegations with briefing, analysis, and coordination.</p>
    <h2>What this support looks like</h2>
    <ul>
      <li>Rapid interpretation of draft texts, proposals, and evolving negotiation issues.</li>
      <li>Preparation of briefings that translate technical design choices into policy consequences for African states.</li>
      <li>Support around submission timelines, pre-meeting coordination, and cross-country alignment where interests overlap.</li>
    </ul>
    <h2>Why it matters</h2>
    <p>Sustained engagement matters because negotiating influence is cumulative. Delegations are stronger when they arrive with clearer evidence, shared framing, and timely technical interpretation.</p>$$
  )
where slug = 'imo-mepc-iswg-ghg-engagement';

insert into public.project_resources (project_id, resource_title, resource_url, resource_type)
select projects.id, resources.resource_title, resources.resource_url, resources.resource_type
from public.projects
join (
  values
    ('patna-phase-iii-2026', 'Browse PATNA publications and evidence outputs', '/publications', 'Publication archive'),
    ('patna-phase-iii-2026', 'Related project: IMO technical engagement', '/projects/imo-mepc-iswg-ghg-engagement', 'Related project'),
    ('leap-phase-ii', 'Related convening: Dakar Francophone Regional Workshop', '/projects/dakar-francophone-workshop-2025', 'Related project'),
    ('leap-phase-ii', 'Browse PATNA publications linked to LEAP', '/publications', 'Publication archive'),
    ('leap-phase-i', 'Browse PATNA publications linked to LEAP', '/publications', 'Publication archive'),
    ('dakar-francophone-workshop-2025', 'Browse related PATNA publications and workshop outputs', '/publications', 'Publication archive'),
    ('african-strategic-summit-abuja-2025', 'Browse related PATNA publications and evidence outputs', '/publications', 'Publication archive'),
    ('africa-climate-summit-ii-2025', 'Browse related PATNA publications and insights', '/publications', 'Publication archive'),
    ('patna-town-hall-december-2025', 'Related project: 2026 regional workplan', '/projects/patna-phase-iii-2026', 'Related project'),
    ('imo-mepc-iswg-ghg-engagement', 'Related project: 2026 regional workplan', '/projects/patna-phase-iii-2026', 'Related project')
) as resources (slug, resource_title, resource_url, resource_type)
  on resources.slug = projects.slug
where not exists (
  select 1
  from public.project_resources existing
  where existing.project_id = projects.id
);
