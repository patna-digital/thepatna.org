import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  applicationEngagementOptions,
  applicationExpertiseOptions,
  adminNav,
} from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { approveAndInviteApplicationAction, reviewApplicationAction } from "./actions";

const STATUS_OPTIONS = ["submitted", "interviewing", "approved", "waitlist", "declined"];
const expertiseLabels = new Map(applicationExpertiseOptions.map((o) => [o.slug, o.label]));
const engagementLabels = new Map(applicationEngagementOptions.map((o) => [o.slug, o.label]));

const STATUS_CHIP = {
  submitted: "chip-neutral",
  interviewing: "chip-warning",
  approved: "chip-success",
  waitlist: "chip-muted",
  declined: "chip-danger",
};

function formatShortDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatFullDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatSourceLabel(value) {
  return value === "wpforms_import" ? "WPForms import" : "PATNA web form";
}

function getLabels(values, labelsBySlug, otherText) {
  const resolved = (values || []).map((v) => labelsBySlug.get(v) || v);
  if (otherText) resolved.push(`Other: ${otherText}`);
  return resolved.filter(Boolean);
}

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

  const cohortsById = new Map((cohorts || []).map((c) => [c.id, c]));
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
      <article className="dashboard-card">
        <div className="stack">
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
          {notice ? (
            <p className={notice === "error" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice)}
            </p>
          ) : null}
          {error ? <p className="form-error">{error.message}</p> : null}
        </div>
      </article>

      <article className="dashboard-card app-list-card">
        {applications?.length ? (
          <div className="app-list">
            {applications.map((application) => {
              const expertise = getLabels(application.expertise_slugs, expertiseLabels, application.expertise_other_text);
              const engagement = getLabels(application.engagement_slugs, engagementLabels, application.engagement_other_text);
              const assignedCohort = application.assigned_cohort_id
                ? cohortsById.get(application.assigned_cohort_id)?.name || "Assigned cohort"
                : null;
              const chipClass = STATUS_CHIP[application.status] || "chip-neutral";
              const fullName = `${application.first_name} ${application.surname}`.trim();
              const roleLine = [application.role_title, application.organisation, application.country]
                .filter(Boolean)
                .join(" · ");

              return (
                <details className="app-row" key={application.id}>
                  <summary className="app-row-summary">
                    <div className="app-row-primary">
                      <div className="app-row-identity">
                        <strong>{fullName}</strong>
                        {roleLine ? <span>{roleLine}</span> : null}
                      </div>
                      <div className="app-row-signals">
                        <span className={`status-chip ${chipClass}`}>
                          {application.status}
                        </span>
                        {assignedCohort ? (
                          <span className="status-chip chip-muted">{assignedCohort}</span>
                        ) : null}
                        <span className="app-row-expand-hint">Review</span>
                      </div>
                    </div>
                    <div className="app-row-meta">
                      <span>{application.submitted_by_email}</span>
                      <span>{formatShortDate(application.submitted_at || application.created_at)}</span>
                      <span>{formatSourceLabel(application.source)}</span>
                    </div>
                  </summary>

                  <div className="app-row-detail">
                    {application.motivation_text ? (
                      <p className="app-row-detail-motivation">{application.motivation_text}</p>
                    ) : null}

                    <div className="app-row-detail-grid">
                      <div className="app-row-detail-field">
                        <strong>Phone</strong>
                        <p>{application.phone_number || "Not provided"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Cohort</strong>
                        <p>{assignedCohort || "Not assigned"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Submitted</strong>
                        <p>{formatFullDate(application.submitted_at || application.created_at)}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Consent: data</strong>
                        <p>{application.consent_data_storage ? "Yes" : "No / legacy"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Consent: updates</strong>
                        <p>{application.consent_updates ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {expertise.length ? (
                      <div className="app-row-tag-section">
                        <span className="app-row-tag-label">Expertise</span>
                        <div className="member-directory-tag-row">
                          {expertise.map((label) => (
                            <span className="status-chip chip-neutral" key={label}>{label}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {engagement.length ? (
                      <div className="app-row-tag-section">
                        <span className="app-row-tag-label">Engagement</span>
                        <div className="member-directory-tag-row">
                          {engagement.map((label) => (
                            <span className="status-chip chip-neutral" key={label}>{label}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="app-row-actions">
                      {application.status !== "declined" ? (
                        <form action={approveAndInviteApplicationAction} className="app-row-action-form app-row-action-form-primary">
                          <input name="application_id" type="hidden" value={application.id} />
                          <div className="app-row-action-form-body">
                            <div>
                              <strong>Approve &amp; invite</strong>
                              <p>Creates the member profile and sends a password-setup email. They will appear in the Members list.</p>
                            </div>
                            <button className="primary-button" type="submit">
                              Approve &amp; invite
                            </button>
                          </div>
                        </form>
                      ) : null}

                      <form action={reviewApplicationAction} className="app-row-action-form">
                        <input name="application_id" type="hidden" value={application.id} />
                        <div className="app-row-review-grid">
                          <label>
                            Status
                            <select defaultValue={application.status} name="status">
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Cohort
                            <select defaultValue={application.assigned_cohort_id || ""} name="assigned_cohort_id">
                              <option value="">Not assigned</option>
                              {(cohorts || []).map((cohort) => (
                                <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label>
                          Reviewer note
                          <textarea
                            defaultValue={application.review_notes || ""}
                            name="review_notes"
                            placeholder="Interview notes, decision rationale, or follow-up actions."
                            rows={3}
                          />
                        </label>
                        <button className="secondary-button" type="submit">Save review</button>
                      </form>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="app-list-empty">
            <p>No applications match the current filter.</p>
          </div>
        )}
      </article>
    </DashboardShell>
  );
}
