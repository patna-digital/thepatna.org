import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchMemberDashboardMainData, fetchMemberDashboardRailData, fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserContext } from "@/lib/supabase/access";

function formatToday() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function formatDashboardRole(value) {
  const text = String(value || "").trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "Member";
}

function formatDashboardSpaceType(value) {
  const labels = {
    cohort: "Cohort Space",
    constituency: "Constituency",
    geography: "Geography",
    working_group: "Working Group",
  };

  return labels[value] || "Space";
}


function DashboardShellFallback() {
  return (
    <article className="dashboard-card member-module-card">
      <div className="member-section-heading">
        <h3>Loading workspace</h3>
        <span className="member-section-note">Pulling your latest PATNA activity</span>
      </div>
      <p className="member-section-copy">
        The dashboard is loading your spaces, queue, and current community updates.
      </p>
    </article>
  );
}

async function MemberDashboardMain({ member, supabase, userId }) {
  const t = await getTranslations();
  const adminClient = canUseSupabaseAdmin() ? createSupabaseAdminClient() : null;
  const { availableSpaces, error, stats, mySpaces, recentDiscussions } = await fetchMemberDashboardMainData({
    adminClient,
    member,
    supabase,
    userId,
  });

  if (error) {
    return (
      <article className="dashboard-card member-module-card">
        <h3>{t("dashboard.errorTitle")}</h3>
        <p className="member-section-copy">{error.message}</p>
      </article>
    );
  }

  return (
    <div className="member-dashboard-stack">
      <div className="member-dashboard-summary-grid">
        {stats.map((stat) => (
          <article className={`member-stat-card tone-${stat.tone}`} key={stat.label}>
            <strong>{stat.value}</strong>
            <h3>{stat.label}</h3>
            <p>{stat.note}</p>
          </article>
        ))}
      </div>

      <article className="dashboard-card member-module-card">
        <div className="member-section-heading">
          <h3>{t("dashboard.mySpaces")}</h3>
          <Link className="text-link" href="/app/spaces">
            {t("dashboard.viewAll")}
          </Link>
        </div>
        {mySpaces.length > 0 ? (
          <div className="member-space-grid">
            {mySpaces.map((space) => (
              <Link className="member-space-card" href={`/app/spaces/${space.slug}`} key={space.slug}>
                <div className="member-space-card-header">
                  <div>
                    <strong>{space.name}</strong>
                    <p>{formatDashboardSpaceType(space.space_type)}</p>
                  </div>
                  <span className="status-chip chip-neutral">{formatDashboardRole(space.role)}</span>
                </div>
                <p className="member-space-card-summary">{space.summary}</p>
                <div className="member-space-card-meta">
                  <span>{space.members} {t("dashboard.membersLabel")}</span>
                  <span>{space.threads} {t("dashboard.threadsLabel")}</span>
                  <span className={space.unread ? "member-meta-emphasis" : undefined}>
                    {space.unread} {t("dashboard.newLabel")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="app-row-empty">
            <strong>No spaces yet</strong>
            <p>You are not in any PATNA spaces yet. Browse the available spaces below to request access.</p>
          </div>
        )}
      </article>

      {availableSpaces.length > 0 && (
        <article className="dashboard-card member-module-card">
          <div className="member-section-heading">
            <h3>Available spaces</h3>
            <span className="member-section-note">Real spaces you can open or request access to.</span>
          </div>
          <div className="member-space-grid">
            {availableSpaces.map((space) => {
              const href = space.requiresRequest
                ? `/app/spaces/${space.slug}/join`
                : `/app/spaces/${space.slug}`;

              return (
                <Link className="member-space-card" href={href} key={space.slug}>
                  <div className="member-space-card-header">
                    <div>
                      <strong>{space.name}</strong>
                      <p>{formatDashboardSpaceType(space.space_type)}</p>
                    </div>
                    <span className="status-chip chip-neutral">
                      {space.requiresRequest ? "Request access" : "Open"}
                    </span>
                  </div>
                  <p className="member-space-card-summary">{space.summary}</p>
                  <div className="member-space-card-meta">
                    <span>{space.members} {t("dashboard.membersLabel")}</span>
                    <span>{space.threads} {t("dashboard.threadsLabel")}</span>
                    <span className="member-meta-emphasis">
                      {space.requiresRequest ? "Admin approval required" : "Available now"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </article>
      )}

      <article className="dashboard-card member-module-card">
        <div className="member-section-heading">
          <h3>{t("dashboard.recentDiscussions")}</h3>
          <span className="member-section-note">{t("dashboard.recentDiscussionsNote")}</span>
        </div>
        {recentDiscussions.length > 0 ? (
          <div className="member-feed-list">
            {recentDiscussions.map((item) => (
              <Link
                className="member-feed-item"
                href={item.spaceSlug ? `/app/spaces/${item.spaceSlug}/threads/${item.id}` : "/app/spaces"}
                key={item.id}
              >
                <div className="member-feed-bullet" aria-hidden="true" />
                <div className="member-feed-copy">
                  <strong>{item.title}</strong>
                  <div className="member-feed-meta">
                    <span className="status-chip chip-neutral">{item.space}</span>
                    <span>{item.author}</span>
                    <span>{item.timeAgo}</span>
                    <span>{item.replies} {t("dashboard.repliesLabel")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="app-row-empty">
            <strong>No recent discussions yet</strong>
            <p>When threads are active in your current spaces, they will show up here.</p>
          </div>
        )}
      </article>
    </div>
  );
}

async function MemberDashboardProfileCard({ member, sidebarUser, userId }) {
  const t = await getTranslations();
  const supabase = await createSupabaseServerClient();
  const { profileSnapshot, recentInsights } = await fetchMemberDashboardRailData({
    supabase,
    member,
    userId,
  });

  return (
    <article className="member-rail-profile-card member-dashboard-profile-card">
      <div className="member-rail-profile-top">
        <div className="member-rail-avatar">{sidebarUser?.initials}</div>
        <div>
          <strong>{member.displayName}</strong>
          <p>
            {profileSnapshot.role}
            {profileSnapshot.country ? ` · ${profileSnapshot.country}` : ""}
          </p>
        </div>
      </div>
      {profileSnapshot.tags.length ? (
        <div className="member-rail-tag-row">
          {profileSnapshot.tags.map((tag) => (
            <span className="status-chip chip-neutral" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="member-rail-profile-stats">
        <div>
          <strong>{member.spaceCount || 0}</strong>
          <span>Spaces</span>
        </div>
        <div>
          <strong>{recentInsights.length}</strong>
          <span>Insights</span>
        </div>
        <div>
          <strong>{(member.secondaryCohorts || []).length + (member.primaryCohort ? 1 : 0)}</strong>
          <span>Cohorts</span>
        </div>
      </div>
      <div className="member-rail-progress">
        <div className="member-rail-progress-copy">
          <strong>{t("dashboard.profileCompletion")}</strong>
          <span>{profileSnapshot.completionPercent}{t("dashboard.profileCompletePct")}</span>
        </div>
        <div className="progress-bar-track" aria-hidden="true">
          <span className="progress-bar-fill" style={{ width: `${profileSnapshot.completionPercent}%` }} />
        </div>
        <Link className="secondary-button member-rail-profile-action" href="/app/profile">
          {t("dashboard.profileCompleteAction")}
        </Link>
      </div>
    </article>
  );
}

async function MemberDashboardRightRail({ member, userId }) {
  const t = await getTranslations();
  const supabase = await createSupabaseServerClient();
  const { error, upcomingEvents, recentInsights } = await fetchMemberDashboardRailData({
    supabase,
    member,
    userId,
  });

  return (
    <div className="member-rail-stack">
      <article className="member-rail-card" id="member-upcoming-events">
        <div className="member-section-heading">
          <h3>{t("dashboard.upcomingEvents")}</h3>
          <Link className="text-link" href="/app/events">
            {t("dashboard.fullArchive")}
          </Link>
        </div>
        {error ? (
          <p className="member-section-copy">{t("dashboard.eventsError")}</p>
        ) : (
          <div className="member-event-list">
            {upcomingEvents.map((event) => (
              <div className="member-event-item" key={event.id || event.title}>
                <div className="member-event-date">
                  <strong>{event.month}</strong>
                  <span>{event.day}</span>
                </div>
                <div className="member-event-copy">
                  <strong>{event.title}</strong>
                  <p>
                    {(event.event_type || event.type || "Event")} · {event.location || t("dashboard.locationPending")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="member-rail-card">
        <div className="member-section-heading">
          <h3>{t("dashboard.recentInsights")}</h3>
        </div>
        <div className="member-rail-link-list">
          {recentInsights.slice(0, 3).map((item) => (
            <Link className="member-rail-link-item" href={`/app/insights/${item.slug}`} key={item.slug}>
              <span className="member-rail-link-meta">
                {item.type} · {item.date}
              </span>
              <strong>{item.title}</strong>
            </Link>
          ))}
        </div>
        <Link className="text-link" href="/app/insights">
          {t("dashboard.browseLibrary")}
        </Link>
      </article>

      <article className="member-rail-card">
        <div className="member-section-heading">
          <h3>{t("dashboard.quickActions")}</h3>
        </div>
        <div className="member-quick-actions">
          <Link className="secondary-button" href="/app/events">
            {t("dashboard.quickActionEvents")}
          </Link>
          <Link className="secondary-button" href="/app/profile">
            {t("dashboard.quickActionProfile")}
          </Link>
          <Link className="secondary-button" href="/app/members">
            {t("dashboard.quickActionDirectory")}
          </Link>
        </div>
      </article>
    </div>
  );
}

export default async function MemberDashboardPage() {
  const t = await getTranslations();
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app");
  }

  const frameData = await fetchMemberWorkspaceFrameData({ supabase, userId: user.id });

  // Allow access even with incomplete/missing profile data
  const member = frameData.member || { domainTags: [], secondaryCohorts: [], cohortSlugs: [] };
  const sidebarUser = frameData.sidebarUser || null;
  const firstName = member.first_name || member.displayName || "Member";

  const headerActions = (
    <>
      <Link className="secondary-button" href="/app/events">
        {t("dashboard.btnViewEvents")}
      </Link>
      <Link className="primary-button" href="/app/spaces">
        {t("dashboard.btnViewSpaces")}
      </Link>
    </>
  );

  return (
    <MemberWorkspaceShell
      dateLabel={formatToday()}
      eyebrow={t("dashboard.eyebrow")}
      headerActions={headerActions}
      rightRail={
        <Suspense fallback={<DashboardShellFallback />}>
          <MemberDashboardRightRail member={member} userId={user.id} />
        </Suspense>
      }
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle={t("dashboard.subtitle")}
      title={t("dashboard.title", { firstName: member?.firstName || member?.first_name || member?.displayName?.split(" ")[0] || "..." })}
    >
      <div className="member-dashboard-home-stack">
        <Suspense fallback={<DashboardShellFallback />}>
          <MemberDashboardProfileCard member={member} notificationUserId={user?.id ?? null}
 sidebarUser={sidebarUser} userId={user.id} />
        </Suspense>
        <Suspense fallback={<DashboardShellFallback />}>
          <MemberDashboardMain member={member} supabase={supabase} userId={user.id} />
        </Suspense>
      </div>
    </MemberWorkspaceShell>
  );
}
