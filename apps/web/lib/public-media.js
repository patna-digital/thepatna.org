/**
 * @typedef {Object} MediaAsset
 * @property {string} id
 * @property {"image"|"gallery"|"embed"} kind
 * @property {string} src
 * @property {string=} posterSrc
 * @property {string} sourceUrl
 * @property {string} credit
 * @property {string} licenseNote
 * @property {string} alt
 * @property {string=} caption
 */

/**
 * @typedef {Object} PageMediaSection
 * @property {string} page
 * @property {string} slot
 * @property {string=} label
 * @property {string=} title
 * @property {string=} subtitle
 * @property {"static"|"slider"|"tabs"|"embed"} interactionMode
 * @property {Array<Object>} items
 */

const SOURCE_PAGES = {
  acs2:
    "https://thepatna.org/ports-people-and-pathways-africas-just-maritime-transition-at-the-africa-climate-summit-ii-acs2/",
  abuja:
    "https://thepatna.org/patnaevents/african-strategic-summit-on-shipping-decarbonisation/",
  dakar: "https://thepatna.org/patnaevents/dakar-maritime-decarbonisation-workshop/",
  wisdom: "https://thepatna.org/cohorts/wisdom-akpalu/",
  resources: "https://thepatna.org/resources/",
};

export const mediaAssets = {
  acs2Hero: {
    id: "acs2-hero",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/a6fe0c8a-e39a-40b9-b336-12560e9398bb-1.webp?fit=1600%2C891&ssl=1",
    sourceUrl: SOURCE_PAGES.acs2,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official ACS2 coverage.",
    alt: "Delegates and participants gathered during PATNA's Africa Climate Summit II coverage.",
    caption: "Delegates convene around Africa's just maritime transition at ACS2.",
  },
  acs2Delegates: {
    id: "acs2-delegates",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/IMG_5165.jpg?resize=800%2C600&ssl=1",
    sourceUrl: SOURCE_PAGES.acs2,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official ACS2 coverage.",
    alt: "Audience members and delegates seated during a PATNA-linked summit session.",
    caption: "Delegates in session during PATNA's ACS2 convening work.",
  },
  acs2Panel: {
    id: "acs2-panel",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/IMG_5298.jpg?resize=800%2C600&ssl=1",
    sourceUrl: SOURCE_PAGES.acs2,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official ACS2 coverage.",
    alt: "Panel-style moment with PATNA and partner participants in discussion.",
    caption: "Technical and policy dialogue anchored in real convening space.",
  },
  acs2Session: {
    id: "acs2-session",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/IMG_5370.jpg?resize=800%2C600&ssl=1",
    sourceUrl: SOURCE_PAGES.acs2,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official ACS2 coverage.",
    alt: "Participants listening and engaging during a PATNA event session.",
    caption: "A real working-room view of PATNA's convening model.",
  },
  acs2Audience: {
    id: "acs2-audience",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/15cf7659-dca0-4889-8d2e-8edf829ca626.jpg?resize=800%2C450&ssl=1",
    sourceUrl: SOURCE_PAGES.acs2,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official ACS2 coverage.",
    alt: "Wide audience shot from a PATNA-related event or discussion.",
    caption: "Audience and room context that grounds the network in real participation.",
  },
  acs2Roundtable: {
    id: "acs2-roundtable",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/36cf1910-e710-4359-92a4-b276465f3689.jpg?resize=800%2C466&ssl=1",
    sourceUrl: SOURCE_PAGES.acs2,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official ACS2 coverage.",
    alt: "Roundtable or panel setting with PATNA participants in discussion.",
    caption: "Roundtable exchange during PATNA's ACS2 presence.",
  },
  abujaSummit: {
    id: "abuja-summit",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/abuja-summit.jpeg?fit=800%2C534&ssl=1",
    sourceUrl: SOURCE_PAGES.abuja,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official Abuja summit page.",
    alt: "Promotional or event photo from the African Strategic Summit on Shipping Decarbonisation in Abuja.",
    caption: "African Strategic Summit on Shipping Decarbonisation, Abuja.",
  },
  abujaStage: {
    id: "abuja-stage",
    kind: "image",
    src: "https://i0.wp.com/thepatna.org/wp-content/uploads/2025/09/Maritimesafety.webp?fit=1681%2C921&ssl=1",
    sourceUrl: SOURCE_PAGES.abuja,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official Abuja summit page.",
    alt: "Summit-stage or banner-style image tied to maritime safety and decarbonisation work.",
    caption: "Abuja summit stage imagery tied to maritime transition and safety.",
  },
  dakarWorkshop: {
    id: "dakar-workshop",
    kind: "image",
    src: "https://thepatna.org/wp-content/uploads/2025/09/Dakar.jpeg",
    sourceUrl: SOURCE_PAGES.dakar,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official Dakar workshop page.",
    alt: "Dakar Maritime Decarbonisation Workshop poster or event visual.",
    caption: "Dakar Maritime Decarbonisation Workshop.",
  },
  wisdomPortrait: {
    id: "wisdom-akpalu",
    kind: "image",
    src: "https://thepatna.org/wp-content/uploads/2025/10/Wisdom-Akpalu.webp",
    sourceUrl: SOURCE_PAGES.wisdom,
    credit: "The PATNA Initiative",
    licenseNote: "Used from PATNA official cohort profile page.",
    alt: "Portrait of Wisdom Akpalu from PATNA's cohort page.",
    caption: "Real member and leadership portrait from PATNA's public cohort profiles.",
  },
};

