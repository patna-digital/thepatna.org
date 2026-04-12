import {
  getAfricanCountryByCode,
  getAfricanCountryByName,
} from "@/lib/africa-countries";

export const FOOTPRINT_PHASES = [
  { key: "all", label: "All" },
  { key: "phase-i", label: "Phase I" },
  { key: "phase-ii", label: "Phase II" },
  { key: "phase-iii", label: "Phase III" },
];

export const FOOTPRINT_HUB_TYPES = [
  { value: "convening", label: "Convening" },
  { value: "partner", label: "Partner anchor" },
  { value: "secretariat", label: "Secretariat" },
];

const PHASE_ORDER = {
  "phase-i": 1,
  "phase-ii": 2,
  "phase-iii": 3,
};

const PROJECT_PHASE_OVERRIDES = {
  "leap-phase-i": "Phase I",
  "leap-phase-ii": "Phase II",
  "patna-phase-iii-2026": "Phase III",
  "dakar-francophone-workshop-2025": "Phase II",
  "african-strategic-summit-abuja-2025": "Phase II",
  "africa-climate-summit-ii-2025": "Phase II",
};

export const PROJECT_FOOTPRINT_HUB_OVERRIDES = {
  "patna-phase-iii-2026": [
    {
      id: "phase-iii-secretariat",
      hub_type: "secretariat",
      label: "PATNA Secretariat",
      city: "Victoria",
      country_code: "SYC",
      latitude: -4.6191,
      longitude: 55.4513,
      phase_label: "Phase III",
      description:
        "PATNA's public secretariat base in Seychelles anchors ongoing coordination, partnership development, and programme delivery across the active workplan.",
      sort_order: 10,
    },
    {
      id: "phase-iii-au-partner",
      hub_type: "partner",
      label: "African Union and regional coordination",
      city: "Addis Ababa",
      country_code: "ETH",
      latitude: 9.045,
      longitude: 38.92,
      phase_label: "Phase III",
      description:
        "PATNA's current workplan links technical evidence to continental policy coordination with African Union and regional maritime stakeholders.",
      sort_order: 20,
    },
  ],
  "dakar-francophone-workshop-2025": [
    {
      id: "dakar-convening",
      hub_type: "convening",
      label: "Dakar Francophone Regional Workshop",
      city: "Dakar",
      country_code: "SEN",
      latitude: 14.7167,
      longitude: -17.4677,
      phase_label: "Phase II",
      description:
        "Dakar marked PATNA's public launch and brought together 25 African IMO Member States around multilingual alignment on the Net Zero Framework.",
      sort_order: 10,
    },
  ],
  "african-strategic-summit-abuja-2025": [
    {
      id: "abuja-convening",
      hub_type: "convening",
      label: "African Strategic Summit",
      city: "Abuja",
      country_code: "NGA",
      latitude: 9.0765,
      longitude: 7.3986,
      phase_label: "Phase II",
      description:
        "The Abuja Summit deepened negotiation readiness and helped convert technical evidence into a stronger shared African position on shipping decarbonisation.",
      sort_order: 10,
    },
  ],
  "africa-climate-summit-ii-2025": [
    {
      id: "acs2-convening",
      hub_type: "convening",
      label: "Africa Climate Summit II",
      city: "Addis Ababa",
      country_code: "ETH",
      latitude: 8.9806,
      longitude: 38.7578,
      phase_label: "Phase II",
      description:
        "At ACS2, PATNA connected maritime decarbonisation to climate finance, African resilience, and just-transition narratives in a wider continental forum.",
      sort_order: 10,
    },
  ],
};

const MAP_PROJECT_SLUGS = new Set([
  "leap-phase-i",
  "leap-phase-ii",
  "patna-phase-iii-2026",
  "dakar-francophone-workshop-2025",
  "african-strategic-summit-abuja-2025",
  "africa-climate-summit-ii-2025",
]);

export function getFootprintPhaseKey(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized.includes("iii") || normalized.includes("3")) {
    return "phase-iii";
  }

  if (normalized.includes("ii") || normalized.includes("2")) {
    return "phase-ii";
  }

  if (normalized.includes("i") || normalized.includes("1")) {
    return "phase-i";
  }

  return null;
}

export function getFootprintPhaseLabel(phaseKey) {
  return FOOTPRINT_PHASES.find((phase) => phase.key === phaseKey)?.label || "";
}

function getProjectDefaultPhaseLabel(project) {
  return PROJECT_PHASE_OVERRIDES[project.slug] || null;
}

function getLatestPhaseKey(phaseKeys = []) {
  return [...phaseKeys].sort((a, b) => (PHASE_ORDER[a] || 0) - (PHASE_ORDER[b] || 0)).at(-1) || null;
}

function buildProjectHref(slug) {
  return `/projects/${slug}`;
}

