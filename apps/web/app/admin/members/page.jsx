import Link from "next/link";
import { AdminMembersBulkAction } from "@/components/admin-members-bulk-action";
import { AdminMembersListClient } from "@/components/admin-members-list-client";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  fetchAdminMembersDirectory,
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
      <article className="dashboard-card admin-toolbar-card">
        <div className="stack">
          {/* Status filters + Cohort in one row */}
          <div className="admin-toolbar-main">
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
              <div className="filter-tab-divider" />
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

            <form className="inline-filter-form" method="get">
              {activeFilter !== "all" ? <input name="status" type="hidden" value={activeFilter} /> : null}
              <select defaultValue={activeCohort} name="cohort">
                <option value="all">All cohorts</option>
                {cohortOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button className="secondary-button" type="submit">Filter</button>
            </form>
          </div>

          {/* Search + Bulk Actions */}
          <div className="admin-toolbar-actions">
            <form className="admin-search-form" method="get">
              {activeFilter !== "all" ? <input name="status" type="hidden" value={activeFilter} /> : null}
              {activeCohort !== "all" ? <input name="cohort" type="hidden" value={activeCohort} /> : null}
              <span className="admin-search-icon" aria-hidden="true">⌕</span>
              <input
                name="search"
                placeholder="Search name, email, organisation…"
                type="search"
              />
            </form>

            <div className="admin-toolbar-right">
              <Link className="secondary-button" href={exportHref}>Export CSV</Link>
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
        <AdminMembersListClient
          members={filteredMembers}
          returnPath={returnPath}
          sendInviteAction={sendMemberInviteAction}
          updateStatusAction={updateMemberProfileStatusAction}
        />
      </article>
    </DashboardShell>
  );
}
