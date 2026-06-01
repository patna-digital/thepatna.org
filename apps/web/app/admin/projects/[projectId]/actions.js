"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDescendantProject } from "@/lib/project-hierarchy";
import { createProject, updateProject, deleteProject } from "@/lib/projects";
import { generateProjectSlug } from "@/lib/project-config";
import { uploadContentImage } from "@/lib/content-images";

function parseText(formData, key) {
  return String(formData.get(key) || "").trim();
}

function parseOptional(formData, key) {
  const v = parseText(formData, key);
  return v || null;
}

function parseIntField(formData, key, fallback = 0) {
  const v = Number.parseInt(String(formData.get(key) || ""), 10);
  return Number.isNaN(v) ? fallback : v;
}

function parseJsonbArray(formData, key) {
  const values = formData.getAll(key);
  return values.map((v) => String(v).trim()).filter(Boolean);
}

function parseStructuredRows(formData, keys = []) {
  const valuesByKey = Object.fromEntries(
    keys.map((key) => [key, formData.getAll(key).map((value) => String(value).trim())])
  );
  const rowCount = Math.max(0, ...keys.map((key) => valuesByKey[key].length));

  return Array.from({ length: rowCount }, (_, index) =>
    Object.fromEntries(keys.map((key) => [key, valuesByKey[key][index] || ""]))
  );
}

function parseHighlights(formData) {
  return parseStructuredRows(formData, ["highlight_value", "highlight_label"])
    .filter((row) => row.highlight_value || row.highlight_label)
    .map((row) => ({
      value: row.highlight_value,
      label: row.highlight_label,
    }))
    .filter((row) => row.value && row.label);
}

function parseResources(formData) {
  return parseStructuredRows(formData, [
    "resource_title",
    "resource_url",
    "resource_type",
  ])
    .filter((row) => row.resource_title || row.resource_url || row.resource_type)
    .map((row) => ({
      resource_title: row.resource_title,
      resource_url: row.resource_url || null,
      resource_type: row.resource_type || null,
    }))
    .filter((row) => row.resource_title);
}

function parseWorkstreams(formData) {
  return parseStructuredRows(formData, [
    "workstream_code",
    "workstream_title",
    "workstream_summary",
    "workstream_objective",
    "workstream_methodology",
    "workstream_status",
    "workstream_starts_on",
    "workstream_ends_on",
    "workstream_sort_order",
  ])
    .filter((row) => row.workstream_code || row.workstream_title || row.workstream_summary)
    .map((row, index) => ({
      code: row.workstream_code || null,
      ends_on: row.workstream_ends_on || null,
      methodology: row.workstream_methodology || null,
      objective: row.workstream_objective || null,
      sort_order: Number.isNaN(Number.parseInt(row.workstream_sort_order, 10))
        ? index
        : Number.parseInt(row.workstream_sort_order, 10),
      starts_on: row.workstream_starts_on || null,
      status: row.workstream_status || "planned",
      summary: row.workstream_summary || null,
      title: row.workstream_title,
    }))
    .filter((row) => row.title);
}

function parseActivities(formData) {
  return parseStructuredRows(formData, [
    "activity_code",
    "activity_title",
    "activity_type",
    "activity_status",
    "activity_workstream_code",
    "activity_summary",
    "activity_location",
    "activity_starts_at",
    "activity_ends_at",
    "activity_sort_order",
  ])
    .filter((row) => row.activity_code || row.activity_title || row.activity_summary)
    .map((row, index) => ({
      activity_type: row.activity_type || "other",
      code: row.activity_code || null,
      ends_at: row.activity_ends_at || null,
      location: row.activity_location || null,
      sort_order: Number.isNaN(Number.parseInt(row.activity_sort_order, 10))
        ? index
        : Number.parseInt(row.activity_sort_order, 10),
      starts_at: row.activity_starts_at || null,
      status: row.activity_status || "planned",
      summary: row.activity_summary || null,
      title: row.activity_title,
      workstream_code: row.activity_workstream_code || null,
    }))
    .filter((row) => row.title);
}

