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
  repairSelectedMemberProfilesAction,
  sendMemberInviteAction,
  sendSelectedMemberInvitesAction,
  updateMemberProfileStatusAction,
} from "./actions";

function pct(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function StatCard({ value, total, label, description, tone, barPct }) {
  return (
    <div className={`admin-stat-card${tone ? ` tone-${tone}` : ""}`}>
      <strong>{value}</strong>
      <h4>{label}</h4>
      {barPct !== undefined ? (
        <div className="stat-progress">
          <div className="stat-progress-track">
            <div className="stat-progress-fill" style={{ width: `${barPct}%` }} />
          </div>
          <span className="stat-progress-pct">{barPct}%</span>
        </div>
      ) : null}
      <p>{description}</p>
    </div>
  );
}

function getNoticeMessage(notice, sentCount, failedCount, profileStatus, repairedCount, skippedCount, repairFailedCount) {
  const messages = {
    sent: "Login email sent.",
    error: "Action failed. Please retry.",
    "missing-fields": "Select at least one member first.",
    "profile-status-error": "Profile status could not be updated.",
  };
  if (notice === "bulk-sent") return `${sentCount || 0} login emails sent.`;
  if (notice === "bulk-partial") return `${sentCount || 0} sent, ${failedCount || 0} failed.`;
  if (notice === "repair-summary")
    return `Repair complete: ${repairedCount || 0} repaired, ${skippedCount || 0} up to date, ${repairFailedCount || 0} failed.`;
  if (notice === "profile-status-updated") return `Profile marked ${profileStatus || "updated"}.`;
  return messages[notice] || "";
}

function buildMembersPath({ cohort, status, q } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (cohort && cohort !== "all") params.set("cohort", cohort);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/members?${query}` : "/admin/members";
}

function matchesMemberSearch(member, query) {
  if (!query) return true;
  const text = [
    member.displayName,
    member.email,
    member.organisation_name,
    member.role_title,
    member.country_of_residence,
    member.primaryCohort?.name,
    ...(member.secondaryCohorts || []).map((c) => c.name),
    ...(member.domainTags || []).map((t) => t.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(query.toLowerCase());
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
  { key: "profile-inactive", label: "Inactive" },
  { key: "headshot-recovery", label: "Headshot" },
  { key: "resume-recovery", label: "Resume" },
];

export default async function AdminMembersPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const p = await searchParams;

  const activeFilter =
    typeof p?.status === "string" && MEMBER_STATUS_FILTERS.includes(p.status) ? p.status : "all";
  const notice = typeof p?.notice === "string" ? p.notice : "";
  const sentCount = Number.parseInt(String(p?.sent || "0"), 10) || 0;
  const failedCount = Number.parseInt(String(p?.failed || "0"), 10) || 0;
  const repairedCount = Number.parseInt(String(p?.repaired || "0"), 10) || 0;
  const skippedCount = Number.parseInt(String(p?.skipped || "0"), 10) || 0;
  const repairFailedCount = Number.parseInt(String(p?.failed || "0"), 10) || 0;
  const updatedStatus = typeof p?.profile_status === "string" ? p.profile_status : "";
  const searchQuery = typeof p?.q === "string" ? p.q.trim() : "";

  const { error: dataError, members, counts, cohortOptions } = await fetchAdminMembersDirectory({ supabase, adminClient });

  const activeCohort =
    typeof p?.cohort === "string" && cohortOptions.some((c) => c.slug === p.cohort) ? p.cohort : "all";

  const filteredMembers = members
    .filter((m) => matchesMemberStatusFilter(m, activeFilter) && matchesMemberCohortFilter(m, activeCohort))
    .filter((m) => matchesMemberSearch(m, searchQuery));

  const returnPath = buildMembersPath({ cohort: activeCohort, status: activeFilter });
  const exportHref = `/admin/members/export${returnPath === "/admin/members" ? "" : returnPath.replace("/admin/members", "")}`;
  const total = members.length;
  const isError = notice === "error" || notice === "profile-status-error";

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Member access",
        title: "Cohort directory",
        body: "Review imported members, verify onboarding state, and control login access.",
      }}
      title="Members"
      subtitle="Manage cohort members, onboarding, and login access."
    >
      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="admin-stat-grid">
        <StatCard
          value={total}
          label="Total members"
          description="All records in the cohort directory"
        />
        <StatCard
          value={counts.active ?? 0}
          total={total}
          label="Active"
          description="Completed onboarding and signed in"
          tone="success"
          barPct={pct(counts.active ?? 0, total)}
        />
        <StatCard
          value={counts.contacted ?? 0}
          total={total}
          label="Contacted"
          description="Login or invite email has been sent"
          tone="muted"
          barPct={pct(counts.contacted ?? 0, total)}
        />
        <StatCard
          value={counts["not-sent"] ?? 0}
          total={total}
          label="Not yet invited"
          description="No login email sent — action required"
          tone="warning"
          barPct={pct(counts["not-sent"] ?? 0, total)}
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <article className="dashboard-card admin-toolbar-card">
        <div className="stack">
          {/* Status + cohort row */}
          <div className="admin-toolbar-main">
            <div className="dashboard-toolbar">
              {PRIMARY_FILTERS.map((f) => {
                const count = f.key === "all" ? total : (counts[f.key] ?? 0);
                return (
                  <Link
                    className={activeFilter === f.key ? "filter-tab active-filter" : "filter-tab"}
                    href={buildMembersPath({ status: f.key, cohort: activeCohort })}
                    key={f.key}
                  >
                    {f.label}
                    <span className="filter-tab-count">{count}</span>
                  </Link>
                );
              })}
              <div className="filter-tab-divider" />
              {SECONDARY_FILTERS.map((f) => (
                <Link
                  className={activeFilter === f.key ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                  href={buildMembersPath({ status: f.key, cohort: activeCohort })}
                  key={f.key}
                >
                  {f.label}
                  <span className="filter-tab-count">{counts[f.key] ?? 0}</span>
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

          {/* Search + actions row */}
          <div className="admin-toolbar-actions">
            <form className="admin-search-form" method="get">
              {activeFilter !== "all" ? <input name="status" type="hidden" value={activeFilter} /> : null}
              {activeCohort !== "all" ? <input name="cohort" type="hidden" value={activeCohort} /> : null}
              <div className="admin-search-field">
                <span className="admin-search-icon" aria-hidden="true">⌕</span>
                <input
                  defaultValue={searchQuery}
                  name="q"
                  placeholder="Search name, email, organisation, cohort…"
                  type="search"
                />
                {searchQuery ? (
                  <Link aria-label="Clear search" className="admin-search-clear" href={buildMembersPath({ status: activeFilter, cohort: activeCohort })}>
                    ✕
                  </Link>
                ) : null}
              </div>
              <button className="secondary-button" type="submit">Search</button>
            </form>

            <div className="admin-toolbar-right">
              <Link className="secondary-button" href={exportHref}>Export CSV</Link>
              <form action={sendSelectedMemberInvitesAction} id="bulk-member-action-form">
                <input name="return_to" type="hidden" value={returnPath} />
                <AdminMembersBulkAction
                  secondaryAction={repairSelectedMemberProfilesAction}
                  secondaryLabel="Repair selected"
                />
              </form>
            </div>
          </div>

          {/* Feedback */}
          {searchQuery ? (
            <p className="admin-search-notice">
              {filteredMembers.length} result{filteredMembers.length === 1 ? "" : "s"} for <strong>"{searchQuery}"</strong>
              {" · "}
              <Link href={buildMembersPath({ status: activeFilter, cohort: activeCohort })}>Clear</Link>
            </p>
          ) : null}
          {notice ? (
            <p className={isError ? "form-error" : "form-success"}>
              {getNoticeMessage(notice, sentCount, failedCount, updatedStatus, repairedCount, skippedCount, repairFailedCount)}
            </p>
          ) : null}
          {dataError ? <p className="form-error">{dataError.message}</p> : null}
        </div>
      </article>

      {/* ── List ────────────────────────────────────────────────────── */}
      <AdminMembersListClient
        initialSearch={searchQuery}
        members={filteredMembers}
        returnPath={returnPath}
        sendInviteAction={sendMemberInviteAction}
        updateStatusAction={updateMemberProfileStatusAction}
      />
    </DashboardShell>
  );
}
