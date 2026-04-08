import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import {
  fetchAdminSpaces,
  buildSpacesSummary,
  filterSpaces,
  SPACE_TYPES,
} from "@/lib/spaces";
import { AdminSpacesList } from "./components/admin-spaces-list";

const TYPE_FILTERS = [
  { key: "all",          label: "All" },
  { key: "working_group", label: "Working Groups" },
  { key: "cohort",        label: "Cohorts" },
  { key: "constituency",  label: "Constituencies" },
  { key: "geography",     label: "Geography" },
];

function getNoticeMessage(notice) {
  const messages = {
    created: "Space created successfully.",
    updated: "Space updated successfully.",
    deleted: "Space deleted successfully.",
    error:   "An error occurred. Please try again.",
  };
  return messages[notice] || "";
}

function buildSpacesPath({ type, search }) {
  const params = new URLSearchParams();
  if (type && type !== "all") params.set("type", type);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/admin/spaces?${query}` : "/admin/spaces";
}

export default async function AdminSpacesPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolved = await searchParams;

  const typeFilter = typeof resolved?.type   === "string" ? resolved.type   : "all";
  const search     = typeof resolved?.search === "string" ? resolved.search : "";
  const notice     = typeof resolved?.notice === "string" ? resolved.notice : "";

  const { spaces, error } = await fetchAdminSpaces({ supabase, filters: { type: typeFilter, search } });
  const summary = buildSpacesSummary(spaces);
  const filtered = filterSpaces(spaces, { type: typeFilter, search });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Spaces",
        title: "PATNA community spaces",
        body: "Manage cohort rooms, constituencies, and working groups. Control membership, tags, and visibility for each space.",
      }}
      subtitle="Create and manage community spaces — working groups, cohorts, and constituencies — and control who can access them."
      title="Spaces"
    >
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <strong>{summary.total}</strong>
          <h4>Total spaces</h4>
          <p>All types</p>
        </div>
        <div className="admin-stat-card tone-muted">
          <strong>{summary.working_group}</strong>
          <h4>Working groups</h4>
          <p>Thematic spaces</p>
        </div>
        <div className="admin-stat-card tone-muted">
          <strong>{summary.cohort}</strong>
          <h4>Cohorts</h4>
          <p>Cohort rooms</p>
        </div>
        <div className="admin-stat-card tone-muted">
          <strong>{summary.constituency}</strong>
          <h4>Constituencies</h4>
          <p>Regional spaces</p>
        </div>
      </div>

      {/* Toolbar */}
      <article className="dashboard-card">
        <div className="stack">
          <div className="dashboard-toolbar">
            {TYPE_FILTERS.map((f) => (
              <Link
                key={f.key}
                className={typeFilter === f.key ? "filter-tab active-filter" : "filter-tab"}
                href={buildSpacesPath({ type: f.key, search })}
              >
                {f.label}
              </Link>
            ))}
          </div>

          <div className="admin-toolbar-actions">
            <form className="admin-search-form" method="get">
              {typeFilter !== "all" && <input name="type" type="hidden" value={typeFilter} />}
              <span className="admin-search-icon" aria-hidden="true">⌕</span>
              <input
                defaultValue={search}
                name="search"
                placeholder="Search spaces by name or description..."
                type="search"
              />
              <button className="secondary-button" type="submit">Search</button>
            </form>

            <div className="admin-toolbar-right">
              <Link className="primary-button" href="/admin/spaces/new">
                + Add space
              </Link>
            </div>
          </div>

          {notice && (
            <p className={notice === "error" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice)}
            </p>
          )}
          {error && <p className="form-error">{error.message}</p>}

          {(search || typeFilter !== "all") && (
            <p className="muted-note">
              Showing {filtered.length} of {spaces.length} spaces.{" "}
              <Link className="text-link" href="/admin/spaces">Clear filters</Link>
            </p>
          )}
        </div>
      </article>

      <AdminSpacesList spaces={filtered} />
    </DashboardShell>
  );
}
