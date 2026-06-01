import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminCollaborationLeadById } from "@/lib/collaboration-leads";
import { fetchAdminUsers } from "@/lib/admin-users";
import { saveAdminCollaborationLeadAction, deleteAdminCollaborationLeadAction } from "@/app/admin/collaboration-leads/actions";
import { CollaborationLeadForm } from "@/app/admin/collaboration-leads/components/collaboration-lead-form";

const STATUS_LABEL = {
  new:            "New",
  contacted:      "Contacted",
  in_discussion:  "In Discussion",
  proposal_sent:  "Proposal Sent",
  negotiation:    "Negotiation",
  agreed:         "Agreed",
  declined:       "Declined",
  closed:         "Closed",
};

const STATUS_CHIP = {
  new:            "chip-new",
  contacted:      "chip-warning",
  in_discussion:  "chip-warning",
  proposal_sent:  "chip-warning",
  negotiation:    "chip-warning",
  agreed:         "chip-success",
  declined:       "chip-muted",
  closed:         "chip-muted",
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata() {
  return { title: "Collaboration Lead | PATNA Admin" };
}

export default async function EditCollaborationLeadPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { leadId } = await params;
  const resolved = await searchParams;
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  const [{ collaborationLead, error }, adminUsers] = await Promise.all([
    fetchAdminCollaborationLeadById({ leadId, supabase }),
    fetchAdminUsers(),
  ]);

  if (error || !collaborationLead) redirect("/admin/leads");

  const assignedUser = adminUsers.find((u) => u.user_id === collaborationLead.assigned_to_user_id);
  const assignedName = assignedUser
    ? [assignedUser.first_name, assignedUser.surname].filter(Boolean).join(" ") || assignedUser.email
    : null;

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Partnerships"
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Leads", href: "/admin/leads" },
        { label: collaborationLead.organisation || "Collaboration lead" },
      ]}
      navItems={adminNav}
      title={collaborationLead.organisation || "Collaboration Lead"}
      subtitle={`${collaborationLead.name}${collaborationLead.email ? ` · ${collaborationLead.email}` : ""}`}
    >
      {notice === "saved" && <p className="form-success">Changes saved.</p>}
      {notice === "error" && <p className="form-error">Something went wrong. Please try again.</p>}

      <div className="admin-form-layout">
        {/* ── Main form ─────────────────────────────────────── */}
        <article className="dashboard-card">
          <CollaborationLeadForm
            lead={collaborationLead}
            action={saveAdminCollaborationLeadAction}
            deleteAction={deleteAdminCollaborationLeadAction}
            cancelHref="/admin/leads"
            adminUsers={adminUsers}
          />
        </article>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="admin-form-sidebar">

          {/* Contact person */}
          <div className="dashboard-card lead-contact-card">
            <p className="lead-sidebar-label">Contact person</p>
            <p className="lead-contact-name">{collaborationLead.name || "—"}</p>
            {collaborationLead.email && (
              <a className="lead-contact-email" href={`mailto:${collaborationLead.email}`}>
                {collaborationLead.email}
              </a>
            )}
            {collaborationLead.organisation && (
              <p className="lead-contact-org">{collaborationLead.organisation}</p>
            )}
            {collaborationLead.collaboration_type && (
              <span className="status-chip chip-neutral" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                {collaborationLead.collaboration_type.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* Lead info */}
          <div className="dashboard-card">
            <p className="lead-sidebar-label">Lead status</p>
            <span className={`status-chip ${STATUS_CHIP[collaborationLead.status] || "chip-neutral"}`}>
              {STATUS_LABEL[collaborationLead.status] || collaborationLead.status}
            </span>

            <dl className="compact-list" style={{ marginTop: "1rem" }}>
              <dt>Type</dt>
              <dd>Collaboration</dd>
              <dt>Submitted</dt>
              <dd>{fmt(collaborationLead.created_at)}</dd>
              <dt>Last updated</dt>
              <dd>{fmt(collaborationLead.updated_at)}</dd>
              <dt>Assigned to</dt>
              <dd>{assignedName || <span style={{ color: "var(--ink-muted)" }}>Unassigned</span>}</dd>
            </dl>
          </div>

          {/* Quick actions */}
          <div className="dashboard-card">
            <p className="lead-sidebar-label">Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Link className="secondary-button" href="/admin/leads">← Back to all leads</Link>
              <Link className="secondary-button" href="/admin/partners/new">Promote to partner</Link>
            </div>
          </div>

        </aside>
      </div>
    </DashboardShell>
  );
}
