import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchAdminServiceRequestById } from "@/lib/service-requests";
import { fetchAdminUsers } from "@/lib/admin-users";
import { saveAdminServiceRequestAction, deleteAdminServiceRequestAction } from "@/app/admin/service-requests/actions";
import { ServiceRequestForm } from "@/app/admin/service-requests/components/service-request-form";

const STATUS_LABEL = {
  new:         "New",
  in_progress: "In Progress",
  review:      "Under Review",
  completed:   "Completed",
  cancelled:   "Cancelled",
  closed:      "Closed",
};

const STATUS_CHIP = {
  new:         "chip-new",
  in_progress: "chip-warning",
  review:      "chip-warning",
  completed:   "chip-success",
  cancelled:   "chip-muted",
  closed:      "chip-muted",
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata() {
  return { title: "Service Request | PATNA Admin" };
}

export default async function EditServiceRequestPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { requestId } = await params;
  const resolved = await searchParams;
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  const [{ serviceRequest, error }, adminUsers] = await Promise.all([
    fetchAdminServiceRequestById({ requestId, supabase }),
    fetchAdminUsers(),
  ]);

  if (error || !serviceRequest) redirect("/admin/leads");

  const assignedUser = adminUsers.find((u) => u.user_id === serviceRequest.assigned_to_user_id);
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
        { label: serviceRequest.requester_name || "Service request" },
      ]}
      navItems={adminNav}
      title={serviceRequest.requester_name || "Service Request"}
      subtitle={`${serviceRequest.organisation ? `${serviceRequest.organisation} · ` : ""}${serviceRequest.requester_email || ""}`}
    >
      {notice === "saved" && <p className="form-success">Changes saved.</p>}
      {notice === "error" && <p className="form-error">Something went wrong. Please try again.</p>}

      <div className="admin-form-layout">
        {/* ── Main form ─────────────────────────────────────── */}
        <article className="dashboard-card">
          <ServiceRequestForm
            serviceRequest={serviceRequest}
            action={saveAdminServiceRequestAction}
            deleteAction={deleteAdminServiceRequestAction}
            cancelHref="/admin/leads"
            submitLabel="Save changes"
            adminUsers={adminUsers}
          />
        </article>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="admin-form-sidebar">

          {/* Contact person */}
          <div className="dashboard-card lead-contact-card">
            <p className="lead-sidebar-label">Contact person</p>
            <p className="lead-contact-name">{serviceRequest.requester_name || "—"}</p>
            {serviceRequest.requester_email && (
              <a className="lead-contact-email" href={`mailto:${serviceRequest.requester_email}`}>
                {serviceRequest.requester_email}
              </a>
            )}
            {serviceRequest.organisation && (
              <p className="lead-contact-org">{serviceRequest.organisation}</p>
            )}
            {serviceRequest.country && (
              <p className="lead-contact-org">{serviceRequest.country}</p>
            )}
            {serviceRequest.request_type && (
              <span className="status-chip chip-neutral" style={{ marginTop: "0.5rem", display: "inline-block" }}>
                {serviceRequest.request_type.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* Lead info */}
          <div className="dashboard-card">
            <p className="lead-sidebar-label">Request status</p>
            <span className={`status-chip ${STATUS_CHIP[serviceRequest.status] || "chip-neutral"}`}>
              {STATUS_LABEL[serviceRequest.status] || serviceRequest.status}
            </span>

            <dl className="compact-list" style={{ marginTop: "1rem" }}>
              <dt>Type</dt>
              <dd>Service Request</dd>
              <dt>Submitted</dt>
              <dd>{fmt(serviceRequest.created_at)}</dd>
              <dt>Last updated</dt>
              <dd>{fmt(serviceRequest.updated_at)}</dd>
              {serviceRequest.timeline && (
                <>
                  <dt>Timeline</dt>
                  <dd>{serviceRequest.timeline}</dd>
                </>
              )}
              <dt>Assigned to</dt>
              <dd>{assignedName || <span style={{ color: "var(--ink-muted)" }}>Unassigned</span>}</dd>
            </dl>
          </div>

          {/* Quick actions */}
          <div className="dashboard-card">
            <p className="lead-sidebar-label">Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Link className="secondary-button" href="/admin/leads">← Back to all leads</Link>
            </div>
          </div>

        </aside>
      </div>
    </DashboardShell>
  );
}
