"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAfricanCountryNameByCode,
} from "@/lib/africa-countries";
import { requireAdminContext } from "@/lib/supabase/access";
import { createProject, updateProject, deleteProject, generateProjectSlug } from "@/lib/projects";

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

function parseCountries(formData) {
  return parseStructuredRows(formData, [
    "country_name",
    "country_code",
    "country_phase_label",
    "country_sort_order",
  ])
    .filter((row) => row.country_name || row.country_code || row.country_phase_label)
    .map((row, index) => ({
      country: row.country_name || getAfricanCountryNameByCode(row.country_code),
      country_code: row.country_code || null,
      phase_label: row.country_phase_label || null,
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

export async function saveAdminProjectAction(formData) {
  await requireAdminContext();

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

  const payload = {
    title,
    slug:             parseText(formData, "slug") || generateProjectSlug(title),
    section,
    project_type:     normaliseProjectType(formData.get("project_type")),
    status:           normaliseStatus(formData.get("status")),
    status_label:     parseOptional(formData, "status_label"),
    period_label:     parseOptional(formData, "period_label"),
    partner_line:     parseOptional(formData, "partner_line"),
    external_url:     parseOptional(formData, "external_url"),
    icon_type:        parseOptional(formData, "icon_type"),
    linked_space_id:  parseOptional(formData, "linked_space_id"),
    cover_image_url:  parseOptional(formData, "cover_image_url"),
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
