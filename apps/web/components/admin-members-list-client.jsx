"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MemberProfileModal } from "./member-profile-modal";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getCompletionTone(pct) {
  if (pct >= 70) return "success";
  if (pct >= 30) return "warning";
  return "danger";
}

function getMemberAlertIssues(member) {
  const issues = [];
  if (member.needsHeadshotRecovery) issues.push("Headshot recovery needed");
  if (member.needsResumeRecovery) issues.push("Resume recovery needed");
  if (!member.isProfileComplete && member.missingProfileFields.length) {
    issues.push(`Missing: ${member.missingProfileFields.join(", ")}`);
  }
  return issues;
}

function getInviteLabel(latestInvite) {
  if (!latestInvite) return "Not sent";
  if (latestInvite.delivery_method === "supabase_invite") return "Invite sent";
  return "Reset sent";
}

function getSearchText(member) {
  return [
    member.displayName,
    member.email,
    member.organisation_name,
    member.role_title,
    member.country_of_residence,
    member.primaryCohort?.name,
    ...(member.secondaryCohorts || []).map((cohort) => cohort.name),
    ...(member.domainTags || []).map((tag) => tag.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function AdminMembersListClient({
  members,
  returnPath,
  sendInviteAction,
  updateStatusAction,
}) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return members;
    }

    return members.filter((member) => getSearchText(member).includes(query));
  }, [members, search]);

  if (!members.length) {
    return (
      <div className="app-row-empty">
        <strong>No members found</strong>
        <p>No members match the current filter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="stack">
        <div className="admin-list-search">
          <span className="admin-list-search-icon" aria-hidden="true">⌕</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, organisation, cohort, or country…"
            type="search"
            value={search}
          />
          {search ? (
            <span className="admin-list-search-count">
              {filtered.length} of {members.length}
            </span>
          ) : null}
        </div>

        <article className="dashboard-card app-list-card">
          {filtered.length ? (
            <div className="app-list">
              {filtered.map((member) => {
                const inviteLabel = member.wasContacted ? getInviteLabel(member.latestInvite) : "Not sent";
                const inviteTone = member.wasContacted ? "neutral" : "warning";
                const issues = getMemberAlertIssues(member);
                const hasIssues = issues.length > 0;

                return (
                  <div className="app-row-wrap" key={member.id}>
                    <label className="app-row-checkbox">
                      <input form="bulk-member-action-form" name="profile_ids" type="checkbox" value={member.id} />
                    </label>

                    <details className="app-row app-row-indented">
                      <summary className="app-row-summary">
                        <div className="app-row-primary">
                          <div className="app-row-identity">
                            <strong>{member.displayName}</strong>
                            <span>
                              {[member.primaryCohort?.name, member.organisation_name, member.country_of_residence]
                                .filter(Boolean)
                                .join(" · ") || "No organisation on file"}
                            </span>
                          </div>
                          <div className="app-row-signals">
                            <span className={`status-chip chip-${inviteTone}`}>{inviteLabel}</span>
                            <span className={`status-chip chip-${member.isActive ? "success" : "warning"}`}>
                              {formatLabel(member.onboarding_status)}
                            </span>
                            <span className={`status-chip chip-${member.profileStatus === "inactive" ? "muted" : "success"}`}>
                              Profile {member.profileStatus}
                            </span>
                            <span className={`status-chip chip-${getCompletionTone(member.completionPercent)}`}>
                              {member.completionPercent}%
                            </span>
                            {hasIssues ? <span className="status-chip chip-danger">Needs attention</span> : null}
                            <span className="app-row-expand-hint">Details</span>
                          </div>
                        </div>

                        <div className="app-row-meta">
                          <span>{member.email}</span>
                          <span>Last sign-in: {formatDate(member.authUser?.last_sign_in_at)}</span>
                          {member.latestInvite ? <span>Invited: {formatDate(member.latestInvite.created_at)}</span> : null}
                        </div>
                      </summary>

                      <div className="app-row-detail">
                        {hasIssues ? (
                          <div className="app-row-alert app-row-alert-warning">
                            {issues.join(" · ")}
                          </div>
                        ) : (
                          <div className="app-row-alert">
                            {member.isActive
                              ? "Onboarding data on file — member is ready for access management."
                              : "Member will complete onboarding after setting a password."}
                          </div>
                        )}

                        <div className="app-row-detail-grid">
                          <div className="app-row-detail-field">
                            <strong>Primary cohort</strong>
                            <p>{member.primaryCohort?.name || "Not assigned"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Secondary cohorts</strong>
                            <p>{member.secondaryCohorts.length ? member.secondaryCohorts.map((cohort) => cohort.name).join(", ") : "None"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Organisation</strong>
                            <p>{member.organisation_name || "Not provided"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Role</strong>
                            <p>{member.role_title || "Not provided"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Country</strong>
                            <p>{member.country_of_residence || "Not provided"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Phone / WhatsApp</strong>
                            <p>{[member.phone_number, member.whatsapp_number].filter(Boolean).join(" / ") || "Not provided"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Timezone</strong>
                            <p>{member.timezone || "Not provided"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Availability</strong>
                            <p>{formatLabel(member.availabilityStatus)}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Last sign-in</strong>
                            <p>{formatDateTime(member.authUser?.last_sign_in_at)}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Last login email</strong>
                            <p>{member.latestInvite ? formatDateTime(member.latestInvite.created_at) : "Not sent yet"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Form completion</strong>
                            <p>{member.cohortProfile?.completed_at ? `Completed ${formatDate(member.cohortProfile.completed_at)}` : "Still required"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Headshot</strong>
                            <p>{member.needsHeadshotRecovery ? "Recovery needed" : member.hasHeadshot ? "Ready" : "Missing"}</p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Resume</strong>
                            <p>
                              {member.needsResumeRecovery
                                ? "Recovery needed"
                                : member.resumeAsset?.source_kind === "storage"
                                  ? "Stored"
                                  : member.resumeAsset?.source_kind === "external"
                                    ? "External"
                                    : "Missing"}
                            </p>
                          </div>
                          <div className="app-row-detail-field">
                            <strong>Migration batch</strong>
                            <p>{member.migration_batch_id || "Legacy / manual"}</p>
                          </div>
                        </div>

                        <div className="app-row-actions-row">
                          <button
                            className="secondary-button"
                            onClick={() => setSelectedMember(member)}
                            type="button"
                          >
                            View profile
                          </button>
                          {member.needsHeadshotRecovery ? (
                            <Link className="secondary-button" href={`/admin/members/${member.id}`}>
                              Recover headshot
                            </Link>
                          ) : null}
                          <form action={updateStatusAction}>
                            <input name="profile_id" type="hidden" value={member.id} />
                            <input name="return_to" type="hidden" value={returnPath} />
                            <input name="next_status" type="hidden" value={member.profileStatus === "inactive" ? "active" : "inactive"} />
                            <button className="secondary-button" type="submit">
                              Mark {member.profileStatus === "inactive" ? "active" : "inactive"}
                            </button>
                          </form>
                          <form action={sendInviteAction}>
                            <input name="profile_id" type="hidden" value={member.id} />
                            <input name="return_to" type="hidden" value={returnPath} />
                            <button className="primary-button" type="submit">
                              {member.latestInvite ? "Resend login email" : "Send login email"}
                            </button>
                          </form>
                        </div>
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="app-row-empty">
              <strong>{search ? "No members match your search." : "No members found"}</strong>
              {search ? <p>Try a different name, email, organisation, or cohort.</p> : <p>No members match the current filter.</p>}
            </div>
          )}
        </article>
      </div>

      {selectedMember ? (
        <MemberProfileModal
          isAdmin={true}
          isSelf={false}
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      ) : null}
    </>
  );
}
