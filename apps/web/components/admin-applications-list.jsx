"use client";

import { useMemo, useState } from "react";
import { applicationEngagementOptions, applicationExpertiseOptions } from "@/lib/patna-data";
import {
  approveAndInviteApplicationAction,
  resendApplicationInviteAction,
  reviewApplicationAction,
  sendPasswordResetLinkAction,
} from "../app/admin/applications/actions";

const STATUS_OPTIONS = ["submitted", "interviewing", "approved", "waitlist", "declined"];

const STATUS_LABELS = {
  submitted: "Submitted",
  interviewing: "Interviewing",
  approved: "Approved",
  waitlist: "Waitlist",
  declined: "Declined",
};

const STATUS_CHIP = {
  submitted: "chip-neutral",
  interviewing: "chip-warning",
  approved: "chip-success",
  waitlist: "chip-muted",
  declined: "chip-danger",
};

const expertiseLabels = new Map(applicationExpertiseOptions.map((o) => [o.slug, o.label]));
const engagementLabels = new Map(applicationEngagementOptions.map((o) => [o.slug, o.label]));

function getLabels(values, labelsBySlug, otherText) {
  const resolved = (values || []).map((v) => labelsBySlug.get(v) || v);
  if (otherText) resolved.push(`Other: ${otherText}`);
  return resolved.filter(Boolean);
}

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