function normalizeHub(project, hub, index) {
  const country =
    getAfricanCountryByCode(hub.country_code) ||
    getAfricanCountryByName(hub.country) ||
    getAfricanCountryByName(hub.city);

  if (!country) {
    return null;
  }

  const latitude = Number.parseFloat(hub.latitude);
  const longitude = Number.parseFloat(hub.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  const phaseKey = getFootprintPhaseKey(hub.phase_label || getProjectDefaultPhaseLabel(project));
  if (!phaseKey) {
    return null;
  }

  return {
    id: hub.id || `${project.slug}-${hub.hub_type}-${index}`,
    kind: hub.hub_type,
    label: hub.label,
    city: hub.city || country.name,
    countryCode: country.code,
    countryName: country.name,
    coordinates: [longitude, latitude],
    phaseKeys: [phaseKey],
    phaseLabels: [getFootprintPhaseLabel(phaseKey)],
    description: hub.description || project.summary || "",
    relatedProjectHref: buildProjectHref(project.slug),
    relatedProjectSlug: project.slug,
    relatedProjectTitle: project.title,
    relatedUrl: hub.related_url || null,
    sortOrder: hub.sort_order ?? index,
  };
}

function resolveProjectHubs(project) {
  if (Array.isArray(project.project_footprint_hubs) && project.project_footprint_hubs.length > 0) {
    return project.project_footprint_hubs;
  }

  return PROJECT_FOOTPRINT_HUB_OVERRIDES[project.slug] || [];
}

export function buildLeapSeriesFootprint(projects = []) {
  const relevantProjects = projects.filter((project) => MAP_PROJECT_SLUGS.has(project.slug));
  const countriesByCode = new Map();

  for (const project of relevantProjects) {
    for (const countryRow of project.project_countries || []) {
      const country =
        getAfricanCountryByCode(countryRow.country_code) ||
        getAfricanCountryByName(countryRow.country);

      if (!country) {
        continue;
      }

      const phaseKey = getFootprintPhaseKey(
        countryRow.phase_label || getProjectDefaultPhaseLabel(project)
      );

      if (!phaseKey) {
        continue;
      }

      if (!countriesByCode.has(country.code)) {
        countriesByCode.set(country.code, {
          countryCode: country.code,
          name: country.name,
          phaseKeys: new Set(),
          phaseLabels: new Set(),
          relatedProjects: new Map(),
          sortOrder: countryRow.sort_order ?? 0,
        });
      }

      const current = countriesByCode.get(country.code);
      current.phaseKeys.add(phaseKey);
      current.phaseLabels.add(getFootprintPhaseLabel(phaseKey));
      current.relatedProjects.set(project.slug, {
        href: buildProjectHref(project.slug),
        slug: project.slug,
        title: project.title,
      });
      current.sortOrder = Math.min(current.sortOrder, countryRow.sort_order ?? current.sortOrder);
    }
  }

  const countries = Array.from(countriesByCode.values())
    .map((country) => {
      const phaseKeys = Array.from(country.phaseKeys);
      const relatedProjects = Array.from(country.relatedProjects.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      const latestPhaseKey = getLatestPhaseKey(phaseKeys);

      return {
        countryCode: country.countryCode,
        latestPhaseKey,
        name: country.name,
        phaseKeys,
        phaseLabels: Array.from(country.phaseLabels),
        relatedProjects,
        relatedProjectSlugs: relatedProjects.map((project) => project.slug),
        sortOrder: country.sortOrder,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const projectsBySlug = Object.fromEntries(relevantProjects.map((p) => [p.slug, p]));

  // Build hubs from all override entries regardless of whether the project exists in the DB.
  // When a project IS in the DB and has its own hub rows, those take priority; otherwise fall
  // back to the hardcoded overrides so the map renders even before projects are published.
  const hubs = Object.entries(PROJECT_FOOTPRINT_HUB_OVERRIDES)
    .flatMap(([slug, overrideHubs]) => {
      const project = projectsBySlug[slug] || { slug, title: slug, summary: "" };
      const hubList =
        Array.isArray(project.project_footprint_hubs) && project.project_footprint_hubs.length > 0
          ? project.project_footprint_hubs
          : overrideHubs;
      return hubList.map((hub, index) => normalizeHub(project, hub, index));
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  const phaseThreeProject = relevantProjects.find((project) => project.slug === "patna-phase-iii-2026");
  const phaseThreeCountriesMetric =
    phaseThreeProject?.highlights?.find((item) => /countries/i.test(item.label || ""))?.value || "25+";

  return {
    countries,
    hubs,
    metrics: [
      { label: "countries with documented LEAP reach", value: String(countries.length) },
      { label: "African hubs and convenings mapped", value: String(hubs.length) },
      { label: "countries targeted in the current workplan", value: phaseThreeCountriesMetric },
    ],
  };
}
