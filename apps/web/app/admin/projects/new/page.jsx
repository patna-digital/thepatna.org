import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectForm } from "../components/project-form";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminSpaces } from "@/lib/spaces";
import { saveAdminProjectAction } from "../[projectId]/actions";

const NOTICE_MESSAGES = {
  "missing-fields": "Title is required.",
  error:            "Project creation failed. Please retry.",
};

export default async function NewAdminProjectPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const sp = await searchParams;
  const notice = typeof sp?.notice === "string" ? sp.notice : "";

  const { spaces } = await fetchAdminSpaces({ supabase });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "New project",
        title: "Add a PATNA project",
        body: "Create a flagship programme, convening, or other project record. Published projects appear on the public /projects page.",
      }}
      title="Add project"
      subtitle="Create a new PATNA project record."
    >
      {notice ? <p className="form-error">{NOTICE_MESSAGES[notice] || notice}</p> : null}
      <div className="form-card">
        <ProjectForm
          action={saveAdminProjectAction}
          spaces={spaces || []}
          submitLabel="Create project"
        />
      </div>
    </DashboardShell>
  );
}
