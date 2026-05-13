// ─────────────────────────────────────────────────────────────────────────────
// lib/projects.js
// Data layer for the projects table. Mirrors lib/spaces.js / lib/insights.js.
// ─────────────────────────────────────────────────────────────────────────────

import { PROJECT_CONTENT_OVERRIDES } from "@/lib/project-content";
import { buildProjectRelationshipSummary } from "@/lib/project-relations";
import {
  getAfricanCountryByCode,
  getAfricanCountryByName,
} from "@/lib/africa-countries";
import { PROJECT_FOOTPRINT_HUB_OVERRIDES } from "@/lib/project-footprints";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROJECT_TYPES = [
  { value: "flagship_programme", label: "Flagship Programme" },
  { value: "convening",          label: "Convening" },
  { value: "technical_analysis", label: "Technical Analysis" },
  { value: "capacity_building",  label: "Capacity Building" },
];

export const PROJECT_SECTIONS = [
  { value: "flagship",  label: "Flagship Programmes" },
  { value: "convening", label: "Regional Convenings" },
  { value: "other",     label: "Other Projects" },
];

export const PROJECT_STATUSES = [
  { value: "draft",     label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived",  label: "Archived" },
];

export const PROJECT_STATUS_LABELS = ["Active", "Completed", "Upcoming", "Ongoing"];

export const PROJECT_ICON_TYPES = [
  { value: "globe",    label: "Globe" },
  { value: "team",     label: "Team / People" },
  { value: "layers",   label: "Layers / Stack" },
  { value: "calendar", label: "Calendar" },
  { value: "chart",    label: "Bar Chart" },
  { value: "check",    label: "Checkmark" },
];

export const PROJECT_FOOTPRINT_HUB_TYPES = [
  { value: "convening", label: "Convening" },
  { value: "partner", label: "Partner anchor" },
  { value: "secretariat", label: "Secretariat" },
];

export const PROJECT_WORKSTREAM_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

export const PROJECT_ACTIVITY_TYPES = [
  { value: "research", label: "Research" },
  { value: "convening", label: "Convening" },
  { value: "publication", label: "Publication" },
  { value: "negotiation_support", label: "Negotiation support" },
  { value: "capacity_building", label: "Capacity building" },
  { value: "coordination", label: "Coordination" },
  { value: "fellowship", label: "Fellowship" },
  { value: "milestone", label: "Milestone" },
  { value: "other", label: "Other" },
];

export const PROJECT_ORGANIZATION_RELATIONSHIP_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "research_partner", label: "Research partner" },
  { value: "strategic_partner", label: "Strategic partner" },
  { value: "funder", label: "Funder" },
  { value: "implementing_partner", label: "Implementing partner" },
  { value: "institutional_partner", label: "Institutional partner" },
  { value: "host", label: "Host" },
  { value: "co_organizer", label: "Co-organizer" },
  { value: "supporter", label: "Supporter" },
  { value: "participant", label: "Participant" },
  { value: "other", label: "Other" },
];

export const PROJECT_CONTRIBUTION_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "technical", label: "Technical" },
  { value: "policy", label: "Policy" },
  { value: "coordination", label: "Coordination" },
  { value: "facilitation", label: "Facilitation" },
  { value: "research", label: "Research" },
  { value: "communications", label: "Communications" },
  { value: "reviewer", label: "Reviewer" },
  { value: "participant", label: "Participant" },
  { value: "other", label: "Other" },
];

export const PROJECT_CONTENT_RELATIONSHIP_TYPES = [
  { value: "deliverable", label: "Deliverable" },
  { value: "report", label: "Report" },
  { value: "brief", label: "Brief" },
  { value: "tool", label: "Tool" },
  { value: "evidence", label: "Evidence" },
  { value: "output", label: "Output" },
  { value: "reference", label: "Reference" },
  { value: "planned_product", label: "Planned product" },
  { value: "other", label: "Other" },
];

