import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData, buildMemberSpaceGroups } from "@/lib/member-workspace";
import { fetchMemberSpaces } from "@/lib/spaces";

export default async function SpacesPage() {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/spaces");
  }

  const [frameData, { spaces, error }] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchMemberSpaces({ supabase, userId: user.id }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;

  // Normalise shape to match buildMemberSpaceGroups expectations
  const normalised = (spaces || []).map((space) => ({
    slug:    space.slug,
    name:    space.name,
    type:    formatSpaceType(space.space_type),
    kind:    space.space_type,
    members: space.member_count ?? 0,
    threads: space.threads ?? 0,
    unread:  space.unread  ?? 0,
    role:    capitalise(space.role || "member"),
    summary: space.description || "",
    tags:    space.tags || [],
  }));

  const groups = buildMemberSpaceGroups(normalised);

  const totalUnread = normalised.reduce((sum, s) => sum + s.unread, 0);
  const leadCount   = normalised.filter((s) => s.role === "Lead").length;

  return (
    <MemberWorkspaceShell
      eyebrow="Community"
      sidebarUser={sidebarUser}
      subtitle="Cohort, constituency, and working-group spaces organised around how PATNA coordinates expertise."
      title="My spaces"
    >
      <div className="member-dashboard-stack">
        {error && (
          <p className="form-error">Could not load spaces. Please refresh and try again.</p>
        )}

        <div className="member-dashboard-summary-grid member-dashboard-summary-grid-compact">
          <article className="member-stat-card tone-blue">
            <strong>{normalised.length}</strong>
            <h3>Total visible spaces</h3>
            <p>Visible across your current PATNA workspace</p>
          </article>
          <article className="member-stat-card tone-blue">
            <strong>{totalUnread}</strong>
            <h3>New updates</h3>
            <p>Unread activity across your current spaces</p>
          </article>
          <article className="member-stat-card tone-blue">
            <strong>{leadCount}</strong>
            <h3>Lead roles</h3>
            <p>Spaces where you currently coordinate</p>
          </article>
        </div>

        {groups.length === 0 && !error && (
          <article className="dashboard-card">
            <div className="app-row-empty">
              <strong>No spaces yet</strong>
              <p>You haven't been added to any spaces. Contact your cohort coordinator to get access.</p>
            </div>
          </article>
        )}

        {groups.map((group) => (
          <article className="dashboard-card member-module-card" key={group.id}>
            <div className="member-section-heading">
              <div>
                <h3>{group.title}</h3>
                <p className="member-section-copy">{group.subtitle}</p>
              </div>
            </div>
            <div className="member-space-grid">
              {group.spaces.map((space) => (
                <div className="member-space-card" key={space.slug}>
                  <div className="member-space-card-header">
                    <div>
                      <strong>{space.name}</strong>
                      <p>{space.type}</p>
                    </div>
                    <span className="status-chip chip-neutral">{space.role}</span>
                  </div>
                  <p className="member-space-card-summary">{space.summary}</p>
                  {space.tags?.length > 0 && (
                    <div className="member-space-card-tags">
                      {space.tags.slice(0, 3).map((tag) => (
                        <span className="status-chip chip-neutral" key={tag.slug} style={{ fontSize: "0.7rem" }}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="member-space-card-meta">
                    <span>{space.threads} threads</span>
                    <span className={space.unread ? "member-meta-emphasis" : undefined}>
                      {space.unread} new
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </MemberWorkspaceShell>
  );
}

function formatSpaceType(type) {
  const map = {
    cohort:        "Cohort Space",
    constituency:  "Constituency",
    working_group: "Working Group",
    geography:     "Geography",
  };
  return map[type] || type;
}

function capitalise(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
