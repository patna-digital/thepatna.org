import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData, buildMemberSpaceGroups } from "@/lib/member-workspace";
import { fetchWorkspaceSpaces } from "@/lib/spaces";
import { fetchLinkedProjectsBySpaceIds } from "@/lib/projects";
import { fetchRecentThreadsBySpaces } from "@/lib/threads";

export default async function SpacesPage() {
  const t = await getTranslations();
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/spaces");
  }

  const [frameData, workspaceSpacesResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchWorkspaceSpaces({ supabase, userId: user.id }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;
  const spaces = workspaceSpacesResult.memberSpaces || [];
  const availableSpaces = workspaceSpacesResult.availableSpaces || [];
  const error = workspaceSpacesResult.error;

  const spaceIds = (spaces || []).map((s) => s.id).filter(Boolean);

  const [{ bySpaceId }, recentBySpaceId] = await Promise.all([
    fetchLinkedProjectsBySpaceIds({ supabase, spaceIds }),
    fetchRecentThreadsBySpaces(supabase, spaceIds, { perSpace: 3 }),
  ]);

  const normalised = (spaces || []).map((space) => ({
    id:            space.id,
    slug:          space.slug,
    name:          space.name,
    type:          formatSpaceType(space.space_type, t),
    kind:          space.space_type,
    members:       space.member_count ?? 0,
    threads:       space.threads ?? 0,
    unread:        space.unread  ?? 0,
    role:          capitalise(space.role || "member"),
    summary:       space.description || "",
    tags:          space.tags || [],
    linkedProject: bySpaceId.get(space.id) || null,
    recentThreads: recentBySpaceId[space.id] || [],
  }));

  const groups = buildMemberSpaceGroups(normalised);
  const totalUnread = normalised.reduce((sum, s) => sum + s.unread, 0);
  const leadCount   = normalised.filter((s) => s.role === "Lead").length;

  return (
    <MemberWorkspaceShell
      eyebrow={t("spaces.eyebrow")}
      sidebarUser={sidebarUser}
      subtitle={t("spaces.subtitle")}
      title={t("spaces.title")}
    >
      <div className="member-dashboard-stack">
        {error && <p className="form-error">{t("spaces.error")}</p>}

        <div className="member-dashboard-summary-grid member-dashboard-summary-grid-compact">
          <article className="member-stat-card tone-blue">
            <strong>{normalised.length}</strong>
            <h3>{t("spaces.statTotal")}</h3>
            <p>{t("spaces.statTotalNote")}</p>
          </article>
          <article className="member-stat-card tone-blue">
            <strong>{totalUnread}</strong>
            <h3>{t("spaces.statUpdates")}</h3>
            <p>{t("spaces.statUpdatesNote")}</p>
          </article>
          <article className="member-stat-card tone-blue">
            <strong>{leadCount}</strong>
            <h3>{t("spaces.statLeadRoles")}</h3>
            <p>{t("spaces.statLeadRolesNote")}</p>
          </article>
        </div>

        {groups.length === 0 && !error && (
          <article className="dashboard-card">
            <div className="app-row-empty">
              <strong>{t("spaces.emptyTitle")}</strong>
              <p>
                {availableSpaces.length > 0
                  ? "You are not in any spaces yet, but you can request access to the available spaces below."
                  : t("spaces.emptyText")}
              </p>
            </div>
          </article>
        )}

        {groups.map((group) => (
          <section className="spaces-group" key={group.id}>
            <div className="spaces-group-header">
              <h2>{group.title}</h2>
              <p>{group.subtitle}</p>
            </div>
            <div className="spaces-card-grid">
              {group.spaces.map((space) => (
                <Link className="space-feed-card" href={`/app/spaces/${space.slug}`} key={space.slug}>
                  <div className="space-feed-card-top">
                    <div className="space-feed-card-info">
                      <span className="space-feed-type-badge">{space.type}</span>
                      <strong className="space-feed-card-name">{space.name}</strong>
                    </div>
                    <span className={`space-role-pill${space.role === "Lead" ? " role-lead" : ""}`}>
                      {space.role}
                    </span>
                  </div>

                  {space.summary && (
                    <p className="space-feed-card-desc">{space.summary}</p>
                  )}

                  {space.recentThreads.length > 0 && (
                    <div className="space-feed-threads">
                      {space.recentThreads.map((thread) => (
                        <div className="space-feed-thread-item" key={thread.id}>
                          <span className="space-feed-thread-dot" aria-hidden="true" />
                          <span className="space-feed-thread-title">{thread.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-feed-card-foot">
                    <span>{space.threads} {space.threads === 1 ? "thread" : "threads"}</span>
                    {space.unread > 0 && (
                      <span className="space-feed-unread">{space.unread} new</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {availableSpaces.length > 0 && (
          <section className="spaces-group">
            <div className="spaces-group-header">
              <h2>Available spaces</h2>
              <p>Real PATNA spaces you can open immediately or request access to.</p>
            </div>
            <div className="spaces-card-grid">
              {availableSpaces.map((space) => {
                const href = space.requiresRequest
                  ? `/app/spaces/${space.slug}/join`
                  : `/app/spaces/${space.slug}`;

                return (
                  <Link className="space-feed-card" href={href} key={space.slug}>
                    <div className="space-feed-card-top">
                      <div className="space-feed-card-info">
                        <span className="space-feed-type-badge">{formatSpaceType(space.space_type, t)}</span>
                        <strong className="space-feed-card-name">{space.name}</strong>
                      </div>
                      <span className="space-role-pill">
                        {space.requiresRequest ? "Request access" : "Open"}
                      </span>
                    </div>

                    {space.description && (
                      <p className="space-feed-card-desc">{space.description}</p>
                    )}

                    <div className="space-feed-card-foot">
                      <span>{space.member_count ?? 0} {(space.member_count ?? 0) === 1 ? "member" : "members"}</span>
                      <span>{space.threads ?? 0} {(space.threads ?? 0) === 1 ? "thread" : "threads"}</span>
                      <span className="space-feed-unread">
                        {space.requiresRequest ? "Admin approval required" : "Available now"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </MemberWorkspaceShell>
  );
}

function formatSpaceType(type, t) {
  const map = {
    cohort:        t("spaces.typeCohort"),
    constituency:  t("spaces.typeConstituency"),
    working_group: t("spaces.typeWorkingGroup"),
    geography:     t("spaces.typeGeography"),
  };
  return map[type] || type;
}

function capitalise(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