function isNewApplication(submittedAt) {
  if (!submittedAt) return false;
  return Date.now() - new Date(submittedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function getSearchText(app) {
  return [
    app.first_name,
    app.surname,
    app.submitted_by_email,
    app.organisation,
    app.country,
    app.role_title,
    app.motivation_text,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function ApplicationRow({ application, cohorts, cohortsById }) {
  const expertise = getLabels(application.expertise_slugs, expertiseLabels, application.expertise_other_text);
  const engagement = getLabels(application.engagement_slugs, engagementLabels, application.engagement_other_text);
  const assignedCohort = application.assigned_cohort_id
    ? cohortsById.get(application.assigned_cohort_id)?.name || "Assigned cohort"
    : null;
  const chipClass = STATUS_CHIP[application.status] || "chip-neutral";
  const statusLabel = STATUS_LABELS[application.status] || application.status;
  const fullName = `${application.first_name} ${application.surname}`.trim();
  const roleLine = [application.role_title, application.organisation, application.country]
    .filter(Boolean)
    .join(" · ");
  const submittedAt = application.submitted_at || application.created_at;
  const isNew = isNewApplication(submittedAt);

  const [selectedStatus, setSelectedStatus] = useState(application.status);

  const profile = application.member_profile;
  const isDeclined = application.status === "declined";
  const isApproved = application.status === "approved";
  const willBeApproved = selectedStatus === "approved";

  // Determine which invite action to show
  function InviteAction() {
    if (isDeclined) return null;

    if (!isApproved || !profile) {
      return (
        <form action={approveAndInviteApplicationAction} className="app-invite-form">
          <input name="application_id" type="hidden" value={application.id} />
          <div className="app-invite-form-body">
            <div className="app-invite-form-copy">
              <strong>Approve &amp; invite</strong>
              <span>Creates the member profile and sends a password-setup email.</span>
            </div>
            <button className="primary-button" type="submit">Approve &amp; invite</button>
          </div>
        </form>
      );
    }

    if (profile.onboarding_status === "active") {
      return (
        <form action={sendPasswordResetLinkAction} className="app-invite-form">
          <input name="application_id" type="hidden" value={application.id} />
          <div className="app-invite-form-body">
            <div className="app-invite-form-copy">
              <strong>Send password reset</strong>
              <span>Member is active. Sends a password reset link to their email.</span>
            </div>
            <button className="secondary-button" type="submit">Send password reset</button>
          </div>
        </form>
      );
    }

    return (
      <form action={resendApplicationInviteAction} className="app-invite-form">
        <input name="application_id" type="hidden" value={application.id} />
        <div className="app-invite-form-body">
          <div className="app-invite-form-copy">
            <strong>Resend invite link</strong>
            <span>Account not yet set up. Sends a fresh password-setup email.</span>
          </div>
          <button className="secondary-button" type="submit">Resend invite</button>
        </div>
      </form>
    );
  }

  return (
    <details className="app-row" key={application.id}>
      <summary className="app-row-summary">
        <div className="app-row-primary">
          <div className="app-row-identity">
            <strong>{fullName}</strong>
            {roleLine ? <span>{roleLine}</span> : null}
          </div>
          <div className="app-row-signals">
            {isNew ? <span className="status-chip chip-new">New</span> : null}
            <span className={`status-chip ${chipClass}`}>{statusLabel}</span>
            {assignedCohort ? (
              <span className="status-chip chip-muted">{assignedCohort}</span>
            ) : null}
            <span className="app-row-expand-hint">Review</span>
          </div>
        </div>
        <div className="app-row-meta">
          <span>{application.submitted_by_email}</span>
          <span>{formatShortDate(submittedAt)}</span>
          <span>{formatSourceLabel(application.source)}</span>
        </div>
      </summary>

      <div className="app-row-detail">

        {/* Motivation */}
        {application.motivation_text ? (
          <p className="app-row-detail-motivation">{application.motivation_text}</p>
        ) : null}

        {/* Details */}
        <div className="app-row-section-header">Details</div>
        <div className="app-row-detail-grid">
          <div className="app-row-detail-field">
            <strong>Phone</strong>
            <p>{application.phone_number || "Not provided"}</p>
          </div>
          <div className="app-row-detail-field">
            <strong>Submitted</strong>
            <p>{formatFullDate(submittedAt)}</p>
          </div>
          <div className="app-row-detail-field">
            <strong>Source</strong>
            <p>{formatSourceLabel(application.source)}</p>
          </div>
          <div className="app-row-detail-field">
            <strong>Cohort</strong>
            <p>{assignedCohort || "Not assigned"}</p>
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
          <>
            <div className="app-row-section-header">Expertise</div>
            <div className="member-directory-tag-row app-row-tag-row">
              {expertise.map((label) => (
                <span className="status-chip chip-neutral" key={label}>{label}</span>
              ))}
            </div>
          </>
        ) : null}

        {engagement.length ? (
          <>
            <div className="app-row-section-header">Engagement interests</div>
            <div className="member-directory-tag-row app-row-tag-row">
              {engagement.map((label) => (
                <span className="status-chip chip-neutral" key={label}>{label}</span>
              ))}
            </div>
          </>
        ) : null}

        {/* ── Review panel ─────────────────────────────────────────────── */}
        {!isDeclined && (
          <div className="app-review-panel">
            <div className="app-row-section-header">Review</div>

            <form action={reviewApplicationAction} className="app-review-form">
              <input name="application_id" type="hidden" value={application.id} />

              <div className="app-row-review-grid">
                <label>
                  Status
                  <select
                    name="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Cohort
                  <select defaultValue={application.assigned_cohort_id || ""} name="assigned_cohort_id">
                    <option value="">Not assigned</option>
                    {(cohorts || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
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

              <div className="app-review-save-bar">
                <button className="secondary-button" type="submit">Save review</button>
              </div>
            </form>

            {/* Invite action sits outside the review form to avoid nested <form> */}
            {(isApproved || willBeApproved) && (
              <div className="app-review-action-bar">
                <InviteAction />
              </div>
            )}
          </div>
        )}

      </div>
    </details>
  );
}

export function AdminApplicationsList({ applications, cohorts }) {
  const [search, setSearch] = useState("");
  const cohortsById = useMemo(() => new Map((cohorts || []).map((c) => [c.id, c])), [cohorts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) => getSearchText(app).includes(q));
  }, [applications, search]);

  const groups = useMemo(() => {
    const presentStatuses = new Set(filtered.map((a) => a.status));
    if (presentStatuses.size <= 1) return null;
    return STATUS_OPTIONS
      .filter((s) => presentStatuses.has(s))
      .map((status) => ({
        status,
        items: filtered.filter((a) => a.status === status),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div className="stack">
      <div className="admin-list-search">
        <span className="admin-list-search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search by name, email, organisation, or country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search ? (
          <span className="admin-list-search-count">
            {filtered.length} of {applications.length}
          </span>
        ) : null}
      </div>

      <article className="dashboard-card app-list-card">
        {filtered.length ? (
          <div className="app-list">
            {groups ? (
              groups.map((group) => (
                <div key={group.status}>
                  <div className="app-row-group-header">
                    <span className={`status-chip ${STATUS_CHIP[group.status] || "chip-neutral"}`}>
                      {STATUS_LABELS[group.status]}
                    </span>
                    <span>{group.items.length} application{group.items.length !== 1 ? "s" : ""}</span>
                  </div>
                  {group.items.map((application) => (
                    <ApplicationRow
                      application={application}
                      cohorts={cohorts}
                      cohortsById={cohortsById}
                      key={application.id}
                    />
                  ))}
                </div>
              ))
            ) : (
              filtered.map((application) => (
                <ApplicationRow
                  application={application}
                  cohorts={cohorts}
                  cohortsById={cohortsById}
                  key={application.id}
                />
              ))
            )}
          </div>
        ) : (
          <div className="app-row-empty">
            <strong>{search ? "No applications match your search." : "No applications found."}</strong>
            {search ? <p>Try a different name, email, or organisation.</p> : null}
          </div>
        )}
      </article>
    </div>
  );
}
