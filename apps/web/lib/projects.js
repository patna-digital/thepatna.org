// ─────────────────────────────────────────────────────────────────────────────
// lib/projects.js
// Data layer for the projects table. Mirrors lib/spaces.js / lib/insights.js.
// ─────────────────────────────────────────────────────────────────────────────

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

// ─── Select fragment ──────────────────────────────────────────────────────────

const PROJECT_SELECT = `
  *,
  project_resources ( id, resource_title, resource_url, resource_type ),
  project_countries ( id, country, phase_label, sort_order ),
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

  return { projects: data || [], error };
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
  return { project: data || null, error };
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

  const bySpaceId = new Map((data || []).map((p) => [p.linked_space_id, p]));
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
      id, title, slug, summary, status, featured,
      section, project_type, status_label, period_label,
      partner_line, external_url, icon_type, sort_order,
      linked_space_id, cover_image_url, cover_image_alt,
      deliverables, tags,
      project_countries ( id, country, phase_label, sort_order ),
      linked_space:linked_space_id ( id, name, slug, space_type ),
      created_at, updated_at
    `)
    .order("section")
    .order("sort_order");

  return { projects: data || [], error };
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
      project_countries ( id, country, phase_label, sort_order ),
      linked_space:linked_space_id ( id, name, slug, space_type )
    `)
    .eq("id", projectId)
    .maybeSingle();

  return { project: data || null, error };
}

// ─── Admin mutations ──────────────────────────────────────────────────────────

/**
 * Create a new project. Uses the admin/service-role client.
 * Returns { project, error }.
 */
export async function createProject({ data: payload }) {
  const adminClient = createSupabaseAdminClient();
  const { countries, ...projectData } = payload;

  const { data, error } = await adminClient
    .from("projects")
    .insert(projectData)
    .select("id, slug")
    .single();

  if (error || !data) return { project: null, error };

  if (countries?.length) {
    await adminClient.from("project_countries").insert(
      countries.map((c, i) => ({
        project_id: data.id,
        country: c.country,
        phase_label: c.phase_label || null,
        sort_order: i,
      }))
    );
  }

  return { project: data, error: null };
}

/**
 * Update an existing project. Replaces project_countries rows.
 * Returns { project, error }.
 */
export async function updateProject({ projectId, data: payload }) {
  const adminClient = createSupabaseAdminClient();
  const { countries, ...projectData } = payload;

  const { data, error } = await adminClient
    .from("projects")
    .update({ ...projectData, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .select("id, slug")
    .single();

  if (error || !data) return { project: null, error };

  if (Array.isArray(countries)) {
    await adminClient.from("project_countries").delete().eq("project_id", projectId);
    if (countries.length) {
      await adminClient.from("project_countries").insert(
        countries.map((c, i) => ({
          project_id: projectId,
          country: c.country,
          phase_label: c.phase_label || null,
          sort_order: i,
        }))
      );
    }
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
