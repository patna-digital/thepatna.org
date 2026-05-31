import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminCollaborationLeadById } from "@/lib/collaboration-leads";
import { saveAdminCollaborationLeadAction, deleteAdminCollaborationLeadAction } from "@/app/admin/collaboration-leads/actions";
import CollaborationLeadForm from "@/app/admin/collaboration-leads/components/collaboration-lead-form";

export default async function EditCollaborationLeadPage({ params }) {
  const { supabase } = await requireAdminContext();
  const { leadId } = await params;

  const { collaborationLead, error } = await fetchAdminCollaborationLeadById({ leadId, supabase });

  if (error || !collaborationLead) {
    redirect("/admin/collaboration-leads");
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Collaboration lead",
        title: "Update collaboration lead details",
        body: "Modify organisation, contact, collaboration type, proposal, and status.",
      }}
      subtitle="Edit collaboration lead details and assignment."
      title="Edit Collaboration Lead"
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <CollaborationLeadForm
            lead={collaborationLead}
            action={saveAdminCollaborationLeadAction}
            deleteAction={deleteAdminCollaborationLeadAction}
            cancelHref="/admin/collaboration-leads"
          />
        </article>

        <aside className="admin-form-sidebar">
          <div className="dashboard-card">
            <h3>Lead Details</h3>
            <dl className="compact-list">
              <dt>ID</dt>
              <dd>{collaborationLead.id}</dd>
              <dt>Status</dt>
              <dd>{collaborationLead.status?.replace(/_/g, " ").toUpperCase()}</dd>
              <dt>Type</dt>
              <dd>{collaborationLead.collaboration_type?.replace(/_/g, " ").toUpperCase() || "-"}</dd>
              <dt>Created</dt>
              <dd>{new Date(collaborationLead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
              <dt>Last Updated</dt>
              <dd>{new Date(collaborationLead.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
              {collaborationLead.assigned_to_profile && (
                <>
                  <dt>Assigned To</dt>
                  <dd>{collaborationLead.assigned_to_profile.first_name || collaborationLead.assigned_to_profile.email}</dd>
                </>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