function parseOrganizationLinks(formData) {
  return parseStructuredRows(formData, [
    "organization_id",
    "organization_name",
    "organization_type",
    "organization_relationship_type",
    "organization_label",
    "organization_workstream_code",
    "organization_activity_code",
    "organization_notes",
    "organization_sort_order",
  ])
    .filter((row) => row.organization_id || row.organization_name || row.organization_label)
    .map((row, index) => ({
      label: row.organization_label || null,
      notes: row.organization_notes || null,
      organization_id: row.organization_id || null,
      organization_name: row.organization_name || null,
      organization_type: row.organization_type || "other",
      relationship_type: row.organization_relationship_type || "institutional_partner",
      workstream_code: row.organization_workstream_code || null,
      activity_code: row.organization_activity_code || null,
      sort_order: Number.isNaN(Number.parseInt(row.organization_sort_order, 10))
        ? index
        : Number.parseInt(row.organization_sort_order, 10),
    }))
    .filter((row) => row.organization_id || row.organization_name);
}

function parseContentLinks(formData) {
  return parseStructuredRows(formData, [
    "content_link_id",
    "content_relationship_type",
    "content_link_label",
    "content_workstream_code",
    "content_activity_code",
    "content_link_notes",
    "content_link_sort_order",
  ])
    .filter((row) => row.content_link_id)
    .map((row, index) => ({
      content_id: row.content_link_id,
      label: row.content_link_label || null,
      notes: row.content_link_notes || null,
      relationship_type: row.content_relationship_type || "reference",
      workstream_code: row.content_workstream_code || null,
      activity_code: row.content_activity_code || null,
      sort_order: Number.isNaN(Number.parseInt(row.content_link_sort_order, 10))
        ? index
        : Number.parseInt(row.content_link_sort_order, 10),
    }));
}

function parseEventLinks(formData) {
  return parseStructuredRows(formData, [
    "event_link_id",
    "event_relationship_type",
    "event_link_label",
    "event_workstream_code",
    "event_activity_code",
    "event_link_notes",
    "event_link_sort_order",
  ])
    .filter((row) => row.event_link_id)
    .map((row, index) => ({
      event_id: row.event_link_id,
      label: row.event_link_label || null,
      notes: row.event_link_notes || null,
      relationship_type: row.event_relationship_type || "participation",
      workstream_code: row.event_workstream_code || null,
      activity_code: row.event_activity_code || null,
      sort_order: Number.isNaN(Number.parseInt(row.event_link_sort_order, 10))
        ? index
        : Number.parseInt(row.event_link_sort_order, 10),
    }));
}

function parseContributions(formData) {
  return parseStructuredRows(formData, [
    "contribution_member_profile_id",
    "contribution_external_contributor_id",
    "contribution_external_name",
    "contribution_external_role_title",
    "contribution_external_organization_name",
    "contribution_organization_id",
    "contribution_type",
    "contribution_role_label",
    "contribution_workstream_code",
    "contribution_activity_code",
    "contribution_notes",
    "contribution_sort_order",
  ])
    .filter((row) =>
      row.contribution_member_profile_id ||
      row.contribution_external_contributor_id ||
      row.contribution_external_name
    )
    .map((row, index) => ({
      contribution_type: row.contribution_type || "other",
      external_contributor_id: row.contribution_external_contributor_id || null,
      external_name: row.contribution_external_name || null,
      external_organization_name: row.contribution_external_organization_name || null,
      external_role_title: row.contribution_external_role_title || null,
      member_profile_id: row.contribution_member_profile_id || null,
      notes: row.contribution_notes || null,
      organization_id: row.contribution_organization_id || null,
      role_label: row.contribution_role_label || null,
      workstream_code: row.contribution_workstream_code || null,
      activity_code: row.contribution_activity_code || null,
      sort_order: Number.isNaN(Number.parseInt(row.contribution_sort_order, 10))
        ? index
        : Number.parseInt(row.contribution_sort_order, 10),
    }))
    .filter((row) => row.member_profile_id || row.external_contributor_id || row.external_name);
}