export const projectMediaBySlug = {
  "patna-phase-iii-2026": mediaAssets.acs2Panel,
  "leap-phase-ii": mediaAssets.acs2Hero,
  "leap-phase-i": mediaAssets.acs2Delegates,
  "abuja-summit": mediaAssets.abujaSummit,
  "dakar-workshop": mediaAssets.dakarWorkshop,
};

export const insightMediaBySlug = {
  "kenyas-national-maritime-ghg-emissions-inventory": mediaAssets.abujaStage,
  "dakar-decarbonization-workshop-advancing-africas-maritime-sector-to-net-zero":
    mediaAssets.dakarWorkshop,
  "report-of-the-second-extraordinary-session-of-the-marine-environment-protection-committee-mepc-es-2":
    mediaAssets.acs2Audience,
};

export const eventMediaBySlug = {
  "african-strategic-summit-on-shipping-decarbonisation": mediaAssets.abujaSummit,
  "dakar-maritime-decarbonisation-workshop": mediaAssets.dakarWorkshop,
  "african-climate-summit-ii-acs2": mediaAssets.acs2Hero,
  "8th-aama-conference-safeguarding-our-ocean-promoting-decarbonization": mediaAssets.acs2Panel,
  "mepc-es-2-2nd-extraordinary-session-imo-net-zero-framework": mediaAssets.acs2Audience,
  "un-climate-change-conference-cop30": mediaAssets.acs2Roundtable,
  "iswg-ghg-21-intersessional-working-group-on-ghg-emissions-from-ships": mediaAssets.acs2Hero,
  "mepc-84-marine-environment-protection-committee-84th-session": mediaAssets.acs2Hero,
  "our-ocean-conference-2026-ooc11-our-ocean-our-heritage-our-future":
    mediaAssets.acs2Panel,
  "un-climate-change-conference-cop31": mediaAssets.acs2Roundtable,
  "mepc-85-marine-environment-protection-committee-85th-session": mediaAssets.acs2Hero,
  "mepc-es-2-resumed-resumed-extraordinary-session-imo-net-zero-framework":
    mediaAssets.acs2Audience,
};

export function getEventMedia(slug) {
  return eventMediaBySlug[slug] || mediaAssets.acs2Hero;
}

