import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchMemberInsights, INSIGHT_CONTENT_TYPES } from "@/lib/insights";
import { MemberInsightsList } from "./components/member-insights-list";

export default async function MemberInsightsPage({ searchParams }) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/insights");
  }

  const resolvedSearchParams = await searchParams;
  const typeFilter = typeof resolvedSearchParams?.type === "string"
    ? resolvedSearchParams.type
    : "all";
  const search = typeof resolvedSearchParams?.search === "string"
    ? resolvedSearchParams.search
    : "";

  const [frameData, insightsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchMemberInsights({ supabase, filters: { type: typeFilter, search } }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;
  const { insights, error } = insightsResult;

  // Get featured insight (most recent)
  const [featuredInsight, ...otherInsights] = insights || [];

  return (
    <MemberWorkspaceShell
      eyebrow="Knowledge"
      sidebarUser={sidebarUser}
      subtitle={`${insights?.length || 0} insights, reports, briefs, and case studies from across PATNA's work.`}
      title="Insights library"
    >
      <div className="member-dashboard-stack">
        {error && (
          <div className="settings-notice settings-notice-error">
            Failed to load insights. Please try again.
          </div>
        )}

        {/* Featured Insight */}
        {featuredInsight && (
          <Link className="insights-featured-link" href={`/app/insights/${featuredInsight.slug}`}>
            <article className="dashboard-card member-featured-insight">
              <div className="member-featured-insight-copy">
                <div className="insights-featured-meta">
                  <span className="tag">{featuredInsight.content_type?.replace("_", " ")}</span>
                  <span className="insights-featured-date">
                    {formatDate(featuredInsight.published_at)}
                  </span>
                </div>
                <h3>{featuredInsight.title}</h3>
                <p>{featuredInsight.summary}</p>
                {featuredInsight.tags?.length > 0 && (
                  <div className="member-directory-tag-row">
                    {featuredInsight.tags.slice(0, 4).map((tag) => (
                      <span className="status-chip chip-neutral" key={tag.slug}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </Link>
        )}

        {/* Library */}
        <article className="dashboard-card member-module-card">
          <div className="member-section-heading">
            <div>
              <h3>Library</h3>
              <p className="member-section-copy">
                Browse by format and topic to find the most relevant PATNA material.
              </p>
            </div>
            <div className="member-filter-pill-row">
              <Link
                className={typeFilter === "all" ? "filter-tab active-filter" : "filter-tab"}
                href="/app/insights"
              >
                All
              </Link>
              {INSIGHT_CONTENT_TYPES.slice(0, 4).map((type) => (
                <Link
                  key={type.value}
                  className={typeFilter === type.value ? "filter-tab active-filter" : "filter-tab"}
                  href={`/app/insights?type=${type.value}`}
                >
                  {type.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search */}
          <form className="insights-search-form" method="get">
            {typeFilter !== "all" && <input name="type" type="hidden" value={typeFilter} />}
            <span className="admin-search-icon" aria-hidden="true">⌕</span>
            <input
              className="insights-search-input"
              defaultValue={search}
              name="search"
              placeholder="Search insights..."
              type="search"
            />
            <button className="secondary-button" type="submit">Search</button>
          </form>

          <MemberInsightsList insights={otherInsights} />

          {otherInsights.length === 0 && !error && (
            <div className="app-row-empty">
              <strong>No insights found</strong>
              <p>
                {search || typeFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Check back soon for new content."}
              </p>
            </div>
          )}
        </article>
      </div>
    </MemberWorkspaceShell>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  }).format(new Date(value));
}
