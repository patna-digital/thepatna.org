import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectForm } from "../components/project-form";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminSpaces } from "@/lib/spaces";
import { fetchProjectEditorOptions } from "@/lib/projects";
import { saveAdminProjectAction } from "../[projectId]/actions";

const NOTICE_MESSAGES = {
  "missing-fields": "Title is required.",
  error:            "Project creation failed. Please retry.",
};

export default async function NewAdminProjectPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const sp = await searchParams;
  const notice = typeof sp?.notice === "string" ? sp.notice : "";

  const [{ spaces }, editorOptionsResult] = await Promise.all([
    fetchAdminSpaces({ supabase }),
    fetchProjectEditorOptions({ supabase }),
  ]);

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "New project",
        title: "Add a PATNA project",
        body: "Create a flagship programme, convening, or other project record with highlights, footprint hubs, resources, and structured public page content.",
      }}
      title="Add project"
      subtitle="Create a new PATNA project record with map-ready country and hub data."
    >
      {notice ? <p className="form-error">{NOTICE_MESSAGES[notice] || notice}</p> : null}
      <div className="form-card">
        <ProjectForm
          action={saveAdminProjectAction}
          relationOptions={editorOptionsResult.options}
          spaces={spaces || []}
          submitLabel="Create project"
        />
      </div>
    </DashboardShell>
  );
}
