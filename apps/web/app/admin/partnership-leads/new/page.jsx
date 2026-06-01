import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminUsers } from "@/lib/admin-users";
import { saveAdminPartnershipLeadAction } from "@/app/admin/partnership-leads/actions";
import { PartnershipLeadForm } from "@/app/admin/partnership-leads/components/partnership-lead-form";

export const metadata = { title: "New Partnership Lead | PATNA Admin" };

export default async function NewPartnershipLeadPage({ searchParams }) {
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
        { label: "New partnership" },
      ]}
      navItems={adminNav}
      title="New partnership lead"
      subtitle="Record a new partnership enquiry from an organisation."
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <PartnershipLeadForm
            action={saveAdminPartnershipLeadAction}
            cancelHref="/admin/leads"
            notice={notice}
            adminUsers={adminUsers}
          />
        </article>
      </div>
    </DashboardShell>
  );
}
