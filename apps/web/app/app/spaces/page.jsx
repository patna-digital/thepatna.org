import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData, buildMemberSpaceGroups } from "@/lib/member-workspace";
import { memberSpaces } from "@/lib/patna-data";

export default async function SpacesPage() {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/spaces");
  }

  const frameData = await fetchMemberWorkspaceFrameData({ supabase, userId: user.id });

  // Allow navigation even with incomplete profile
  const sidebarUser = frameData.sidebarUser || null;

  const groups = buildMemberSpaceGroups(memberSpaces);

  return (
    <MemberWorkspaceShell
      eyebrow="Community"
      sidebarUser={sidebarUser}
      subtitle="Cohort, constituency, and working-group spaces organised around how PATNA coordinates expertise."
      title="My spaces"
    >
      <div className="member-dashboard-stack">
        <div className="member-dashboard-summary-grid member-dashboard-summary-grid-compact">
          <article className="member-stat-card tone-blue">
            <strong>{memberSpaces.length}</strong>
            <h3>Total visible spaces</h3>
            <p>Visible across your current PATNA workspace</p>
          </article>
          <article className="member-stat-card tone-blue">
            <strong>{memberSpaces.reduce((sum, item) => sum + item.unread, 0)}</strong>
            <h3>New updates</h3>
            <p>Unread activity across your current spaces</p>
          </article>
          <article className="member-stat-card tone-blue">
            <strong>{memberSpaces.filter((item) => item.role === "Lead").length}</strong>
            <h3>Lead roles</h3>
            <p>Spaces where you currently coordinate</p>
          </article>
        </div>

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
        ))}
      </div>
    </MemberWorkspaceShell>
  );
}
