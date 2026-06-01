import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { INSIGHT_CONTENT_TYPES, INSIGHT_STATUSES } from "@/lib/content-types";
import { adminNav } from "@/lib/patna-data";
import { requirePublicationManagerContext } from "@/lib/supabase/access";
import {
  fetchAdminInsights,
  buildInsightsSummary,
  filterInsights,
} from "@/lib/insights";
import { AdminInsightsList } from "./components/admin-insights-list";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "archived", label: "Archived" },
];

function getNoticeMessage(notice) {
  const messages = {
    created: "Insight created successfully.",
    updated: "Insight updated successfully.",
    deleted: "Insight deleted successfully.",
    error: "An error occurred. Please try again.",
  };
  return messages[notice] || "";
}

function buildInsightsPath({ status, type, search }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (type && type !== "all") params.set("type", type);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/admin/insights?${query}` : "/admin/insights";
}

export default async function AdminInsightsPage({ searchParams }) {
  const { supabase } = await requirePublicationManagerContext();
  const resolvedSearchParams = await searchParams;

  const statusFilter = typeof resolvedSearchParams?.status === "string" 
    ? resolvedSearchParams.status 
    : "all";
  const typeFilter = typeof resolvedSearchParams?.type === "string" 
    ? resolvedSearchParams.type 
    : "all";
  const search = typeof resolvedSearchParams?.search === "string" 
    ? resolvedSearchParams.search 
    : "";
  const notice = typeof resolvedSearchParams?.notice === "string" 
    ? resolvedSearchParams.notice 
    : "";

  const { insights, error } = await fetchAdminInsights({
    supabase,
    filters: { status: statusFilter, type: typeFilter, search },
  });

  const summary = buildInsightsSummary(insights);
  const filteredInsights = filterInsights(insights, {
    status: statusFilter,
    type: typeFilter,
    search,
  });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Insights library",
        title: "PATNA insights and knowledge products",
        body: "Manage reports, briefs, case studies, and articles. Control publication status, visibility, and editorial metadata.",
      }}
      subtitle="Manage published, draft, and archived PATNA insights with editorial controls and attachment management."
      title="Insights"
    >
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <strong>{summary.total}</strong>
          <h4>Total insights</h4>
          <p>All statuses</p>
        </div>
        <div className="admin-stat-card tone-success">
          <strong>{summary.published}</strong>
          <h4>Published</h4>
          <p>Visible to members</p>
        </div>
        <div className="admin-stat-card tone-warning">
          <strong>{summary.draft}</strong>
          <h4>Drafts</h4>
          <p>Not yet published</p>
        </div>
        <div className="admin-stat-card tone-muted">
          <strong>{summary.archived}</strong>
          <h4>Archived</h4>
          <p>Hidden from library</p>
        </div>
      </div>

      {/* Toolbar */}
      <article className="dashboard-card">
        <div className="stack">
          {/* Status filters */}
          <div className="dashboard-toolbar">
            {STATUS_FILTERS.map((f) => (
              <Link
                key={f.key}
                className={statusFilter === f.key ? "filter-tab active-filter" : "filter-tab"}
                href={buildInsightsPath({ status: f.key, type: typeFilter, search })}
              >
                {f.label}
              </Link>
            ))}
            <div className="filter-tab-divider" />
            {INSIGHT_CONTENT_TYPES.map((t) => (
              <Link
                key={t.value}
                className={typeFilter === t.value ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                href={buildInsightsPath({ status: statusFilter, type: t.value, search })}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* Search + Actions */}
          <div className="admin-toolbar-actions">
            <form className="admin-search-form" method="get">
              {statusFilter !== "all" && <input name="status" type="hidden" value={statusFilter} />}
              {typeFilter !== "all" && <input name="type" type="hidden" value={typeFilter} />}
              <span className="admin-search-icon" aria-hidden="true">⌕</span>
              <input
                defaultValue={search}
                name="search"
                placeholder="Search insights by title or summary..."
                type="search"
              />
              <button className="secondary-button" type="submit">Search</button>
            </form>

            <div className="admin-toolbar-right">
              <Link className="primary-button" href="/admin/insights/new">
                + Add insight
              </Link>
            </div>
          </div>

          {notice && (
            <p className={notice === "error" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice)}
            </p>
          )}
          {error && <p className="form-error">{error.message}</p>}

          {(search || statusFilter !== "all" || typeFilter !== "all") && (
            <p className="muted-note">
              Showing {filteredInsights.length} of {insights.length} insights.{" "}
              <Link className="text-link" href="/admin/insights">
                Clear filters
              </Link>
            </p>
          )}
        </div>
      </article>

      {/* Insights List */}
      <AdminInsightsList insights={filteredInsights} />
    </DashboardShell>
  );
}
