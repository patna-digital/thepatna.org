import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { publicInsights } from "@/lib/patna-data";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";

export default async function MemberInsightsPage() {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/insights");
  }

  const frameData = await fetchMemberWorkspaceFrameData({ supabase, userId: user.id });

  // Allow navigation even with incomplete profile
  const [featuredInsight, ...libraryItems] = publicInsights;

  return (
    <MemberWorkspaceShell
      eyebrow="Knowledge"
      sidebarUser={frameData.sidebarUser}
      subtitle="A member-facing library organised around briefs, reports, commentary, and audience relevance."
      title="Insights library"
    >
      <div className="member-dashboard-stack">
        <article className="dashboard-card member-featured-insight">
          <div className="member-featured-insight-copy">
            <span className="tag">{featuredInsight.type}</span>
            <h3>{featuredInsight.title}</h3>
            <p>{featuredInsight.summary}</p>
            <div className="content-meta">
              <span>{featuredInsight.date}</span>
              <span>{featuredInsight.audience}</span>
            </div>
          </div>
        </article>

        <article className="dashboard-card member-module-card">
          <div className="member-section-heading">
            <div>
              <h3>Library</h3>
              <p className="member-section-copy">Browse by format and audience to find the most relevant PATNA material quickly.</p>
            </div>
            <div className="member-filter-pill-row">
              <span className="filter-tab active-filter">All</span>
              <span className="filter-tab">Brief</span>
              <span className="filter-tab">Report</span>
              <span className="filter-tab">Article</span>
            </div>
          </div>

          <div className="member-insight-list">
            {libraryItems.map((item) => (
              <article className="member-insight-row" key={item.slug}>
                <div className="member-insight-row-top">
                  <span className="status-chip chip-neutral">{item.type}</span>
                  <span className="member-insight-date">{item.date}</span>
                </div>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <div className="member-insight-row-footer">
                  <span>{item.audience}</span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>
    </MemberWorkspaceShell>
  );
}
