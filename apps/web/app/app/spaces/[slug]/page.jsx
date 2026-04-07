import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { ThreadCard } from "@/components/thread-card";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchSpaceBySlug } from "@/lib/spaces";
import { fetchSpaceThreads } from "@/lib/threads";
import { formatSpaceType } from "@/lib/space-types";

export default async function SpacePage({ params }) {
  const { slug } = await params;

  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect(`/auth/login?next=/app/spaces/${slug}`);
  }

  const [frameData, { space, error: spaceError }, page] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchSpaceBySlug({ supabase, slug, userId: user.id }),
    Promise.resolve(0),
  ]);

  if (spaceError || !space) {
    notFound();
  }

  // Non-members of private/invite-only spaces see the join gate
  if (!space.isMember && space.visibility !== "public_members") {
    redirect(`/app/spaces/${slug}/join`);
  }

  const { threads, total, error: threadsError } = await fetchSpaceThreads(
    supabase,
    space.id,
    { page, limit: 20 }
  );

  const sidebarUser  = frameData.sidebarUser || null;
  const spaceTypeFmt = formatSpaceType(space.space_type);
  const memberCount  = space.members?.length ?? 0;
  const shownMembers = space.members?.slice(0, 8) ?? [];
  const extraCount   = Math.max(0, memberCount - shownMembers.length);

  const headerActions = space.isMember ? (
    <Link className="primary-button" href={`/app/spaces/${slug}/threads/new`}>
      New Thread
    </Link>
  ) : null;

  const rightRail = (
    <div className="member-dashboard-stack">
      <article className="member-module-card">
        <div className="space-rail-stat-row">
          <div className="space-rail-stat">
            <strong>{memberCount}</strong>
            <span>members</span>
          </div>
          <div className="space-rail-stat">
            <strong>{total}</strong>
            <span>threads</span>
          </div>
        </div>
      </article>

      {shownMembers.length > 0 && (
        <article className="member-module-card">
          <div className="member-section-heading">
            <h3>Members</h3>
          </div>
          <div className="space-rail-member-avatars">
            {shownMembers.map((m) => {
              const profile = m.profile || {};
              const first   = profile.first_name || "";
              const last    = profile.surname || "";
              const initials = [first[0], last[0]].filter(Boolean).join("").toUpperCase() || "?";
              const name    = [first, last].filter(Boolean).join(" ") || "Member";
              return (
                <div className="space-rail-avatar" key={m.user_id} title={name}>
                  {initials}
                </div>
              );
            })}
            {extraCount > 0 && (
              <div className="space-rail-avatar space-rail-avatar-more">
                +{extraCount}
              </div>
            )}
          </div>
        </article>
      )}

      {space.tags?.length > 0 && (
        <article className="member-module-card">
          <div className="member-section-heading">
            <h3>Topics</h3>
          </div>
          <div className="member-space-card-tags" style={{ flexWrap: "wrap" }}>
            {space.tags.map((tag) => (
              <span className="status-chip chip-neutral" key={tag.slug || tag.id}>
                {tag.name}
              </span>
            ))}
          </div>
        </article>
      )}
    </div>
  );

  return (
    <MemberWorkspaceShell
      eyebrow={spaceTypeFmt}
      headerActions={headerActions}
      rightRail={rightRail}
      sidebarUser={sidebarUser}
      subtitle={space.description || ""}
      title={space.name}
    >
      <div className="member-dashboard-stack">
        {threadsError && (
          <p className="form-error">Failed to load threads. Please refresh.</p>
        )}

        {threads.length === 0 && !threadsError && (
          <article className="dashboard-card">
            <div className="app-row-empty">
              <strong>No threads yet</strong>
              <p>
                {space.isMember
                  ? "Be the first to start a discussion in this space."
                  : "No threads have been posted in this space yet."}
              </p>
              {space.isMember && (
                <Link className="primary-button" href={`/app/spaces/${slug}/threads/new`}>
                  Start a thread
                </Link>
              )}
            </div>
          </article>
        )}

        {threads.length > 0 && (
          <article className="dashboard-card member-module-card">
            <div className="thread-list">
              {threads.map((thread) => (
                <ThreadCard
                  href={`/app/spaces/${slug}/threads/${thread.id}`}
                  key={thread.id}
                  thread={thread}
                />
              ))}
            </div>
          </article>
        )}
      </div>
    </MemberWorkspaceShell>
  );
}
