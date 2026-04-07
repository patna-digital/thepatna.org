import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminServiceRequestById } from "@/lib/service-requests";
import { saveAdminServiceRequestAction } from "@/app/admin/service-requests/actions";
import { deleteAdminServiceRequestAction } from "@/app/admin/service-requests/actions";
import { ServiceRequestForm } from "@/app/admin/service-requests/components/service-request-form";

export default async function EditServiceRequestPage({ params }) {
  const { supabase } = await requireAdminContext();
  const { requestId } = params;

  const { serviceRequest, error } = await fetchAdminServiceRequestById({ requestId, supabase });

  if (error || !serviceRequest) {
    redirect("/admin/service-requests");
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Edit service request",
        title: "Update service request details",
        body: "Modify requester information, status, assignment, and tracking details.",
      }}
      subtitle="Edit service request details and assignment."
      title="Edit Service Request"
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <ServiceRequestForm
            serviceRequest={serviceRequest}
            action={saveAdminServiceRequestAction}
            deleteAction={deleteAdminServiceRequestAction}
            cancelHref="/admin/service-requests"
            submitLabel="Save Changes"
          />
        </article>

        <aside className="admin-form-sidebar">
          <div className="dashboard-card">
            <h3>Request Details</h3>
            <dl className="compact-list">
              <dt>ID</dt>
              <dd>{serviceRequest.id}</dd>
              <dt>Created</dt>
              <dd>{new Date(serviceRequest.created_at).toLocaleDateString()}</dd>
              <dt>Last Updated</dt>
              <dd>{new Date(serviceRequest.updated_at).toLocaleDateString()}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}