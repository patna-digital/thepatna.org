"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    tags,
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
