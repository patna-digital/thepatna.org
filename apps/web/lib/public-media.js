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
    caption: "Audience and room context that grounds the platform in real participation.",
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
  "leap-phase-ii": mediaAssets.acs2Hero,
  "leap-phase-i": mediaAssets.acs2Delegates,
  "abuja-summit": mediaAssets.abujaSummit,
  "dakar-workshop": mediaAssets.dakarWorkshop,
};

export const insightMediaBySlug = {
  "african-positions-on-imo-net-zero-framework": mediaAssets.abujaStage,
  "leap-phase-ii-interim-findings": mediaAssets.acs2Roundtable,
  "why-sids-need-a-stronger-voice": mediaAssets.acs2Audience,
};

export const eventMediaBySlug = {
  "policy-cohort-monthly-sync": mediaAssets.acs2Session,
  "mepc-83": mediaAssets.abujaStage,
  "dakar-maritime-prep-workshop": mediaAssets.dakarWorkshop,
  "african-strategic-summit-on-shipping-decarbonisation": mediaAssets.abujaSummit,
  "dakar-maritime-decarbonisation-workshop": mediaAssets.dakarWorkshop,
  "african-climate-summit-ii-acs2": mediaAssets.acs2Hero,
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
          body: "PATNA's public website should show real convening work, not abstract placeholders.",
        },
        {
          ...mediaAssets.abujaSummit,
          title: "Abuja Summit",
          body: "Flagship moments can rotate through official PATNA event coverage and summit imagery.",
        },
        {
          ...mediaAssets.dakarWorkshop,
          title: "Dakar Workshop",
          body: "Event-led imagery gives programme pages proof, texture, and institutional memory.",
        },
      ],
    },
    featuredMoments: {
      page: "home",
      slot: "featured-moments",
      label: "Featured moments",
      title: "Real people, real rooms, real momentum",
      subtitle:
        "These moments come directly from PATNA's official event and article coverage and give the homepage more evidence-led storytelling.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.acs2Delegates,
          title: "Delegates in session",
          body: "Use summit-floor imagery to show the scale and seriousness of PATNA's convening work.",
        },
        {
          ...mediaAssets.acs2Panel,
          title: "Technical exchange",
          body: "Discussion-led imagery helps the website feel like a network in motion, not just a static brochure.",
        },
        {
          ...mediaAssets.acs2Session,
          title: "Working-room context",
          body: "Candid event imagery creates far more credibility than decorative illustrations or synthetic backdrops.",
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
        "About should combine mission language with imagery from real PATNA rooms and real PATNA people.",
      quote:
        "The network becomes legible when the website shows actual participants, not just programme abstractions.",
      body: "This photo/quote split should anchor the page in real institutional work before the cohort summaries.",
      asset: mediaAssets.acs2Roundtable,
    },
    portraits: {
      page: "about",
      slot: "portraits",
      label: "Network in practice",
      title: "Leadership and expertise should be visible",
      subtitle:
        "Public portraits from PATNA's cohort pages can help about/community sections feel more grounded and human.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.wisdomPortrait,
          title: "Expertise with public visibility",
          body: "Profile imagery can introduce real members and emphasise that PATNA's strength is people as much as programmes.",
        },
        {
          ...mediaAssets.acs2Delegates,
          title: "Collective representation",
          body: "Pair portrait-led storytelling with room shots so the page balances personal and institutional scale.",
        },
      ],
    },
  },
  insights: {
    featured: {
      page: "insights",
      slot: "featured",
      label: "Featured from PATNA",
      title: "Editorial storytelling needs images that carry context",
      subtitle:
        "Use official PATNA article and event imagery to make the insights library feel like an editorial surface instead of a list of text cards.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.abujaStage,
          title: "Policy and implementation",
          body: "Use event-linked imagery to ground policy writing in the real processes and rooms it speaks to.",
        },
        {
          ...mediaAssets.acs2Audience,
          title: "Climate justice and participation",
          body: "Audience and room context help insights pages feel connected to public engagement and regional deliberation.",
        },
        {
          ...mediaAssets.acs2Roundtable,
          title: "Technical coordination",
          body: "Reports and briefs read better when they live beside real-world process imagery rather than icon treatment alone.",
        },
      ],
    },
  },
  events: {
    gallery: {
      page: "events",
      slot: "gallery",
      label: "Event gallery",
      title: "PATNA events should be the most visually grounded pages on the site",
      subtitle:
        "This strip uses official PATNA event pages and article coverage so the events route becomes an image-led archive rather than a text register.",
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
      title: "A living network should look lived-in",
      subtitle:
        "Community pages should show rooms, exchanges, and public member presence so application copy does not have to carry the whole story alone.",
      interactionMode: "tabs",
      items: [
        {
          ...mediaAssets.wisdomPortrait,
          title: "Real member presence",
          body: "Profile imagery can support member-story blocks and make the community page more personal.",
        },
        {
          ...mediaAssets.acs2Delegates,
          title: "Convening as community",
          body: "Community is not just software; it is shared participation, room dynamics, and coordinated presence.",
        },
        {
          ...mediaAssets.acs2Session,
          title: "Working groups in motion",
          body: "Room-level images support the page's explanation of cohorts, working groups, and contribution pathways.",
        },
      ],
    },
  },
  workWithUs: {
    feature: {
      page: "work-with-us",
      slot: "feature",
      label: "Partnership context",
      title: "Support and collaboration requests should connect to real PATNA activity",
      subtitle:
        "One strong image-led block is enough here; it should show that PATNA's work is already happening in real rooms and partnerships.",
      interactionMode: "static",
      quote:
        "The site should show what partnership looks like in practice: convening power, technical exchange, and visible outputs.",
      body: "A single asymmetric photo/text section keeps this page grounded without overwhelming the conversion pathway cards below.",
      asset: mediaAssets.abujaStage,
    },
  },
  contact: {
    feature: {
      page: "contact",
      slot: "feature",
      label: "Meet the network",
      title: "Even contact should feel connected to real PATNA work",
      subtitle:
        "A light-touch media block keeps the contact page from becoming a dead-end form surface.",
      interactionMode: "static",
      quote:
        "Contact is stronger when it sits beside proof of the network's public presence and convening work.",
      body: "Keep this light and human: one image, one caption, clear contact routes.",
      asset: mediaAssets.acs2Panel,
    },
  },
};