function parseCountries(formData) {
  return parseStructuredRows(formData, [
    "country_name",
    "country_code",
    "country_place_id",
    "country_phase_label",
    "country_class",
    "country_priority_focus",
    "country_engagement_role",
    "country_sort_order",
  ])
    .filter((row) => row.country_name || row.country_code || row.country_phase_label)
    .map((row, index) => ({
      country: row.country_name || row.country_code || null,
      country_code: row.country_code || null,
      country_class: row.country_class || null,
      engagement_role: row.country_engagement_role || null,
      phase_label: row.country_phase_label || null,
      place_id: row.country_place_id || null,
      priority_focus: row.country_priority_focus || null,
      sort_order: Number.isNaN(Number.parseInt(row.country_sort_order, 10))
        ? index
        : Number.parseInt(row.country_sort_order, 10),
    }))
    .filter((row) => row.country);
}

function parseFootprintHubs(formData) {
  return parseStructuredRows(formData, [
    "hub_type",
    "hub_label",
    "hub_place_id",
    "hub_place_name",
    "hub_place_type",
    "hub_place_source",
    "hub_place_source_id",
    "hub_place_address",
    "hub_city",
    "hub_country_code",
    "hub_latitude",
    "hub_longitude",
    "hub_phase_label",
    "hub_description",
    "hub_related_url",
    "hub_sort_order",
  ])
    .filter((row) =>
      row.hub_type ||
      row.hub_label ||
      row.hub_city ||
      row.hub_country_code ||
      row.hub_description
    )
    .map((row, index) => ({
      city: row.hub_city || null,
      country_code: row.hub_country_code || null,
      description: row.hub_description || null,
      hub_type: row.hub_type || "convening",
      label: row.hub_label,
      latitude: Number.parseFloat(row.hub_latitude),
      longitude: Number.parseFloat(row.hub_longitude),
      phase_label: row.hub_phase_label || null,
      place_address: row.hub_place_address || null,
      place_id: row.hub_place_id || null,
      place_name: row.hub_place_name || null,
      place_source: row.hub_place_source || null,
      place_source_id: row.hub_place_source_id || null,
      place_type: row.hub_place_type || null,
      related_url: row.hub_related_url || null,
      sort_order: Number.isNaN(Number.parseInt(row.hub_sort_order, 10))
        ? index
        : Number.parseInt(row.hub_sort_order, 10),
    }))
    .filter(
      (row) =>
        row.label &&
        row.country_code &&
        !Number.isNaN(row.latitude) &&
        !Number.isNaN(row.longitude)
    );
}

function normaliseStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  return ["draft", "published", "archived"].includes(v) ? v : "draft";
}

function normaliseSection(value) {
  const v = String(value || "").trim().toLowerCase();
  return ["flagship", "convening", "other"].includes(v) ? v : "other";
}

function normaliseProjectType(value) {
  const v = String(value || "").trim();
  return ["flagship_programme", "convening", "technical_analysis", "capacity_building"].includes(v)
    ? v
    : null;
}

function buildProjectPath({ projectId = "", notice = "" }) {
  const base = projectId ? `/admin/projects/${projectId}` : "/admin/projects";
  if (!notice) return base;
  return `${base}?notice=${notice}`;
}

async function isInvalidParentSelection({ adminClient, parentProjectId, projectId }) {
  if (!parentProjectId) return false;
  if (!projectId) return false;
  if (parentProjectId === projectId) return true;

  const { data, error } = await adminClient
    .from("projects")
    .select("id, parent_project_id");

  if (error) {
    return true;
  }

  return isDescendantProject(data || [], projectId, parentProjectId);
}

