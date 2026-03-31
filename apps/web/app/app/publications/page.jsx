import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchMemberInsights, INSIGHT_CONTENT_TYPES } from "@/lib/insights";
import { FeaturedPublicationCard } from "@/components/publication-card";
import { MemberPublicationsList } from "./components/member-publications-list";

export default async function MemberPublicationsPage({ searchParams }) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/publications");
  }

  const resolvedSearchParams = await searchParams;
  const typeFilter =
    typeof resolvedSearchParams?.type === "string" ? resolvedSearchParams.type : "all";
  const search =
    typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";

  const [frameData, insightsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchMemberInsights({ supabase, filters: { type: typeFilter, search } }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;
  const { insights: publications, error } = insightsResult;

  const [featured, ...rest] = publications || [];

  return (
    <MemberWorkspaceShell
      eyebrow="Knowledge"
      sidebarUser={sidebarUser}
      subtitle={`${publications?.length || 0} publications, reports, briefs, and case studies from across PATNA's work.`}
      title="Publications Library"
    >
      <div className="member-dashboard-stack">
        {error && (
          <div className="settings-notice settings-notice-error">
            Failed to load publications. Please try again.
          </div>
        )}

        {/* Featured / latest publication */}
        {featured && (
          <FeaturedPublicationCard
            href={`/app/publications/${featured.slug}`}
            publication={featured}
          />
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
                href="/app/publications"
              >
                All
              </Link>
              {INSIGHT_CONTENT_TYPES.slice(0, 4).map((type) => (
                <Link
                  key={type.value}
                  className={
                    typeFilter === type.value ? "filter-tab active-filter" : "filter-tab"
                  }
                  href={`/app/publications?type=${type.value}`}
                >
                  {type.label}
                </Link>
              ))}
            </div>
          </div>

          <form className="insights-search-form" method="get">
            {typeFilter !== "all" && <input name="type" type="hidden" value={typeFilter} />}
            <span className="admin-search-icon" aria-hidden="true">⌕</span>
            <input
              className="insights-search-input"
              defaultValue={search}
              name="search"
              placeholder="Search publications..."
              type="search"
            />
            <button className="secondary-button" type="submit">Search</button>
          </form>

          <MemberPublicationsList publications={rest} />

          {rest.length === 0 && !error && (
            <div className="app-row-empty">
              <strong>No publications found</strong>
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
