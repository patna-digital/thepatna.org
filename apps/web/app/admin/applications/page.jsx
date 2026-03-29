import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { reviewApplicationAction } from "./actions";

const STATUS_OPTIONS = ["submitted", "interviewing", "approved", "waitlist", "declined"];

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getNoticeMessage(notice) {
  if (notice === "saved") {
    return "Application review saved.";
  }

  if (notice === "error") {
    return "Review update failed. Please retry.";
  }

  if (notice === "missing-fields") {
    return "Status and application ID are required.";
  }

  return "";
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
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data: applications, error } = await query;

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
        title: "Application decisions and notes",
        body: "Filter, review, and update application status without leaving the admin shell.",
      }}
      title="Application review"
      subtitle="This queue is live against Supabase. Updates here write directly to the PATNA community application workflow."
    >
      <article className="dashboard-card">
        <div className="stack">
          <div className="dashboard-toolbar">
            <Link className={activeStatus === "all" ? "filter-tab active-filter" : "filter-tab"} href="/admin/applications">
              All
            </Link>
            {STATUS_OPTIONS.map((status) => (
              <Link
                className={activeStatus === status ? "filter-tab active-filter" : "filter-tab"}
                href={`/admin/applications?status=${status}`}
                key={status}
              >
                {status} ({statusCounts[status] ?? 0})
              </Link>
            ))}
          </div>

          {notice ? <p className="form-success">{getNoticeMessage(notice)}</p> : null}
          {error ? <p className="form-error">{error.message}</p> : null}
        </div>
      </article>

      <div className="stack">
        {applications?.length ? (
          applications.map((application) => (
            <article className="dashboard-card" key={application.id}>
              <div className="list-row">
                <div>
                  <strong>
                    {application.first_name} {application.surname}
                  </strong>
                  <p>
                    {application.organisation || "No organisation provided"} ·{" "}
                    {application.country || "Country not provided"}
                  </p>
                </div>
                <div className="item-meta">
                  <span>{application.submitted_by_email}</span>
                  <span className="status-chip">{application.status}</span>
                  <span>{formatDate(application.created_at)}</span>
                </div>
              </div>

              <div className="stack">
                <div>
                  <strong>Role title</strong>
                  <p>{application.role_title || "Not provided"}</p>
                </div>
                <div>
                  <strong>Motivation</strong>
                  <p>{application.motivation_text}</p>
                </div>
              </div>

              <form action={reviewApplicationAction} className="form-card compact-form">
                <input name="application_id" type="hidden" value={application.id} />
                <div className="two-column-grid">
                  <label>
                    Status
                    <select defaultValue={application.status} name="status">
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Reviewer note
                    <textarea
                      defaultValue={application.review_notes || ""}
                      name="review_notes"
                      placeholder="Add interview notes, decision rationale, or follow-up actions."
                    />
                  </label>
                </div>
                <button className="primary-button" type="submit">
                  Save review
                </button>
              </form>
            </article>
          ))
        ) : (
          <article className="dashboard-card">
            <h3>No applications found</h3>
            <p>No applications match the current filter yet.</p>
          </article>
        )}
      </div>
    </DashboardShell>
  );
}
