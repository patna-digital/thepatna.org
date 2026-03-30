import Link from "next/link";
import { AdminMembersBulkAction } from "@/components/admin-members-bulk-action";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  fetchAdminMembersDirectory,
  getMemberInviteLabel,
  matchesMemberCohortFilter,
  matchesMemberStatusFilter,
  MEMBER_STATUS_FILTERS,
} from "@/lib/admin-members";
import { adminNav } from "@/lib/patna-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import {
  sendMemberInviteAction,
  sendSelectedMemberInvitesAction,
  updateMemberProfileStatusAction,
} from "./actions";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getNoticeMessage(notice, sentCount, failedCount, profileStatus) {
  const messages = {
    sent: "Login email sent.",
    error: "Member email action failed. Please retry.",
    "missing-fields": "Select at least one member first.",
    "profile-status-error": "Profile status could not be updated. Please retry.",
  };
  if (notice === "bulk-sent") return `${sentCount || 0} login emails sent.`;
  if (notice === "bulk-partial") return `${sentCount || 0} sent, ${failedCount || 0} failed.`;
  if (notice === "profile-status-updated") return `Profile marked ${profileStatus || "updated"}.`;
  return messages[notice] || "";
}

function buildMembersPath({ cohort, status }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (cohort && cohort !== "all") params.set("cohort", cohort);
  const query = params.toString();
  return query ? `/admin/members?${query}` : "/admin/members";
}