export const publicPageMedia = {
  home: {
    hero: {
      page: "home",
      slot: "hero",
      interactionMode: "slider",
      items: [
        {
          ...mediaAssets.acs2Hero,
          title: "Africa Climate Summit II",
          body:
            "At ACS2 in Addis Ababa, PATNA helped position maritime decarbonisation as an African question of resilience, industrialisation, and just transition.",
        },
        {
          ...mediaAssets.abujaSummit,
          title: "African Strategic Summit",
          body:
            "The Abuja summit brought policymakers, negotiators, and industry leaders together around a stronger shared African position on shipping decarbonisation.",
        },
        {
          ...mediaAssets.dakarWorkshop,
          title: "Dakar Workshop",
          body:
            "In Dakar, PATNA convened more than 100 delegates from 25 African IMO member states for a deeper technical exchange on equitable transition.",
        },
      ],
    },
    featuredMoments: {
      page: "home",
      slot: "featured-moments",
      label: "Featured moments",
      title: "Convening Africa's climate and maritime agenda",
      subtitle:
        "From Addis Ababa to Abuja and Dakar, PATNA's public record shows policy dialogue, technical exchange, and coalition-building in action.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.acs2Delegates,
          title: "Delegates in session",
          body:
            "PATNA's convenings bring together delegates, experts, and institutions around the policy choices shaping Africa's transition pathways.",
        },
        {
          ...mediaAssets.acs2Panel,
          title: "Technical exchange",
          body:
            "The network's value is practical as well as political: research, analysis, and working sessions that help African voices intervene with confidence.",
        },
        {
          ...mediaAssets.acs2Session,
          title: "Working-room context",
          body:
            "PATNA's public presence is strongest when it stays anchored in the real rooms and relationships where the work happens.",
        },
      ],
    },
  },
  about: {
    mission: {
      page: "about",
      slot: "mission",
      interactionMode: "static",
      label: "Network in practice",
      title: "PATNA is built around people, convenings, and long-term strategic work",
      subtitle:
        "PATNA's public story is strongest when mission language sits beside the people, institutions, and rooms that make the work visible.",
      quote:
        "To harness the collective expertise of African professionals to generate, coordinate, and apply evidence-based strategies.",
      body:
        "What began as a maritime decarbonisation initiative has grown into a broader network for climate action, energy transition, and institutional readiness across Africa.",
      asset: mediaAssets.acs2Roundtable,
    },
    portraits: {
      page: "about",
      slot: "portraits",
      label: "Network in practice",
      title: "Leadership, expertise, and public service",
      subtitle:
        "PATNA's public pages make the people behind the network visible: practitioners, researchers, negotiators, and institutional leaders.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.wisdomPortrait,
          title: "Expertise with public visibility",
          body:
            "Profile pages show that PATNA's strength is not only in programmes, but in the African professionals who bring technical credibility to the work.",
        },
        {
          ...mediaAssets.acs2Delegates,
          title: "Collective representation",
          body:
            "PATNA's influence comes from combining individual expertise with collective presence in regional and global policy forums.",
        },
      ],
    },
  },
  insights: {
    featured: {
      page: "insights",
      slot: "featured",
      label: "Featured from PATNA",
      title: "Knowledge products grounded in lived process",
      subtitle:
        "Reports, briefs, and commentary carry more weight when they sit alongside the delegations, workshops, and working sessions that shaped them.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.abujaStage,
          title: "Evidence for implementation",
          body:
            "PATNA's publications are meant to inform real policy choices, negotiation positions, and implementation pathways, not sit apart from them.",
        },
        {
          ...mediaAssets.acs2Audience,
          title: "Regional participation",
          body:
            "The network's publications reflect a wider process of regional consultation, dialogue, and public positioning across African institutions.",
        },
        {
          ...mediaAssets.acs2Roundtable,
          title: "Technical coordination",
          body:
            "PATNA's reports and briefs emerge from technical coordination, not abstract commentary.",
        },
      ],
    },
  },
  events: {
    gallery: {
      page: "events",
      slot: "gallery",
      label: "Event gallery",
      title: "PATNA convenings and the wider policy calendar",
      subtitle:
        "The events archive combines PATNA-led summits and workshops with the international policy moments shaping African maritime and climate strategy.",
      interactionMode: "slider",
      items: [
        mediaAssets.abujaSummit,
        mediaAssets.dakarWorkshop,
        mediaAssets.acs2Hero,
        mediaAssets.acs2Panel,
      ],
    },
  },
  community: {
    stories: {
      page: "community",
      slot: "stories",
      label: "Community in practice",
      title: "A community grounded in people, institutions, and shared purpose",
      subtitle:
        "PATNA's community is a network of experts, institutions, and working relationships strengthened through shared evidence and regular convenings.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.wisdomPortrait,
          title: "Real member presence",
          body:
            "PATNA's public community highlights the people who contribute expertise, leadership, and credibility across the network.",
        },
        {
          ...mediaAssets.acs2Delegates,
          title: "Convening as community",
          body:
            "Community at PATNA is not just digital access. It is shared participation, room dynamics, and coordinated presence across institutions.",
        },
        {
          ...mediaAssets.acs2Session,
          title: "Working groups in motion",
          body:
            "Cohorts, working groups, and collaborative exchanges are what turn PATNA from a network name into a functioning professional community.",
        },
      ],
    },
  },
  workWithUs: {
    feature: {
      page: "work-with-us",
      slot: "feature",
      label: "Partnership context",
      title: "Partnerships begin with real work already underway",
      subtitle:
        "PATNA works with public institutions, researchers, funders, and strategic partners across convenings, technical analysis, and long-term programme development.",
      interactionMode: "static",
      quote:
        "Collaboration is strongest when it builds on shared evidence, clear priorities, and visible public work.",
      body:
        "Use this page to choose the route that best matches the work you want to advance with PATNA: technical support, a strategic partnership, or a co-created initiative.",
      asset: mediaAssets.abujaStage,
    },
  },
  contact: {
    feature: {
      page: "contact",
      slot: "feature",
      label: "Meet the network",
      title: "Stay in touch with the PATNA team",
      subtitle:
        "Clear contact routes matter because PATNA works across institutions, countries, and professional communities.",
      interactionMode: "static",
      quote:
        "Sometimes the right next step is a conversation that connects evidence, policy needs, and the people who can move the work forward.",
      body:
        "Email, phone, and social channels are the clearest way to reach PATNA and start the right conversation with the team.",
      asset: mediaAssets.acs2Panel,
    },
  },
};
