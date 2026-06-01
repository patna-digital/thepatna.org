import { mediaAssets } from "@/lib/public-media";

function list(items = []) {
  if (!items.length) return "";
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function paragraphs(items = []) {
  return items.map((item) => `<p>${item}</p>`).join("");
}

function section(title, content) {
  return `<h2>${title}</h2>${content}`;
}

function body(sections = []) {
  return sections.join("");
}

function resource(id, resource_title, resource_url, resource_type) {
  return { id, resource_title, resource_url, resource_type };
}

function highlight(value, label) {
  return { value, label };
}

export const PROJECT_CONTENT_OVERRIDES = {
  "patna-phase-iii-2026": {
    cover_image_url: mediaAssets.acs2Panel.src,
    cover_image_alt: mediaAssets.acs2Panel.alt,
    highlights: [
      highlight("5", "core workstreams"),
      highlight("25+", "countries engaged"),
      highlight("2028", "key-result horizon"),
      highlight("10+", "fellows and delegates targeted"),
    ],
    project_resources: [
      resource(
        "phase-iii-publications",
        "Browse PATNA publications and evidence outputs",
        "/publications",
        "Publication archive"
      ),
      resource(
        "phase-iii-imo-engagement",
        "Related project: IMO technical engagement",
        "/projects/imo-mepc-iswg-ghg-engagement",
        "Related project"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "Phase III is the delivery phase that turns LEAP's earlier research and coalition-building into an operating programme. Under the 2026 Shipping Decarbonisation Africa Regional Workplan, PATNA leads in-continent coordination while UCL Energy Institute remains the technical research backbone.",
          "The programme is designed around real IMO decision windows. Rather than treating maritime decarbonisation as a distant policy conversation, this phase focuses on what African delegations, institutions, and partners need now to influence guideline design, funding architecture, and implementation pathways.",
        ])
      ),
      section(
        "Why this phase exists",
        paragraphs([
          "PATNA's end-of-2025 consultation surfaced three persistent bottlenecks: limited pre-negotiation alignment across African states, uneven access to Africa-specific technical evidence, and large differences in negotiation readiness between delegations.",
          "Phase III responds by combining diplomatic coordination, technical modelling, capacity building, and investable implementation pathways in one programme. The aim is not only to strengthen positions at the IMO, but to convert those positions into durable African capability.",
        ])
      ),
      section(
        "What the workplan is delivering",
        list([
          "Continental technical coordination ahead of each ISWG-GHG and MEPC cycle, including structured briefings and coalition support.",
          "Africa-wide evidence on the Net Zero Framework, including reward design, fund governance, lifecycle and compliance issues, and typology-based risk analysis.",
          "Port readiness and corridor case studies that connect policy outcomes to financeable African infrastructure and supply-chain priorities.",
          "A fellowship and coaching model that places trained PATNA members closer to real delegation support and negotiation preparation.",
          "A resource-mobilisation pipeline that helps PATNA sustain African technical coordination beyond a single grant cycle.",
        ])
      ),
      section(
        "What success looks like",
        paragraphs([
          "Success in Phase III means Africa is better organised before negotiations, better equipped during negotiations, and better positioned after negotiations to shape project pipelines, finance readiness, and institutional follow-through.",
          "It also means PATNA is no longer only a project brand associated with LEAP. It becomes a durable secretariat with repeatable rhythms for evidence production, diplomatic coordination, and partnership development.",
        ])
      ),
    ]),
  },
  "leap-phase-ii": {
    cover_image_url: mediaAssets.acs2Hero.src,
    cover_image_alt: mediaAssets.acs2Hero.alt,
    highlights: [
      highlight("19", "participating countries"),
      highlight("25", "member states at Dakar"),
      highlight("15", "resolutions adopted"),
      highlight("4", "working languages at launch"),
    ],
    project_resources: [
      resource(
        "phase-ii-dakar",
        "Related convening: Dakar Francophone Regional Workshop",
        "/projects/dakar-francophone-workshop-2025",
        "Related project"
      ),
      resource(
        "phase-ii-publications",
        "Browse PATNA publications linked to LEAP",
        "/publications",
        "Publication archive"
      ),
      resource(
        "phase-ii-legacy",
        "Legacy PATNA project archive",
        "https://thepatna.org/projects/leading-effective-afrocentric-participation-leap-phase-ii/",
        "Legacy page"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "LEAP Phase II marked the shift from a six-country technical support effort to a continent-facing programme with political reach. It expanded the country base, widened the evidence agenda, and formalised PATNA as a permanent African secretariat rather than a temporary project network.",
          "This phase mattered because the IMO Net Zero Framework debate had moved beyond headline ambition and into questions of impact, funding, readiness, and implementation. African delegations needed stronger evidence, tighter coordination, and a more visible institutional platform.",
        ])
      ),
      section(
        "What changed in Phase II",
        list([
          "The country base expanded from the Phase I case-study group to a broader Africa-wide coalition spanning 19 countries and key regional bodies.",
          "PATNA commissioned new socioeconomic analysis focused on trade, GDP, and food-security implications of the Net Zero Framework.",
          "Ports readiness entered the programme as a practical implementation question, linking diplomatic positions to infrastructure, finance, and project pipeline planning.",
          "The Dakar Francophone Regional Workshop served as PATNA's public launch and a multilingual convening point for 25 African IMO Member States.",
          "Translations in French and Portuguese made the evidence base more usable across non-Anglophone delegations and institutions.",
        ])
      ),
      section(
        "Why it mattered for African influence",
        paragraphs([
          "Phase II helped replace broad concern with structured African positions. The Dakar resolutions, the Abuja summit, and the expanded evidence programme created a clearer negotiating posture heading into MEPC 84 and the next round of guideline design.",
          "Just as importantly, the phase established PATNA as a recognisable institutional home for this work. That gave partners, delegates, and funders a more durable point of contact than a single workshop, report, or project cycle.",
        ])
      ),
      section(
        "How Phase II set up Phase III",
        paragraphs([
          "Phase III inherits the coalition, legitimacy, and evidence agenda built here. The move into active workstreams, fellowship deployment, and long-horizon implementation support would have been much harder without the institutional formalisation achieved in 2025.",
          "In that sense, Phase II was both an expansion phase and a transition phase: it scaled the work, proved demand, and created the operating platform that PATNA now uses for delivery.",
        ])
      ),
    ]),
  },
  "leap-phase-i": {
    cover_image_url: mediaAssets.acs2Delegates.src,
    cover_image_alt: mediaAssets.acs2Delegates.alt,
    highlights: [
      highlight("6", "case-study countries"),
      highlight("4", "core technical tasks"),
      highlight("2024", "foundational delivery year"),
      highlight("1", "Pan-African network launched"),
    ],
    project_resources: [
      resource(
        "phase-i-publications",
        "Browse PATNA publications linked to LEAP",
        "/publications",
        "Publication archive"
      ),
      resource(
        "phase-i-legacy",
        "Legacy PATNA project archive",
        "https://thepatna.org/projects/leading-effective-afrocentric-participation-leap-project-phase-i/",
        "Legacy page"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "LEAP Phase I was the foundation. It concentrated on six case-study countries and built the first Africa-generated evidence base that delegations could use in IMO greenhouse-gas negotiations.",
          "At this stage, the goal was not institutional scale. It was to prove that Africa-specific analysis, produced with local and regional expertise, could materially strengthen participation in a global policy process that often moved faster than many delegations' technical support systems.",
        ])
      ),
      section(
        "What Phase I produced",
        list([
          "National shipping emissions inventories for the six case-study countries.",
          "Economic potential and transition-readiness assessments focused on low-carbon shipping opportunities.",
          "Africa-centred interpretation of Comprehensive Impact Assessment findings and related IMO policy implications.",
          "Independent cost-impact case studies to test how proposed measures could affect specific countries and trade realities.",
          "Landscape analysis, stakeholder mapping, and an early in-region convening that seeded the broader PATNA network.",
        ])
      ),
      section(
        "Why it mattered",
        paragraphs([
          "Phase I helped delegations move from reacting to external analysis toward engaging with their own evidence base. That shift matters because negotiating confidence is stronger when countries can point to locally grounded analysis rather than only challenge someone else's model.",
          "It also created the relationships that later became PATNA's operating network. The research outputs and the human network were both foundational deliverables, even if only one looked like a traditional report.",
        ])
      ),
      section(
        "What carried forward",
        paragraphs([
          "The inventories, country studies, and policy interpretation frameworks built in Phase I became inputs for the wider Africa-wide modelling and institutional growth that followed in Phase II.",
          "Without Phase I, the later expansion would have lacked both an evidence baseline and a credible demonstration that this kind of Afrocentric technical support could deliver value.",
        ])
      ),
    ]),
  },
  "dakar-francophone-workshop-2025": {
    cover_image_url: mediaAssets.dakarWorkshop.src,
    cover_image_alt: mediaAssets.dakarWorkshop.alt,
    highlights: [
      highlight("25", "member states represented"),
      highlight("100+", "participants convened"),
      highlight("4", "working languages"),
      highlight("15", "resolutions adopted"),
    ],
    deliverables: [
      "Adopted 15 resolutions to guide African engagement ahead of MEPC 84.",
      "Publicly launched PATNA as a permanent African secretariat.",
      "Created a multilingual forum for governments, experts, and maritime stakeholders to align around the Net Zero Framework.",
    ],
    project_resources: [
      resource(
        "dakar-publications",
        "Browse related PATNA publications and workshop outputs",
        "/publications",
        "Publication archive"
      ),
      resource(
        "dakar-legacy",
        "Legacy PATNA event coverage",
        "https://thepatna.org/patnaevents/dakar-maritime-decarbonisation-workshop/",
        "Event coverage"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "The Dakar Francophone Regional Workshop was a turning point for PATNA's public profile and for Africa's multilingual coordination around maritime decarbonisation. It convened African IMO Member States, regional actors, and technical stakeholders around the structure and implications of the Net Zero Framework.",
          "The workshop did more than explain policy. It created a space where technical evidence, diplomatic positioning, and language accessibility were treated as part of the same coordination problem.",
        ])
      ),
      section(
        "What happened in Dakar",
        list([
          "Delegates and stakeholders examined the practical implications of the Net Zero Framework for African states.",
          "The convening addressed MARPOL Annex VI awareness, regulatory readiness, and the implications of upcoming IMO guideline work.",
          "Interpretation and materials were structured across English, French, Portuguese, and Arabic to widen effective participation.",
          "PATNA used the moment to formalise its public launch and signal long-term institutional intent.",
        ])
      ),
      section(
        "Why the workshop mattered",
        paragraphs([
          "Dakar translated a growing network into visible continental coordination. The 15 resolutions created a clearer shared reference point for African participation ahead of MEPC 84.",
          "It also demonstrated that PATNA's role is not limited to research production. The organisation can convene, translate, align, and prepare actors across linguistic and institutional divides.",
        ])
      ),
    ]),
  },
  "african-strategic-summit-abuja-2025": {
    cover_image_url: mediaAssets.abujaSummit.src,
    cover_image_alt: mediaAssets.abujaSummit.alt,
    highlights: [
      highlight("2", "summit days"),
      highlight("Africa-wide", "policy alignment"),
      highlight("IMO", "negotiation focus"),
      highlight("LEAP II", "programme milestone"),
    ],
    deliverables: [
      "Strengthened negotiation readiness among policymakers, negotiators, and sector stakeholders.",
      "Helped consolidate a stronger African position on shipping decarbonisation ahead of later convenings and IMO sessions.",
      "Reinforced the link between technical evidence and diplomatic coordination.",
    ],
    project_resources: [
      resource(
        "abuja-publications",
        "Browse related PATNA publications and evidence outputs",
        "/publications",
        "Publication archive"
      ),
      resource(
        "abuja-legacy",
        "Legacy PATNA event coverage",
        "https://thepatna.org/patnaevents/african-strategic-summit-on-shipping-decarbonisation/",
        "Event coverage"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "The Abuja Strategic Summit focused on alignment: bringing African maritime policymakers, negotiators, and industry voices into a more coordinated conversation about shipping decarbonisation.",
          "As a LEAP Phase II milestone, it linked evidence production to the practical politics of negotiating posture, coalition-building, and leadership development.",
        ])
      ),
      section(
        "What the summit achieved",
        list([
          "Created space for strategic discussion before higher-stakes regional and global engagements.",
          "Helped participants translate technical findings into negotiation language and political priorities.",
          "Strengthened the case for a more coordinated African position on decarbonisation, transition readiness, and equity.",
        ])
      ),
      section(
        "Why it mattered",
        paragraphs([
          "Summits like Abuja matter because evidence alone rarely changes negotiating outcomes. Delegations also need trust, shared framing, and political confidence.",
          "Abuja helped build that connective tissue and prepared the ground for broader coalition moments, including Dakar and the continuing work around IMO guideline design.",
        ])
      ),
    ]),
  },
  "africa-climate-summit-ii-2025": {
    cover_image_url: mediaAssets.acs2Hero.src,
    cover_image_alt: mediaAssets.acs2Hero.alt,
    highlights: [
      highlight("2", "PATNA-facilitated sessions"),
      highlight("Climate finance", "core framing"),
      highlight("Ocean-climate", "policy bridge"),
      highlight("Africa-wide", "public visibility"),
    ],
    deliverables: [
      "Positioned maritime decarbonisation within wider African resilience, finance, and industrialisation debates.",
      "Extended PATNA's visibility beyond maritime-only audiences into climate and development conversations.",
      "Strengthened the link between shipping policy and just-transition narratives.",
    ],
    project_resources: [
      resource(
        "acs2-publications",
        "Browse related PATNA publications and insights",
        "/publications",
        "Publication archive"
      ),
      resource(
        "acs2-legacy",
        "Legacy PATNA ACS2 coverage",
        "https://thepatna.org/ports-people-and-pathways-africas-just-maritime-transition-at-the-africa-climate-summit-ii-acs2/",
        "Event coverage"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "PATNA's presence at Africa Climate Summit II widened the frame for maritime decarbonisation. Rather than treating the issue as a narrow technical agenda, PATNA connected it to African resilience, green development, climate finance, and industrial opportunity.",
          "That shift is strategically important because shipping policy is increasingly shaped by conversations that sit across climate, infrastructure, trade, and development institutions.",
        ])
      ),
      section(
        "What happened",
        list([
          "PATNA co-facilitated sessions in the Africa Ocean-Climate Solutions Pavilion.",
          "The organisation framed maritime transition as part of an Africa-led development and just-transition agenda.",
          "The convening helped socialise PATNA's evidence and positioning in a broader continental climate-policy audience.",
        ])
      ),
      section(
        "Why it mattered",
        paragraphs([
          "Events like ACS2 help PATNA reach decision-makers and partners who may never attend a maritime-only negotiation meeting but still influence finance, infrastructure, and climate priorities.",
          "That wider visibility supports partnership-building and helps move PATNA's work from technical specialist circles into cross-sector strategy conversations.",
        ])
      ),
    ]),
  },
  "patna-town-hall-december-2025": {
    cover_image_url: mediaAssets.acs2Audience.src,
    cover_image_alt: mediaAssets.acs2Audience.alt,
    highlights: [
      highlight("1", "member-wide consultation"),
      highlight("2026", "programme shaped"),
      highlight("NZF", "priority focus"),
      highlight("Africa-wide", "member participation"),
    ],
    deliverables: [
      "Captured member insight on food security, implementation timelines, and Africa-specific evidence gaps.",
      "Confirmed regional coordination as a high-priority capacity need across the network.",
      "Directly informed the design and prioritisation of the 2026 workplan.",
    ],
    project_resources: [
      resource(
        "townhall-publications",
        "Browse PATNA publications and programme outputs",
        "/publications",
        "Publication archive"
      ),
      resource(
        "townhall-phase-iii",
        "Related project: 2026 regional workplan",
        "/projects/patna-phase-iii-2026",
        "Related project"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "The End-of-Year Town Hall was a member-driven checkpoint between LEAP Phase II and the 2026 delivery cycle. It gave PATNA a structured way to listen back to its network before converting 2025 momentum into the next phase of work.",
          "This mattered because PATNA's value depends not only on producing evidence, but also on correctly identifying where African delegations and experts still feel most constrained.",
        ])
      ),
      section(
        "What members surfaced",
        list([
          "Food security remained a central concern in how African actors interpreted Net Zero Framework outcomes.",
          "Implementation timelines and readiness were more pressing than abstract legal uncertainty for many participants.",
          "Members pointed to persistent gaps in Africa-specific technical evidence and coordination support.",
        ])
      ),
      section(
        "Why it mattered",
        paragraphs([
          "The Town Hall translated consultation into programme design. Its findings fed directly into the structure of Phase III, especially the emphasis on coordination, evidence pipelines, and targeted capacity support.",
          "It also demonstrated that PATNA can use its community as a strategic signal source, not only as an audience for outputs.",
        ])
      ),
    ]),
  },
  "imo-mepc-iswg-ghg-engagement": {
    cover_image_url: mediaAssets.acs2Roundtable.src,
    cover_image_alt: mediaAssets.acs2Roundtable.alt,
    highlights: [
      highlight("2024-present", "ongoing support window"),
      highlight("IMO", "primary decision arena"),
      highlight("Delegations", "briefing support"),
      highlight("Guidelines", "focus of engagement"),
    ],
    deliverables: [
      "Prepared decision-ready briefings for African capitals and negotiators.",
      "Supported delegates as guideline discussions moved into reward design, fund architecture, compliance, and lifecycle questions.",
      "Converted fast-moving technical debates into usable African negotiation intelligence.",
    ],
    project_resources: [
      resource(
        "imo-publications",
        "Browse PATNA publications and policy outputs",
        "/publications",
        "Publication archive"
      ),
      resource(
        "imo-phase-iii",
        "Related project: 2026 regional workplan",
        "/projects/patna-phase-iii-2026",
        "Related project"
      ),
    ],
    body: body([
      section(
        "Overview",
        paragraphs([
          "PATNA's IMO technical engagement is the continuous thread that connects evidence production to actual negotiating processes. Across MEPC sessions and ISWG-GHG intersessionals, the organisation supports African delegations with briefing, analysis, and coordination.",
          "This work is less visible than a summit or workshop, but it is where many of the decisive technical choices are interpreted, contested, and turned into national positions.",
        ])
      ),
      section(
        "What this support looks like",
        list([
          "Rapid interpretation of draft texts, proposals, and evolving negotiation issues.",
          "Preparation of briefings that translate technical design choices into policy consequences for African states.",
          "Support around submission timelines, pre-meeting coordination, and cross-country alignment where interests overlap.",
        ])
      ),
      section(
        "Why it matters",
        paragraphs([
          "Sustained engagement matters because negotiating influence is cumulative. Delegations are stronger when they arrive with clearer evidence, shared framing, and timely technical interpretation.",
          "This project is where PATNA helps turn its broader programme into practical decision support in the rooms where maritime climate rules are still being shaped.",
        ])
      ),
    ]),
  },
};
