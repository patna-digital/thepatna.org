"use client";

import { useMemo, useState, useTransition } from "react";
import { applicationEngagementOptions, applicationExpertiseOptions } from "@/lib/patna-data";
import {
  approveAndInviteApplicationAction,
  assignApplicationAction,
  resendApplicationInviteAction,
  reviewApplicationAction,
  sendPasswordResetLinkAction,
  updateApplicationCohortsAction,
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
    app.assignee_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// ── Multi-cohort selector ────────────────────────────────────────────────────

function MultiCohortSelector({ applicationId, cohorts, initialAssignedCohorts }) {
  const [selected, setSelected] = useState(() => new Set(initialAssignedCohorts.map((c) => c.cohort_id)));
  const [primaryId, setPrimaryId] = useState(() => initialAssignedCohorts.find((c) => c.is_primary)?.cohort_id || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleCohort(cohortId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cohortId)) {
        next.delete(cohortId);
        if (primaryId === cohortId) setPrimaryId("");
      } else {
        next.add(cohortId);
        if (!primaryId) setPrimaryId(cohortId);
      }
      return next;
    });
    setSaved(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    // Ensure cohort_ids[] reflects current checked state (FormData from checkboxes)
    startTransition(async () => {
      await updateApplicationCohortsAction(fd);
      setSaved(true);
    });
  }

  return (
    <form className="multicohort-form" onSubmit={handleSubmit}>
      <input name="application_id" type="hidden" value={applicationId} />
      <input name="primary_cohort_id" type="hidden" value={primaryId} />

      <div className="app-row-section-header">Cohort assignment</div>
      <div className="multicohort-grid">
        {(cohorts || []).map((cohort) => {
          const isSelected = selected.has(cohort.id);
          const isPrimary = primaryId === cohort.id;
          return (
            <label
              className={`multicohort-option${isSelected ? " is-selected" : ""}${isPrimary ? " is-primary" : ""}`}
              key={cohort.id}
            >
              <input
                checked={isSelected}
                name="cohort_ids[]"
                onChange={() => toggleCohort(cohort.id)}
                type="checkbox"
                value={cohort.id}
              />
              <span className="multicohort-option-name">{cohort.name}</span>
              {isSelected && (
                <button
                  aria-label={isPrimary ? "Primary cohort" : `Set ${cohort.name} as primary`}
                  className={`multicohort-primary-btn${isPrimary ? " is-active" : ""}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrimaryId(cohort.id); setSaved(false); }}
                  title={isPrimary ? "Primary cohort" : "Set as primary"}
                  type="button"
                >
                  {isPrimary ? "Primary" : "Set primary"}
                </button>
              )}
            </label>
          );
        })}
      </div>

      {selected.size > 0 && (
        <p className="multicohort-summary">
          <strong>{selected.size}</strong> cohort{selected.size !== 1 ? "s" : ""} selected
          {primaryId ? ` · Primary: ${cohorts.find((c) => c.id === primaryId)?.name || "—"}` : ""}
        </p>
      )}

      <div className="app-review-save-bar">
        <button className="secondary-button" disabled={isPending} type="submit">
          {isPending ? "Saving…" : saved ? "✓ Saved" : "Save cohorts"}
        </button>
      </div>
    </form>
  );
}

// ── Task assignment panel ────────────────────────────────────────────────────

function AssignmentPanel({ application, admins }) {
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState(application.assigned_to_user_id || "");
  const [notes, setNotes] = useState(application.assignment_notes || "");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const currentAssignee = admins.find((a) => a.id === application.assigned_to_user_id);

  function handleSubmit(e) {
    e.preventDefault();
    if (!assigneeId) return;
    const fd = new FormData(e.target);
    startTransition(async () => {
      await assignApplicationAction(fd);
      setSent(true);
      setOpen(false);
    });
  }

  return (
    <div className="assignment-panel">
      <div className="app-row-section-header">
        <span>Task assignment</span>
        {currentAssignee && (
          <span className="status-chip chip-muted" style={{ marginLeft: "auto" }}>
            Assigned to {[currentAssignee.first_name, currentAssignee.surname].filter(Boolean).join(" ") || currentAssignee.email}
          </span>
        )}
      </div>

      {!open ? (
        <div className="assignment-summary">
          {currentAssignee ? (
            <p className="assignment-current">
              <strong>{[currentAssignee.first_name, currentAssignee.surname].filter(Boolean).join(" ")}</strong>
              {application.assignment_notes ? ` — ${application.assignment_notes}` : ""}
              {application.assigned_at ? (
                <span className="assignment-meta"> · {formatShortDate(application.assigned_at)}</span>
              ) : null}
            </p>
          ) : (
            <p className="assignment-empty">Not assigned to anyone yet.</p>
          )}
          <button className="secondary-button" onClick={() => setOpen(true)} type="button">
            {currentAssignee ? "Reassign" : "Assign to admin"}
          </button>
        </div>
      ) : (
        <form className="assignment-form" onSubmit={handleSubmit}>
          <input name="application_id" type="hidden" value={application.id} />

          <label className="form-label">
            Assign to
            <select
              className="form-select"
              name="assigned_to_user_id"
              onChange={(e) => setAssigneeId(e.target.value)}
              required
              value={assigneeId}
            >
              <option value="">— select admin —</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {[admin.first_name, admin.surname].filter(Boolean).join(" ") || admin.email}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Notes for assignee <span className="form-label-optional">(optional)</span>
            <textarea
              className="form-textarea"
              maxLength={500}
              name="assignment_notes"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific action needed, deadline, or context…"
              rows={3}
              value={notes}
            />
          </label>

          <div className="assignment-form-actions">
            <button
              className="primary-button"
              disabled={isPending || !assigneeId}
              type="submit"
            >
              {isPending ? "Assigning…" : sent ? "✓ Assigned" : "Assign & notify"}
            </button>
            <button
              className="secondary-button"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Application row ──────────────────────────────────────────────────────────

function ApplicationRow({ application, admins, cohorts, cohortsById, assignedCohortsMap }) {
  const expertise = getLabels(application.expertise_slugs, expertiseLabels, application.expertise_other_text);
  const engagement = getLabels(application.engagement_slugs, engagementLabels, application.engagement_other_text);

  // Prefer new multi-cohort assignments, fall back to legacy single field
  const assignedCohorts = assignedCohortsMap.get(application.id) || [];
  const primaryCohort = assignedCohorts.find((c) => c.is_primary) ||
    (application.assigned_cohort_id ? { cohort_id: application.assigned_cohort_id, is_primary: true } : null);
  const primaryCohortName = primaryCohort ? (cohortsById.get(primaryCohort.cohort_id)?.name || "Assigned") : null;

  const chipClass = STATUS_CHIP[application.status] || "chip-neutral";
  const statusLabel = STATUS_LABELS[application.status] || application.status;
  const fullName = `${application.first_name || ""} ${application.surname || ""}`.trim();
  const roleLine = [application.role_title, application.organisation, application.country]
    .filter(Boolean)
    .join(" · ");
  const submittedAt = application.submitted_at || application.created_at;
  const isNew = isNewApplication(submittedAt);
  const isDeclined = application.status === "declined";
  const isApproved = application.status === "approved";

  const [selectedStatus, setSelectedStatus] = useState(application.status);
  const willBeApproved = selectedStatus === "approved";

  const profile = application.member_profile;
  const assignee = admins.find((a) => a.id === application.assigned_to_user_id);

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
              <span>Member is active. Sends a password reset link.</span>
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
            {assignee && (
              <span className="status-chip chip-muted app-assignee-chip" title="Assigned to">
                ↳ {[assignee.first_name, assignee.surname].filter(Boolean).join(" ") || assignee.email}
              </span>
            )}
            <span className={`status-chip ${chipClass}`}>{statusLabel}</span>
            {primaryCohortName ? (
              <span className="status-chip chip-muted">{primaryCohortName}</span>
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

        {application.motivation_text ? (
          <p className="app-row-detail-motivation">{application.motivation_text}</p>
        ) : null}

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
            <strong>Primary cohort</strong>
            <p>{primaryCohortName || "Not assigned"}</p>
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

        {/* ── Review panel ── */}
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
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    value={selectedStatus}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </label>
                {/* Legacy single-cohort field kept for backward compat with provisioning */}
                <label>
                  Primary cohort (legacy)
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
                  placeholder="Interview notes, decision rationale, or follow-up actions."
                />
              </label>

              <div className="app-review-save-bar">
                <button className="secondary-button" type="submit">Save review</button>
              </div>
            </form>

            {/* Multi-cohort assignment (additive, manages application_assigned_cohorts) */}
            <MultiCohortSelector
              applicationId={application.id}
              cohorts={cohorts}
              initialAssignedCohorts={assignedCohorts}
            />

            {/* Task assignment (assigns to admin + notifications) */}
            {admins.length > 0 && (
              <AssignmentPanel admins={admins} application={application} />
            )}

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

// ── Main list ────────────────────────────────────────────────────────────────

export function AdminApplicationsList({ admins = [], applications, assignedCohortsMap = new Map(), cohorts }) {
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
        <span aria-hidden="true" className="admin-list-search-icon">⌕</span>
        <input
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, organisation, country, or assignee…"
          type="search"
          value={search}
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
                      admins={admins}
                      application={application}
                      assignedCohortsMap={assignedCohortsMap}
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
                  admins={admins}
                  application={application}
                  assignedCohortsMap={assignedCohortsMap}
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
