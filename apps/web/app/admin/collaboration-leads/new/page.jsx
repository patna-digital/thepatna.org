import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminUsers } from "@/lib/admin-users";
import { saveAdminCollaborationLeadAction } from "@/app/admin/collaboration-leads/actions";
import { CollaborationLeadForm } from "@/app/admin/collaboration-leads/components/collaboration-lead-form";

export const metadata = { title: "New Collaboration Lead | PATNA Admin" };

export default async function NewCollaborationLeadPage({ searchParams }) {
  await requireAdminContext();
  const [resolved, adminUsers] = await Promise.all([searchParams, fetchAdminUsers()]);
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Partnerships"
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Leads", href: "/admin/leads" },
        { label: "New collaboration" },
      ]}
      navItems={adminNav}
      title="New collaboration lead"
      subtitle="Record a new collaboration enquiry from an organisation."
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <CollaborationLeadForm
            action={saveAdminCollaborationLeadAction}
            cancelHref="/admin/leads"
            notice={notice}
            adminUsers={adminUsers}
          />
        </article>
      </div>
    </DashboardShell>
  );
}
