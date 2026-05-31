import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { INSIGHT_CONTENT_TYPES } from "@/lib/content-types";
import { fetchMemberInsights } from "@/lib/insights";
import { FeaturedPublicationCard } from "@/components/publication-card";
import { MemberPublicationsList } from "./components/member-publications-list";

export default async function MemberPublicationsPage({ searchParams }) {
  const t = await getTranslations();
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
      eyebrow={t("publications.appLabel")}
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle={t("publications.appSubtitle", { count: publications?.length || 0 })}
      title={t("publications.appTitle")}
    >
      <div className="member-dashboard-stack">
        {error && (
          <div className="settings-notice settings-notice-error">
            {t("publications.appError")}
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
              <h3>{t("publications.libraryHeading")}</h3>
              <p className="member-section-copy">
                {t("publications.libraryCopy")}
              </p>
            </div>
            <div className="member-filter-pill-row">
              <Link
                className={typeFilter === "all" ? "filter-tab active-filter" : "filter-tab"}
                href="/app/publications"
              >
                {t("publications.filterAll")}
              </Link>
              {INSIGHT_CONTENT_TYPES.slice(0, 4).map((type) => (
                <Link
                  key={type.value}
                  className={
                    typeFilter === type.value ? "filter-tab active-filter" : "filter-tab"
                  }
                  href={`/app/publications?type=${type.value}`}
                >
                  {t(`contentTypes.${type.value}`)}
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
              placeholder={t("publications.searchPlaceholder")}
              type="search"
            />
            <button className="secondary-button" type="submit">{t("publications.btnSearch")}</button>
          </form>

          <MemberPublicationsList publications={rest} />

          {rest.length === 0 && !error && (
            <div className="app-row-empty">
              <strong>{t("publications.emptySearch")}</strong>
              <p>
                {search || typeFilter !== "all"
                  ? t("publications.emptyTryFilters")
                  : t("publications.emptyCheckBack")}
              </p>
            </div>
          )}
        </article>
      </div>
    </MemberWorkspaceShell>
  );
}