export const PROJECT_EVENT_RELATIONSHIP_TYPES = [
  { value: "convening", label: "Convening" },
  { value: "launch", label: "Launch" },
  { value: "validation", label: "Validation" },
  { value: "presentation", label: "Presentation" },
  { value: "negotiation_session", label: "Negotiation session" },
  { value: "participation", label: "Participation" },
  { value: "output_source", label: "Output source" },
  { value: "other", label: "Other" },
];

export function formatProjectType(value) {
  return PROJECT_TYPES.find((t) => t.value === value)?.label || value || "";
}

export function formatProjectSection(value) {
  return PROJECT_SECTIONS.find((s) => s.value === value)?.label || value || "";
}

export function generateProjectSlug(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function getProjectHref(slug) {
  return `/projects/${slug}`;
}

// ─── Select fragment ──────────────────────────────────────────────────────────

const PROJECT_BASE_SELECT = `
  *,
  project_resources ( id, resource_title, resource_url, resource_type ),
  project_countries ( * ),
  project_workstreams ( * ),
  project_activities ( * ),
  project_organization_links ( *, organizations ( id, name, slug, acronym, organization_type, website_url, country, country_code, description ) ),
  project_content_links ( *, content_items ( id, title, slug, content_type, summary, publish_status, visibility, published_at ) ),
  project_event_links ( *, events ( id, title, slug, event_type, location, display_date, starts_at, ends_at, status, visibility ) ),
  project_contributions (
    *,
    member_profile:member_profile_id ( id, email, first_name, surname, role_title, organisation_name, country_of_residence ),
    external_contributors ( id, name, slug, role_title, organization_name, country, profile_url ),
    organizations ( id, name, slug, acronym, organization_type )
  ),
  linked_space:linked_space_id ( id, name, slug, space_type, description )
`.trim();

// ─── Public fetches ───────────────────────────────────────────────────────────

/**
 * Fetch all published projects with full relations, ordered by section then sort_order.
 * Used by the /projects marketing page (ISR server component).
 */
export async function fetchPublishedProjects({ supabase }) {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_BASE_SELECT)
    .eq("status", "published")
    .order("section")
    .order("sort_order");

  if (error) {
    console.error("[projects] Failed to fetch published projects", {
      message: error.message,
      code: error.code,
    });
  }

  const projects = (data || []).map(normalizeProjectRecord);
  return { projects: await attachProjectFootprintHubs({ supabase, projects }), error };
}

/**
 * Fetch a single published project by slug. Allows unpublished for admin preview.
 */
export async function fetchProjectBySlug({ supabase, slug, includeUnpublished = false }) {
  let query = supabase
    .from("projects")
    .select(PROJECT_BASE_SELECT)
    .eq("slug", slug);

  if (!includeUnpublished) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[projects] Failed to fetch project by slug", {
      slug,
      includeUnpublished,
      message: error.message,
      code: error.code,
    });
  }

  const [project] = await attachProjectFootprintHubs({
    supabase,
    projects: [normalizeProjectRecord(data)].filter(Boolean),
  });

  if (!project) {
    return { project: null, error };
  }

  const { gallery, error: galleryError } = await fetchProjectGallery({
    supabase,
    projectId: project.id,
  });

  if (galleryError) {
    console.error("[projects] Failed to fetch project gallery", {
      slug,
      projectId: project.id,
      message: galleryError.message,
      code: galleryError.code,
    });
  }

  return {
    project: {
      ...project,
      project_gallery: gallery,
    },
    error,
    galleryError,
  };
}

/**
 * Fetch all published project slugs. Used in generateStaticParams for ISR.
 */
export async function fetchPublishedProjectSlugs({ supabase }) {
  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .eq("status", "published");

  return { slugs: (data || []).map((r) => r.slug), error };
}

// ─── Community integration ────────────────────────────────────────────────────

