// ─────────────────────────────────────────────────────────────────────────────
// lib/projects.js
// Data layer for the projects table. Mirrors lib/spaces.js / lib/insights.js.
// ─────────────────────────────────────────────────────────────────────────────

import { PROJECT_CONTENT_OVERRIDES } from "@/lib/project-content";
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

const PROJECT_SELECT = `
  *,
  project_resources ( id, resource_title, resource_url, resource_type ),
  project_countries ( * ),
  project_gallery ( id, image_url, alt_text, caption, sort_order ),
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
    .select(PROJECT_SELECT)
    .eq("status", "published")
    .order("section")
    .order("sort_order");

  const projects = (data || []).map(normalizeProjectRecord);
  return { projects: await attachProjectFootprintHubs({ supabase, projects }), error };
}

/**
 * Fetch a single published project by slug. Allows unpublished for admin preview.
 */
export async function fetchProjectBySlug({ supabase, slug, includeUnpublished = false }) {
  let query = supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("slug", slug);

  if (!includeUnpublished) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.maybeSingle();
  const [project] = await attachProjectFootprintHubs({
    supabase,
    projects: [normalizeProjectRecord(data)].filter(Boolean),
  });

  return { project: project || null, error };
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
    .select(`
      *,
      project_resources ( id, resource_title, resource_url, resource_type ),
      project_countries ( * ),
      linked_space:linked_space_id ( id, name, slug, space_type )
    `)
    .eq("id", projectId)
    .maybeSingle();

  const [project] = await attachProjectFootprintHubs({
    supabase,
    projects: [normalizeProjectRecord(data)].filter(Boolean),
  });

  return { project: project || null, error };
}

// ─── Admin mutations ──────────────────────────────────────────────────────────

/**
 * Create a new project. Uses the admin/service-role client.
 * Returns { project, error }.
 */
export async function createProject({ data: payload }) {
  const adminClient = createSupabaseAdminClient();
  const { countries, footprint_hubs, resources, ...projectData } = payload;

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

  return { project: data, error: null };
}

/**
 * Update an existing project. Replaces project_countries rows.
 * Returns { project, error }.
 */
export async function updateProject({ projectId, data: payload }) {
  const adminClient = createSupabaseAdminClient();
  const { countries, footprint_hubs, resources, ...projectData } = payload;

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
    project_id: projectId,
    country: country.country,
    country_code: country.country_code || null,
    phase_label: country.phase_label || null,
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
