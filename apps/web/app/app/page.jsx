import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

async function MemberDashboardMain({ member }) {
  const adminClient = createSupabaseAdminClient();
  const { error, stats, mySpaces, recentDiscussions, applicationQueue } = await fetchMemberDashboardMainData({
    adminClient,
    member,
  });

  if (error) {
    return (
      <article className="dashboard-card member-module-card">
        <h3>Dashboard unavailable</h3>
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
          <h3>My spaces</h3>
          <Link className="text-link" href="/app/spaces">
            View all
          </Link>
        </div>
        <div className="member-space-grid">
          {mySpaces.map((space) => (
            <div className="member-space-card" key={space.slug}>
              <div className="member-space-card-header">
                <div>
                  <strong>{space.name}</strong>
                  <p>{space.type}</p>
                </div>
                <span className="status-chip chip-neutral">{space.role}</span>
              </div>
              <p className="member-space-card-summary">{space.summary}</p>
              <div className="member-space-card-meta">
                <span>{space.members} members</span>
                <span>{space.threads} threads</span>
                <span className={space.unread ? "member-meta-emphasis" : undefined}>
                  {space.unread} new
                </span>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="dashboard-card member-module-card">
        <div className="member-section-heading">
          <h3>Recent discussions</h3>
          <span className="member-section-note">Recent coordination activity</span>
        </div>
        <div className="member-feed-list">
          {recentDiscussions.map((item) => (
            <div className="member-feed-item" key={item.title}>
              <div className="member-feed-bullet" aria-hidden="true" />
              <div className="member-feed-copy">
                <strong>{item.title}</strong>
                <div className="member-feed-meta">
                  <span className="status-chip chip-neutral">{item.space}</span>
                  <span>{item.author}</span>
                  <span>{item.timeAgo || item.time}</span>
                  <span>{item.replies} replies</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="dashboard-card member-module-card">
        <div className="member-section-heading">
          <div>
            <h3>Applications in review</h3>
            <p className="member-section-copy">A compact queue organised around applicant, cohort, and current review state.</p>
          </div>
          <Link className="text-link" href="/app/applications">
            Open queue
          </Link>
        </div>
        <div className="member-review-table">
          <div className="member-review-table-head">
            <span>Applicant</span>
            <span>Country / Org</span>
            <span>Cohort</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {applicationQueue.map((application) => (
            <div className="member-review-row" key={application.name}>
              <strong>{application.name}</strong>
              <span>
                {application.country} · {application.organisation}
              </span>
              <span className="status-chip chip-neutral">{application.cohort}</span>
              <span
                className={
                  application.status === "interviewing"
                    ? "status-chip chip-warning"
                    : "status-chip chip-neutral"
                }
              >
                {formatStatus(application.status)}
              </span>
              <span className="status-chip chip-neutral">{application.actionLabel}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

async function MemberDashboardRightRail({ member, sidebarUser }) {
  const supabase = await createSupabaseServerClient();
  const { error, upcomingEvents, recentInsights, profileSnapshot } = await fetchMemberDashboardRailData({
    supabase,
    member,
  });

  return (
    <div className="member-rail-stack">
      <article className="member-rail-profile-card">
        <div className="member-rail-profile-top">
          <div className="member-rail-avatar">{sidebarUser.initials}</div>
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
            <strong>{member.secondaryCohorts.length + (member.primaryCohort ? 1 : 0)}</strong>
            <span>Cohorts</span>
          </div>
        </div>
        <div className="member-rail-progress">
          <div className="member-rail-progress-copy">
            <strong>Profile completion</strong>
            <span>{profileSnapshot.completionPercent}% complete</span>
          </div>
          <div className="progress-bar-track" aria-hidden="true">
            <span className="progress-bar-fill" style={{ width: `${profileSnapshot.completionPercent}%` }} />
          </div>
        </div>
      </article>

      <article className="member-rail-card" id="member-upcoming-events">
        <div className="member-section-heading">
          <h3>Upcoming events</h3>
          <Link className="text-link" href="/app/events">
            Full archive
          </Link>
        </div>
        {error ? (
          <p className="member-section-copy">Live events could not be refreshed just now.</p>
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
                    {(event.event_type || event.type || "Event")} · {event.location || "Location pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="member-rail-card">
        <div className="member-section-heading">
          <h3>Recent insights</h3>
        </div>
        <div className="member-rail-link-list">
          {recentInsights.slice(0, 3).map((item) => (
            <div className="member-rail-link-item" key={item.slug}>
              <span className="member-rail-link-meta">
                {item.type} · {item.date}
              </span>
              <strong>{item.title}</strong>
            </div>
          ))}
        </div>
        <Link className="text-link" href="/app/insights">
          Browse library
        </Link>
      </article>

      <article className="member-rail-card">
        <div className="member-section-heading">
          <h3>Quick actions</h3>
        </div>
        <div className="member-quick-actions">
          <Link className="secondary-button" href="/app/applications">
            Review applications
          </Link>
          <Link className="secondary-button" href="/app/events">
            Open events
          </Link>
          <Link className="secondary-button" href="/app/profile">
            Update my profile
          </Link>
          <Link className="secondary-button" href="/app/members">
            Open member directory
          </Link>
        </div>
      </article>
    </div>
  );
}

export default async function MemberDashboardPage() {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app");
  }

  const frameData = await fetchMemberWorkspaceFrameData({ supabase, userId: user.id });

  if (frameData.error || !frameData.member) {
    redirect("/app/profile");
  }

  const headerActions = (
    <>
      <Link className="secondary-button" href="/app/events">
        View events
      </Link>
      <Link className="primary-button" href="/app/spaces">
        View spaces
      </Link>
    </>
  );

  return (
    <MemberWorkspaceShell
      dateLabel={formatToday()}
      eyebrow="Community workspace"
      headerActions={headerActions}
      rightRail={
        <Suspense fallback={<DashboardShellFallback />}>
          <MemberDashboardRightRail member={frameData.member} sidebarUser={frameData.sidebarUser} />
        </Suspense>
      }
      sidebarUser={frameData.sidebarUser}
      subtitle="Your current spaces, review queue, events, and profile progress are gathered here in one member workspace."
      title={`Welcome back, ${frameData.member.first_name || frameData.member.displayName}`}
    >
      <Suspense fallback={<DashboardShellFallback />}>
        <MemberDashboardMain member={frameData.member} />
      </Suspense>
    </MemberWorkspaceShell>
  );
}