const PRIMARY_FILTERS = [
  { key: "all", label: "All" },
  { key: "imported", label: "Imported" },
  { key: "not-sent", label: "Not sent" },
  { key: "contacted", label: "Contacted" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
];

const SECONDARY_FILTERS = [
  { key: "profile-active", label: "Profile active" },
  { key: "profile-inactive", label: "Profile inactive" },
  { key: "headshot-recovery", label: "Headshot" },
  { key: "resume-recovery", label: "Resume" },
];

function getFilterCount(key, members, counts) {
  return key === "all" ? members.length : (counts[key] ?? 0);
}

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInviteChip(member) {
  if (!member.wasContacted) return { label: getMemberInviteLabel(member.latestInvite), tone: "warning" };
  return { label: getMemberInviteLabel(member.latestInvite), tone: "neutral" };
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

export default async function AdminMembersPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const resolvedSearchParams = await searchParams;

  const activeFilter =
    typeof resolvedSearchParams?.status === "string" && MEMBER_STATUS_FILTERS.includes(resolvedSearchParams.status)
      ? resolvedSearchParams.status
      : "all";
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const sentCount = Number.parseInt(String(resolvedSearchParams?.sent || "0"), 10) || 0;
  const failedCount = Number.parseInt(String(resolvedSearchParams?.failed || "0"), 10) || 0;
  const updatedProfileStatus = typeof resolvedSearchParams?.profile_status === "string" ? resolvedSearchParams.profile_status : "";

  const { error: dataError, members, counts, cohortOptions } = await fetchAdminMembersDirectory({ supabase, adminClient });

  const activeCohort =
    typeof resolvedSearchParams?.cohort === "string" &&
    cohortOptions.some((c) => c.slug === resolvedSearchParams.cohort)
      ? resolvedSearchParams.cohort
      : "all";

  const filteredMembers = members.filter(
    (m) => matchesMemberStatusFilter(m, activeFilter) && matchesMemberCohortFilter(m, activeCohort),
  );

  const returnPath = buildMembersPath({ cohort: activeCohort, status: activeFilter });
  const exportHref = `/admin/members/export${returnPath === "/admin/members" ? "" : returnPath.replace("/admin/members", "")}`;

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Member access",
        title: "Imported cohort directory",
        body: "Review imported members, verify onboarding state, and control when login emails are sent.",
      }}
      title="Members"
      subtitle="Manage cohort members, onboarding state, and login access from one place."
    >
      {/* Toolbar */}
      <article className="dashboard-card">
        <div className="stack">
          {/* Primary status filters */}
          <div className="dashboard-toolbar">
            {PRIMARY_FILTERS.map((f) => (
              <Link
                className={activeFilter === f.key ? "filter-tab active-filter" : "filter-tab"}
                href={buildMembersPath({ status: f.key, cohort: activeCohort })}
                key={f.key}
              >
                {f.label} ({getFilterCount(f.key, members, counts)})
              </Link>
            ))}
          </div>

          {/* Secondary row: diagnostic filters + cohort + actions */}
          <div className="admin-member-controls">
            <div className="dashboard-toolbar">
              {SECONDARY_FILTERS.map((f) => (
                <Link
                  className={activeFilter === f.key ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                  href={buildMembersPath({ status: f.key, cohort: activeCohort })}
                  key={f.key}
                >
                  {f.label} ({getFilterCount(f.key, members, counts)})
                </Link>
              ))}
            </div>

            <div className="member-toolbar-actions-panel">
              <form className="inline-filter-form" method="get">
                {activeFilter !== "all" ? <input name="status" type="hidden" value={activeFilter} /> : null}
                <select defaultValue={activeCohort} name="cohort" style={{ maxWidth: "160px" }}>
                  <option value="all">All cohorts</option>
                  {cohortOptions.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <button className="secondary-button" type="submit">Filter</button>
              </form>

              <Link className="secondary-button" href={exportHref}>Export</Link>

              <form action={sendSelectedMemberInvitesAction} id="bulk-member-action-form">
                <input name="return_to" type="hidden" value={returnPath} />
                <AdminMembersBulkAction />
              </form>
            </div>
          </div>

          {notice ? (
            <p className={notice === "error" || notice === "profile-status-error" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice, sentCount, failedCount, updatedProfileStatus)}
            </p>
          ) : null}
          {dataError ? <p className="form-error">{dataError.message}</p> : null}
        </div>
      </article>

      {/* Member list */}
      <article className="dashboard-card app-list-card">
        {filteredMembers.length ? (
          <div className="app-list">
            {filteredMembers.map((member) => {
              const invite = getInviteChip(member);
              const issues = getMemberAlertIssues(member);
              const hasIssues = issues.length > 0;

              return (
                <details className="app-row" key={member.id}>
                  <summary className="app-row-summary">
                    {/* Checkbox stays accessible in summary */}
                    <label className="app-row-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input form="bulk-member-action-form" name="profile_ids" type="checkbox" value={member.id} />
                    </label>

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
                        <span className={`status-chip chip-${invite.tone}`}>{invite.label}</span>
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
                        <p>{member.secondaryCohorts.length ? member.secondaryCohorts.map((c) => c.name).join(", ") : "None"}</p>
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
                      <Link className="secondary-button" href={`/admin/members/${member.id}`}>
                        {member.needsHeadshotRecovery ? "Recover headshot" : "View full profile"}
                      </Link>
                      <form action={updateMemberProfileStatusAction}>
                        <input name="profile_id" type="hidden" value={member.id} />
                        <input name="return_to" type="hidden" value={returnPath} />
                        <input name="next_status" type="hidden" value={member.profileStatus === "inactive" ? "active" : "inactive"} />
                        <button className="secondary-button" type="submit">
                          Mark {member.profileStatus === "inactive" ? "active" : "inactive"}
                        </button>
                      </form>
                      <form action={sendMemberInviteAction}>
                        <input name="profile_id" type="hidden" value={member.id} />
                        <input name="return_to" type="hidden" value={returnPath} />
                        <button className="primary-button" type="submit">
                          {member.latestInvite ? "Resend login email" : "Send login email"}
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="app-row-empty">
            <strong>No members found</strong>
            <p>No members match the current filter.</p>
          </div>
        )}
      </article>
    </DashboardShell>
  );
}
