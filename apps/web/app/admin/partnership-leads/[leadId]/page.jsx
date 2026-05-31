import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminPartnershipLeadById } from "@/lib/partnership-leads";
import { saveAdminPartnershipLeadAction, deleteAdminPartnershipLeadAction } from "@/app/admin/partnership-leads/actions";
import PartnershipLeadForm from "@/app/admin/partnership-leads/components/partnership-lead-form";

export default async function EditPartnershipLeadPage({ params }) {
  const { supabase } = await requireAdminContext();
  const { leadId } = await params;

  const { partnershipLead, error } = await fetchAdminPartnershipLeadById({ leadId, supabase });

  if (error || !partnershipLead) {
    redirect("/admin/partnership-leads");
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Partnership lead",
        title: "Update partnership lead details",
        body: "Modify organisation, contact, focus areas, status, and assignment.",
      }}
      subtitle="Edit partnership lead details and assignment."
      title="Edit Partnership Lead"
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <PartnershipLeadForm
            lead={partnershipLead}
            action={saveAdminPartnershipLeadAction}
            deleteAction={deleteAdminPartnershipLeadAction}
            cancelHref="/admin/partnership-leads"
          />
        </article>

        <aside className="admin-form-sidebar">
          <div className="dashboard-card">
            <h3>Lead Details</h3>
            <dl className="compact-list">
              <dt>ID</dt>
              <dd>{partnershipLead.id}</dd>
              <dt>Status</dt>
              <dd>{partnershipLead.status?.replace(/_/g, " ").toUpperCase()}</dd>
              <dt>Created</dt>
              <dd>{new Date(partnershipLead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
              <dt>Last Updated</dt>
              <dd>{new Date(partnershipLead.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
              {partnershipLead.assigned_to_profile && (
                <>
                  <dt>Assigned To</dt>
                  <dd>{partnershipLead.assigned_to_profile.first_name || partnershipLead.assigned_to_profile.email}</dd>
                </>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