/**
 * Given a list of space IDs, return a Map of spaceId → project for any
 * published projects linked to those spaces. Used in /app/spaces to attach
 * a project badge to a workspace card.
 */
export async function fetchLinkedProjectsBySpaceIds({ supabase, spaceIds }) {
  if (!spaceIds || spaceIds.length === 0) {
    return { bySpaceId: new Map(), error: null };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, slug, status_label, section, project_type, linked_space_id")
    .eq("status", "published")
    .in("linked_space_id", spaceIds);

  const bySpaceId = new Map(
    (data || []).map((project) => {
      const normalized = normalizeProjectRecord(project);
      return [normalized.linked_space_id, normalized];
    })
  );
  return { bySpaceId, error };
}

// ─── Admin fetches ────────────────────────────────────────────────────────────

/**
 * Fetch all projects (all statuses) for admin list pages.
 * The supabase client passed here should be the admin / authenticated client
 * from requireAdminContext().
 */
export async function fetchAdminProjects({ supabase }) {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_countries ( * ),
      linked_space:linked_space_id ( id, name, slug, space_type )
    `)
    .order("section")
    .order("sort_order");

  return { projects: (data || []).map(normalizeProjectRecord), error };
}

/**
 * Fetch a single project by id for admin edit pages.
 */
export async function fetchAdminProjectById({ supabase, projectId }) {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_BASE_SELECT)
    .eq("id", projectId)
    .maybeSingle();

  const [project] = await attachProjectFootprintHubs({
    supabase,
    projects: [normalizeProjectRecord(data)].filter(Boolean),
  });

  return { project: project || null, error };
}

export async function fetchProjectEditorOptions({ supabase }) {
  const [
    organizationsResult,
    externalContributorsResult,
    membersResult,
    eventsResult,
    publicationsResult,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, acronym, organization_type")
      .order("name"),
    supabase
      .from("external_contributors")
      .select("id, name, slug, role_title, organization_name")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, email, first_name, surname, role_title, organisation_name")
      .eq("profile_status", "active")
      .order("surname"),
    supabase
      .from("events")
      .select("id, title, slug, display_date, starts_at, status")
      .order("starts_at", { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from("content_items")
      .select("id, title, slug, content_type, publish_status, visibility")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(250),
  ]);

  return {
    error:
      organizationsResult.error ||
      externalContributorsResult.error ||
      membersResult.error ||
      eventsResult.error ||
      publicationsResult.error ||
      null,
    options: {
      events: eventsResult.data || [],
      externalContributors: externalContributorsResult.data || [],
      members: membersResult.data || [],
      organizations: organizationsResult.data || [],
      publications: publicationsResult.data || [],
    },
  };
}

export async function fetchProjectGallery({ supabase, projectId }) {
  if (!projectId) {
    return { gallery: [], error: null };
  }

  const { data, error } = await supabase
    .from("project_gallery")
    .select("id, image_url, alt_text, caption, sort_order")
    .eq("project_id", projectId)
    .order("sort_order");

  if (error) {
    return { gallery: [], error };
  }

  return { gallery: data || [], error: null };
}

// ─── Admin mutations ──────────────────────────────────────────────────────────

/**
 * Create a new project. Uses the admin/service-role client.
 * Returns { project, error }.
 */
export async function createProject({ data: payload }) {
  const adminClient = createSupabaseAdminClient();
  const {
    activities,
    content_links,
    contributions,
    countries,
    event_links,
    footprint_hubs,
    organization_links,
    resources,
    workstreams,
    ...projectData
  } = payload;

  const { data, error } = await adminClient
    .from("projects")
    .insert(projectData)
    .select("id, slug")
    .single();

  if (error || !data) return { project: null, error };

  if (countries?.length) {
    await replaceProjectCountries({
      adminClient,
      countries,
      projectId: data.id,
    });
  }

  if (resources?.length) {
    await adminClient.from("project_resources").insert(
      resources.map((resource) => ({
        project_id: data.id,
        resource_title: resource.resource_title,
        resource_url: resource.resource_url || null,
        resource_type: resource.resource_type || null,
      }))
    );
  }

  if (Array.isArray(footprint_hubs)) {
    await replaceProjectFootprintHubs({
      adminClient,
      hubs: footprint_hubs,
      projectId: data.id,
    });
  }

  await replaceProjectGraphRelations({
    activities,
    adminClient,
    content_links,
    contributions,
    event_links,
    organization_links,
    projectId: data.id,
    workstreams,
  });

  return { project: data, error: null };
}

/**
 * Update an existing project. Replaces project_countries rows.
 * Returns { project, error }.
 */
export async function updateProject({ projectId, data: payload }) {
  const adminClient = createSupabaseAdminClient();
  const {
    activities,
    content_links,
    contributions,
    countries,
    event_links,
    footprint_hubs,
    organization_links,
    resources,
    workstreams,
    ...projectData
  } = payload;

  const { data, error } = await adminClient
    .from("projects")
    .update({ ...projectData, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .select("id, slug")
    .single();

  if (error || !data) return { project: null, error };

  if (Array.isArray(countries)) {
    await replaceProjectCountries({
      adminClient,
      countries,
      projectId,
      replace: true,
    });
  }

  if (Array.isArray(resources)) {
    await adminClient.from("project_resources").delete().eq("project_id", projectId);
    if (resources.length) {
      await adminClient.from("project_resources").insert(
        resources.map((resource) => ({
          project_id: projectId,
          resource_title: resource.resource_title,
          resource_url: resource.resource_url || null,
          resource_type: resource.resource_type || null,
        }))
      );
    }
  }

  if (Array.isArray(footprint_hubs)) {
    await replaceProjectFootprintHubs({
      adminClient,
      hubs: footprint_hubs,
      projectId,
      replace: true,
    });
  }

  await replaceProjectGraphRelations({
    activities,
    adminClient,
    content_links,
    contributions,
    event_links,
    organization_links,
    projectId,
    replace: true,
    workstreams,
  });

  return { project: data, error: null };
}

/**
 * Delete a project by id. Cascades handle project_resources and project_countries.
 */
export async function deleteProject({ projectId }) {
  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("projects").delete().eq("id", projectId);
  return { error };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

/**
 * Build a quick stat summary from an array of project records.
 */
export function buildProjectsSummary(projects) {
  return {
    total:      projects.length,
    flagship:   projects.filter((p) => p.section === "flagship").length,
    convening:  projects.filter((p) => p.section === "convening").length,
    other:      projects.filter((p) => p.section === "other").length,
    published:  projects.filter((p) => p.status === "published").length,
    draft:      projects.filter((p) => p.status === "draft").length,
    archived:   projects.filter((p) => p.status === "archived").length,
  };
}

export function buildProjectRelationshipSummary(project = {}) {
export { buildProjectRelationshipSummary };

// ─── Filter helper (admin list) ────────────────────────────────────────────────

export function filterAdminProjects(projects, { status, section, search }) {
  let result = projects;

  if (status && status !== "all") {
    result = result.filter((p) => p.status === status);
  }

  if (section && section !== "all") {
    result = result.filter((p) => p.section === section);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter((p) =>
      [p.title, p.summary, p.status_label, p.period_label, p.partner_line]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  return result;
}

function normalizeProjectRecord(project) {
  if (!project) return null;

  const override = PROJECT_CONTENT_OVERRIDES[project.slug] || {};
  const projectCountries = pickArray(project.project_countries, override.project_countries).map(
    normalizeProjectCountry
  );
  const projectFootprintHubs = pickArray(
    project.project_footprint_hubs,
    PROJECT_FOOTPRINT_HUB_OVERRIDES[project.slug]
  ).map(normalizeProjectFootprintHub);

  return {
    ...project,
    summary: project.summary || override.summary || null,
    body: project.body || override.body || null,
    deliverables: pickArray(project.deliverables, override.deliverables),
    tags: pickArray(project.tags, override.tags),
    highlights: pickArray(project.highlights, override.highlights),
    project_resources: pickArray(project.project_resources, override.project_resources),
    project_countries: projectCountries,
    project_footprint_hubs: projectFootprintHubs,
    project_workstreams: sortByOrder(pickArray(project.project_workstreams, [])),
    project_activities: sortByOrder(pickArray(project.project_activities, [])),
    project_organization_links: sortByOrder(pickArray(project.project_organization_links, [])),
    project_content_links: sortByOrder(pickArray(project.project_content_links, [])),
    project_event_links: sortByOrder(pickArray(project.project_event_links, [])),
    project_contributions: sortByOrder(pickArray(project.project_contributions, [])),
    project_gallery: pickArray(project.project_gallery, []),
    cover_image_url: project.cover_image_url || override.cover_image_url || null,
    cover_image_alt:
      project.cover_image_alt || override.cover_image_alt || project.title || "Project cover image",
    external_url: project.external_url || override.external_url || null,
    partner_line: project.partner_line || override.partner_line || null,
  };
}

function pickArray(primary, fallback) {
  if (Array.isArray(primary) && primary.length > 0) {
    return primary;
  }

  return Array.isArray(fallback) ? fallback : [];
}

function sortByOrder(items = []) {
  return [...items].sort((left, right) => {
    const leftOrder = Number.isFinite(Number(left?.sort_order)) ? Number(left.sort_order) : 0;
    const rightOrder = Number.isFinite(Number(right?.sort_order)) ? Number(right.sort_order) : 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return String(left?.title || left?.label || left?.id || "").localeCompare(
      String(right?.title || right?.label || right?.id || "")
    );
  });
}

function normalizeProjectCountry(country) {
  const resolvedCountry =
    getAfricanCountryByCode(country?.country_code) ||
    getAfricanCountryByName(country?.country);

  return {
    ...country,
    country: country?.country || resolvedCountry?.name || "",
    country_code: resolvedCountry?.code || country?.country_code || null,
  };
}

function normalizeProjectFootprintHub(hub) {
  const resolvedCountry =
    getAfricanCountryByCode(hub?.country_code) ||
    getAfricanCountryByName(hub?.country);

  return {
    ...hub,
    country: resolvedCountry?.name || hub?.country || "",
    country_code: resolvedCountry?.code || hub?.country_code || null,
    latitude: hub?.latitude ?? null,
    longitude: hub?.longitude ?? null,
  };
}

async function attachProjectFootprintHubs({ supabase, projects }) {
  if (!projects?.length) {
    return projects || [];
  }

  const projectIds = projects.map((project) => project.id).filter(Boolean);
  if (!projectIds.length) {
    return projects;
  }

  const { data, error } = await supabase
    .from("project_footprint_hubs")
    .select("*")
    .in("project_id", projectIds)
    .order("sort_order");

  if (error) {
    return projects;
  }

  const hubsByProjectId = new Map();
  for (const hub of data || []) {
    if (!hubsByProjectId.has(hub.project_id)) {
      hubsByProjectId.set(hub.project_id, []);
    }

    hubsByProjectId.get(hub.project_id).push(hub);
  }

  return projects.map((project) =>
    normalizeProjectRecord({
      ...project,
      project_footprint_hubs: hubsByProjectId.get(project.id) || project.project_footprint_hubs,
    })
  );
}

async function replaceProjectCountries({
  adminClient,
  countries,
  projectId,
  replace = false,
}) {
  if (replace) {
    await adminClient.from("project_countries").delete().eq("project_id", projectId);
  }

  if (!countries.length) {
    return;
  }

  const rowsWithCountryCode = countries.map((country, index) => ({
    country_class: country.country_class || null,
    engagement_role: country.engagement_role || null,
    project_id: projectId,
    country: country.country,
    country_code: country.country_code || null,
    phase_label: country.phase_label || null,
    priority_focus: country.priority_focus || null,
    sort_order: Number.isInteger(country.sort_order) ? country.sort_order : index,
  }));

  const { error } = await adminClient.from("project_countries").insert(rowsWithCountryCode);

  if (!error) {
    return;
  }

  const fallbackRows = rowsWithCountryCode.map(({ country_code, ...country }) => country);
  await adminClient.from("project_countries").insert(fallbackRows);
}

async function replaceProjectFootprintHubs({
  adminClient,
  hubs,
  projectId,
  replace = false,
}) {
  if (replace) {
    const { error } = await adminClient.from("project_footprint_hubs").delete().eq("project_id", projectId);
    if (error) {
      return;
    }
  }

  if (!hubs.length) {
    return;
  }

  await adminClient.from("project_footprint_hubs").insert(
    hubs.map((hub, index) => ({
      city: hub.city || null,
      country_code: hub.country_code || null,
      description: hub.description || null,
      hub_type: hub.hub_type,
      label: hub.label,
      latitude: hub.latitude,
      longitude: hub.longitude,
      phase_label: hub.phase_label || null,
      project_id: projectId,
      related_url: hub.related_url || null,
      sort_order: Number.isInteger(hub.sort_order) ? hub.sort_order : index,
    }))
  );
}

async function replaceProjectGraphRelations({
  activities,
  adminClient,
  content_links,
  contributions,
  event_links,
  organization_links,
  projectId,
  replace = false,
  workstreams,
}) {
  const hasGraphPayload = [
    activities,
    content_links,
    contributions,
    event_links,
    organization_links,
    workstreams,
  ].some(Array.isArray);

  if (!hasGraphPayload) {
    return;
  }

  if (replace) {
    await adminClient.from("project_contributions").delete().eq("project_id", projectId);
    await adminClient.from("project_organization_links").delete().eq("project_id", projectId);
    await adminClient.from("project_content_links").delete().eq("project_id", projectId);
    await adminClient.from("project_event_links").delete().eq("project_id", projectId);
    await adminClient.from("project_activities").delete().eq("project_id", projectId);
    await adminClient.from("project_workstreams").delete().eq("project_id", projectId);
  }

  const workstreamCodeMap = new Map();

  if (Array.isArray(workstreams) && workstreams.length) {
    const rows = workstreams
      .filter((workstream) => workstream.title)
      .map((workstream, index) => ({
        code: workstream.code || null,
        ends_on: workstream.ends_on || null,
        methodology: workstream.methodology || null,
        objective: workstream.objective || null,
        project_id: projectId,
        sort_order: toInteger(workstream.sort_order, index),
        starts_on: workstream.starts_on || null,
        status: workstream.status || "planned",
        summary: workstream.summary || null,
        title: workstream.title,
      }));

    if (rows.length) {
      await adminClient.from("project_workstreams").insert(rows);
    }
  }

  const { data: savedWorkstreams } = await adminClient
    .from("project_workstreams")
    .select("id, code")
    .eq("project_id", projectId);

  for (const workstream of savedWorkstreams || []) {
    if (workstream.code) {
      workstreamCodeMap.set(workstream.code, workstream.id);
    }
  }

  if (Array.isArray(activities) && activities.length) {
    const rows = activities
      .filter((activity) => activity.title)
      .map((activity, index) => ({
        activity_type: activity.activity_type || "other",
        code: activity.code || null,
        ends_at: activity.ends_at || null,
        location: activity.location || null,
        notes: activity.notes || null,
        project_id: projectId,
        sort_order: toInteger(activity.sort_order, index),
        starts_at: activity.starts_at || null,
        status: activity.status || "planned",
        summary: activity.summary || null,
        title: activity.title,
        workstream_id: activity.workstream_code
          ? workstreamCodeMap.get(activity.workstream_code) || null
          : activity.workstream_id || null,
      }));

    if (rows.length) {
      await adminClient.from("project_activities").insert(rows);
    }
  }

  if (Array.isArray(organization_links) && organization_links.length) {
    const rows = [];
    for (const [index, link] of organization_links.entries()) {
      const organizationId =
        link.organization_id ||
        (link.organization_name
          ? await upsertOrganization(adminClient, {
              name: link.organization_name,
              organization_type: link.organization_type || "other",
            })
          : null);

      if (!organizationId) continue;

      rows.push({
        label: link.label || null,
        notes: link.notes || null,
        organization_id: organizationId,
        project_id: projectId,
        relationship_type: link.relationship_type || "institutional_partner",
        sort_order: toInteger(link.sort_order, index),
      });
    }

    if (rows.length) {
      await adminClient.from("project_organization_links").insert(rows);
    }
  }

  if (Array.isArray(content_links) && content_links.length) {
    const rows = content_links
      .filter((link) => link.content_id)
      .map((link, index) => ({
        content_id: link.content_id,
        label: link.label || null,
        notes: link.notes || null,
        project_id: projectId,
        relationship_type: link.relationship_type || "reference",
        sort_order: toInteger(link.sort_order, index),
      }));

    if (rows.length) {
      await adminClient.from("project_content_links").insert(rows);
    }
  }

  if (Array.isArray(event_links) && event_links.length) {
    const rows = event_links
      .filter((link) => link.event_id)
      .map((link, index) => ({
        event_id: link.event_id,
        label: link.label || null,
        notes: link.notes || null,
        project_id: projectId,
        relationship_type: link.relationship_type || "participation",
        sort_order: toInteger(link.sort_order, index),
      }));

    if (rows.length) {
      await adminClient.from("project_event_links").insert(rows);
    }
  }

  if (Array.isArray(contributions) && contributions.length) {
    const rows = [];
    for (const [index, contribution] of contributions.entries()) {
      const memberProfileId = contribution.member_profile_id || null;
      const externalContributorId =
        memberProfileId
          ? null
          : contribution.external_contributor_id ||
            (contribution.external_name
              ? await upsertExternalContributor(adminClient, contribution)
              : null);

      if (!memberProfileId && !externalContributorId) continue;

      rows.push({
        contribution_type: contribution.contribution_type || "other",
        external_contributor_id: externalContributorId,
        member_profile_id: memberProfileId,
        notes: contribution.notes || null,
        organization_id: contribution.organization_id || null,
        project_id: projectId,
        role_label: contribution.role_label || null,
        sort_order: toInteger(contribution.sort_order, index),
      });
    }

    if (rows.length) {
      await adminClient.from("project_contributions").insert(rows);
    }
  }
}

async function upsertOrganization(adminClient, organization) {
  const name = String(organization?.name || "").trim();
  if (!name) return null;

  const slug = generateProjectSlug(name);
  const { data, error } = await adminClient
    .from("organizations")
    .upsert(
      {
        name,
        organization_type: organization.organization_type || "other",
        slug,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) {
    return null;
  }

  return data?.id || null;
}

async function upsertExternalContributor(adminClient, contribution) {
  const name = String(contribution?.external_name || "").trim();
  if (!name) return null;

  const organizationName = String(contribution?.external_organization_name || "").trim();
  const slug = generateProjectSlug([name, organizationName].filter(Boolean).join(" "));
  const { data, error } = await adminClient
    .from("external_contributors")
    .upsert(
      {
        name,
        organization_name: organizationName || null,
        role_title: contribution.external_role_title || null,
        slug,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) {
    return null;
  }

  return data?.id || null;
}

function toInteger(value, fallback = 0) {
  const number = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(number) ? fallback : number;
}
