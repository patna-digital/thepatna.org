import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminUsers } from "@/lib/admin-users";
import { saveAdminServiceRequestAction } from "@/app/admin/service-requests/actions";
import { ServiceRequestForm } from "@/app/admin/service-requests/components/service-request-form";

export const metadata = { title: "New Service Request | PATNA Admin" };

export default async function NewServiceRequestPage({ searchParams }) {
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
        { label: "New service request" },
      ]}
      navItems={adminNav}
      title="New service request"
      subtitle="Record a new technical or advisory service request."
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <ServiceRequestForm
            action={saveAdminServiceRequestAction}
            cancelHref="/admin/leads"
            adminUsers={adminUsers}
          />
        </article>
      </div>
    </DashboardShell>
  );
}
