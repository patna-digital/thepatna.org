import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectForm } from "../components/project-form";
import { adminNav } from "@/lib/patna-data";
import { fetchAdminProjectById, fetchProjectEditorOptions } from "@/lib/projects";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminSpaces } from "@/lib/spaces";
import { saveAdminProjectAction, deleteAdminProjectAction } from "./actions";
import { addProjectGalleryImageAction, removeProjectGalleryImageAction } from "./gallery-actions";
import { GalleryManager } from "@/components/admin/gallery-manager";

const NOTICE_MESSAGES = {
  saved:            "Project saved.",
  "missing-fields": "Title is required.",
  "invalid-parent": "Parent project cannot be this project or one of its child projects.",
  error:            "Operation failed. Please retry.",
};

export default async function AdminProjectDetailPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { projectId } = await params;
  const sp = await searchParams;
  const notice = typeof sp?.notice === "string" ? sp.notice : "";

  const [{ project, error }, { spaces }, editorOptionsResult, galleryResult] = await Promise.all([
    fetchAdminProjectById({ supabase, projectId }),
    fetchAdminSpaces({ supabase }),
    fetchProjectEditorOptions({ supabase }),
    supabase
      .from("project_gallery")
      .select("id, image_url, alt_text, caption, sort_order")
      .eq("project_id", projectId)
      .order("sort_order"),
  ]);

  const galleryImages = galleryResult.data || [];

  if (error || !project) {
    redirect("/admin/projects");
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: project.section,
        title: project.title,
        body: `Status: ${project.status} · ${project.status_label || "—"} · Sort order: ${project.sort_order}`,
      }}
      title={project.title}
      subtitle="Edit project details, highlights, countries, footprint hubs, resources, and community workspace links."
    >
      {notice ? (
        <p className={notice === "saved" ? "form-success" : "form-error"}>
          {NOTICE_MESSAGES[notice] || notice}
        </p>
      ) : null}

      <div className="form-card">
        <ProjectForm
          action={saveAdminProjectAction}
          project={project}
          relationOptions={editorOptionsResult.options}
          spaces={spaces || []}
          submitLabel="Save project"
        />
      </div>

      {/* Gallery */}
      <div className="form-card" style={{ marginTop: "1rem" }}>
        <GalleryManager
          addAction={addProjectGalleryImageAction}
          contentId={project.id}
          contentIdFieldName="project_id"
          galleryImages={galleryImages}
          removeAction={removeProjectGalleryImageAction}
        />
      </div>

      {/* Quick links */}
      <div className="dashboard-card" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <strong style={{ fontSize: "0.85rem" }}>Quick links</strong>
          <a
            className="secondary-button"
            href={`/projects/${project.slug}`}
            rel="noopener noreferrer"
            style={{ fontSize: "0.8rem" }}
            target="_blank"
          >
            View public page ↗
          </a>
          {project.external_url && (
            <a
              className="secondary-button"
              href={project.external_url}
              rel="noopener noreferrer"
              style={{ fontSize: "0.8rem" }}
              target="_blank"
            >
              External project page ↗
            </a>
          )}
        </div>
      </div>

      {/* Delete zone */}
      <details className="dashboard-card" style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "#b91c1c" }}>
          Danger zone — delete this project
        </summary>
        <div style={{ marginTop: "0.75rem" }}>
          <p className="muted-note" style={{ marginBottom: "0.75rem" }}>
            Deleting a project is permanent. Project countries and resources will also be removed.
          </p>
          <form action={deleteAdminProjectAction}>
            <input name="project_id" type="hidden" value={project.id} />
            <input name="slug" type="hidden" value={project.slug} />
            <button
              className="primary-button"
              style={{ background: "#b91c1c" }}
              type="submit"
            >
              Delete project permanently
            </button>
          </form>
        </div>
      </details>
    </DashboardShell>
  );
}
