import Link from "next/link";
import { AdminApplicationsList } from "@/components/admin-applications-list";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";

const STATUS_OPTIONS = ["submitted", "interviewing", "approved", "waitlist", "declined"];

function getNoticeMessage(notice) {
  const messages = {
    saved: "Application review saved.",
    error: "Review update failed. Please retry.",
    "missing-fields": "Status and application ID are required.",
    invited: "Applicant approved and invited. Profile seeded from application data.",
    "invite-resent": "Invite link resent.",
    "password-reset-sent": "Password reset link sent.",
  };
  return messages[notice] || "";
}

export default async function AdminApplicationsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolvedSearchParams = await searchParams;
  const activeStatus =
    typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : "all";
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";

  let query = supabase
    .from("community_applications")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const [{ data: applications, error }, { data: cohorts }] = await Promise.all([
    query,
    supabase.from("cohorts").select("id, name, slug").order("name", { ascending: true }),
  ]);

  // Fetch profile data for all applications so the UI can show the right action button
  const emails = (applications || [])
    .map((a) => a.submitted_by_email?.toLowerCase())
    .filter(Boolean);

  const { data: profiles } = emails.length
    ? await supabase
        .from("profiles")
        .select("email, onboarding_status, invited_at")
        .in("email", emails)
    : { data: [] };

  const profileByEmail = new Map((profiles || []).map((p) => [p.email?.toLowerCase(), p]));

  const applicationsWithProfile = (applications || []).map((app) => ({
    ...app,
    member_profile: profileByEmail.get(app.submitted_by_email?.toLowerCase()) || null,
  }));

  const statusCounts = Object.fromEntries(
    await Promise.all(
      STATUS_OPTIONS.map(async (status) => {
        const { count } = await supabase
          .from("community_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", status);
        return [status, count ?? 0];
      }),
    ),
  );

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Review queue",
        title: "Applications, interview routing, and cohort fit",
        body: "Review community applications, assign cohort placement, and capture interview decisions.",
      }}
      title="Application review"
      subtitle="Live review queue. Click any row to expand details and take action."
    >
      <div className="admin-stat-grid admin-stat-grid-5">
        <div className="admin-stat-card">
          <strong>{applicationsWithProfile.length}</strong>
          <h4>All applications</h4>
          <p>Total received</p>
        </div>
        <div className="admin-stat-card tone-warning">
          <strong>{statusCounts.submitted ?? 0}</strong>
          <h4>Submitted</h4>
          <p>Awaiting review</p>
        </div>
        <div className="admin-stat-card tone-muted">
          <strong>{statusCounts.interviewing ?? 0}</strong>
          <h4>Interviewing</h4>
          <p>In progress</p>
        </div>
        <div className="admin-stat-card tone-success">
          <strong>{statusCounts.approved ?? 0}</strong>
          <h4>Approved</h4>
          <p>Cohort accepted</p>
        </div>
        <div className="admin-stat-card tone-muted">
          <strong>{(statusCounts.waitlist ?? 0) + (statusCounts.declined ?? 0)}</strong>
          <h4>Waitlist / Declined</h4>
          <p>Not progressed</p>
        </div>
      </div>

      <article className="dashboard-card admin-toolbar-card">
        <div className="stack">
          <div className="admin-toolbar-main">
            <div className="dashboard-toolbar">
              <Link
                className={activeStatus === "all" ? "filter-tab active-filter" : "filter-tab"}
                href="/admin/applications"
              >
                All
              </Link>
              {STATUS_OPTIONS.map((status) => (
                <Link
                  className={activeStatus === status ? "filter-tab active-filter" : "filter-tab"}
                  href={`/admin/applications?status=${status}`}
                  key={status}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status] ?? 0})
                </Link>
              ))}
            </div>
          </div>
          
          {notice ? (
            <p className={notice === "error" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice)}
            </p>
          ) : null}
          {error ? <p className="form-error">{error.message}</p> : null}
        </div>
      </article>

      <AdminApplicationsList applications={applicationsWithProfile} cohorts={cohorts || []} />
    </DashboardShell>
  );
}
