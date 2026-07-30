import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { fetchAdminStaffLogHistory, fetchPotentialLineManagers } from "@/lib/daily-work-logs";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { setLineManagerAction } from "../actions";

function getNoticeMessage(notice) {
  const messages = {
    "manager-updated": "Line manager updated.",
    "missing-fields": "Select a line manager.",
    error: "Something went wrong. Please try again.",
  };
  return messages[notice] || "";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00.000Z`));
}

export default async function AdminStaffDetailPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { staffId } = await params;
  const resolvedSearchParams = await searchParams;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";

  const [{ profile, logs, error }, managersResult] = await Promise.all([
    fetchAdminStaffLogHistory({ supabase, staffId }),
    fetchPotentialLineManagers({ supabase }),
  ]);

  if (error || !profile) {
    redirect("/admin/staff");
  }

  const noticeMessage = getNoticeMessage(notice);

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Staff member",
        title: profile.name || profile.email,
        body: `${profile.role_title || "PATNA staff"} · ${logs.length} logged day${logs.length === 1 ? "" : "s"}.`,
      }}
      title={profile.name || profile.email}
      subtitle="Daily remote working log history for this staff member."
    >
      {notice ? <p className={notice === "manager-updated" ? "form-success" : "form-error"}>{noticeMessage}</p> : null}

      <div className="summary-grid">
        <div className="summary-tile">
          <strong>{profile.email}</strong>
          <span>Email</span>
        </div>
        <div className="summary-tile">
          <strong>{profile.country_of_residence || "—"}</strong>
          <span>Country</span>
        </div>
        <div className="summary-tile">
          <strong>{profile.timezone || "—"}</strong>
          <span>Timezone</span>
        </div>
        <div className="summary-tile">
          <strong>{profile.lineManagerName || "Unassigned"}</strong>
          <span>Line manager</span>
        </div>
      </div>

      <article className="dashboard-card">
        <h3 className="card-heading">Reassign line manager</h3>
        <form action={setLineManagerAction} className="inline-form">
          <input name="staff_id" type="hidden" value={profile.id} />
          <select className="form-input" defaultValue={profile.line_manager_id || ""} name="line_manager_id">
            <option disabled value="">
              Select line manager
            </option>
            {(managersResult.managers || []).map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Save
          </button>
        </form>
      </article>

      <article className="dashboard-card">
        <h3 className="card-heading">Log history</h3>
        {logs.length === 0 ? (
          <p className="empty-state">No daily logs submitted yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Progress</th>
                <th>Wellbeing</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.log_date)}</td>
                  <td>{log.checkin_time || "—"}</td>
                  <td>{log.checkout_time || "—"}</td>
                  <td>{log.prioritiesProgressLabel || "—"}</td>
                  <td>{log.wellbeingLabel || "—"}</td>
                  <td>
                    {log.isFlagged ? (
                      <span className="chip chip-warning">Needs attention</span>
                    ) : (
                      <span className="chip chip-muted">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>

      <Link className="secondary-button" href="/admin/staff">
        Back to staff roster
      </Link>
    </DashboardShell>
  );
}
