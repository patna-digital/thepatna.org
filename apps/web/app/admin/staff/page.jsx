import { AdminStaffList } from "@/components/admin-staff-list";
import { DashboardShell } from "@/components/dashboard-shell";
import { fetchAdminStaffRoster, fetchPotentialLineManagers } from "@/lib/daily-work-logs";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";

function getNoticeMessage(notice) {
  const messages = {
    granted: "Staff access granted.",
    revoked: "Staff access removed.",
    invited: "Invitation sent. Staff access will be granted as soon as they complete account setup.",
    "invite-failed": "Could not send an invitation to that email address. It may already be registered.",
    "missing-fields": "Email and line manager are required.",
    error: "Something went wrong. Please try again.",
  };
  return messages[notice] || "";
}

export default async function AdminStaffPage({ searchParams }) {
  const { supabase } = await requireAdminContext();

  const resolvedSearchParams = await searchParams;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";

  const [rosterResult, managersResult] = await Promise.all([
    fetchAdminStaffRoster({ supabase }),
    fetchPotentialLineManagers({ supabase }),
  ]);

  const staff = rosterResult.staff || [];
  const noticeMessage = getNoticeMessage(notice);

  const checkedInToday = staff.filter((member) => member.todayLog?.hasCheckedIn).length;
  const checkedOutToday = staff.filter((member) => member.todayLog?.hasCheckedOut).length;
  const flaggedToday = staff.filter((member) => member.todayLog?.isFlagged).length;

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Operations",
        title: "Staff daily logs",
        body: "Grant staff access, assign line managers, and review remote working check-ins organised by staff member.",
      }}
      title="Staff"
      subtitle="Manage staff access and review daily remote working logs."
    >
      {noticeMessage && (
        <div className={`notice-banner ${["granted", "revoked", "invited"].includes(notice) ? "notice-success" : "notice-error"}`}>
          {noticeMessage}
        </div>
      )}

      <div className="admin-stat-grid admin-stat-grid-3">
        <div className="admin-stat-card">
          <strong>{staff.length}</strong>
          <h4>Staff</h4>
          <p>With daily log access</p>
        </div>
        <div className="admin-stat-card">
          <strong>{checkedInToday}</strong>
          <h4>Checked in today</h4>
          <p>{checkedOutToday} checked out</p>
        </div>
        <div className="admin-stat-card tone-warning">
          <strong>{flaggedToday}</strong>
          <h4>Flagged today</h4>
          <p>Risks, support needs, or wellbeing flags</p>
        </div>
      </div>

      <AdminStaffList managers={managersResult.managers || []} staff={staff} />
    </DashboardShell>
  );
}
