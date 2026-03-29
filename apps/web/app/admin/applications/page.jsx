import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  applicationEngagementOptions,
  applicationExpertiseOptions,
  adminNav,
} from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { reviewApplicationAction } from "./actions";

const STATUS_OPTIONS = ["submitted", "interviewing", "approved", "waitlist", "declined"];
const expertiseLabels = new Map(applicationExpertiseOptions.map((option) => [option.slug, option.label]));
const engagementLabels = new Map(applicationEngagementOptions.map((option) => [option.slug, option.label]));

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSourceLabel(value) {
  if (value === "wpforms_import") {
    return "WPForms import";
  }

  return "PATNA web form";
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

function getLabels(values, labelsBySlug, otherText) {
  const resolved = (values || []).map((value) => labelsBySlug.get(value) || value);

  if (otherText) {
    resolved.push(`Other: ${otherText}`);
  }

  return resolved.filter(Boolean);
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

  const cohortsById = new Map((cohorts || []).map((cohort) => [cohort.id, cohort]));
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
        body: "Review new community applications, assign internal cohort placement, and capture interview decisions.",
      }}
      title="Application review"
      subtitle="This queue is live against Supabase. PATNA now captures applicant expertise, engagement intent, consent state, and source provenance directly in the review flow."
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
          applications.map((application) => {
            const expertise = getLabels(
              application.expertise_slugs,
              expertiseLabels,
              application.expertise_other_text,
            );
            const engagement = getLabels(
              application.engagement_slugs,
              engagementLabels,
              application.engagement_other_text,
            );
            const assignedCohort = application.assigned_cohort_id
              ? cohortsById.get(application.assigned_cohort_id)?.name || "Assigned cohort"
              : "Not assigned";

            return (
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
                    <span>{formatDate(application.submitted_at || application.created_at)}</span>
                    <span>{formatSourceLabel(application.source)}</span>
                  </div>
                </div>

                <div className="stack">
                  <div className="two-column-grid">
                    <div>
                      <strong>Phone</strong>
                      <p>{application.phone_number || "Not provided"}</p>
                    </div>
                    <div>
                      <strong>Assigned cohort</strong>
                      <p>{assignedCohort}</p>
                    </div>
                  </div>

                  <div>
                    <strong>Role title</strong>
                    <p>{application.role_title || "Not provided"}</p>
                  </div>

                  <div>
                    <strong>Motivation</strong>
                    <p>{application.motivation_text}</p>
                  </div>

                  <div>
                    <strong>Expertise</strong>
                    <div className="member-directory-tag-row">
                      {expertise.length ? (
                        expertise.map((label) => (
                          <span className="status-chip chip-neutral" key={label}>
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="member-directory-footer-note">No expertise selections recorded.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>Engagement preferences</strong>
                    <div className="member-directory-tag-row">
                      {engagement.length ? (
                        engagement.map((label) => (
                          <span className="status-chip chip-neutral" key={label}>
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="member-directory-footer-note">No engagement preferences recorded.</span>
                      )}
                    </div>
                  </div>

                  <div className="two-column-grid">
                    <div>
                      <strong>Consent: data storage</strong>
                      <p>{application.consent_data_storage ? "Yes" : "No / legacy unknown"}</p>
                    </div>
                    <div>
                      <strong>Consent: updates</strong>
                      <p>{application.consent_updates ? "Yes" : "No / not subscribed"}</p>
                    </div>
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
                      Assigned cohort
                      <select
                        defaultValue={application.assigned_cohort_id || ""}
                        name="assigned_cohort_id"
                      >
                        <option value="">Not assigned</option>
                        {(cohorts || []).map((cohort) => (
                          <option key={cohort.id} value={cohort.id}>
                            {cohort.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Reviewer note
                    <textarea
                      defaultValue={application.review_notes || ""}
                      name="review_notes"
                      placeholder="Add interview notes, decision rationale, or follow-up actions."
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Save review
                  </button>
                </form>
              </article>
            );
          })
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
