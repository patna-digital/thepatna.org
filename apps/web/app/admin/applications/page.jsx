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
    invited: "Applicant invited. Profile seeded from application data.",
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

      <AdminApplicationsList applications={applications || []} cohorts={cohorts || []} />
    </DashboardShell>
  );
}
