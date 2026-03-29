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
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getNoticeMessage(notice, sentCount, failedCount, profileStatus) {
  if (notice === "sent") {
    return "Login email sent.";
  }

  if (notice === "bulk-sent") {
    return `${sentCount || 0} login emails sent.`;
  }

  if (notice === "bulk-partial") {
    return `${sentCount || 0} login emails sent, ${failedCount || 0} failed.`;
  }

  if (notice === "error") {
    return "Member email action failed. Please retry.";
  }

  if (notice === "missing-fields") {
    return "Select at least one member first.";
  }

  if (notice === "profile-status-updated") {
    return `Profile marked ${profileStatus || "updated"}.`;
  }

  if (notice === "profile-status-error") {
    return "Profile status could not be updated. Please retry.";
  }

  return "";
}

function buildMembersPath({ cohort, status }) {
  const params = new URLSearchParams();

  if (status && status !== "all") {
    params.set("status", status);
  }

  if (cohort && cohort !== "all") {
    params.set("cohort", cohort);
  }

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
  { key: "headshot-recovery", label: "Headshot recovery" },
  { key: "resume-recovery", label: "Resume recovery" },
];

function getFilterCount(key, members, counts) {
  return key === "all" ? members.length : counts[key];
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getChipClass(tone = "neutral") {
  return `status-chip chip-${tone}`;
}

function getMemberAlert(member) {
  const issues = [];

  if (member.needsHeadshotRecovery) {
    issues.push("Headshot recovery needed");
  }

  if (member.needsResumeRecovery) {
    issues.push("Resume recovery needed");
  }

  if (!member.isProfileComplete && member.missingProfileFields.length) {
    issues.push(`Missing: ${member.missingProfileFields.join(", ")}`);
  }

  if (issues.length) {
    return {
      tone: "warning",
      message: issues.join(" • "),
    };
  }

  return {
    tone: "neutral",
    message: member.isActive
      ? "Onboarding data is on file and this member is ready for access management."
      : "This member will still complete onboarding after setting a password.",
  };
}

export default async function AdminMembersPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const resolvedSearchParams = await searchParams;
  const activeFilter =
    typeof resolvedSearchParams?.status === "string" && MEMBER_STATUS_FILTERS.includes(resolvedSearchParams.status)
      ? resolvedSearchParams.status
      : "all";
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const sentCount = Number.parseInt(String(resolvedSearchParams?.sent || "0"), 10) || 0;
  const failedCount = Number.parseInt(String(resolvedSearchParams?.failed || "0"), 10) || 0;
  const updatedProfileStatus =
    typeof resolvedSearchParams?.profile_status === "string" ? resolvedSearchParams.profile_status : "";

  const { error: dataError, members, counts, cohortOptions } = await fetchAdminMembersDirectory({
    supabase,
    adminClient,
  });

  const activeCohort =
    typeof resolvedSearchParams?.cohort === "string" &&
    cohortOptions.some((cohort) => cohort.slug === resolvedSearchParams.cohort)
      ? resolvedSearchParams.cohort
      : "all";

  const filteredMembers = members.filter(
    (member) =>
      matchesMemberStatusFilter(member, activeFilter) && matchesMemberCohortFilter(member, activeCohort),
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
        body: "Review imported members, verify onboarding state, and control when login emails are actually sent.",
      }}
      title="Member access queue"
      subtitle="This queue separates member import from member contact. Imported cohort members can be reviewed first, then emailed from the admin portal when you are ready."
    >
      <article className="dashboard-card admin-member-toolbar-card">
        <div className="stack">
          <div className="admin-member-controls">
            <div className="member-filter-stack">
              <div className="filter-tab-group filter-tab-group-primary">
                {PRIMARY_FILTERS.map((filter) => (
                  <Link
                    className={activeFilter === filter.key ? "filter-tab active-filter" : "filter-tab"}
                    href={buildMembersPath({ status: filter.key, cohort: activeCohort })}
                    key={filter.key}
                  >
                    {filter.label} ({getFilterCount(filter.key, members, counts)})
                  </Link>
                ))}
              </div>

              <div className="filter-tab-group filter-tab-group-secondary">
                {SECONDARY_FILTERS.map((filter) => (
                  <Link
                    className={
                      activeFilter === filter.key
                        ? "filter-tab filter-tab-secondary active-filter"
                        : "filter-tab filter-tab-secondary"
                    }
                    href={buildMembersPath({ status: filter.key, cohort: activeCohort })}
                    key={filter.key}
                  >
                    {filter.label} ({getFilterCount(filter.key, members, counts)})
                  </Link>
                ))}
              </div>
            </div>

            <div className="member-toolbar-actions-panel">
              <form className="inline-filter-form" method="get">
                {activeFilter !== "all" ? <input name="status" type="hidden" value={activeFilter} /> : null}
                <label>
                  Cohort
                  <select defaultValue={activeCohort} name="cohort">
                    <option value="all">All cohorts</option>
                    {cohortOptions.map((cohort) => (
                      <option key={cohort.slug} value={cohort.slug}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" type="submit">
                  Apply filter
                </button>
              </form>

              <div className="admin-member-actions">
                <Link className="secondary-button" href={exportHref}>
                  Export member status
                </Link>
                <form action={sendSelectedMemberInvitesAction} id="bulk-member-action-form">
                  <input name="return_to" type="hidden" value={returnPath} />
                  <AdminMembersBulkAction />
                </form>
              </div>
            </div>
          </div>

          {notice ? <p className={notice === "error" || notice === "profile-status-error" ? "form-error" : "form-success"}>{getNoticeMessage(notice, sentCount, failedCount, updatedProfileStatus)}</p> : null}
          {dataError ? <p className="form-error">{dataError.message}</p> : null}
        </div>
      </article>

      <div className="stack">
        {filteredMembers.length ? (
          filteredMembers.map((member) => (
            <article className="dashboard-card member-record-card" key={member.id}>
              <div className="member-record-header">
                <div className="member-selection-block">
                  <label className="member-select-label">
                    <input form="bulk-member-action-form" name="profile_ids" type="checkbox" value={member.id} />
                    <span>Select</span>
                  </label>
                  <div className="member-identity">
                    <strong>{member.displayName}</strong>
                    <p>{member.email}</p>
                  </div>
                </div>
                <div className="member-status-strip">
                  <span className={getChipClass(member.wasContacted ? "neutral" : "warning")}>
                    {getMemberInviteLabel(member.latestInvite)}
                  </span>
                  <span className={getChipClass(member.isActive ? "success" : "warning")}>
                    {formatLabel(member.onboarding_status)}
                  </span>
                  <span className={getChipClass(member.profileStatus === "inactive" ? "muted" : "success")}>
                    Profile {member.profileStatus}
                  </span>
                  <span className={getChipClass(member.isProfileComplete ? "success" : "warning")}>
                    {member.completionPercent}% complete
                  </span>
                </div>
              </div>

              <dl className="member-definition-grid">
                <div className="member-detail-card">
                  <dt>Primary cohort</dt>
                  <dd>{member.primaryCohort?.name || "Not assigned"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Secondary cohorts</dt>
                  <dd>{member.secondaryCohorts.length ? member.secondaryCohorts.map((cohort) => cohort.name).join(", ") : "None recorded"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Organisation</dt>
                  <dd>{member.organisation_name || "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Role</dt>
                  <dd>{member.role_title || "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Country</dt>
                  <dd>{member.country_of_residence || "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Phone / WhatsApp</dt>
                  <dd>{member.phone_number || member.whatsapp_number ? [member.phone_number, member.whatsapp_number].filter(Boolean).join(" / ") : "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Timezone</dt>
                  <dd>{member.timezone || "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Availability</dt>
                  <dd>{formatLabel(member.availabilityStatus)}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Form completion</dt>
                  <dd>
                    {member.cohortProfile?.completed_at
                      ? `Completed ${formatDate(member.cohortProfile.completed_at)}`
                      : "Still required"}
                  </dd>
                </div>
                <div className="member-detail-card">
                  <dt>Last login email</dt>
                  <dd>{member.latestInvite ? formatDate(member.latestInvite.created_at) : "Not sent yet"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Last sign-in</dt>
                  <dd>{formatDate(member.authUser?.last_sign_in_at)}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Headshot</dt>
                  <dd>
                    {member.needsHeadshotRecovery
                      ? "Recovery needed"
                      : member.hasHeadshot
                        ? "Ready"
                        : "Missing"}
                  </dd>
                </div>
                <div className="member-detail-card">
                  <dt>Resume</dt>
                  <dd>
                    {member.needsResumeRecovery
                      ? "Recovery needed"
                      : member.resumeAsset?.source_kind === "storage"
                        ? "Stored"
                        : member.resumeAsset?.source_kind === "external"
                          ? "External"
                          : "Missing"}
                  </dd>
                </div>
                <div className="member-detail-card">
                  <dt>Migration batch</dt>
                  <dd>{member.migration_batch_id || "Legacy / manual"}</dd>
                </div>
              </dl>

              <div className="member-action-row">
                <div
                  className={
                    getMemberAlert(member).tone === "warning"
                      ? "member-alert member-alert-warning"
                      : "member-alert"
                  }
                >
                  {getMemberAlert(member).message}
                </div>
                <div className="admin-member-row-actions">
                  <Link className="secondary-button" href={`/admin/members/${member.id}`}>
                    {member.needsHeadshotRecovery ? "Recover headshot" : "View full profile"}
                  </Link>
                  <form action={updateMemberProfileStatusAction}>
                    <input name="profile_id" type="hidden" value={member.id} />
                    <input name="return_to" type="hidden" value={returnPath} />
                    <input
                      name="next_status"
                      type="hidden"
                      value={member.profileStatus === "inactive" ? "active" : "inactive"}
                    />
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
            </article>
          ))
        ) : (
          <article className="dashboard-card">
            <h3>No members found</h3>
            <p>No members match the current filter yet.</p>
          </article>
        )}
      </div>
    </DashboardShell>
  );
}
