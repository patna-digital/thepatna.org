"use client";

import { useMemo, useState } from "react";
import { applicationEngagementOptions, applicationExpertiseOptions } from "@/lib/patna-data";
import { approveAndInviteApplicationAction, reviewApplicationAction } from "../app/admin/applications/actions";

const STATUS_OPTIONS = ["submitted", "interviewing", "approved", "waitlist", "declined"];

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

export function AdminApplicationsList({ applications, cohorts }) {
  const [search, setSearch] = useState("");
  const cohortsById = useMemo(() => new Map((cohorts || []).map((c) => [c.id, c])), [cohorts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((app) => getSearchText(app).includes(q));
  }, [applications, search]);

  return (
    <div className="stack">
      {/* Results count */}
      {search ? (
        <p className="muted-note">
          Showing {filtered.length} of {applications.length} applications matching "{search}".
        </p>
      ) : null}

      {/* List */}
      <article className="dashboard-card app-list-card">
        {filtered.length ? (
          <div className="app-list">
            {filtered.map((application) => {
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
                        <span className={`status-chip ${chipClass}`}>{application.status}</span>
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
                              <p>Creates the member profile and sends a password-setup email.</p>
                            </div>
                            <button className="primary-button" type="submit">Approve &amp; invite</button>
                          </div>
                        </form>
                      ) : null}

                      <form action={reviewApplicationAction} className="app-row-action-form">
                        <input name="application_id" type="hidden" value={application.id} />
                        <div className="app-row-review-grid">
                          <label>
                            Status
                            <select defaultValue={application.status} name="status">
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
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
                        <button className="primary-button" type="submit">Save review</button>
                      </form>
                    </div>
                  </div>
                </details>
              );
            })}
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