export async function saveAdminProjectAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const projectId = parseText(formData, "project_id");
  const title     = parseText(formData, "title");

  if (!title) {
    redirect(buildProjectPath({ projectId, notice: "missing-fields" }));
  }

  const section     = normaliseSection(formData.get("section"));
  const deliverables = parseJsonbArray(formData, "deliverables");
  const tags         = parseJsonbArray(formData, "tags");
  const highlights   = parseHighlights(formData);
  const resources    = parseResources(formData);
  const countries    = parseCountries(formData);
  const footprint_hubs = parseFootprintHubs(formData);
  const workstreams = parseWorkstreams(formData);
  const activities = parseActivities(formData);
  const organization_links = parseOrganizationLinks(formData);
  const contributions = parseContributions(formData);
  const content_links = parseContentLinks(formData);
  const event_links = parseEventLinks(formData);
  const parent_project_id = parseOptional(formData, "parent_project_id");

  if (
    await isInvalidParentSelection({
      adminClient,
      parentProjectId: parent_project_id,
      projectId,
    })
  ) {
    redirect(buildProjectPath({ projectId, notice: "invalid-parent" }));
  }

  // Cover image: upload file if provided, otherwise keep existing URL
  const coverImageFile = formData.get("cover_image_file");
  const existingCoverUrl = parseOptional(formData, "cover_image_url");
  let cover_image_url = existingCoverUrl;

  if (coverImageFile && Number(coverImageFile.size) > 0) {
    try {
      const { imageUrl } = await uploadContentImage({
        adminSupabase: adminClient,
        file: coverImageFile,
        userId: user.id,
        subfolder: "projects",
        currentImageUrl: existingCoverUrl || "",
      });
      cover_image_url = imageUrl || existingCoverUrl;
    } catch {
      redirect(buildProjectPath({ projectId, notice: "error" }));
    }
  }

  const payload = {
    title,
    slug:             parseText(formData, "slug") || generateProjectSlug(title),
    short_title:      parseOptional(formData, "short_title"),
    project_code:     parseOptional(formData, "project_code"),
    parent_project_id,
    series_id:        parseOptional(formData, "series_id"),
    series_phase_label: parseOptional(formData, "series_phase_label"),
    series_phase_order: parseIntField(formData, "series_phase_order", 0) || null,
    phase_summary:    parseOptional(formData, "phase_summary"),
    start_date:       parseOptional(formData, "start_date"),
    end_date:         parseOptional(formData, "end_date"),
    geographic_scope: parseOptional(formData, "geographic_scope"),
    section,
    project_type:     normaliseProjectType(formData.get("project_type")),
    status:           normaliseStatus(formData.get("status")),
    status_label:     parseOptional(formData, "status_label"),
    period_label:     parseOptional(formData, "period_label"),
    partner_line:     parseOptional(formData, "partner_line"),
    external_url:     parseOptional(formData, "external_url"),
    icon_type:        parseOptional(formData, "icon_type"),
    linked_space_id:  parseOptional(formData, "linked_space_id"),
    cover_image_url,
    cover_image_alt:  parseOptional(formData, "cover_image_alt"),
    summary:          parseOptional(formData, "summary"),
    body:             parseOptional(formData, "body"),
    featured:         formData.get("featured") === "true",
    sort_order:       parseIntField(formData, "sort_order", 0),
    deliverables,
    highlights,
    tags,
    resources,
    countries,
    footprint_hubs,
    workstreams,
    activities,
    organization_links,
    contributions,
    content_links,
    event_links,
  };

  let savedId = projectId;

  if (projectId) {
    const { project, error } = await updateProject({ projectId, data: payload });
    if (error || !project) redirect(buildProjectPath({ projectId, notice: "error" }));
    savedId = project.id;
  } else {
    const { project, error } = await createProject({ data: payload });
    if (error || !project) redirect(buildProjectPath({ notice: "error" }));
    savedId = project.id;
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${payload.slug}`);
  revalidatePath("/admin/projects");

  redirect(buildProjectPath({ projectId: savedId, notice: "saved" }));
}

export async function deleteAdminProjectAction(formData) {
  await requireAdminContext();

  const projectId = parseText(formData, "project_id");
  const slug      = parseText(formData, "slug");

  if (!projectId) redirect("/admin/projects");

  const { error } = await deleteProject({ projectId });

  if (error) redirect(buildProjectPath({ projectId, notice: "error" }));

  revalidatePath("/projects");
  if (slug) revalidatePath(`/projects/${slug}`);
  revalidatePath("/admin/projects");

  redirect("/admin/projects?notice=deleted");
}
