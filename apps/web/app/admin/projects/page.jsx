import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminProjectsList } from "./components/admin-projects-list";
import { adminNav } from "@/lib/patna-data";
import { fetchAdminProjects, filterAdminProjects, buildProjectsSummary } from "@/lib/projects";
import { requireAdminContext } from "@/lib/supabase/access";

const STATUS_FILTERS = [
  { key: "all",       label: "All" },
  { key: "published", label: "Published" },
  { key: "draft",     label: "Draft" },
  { key: "archived",  label: "Archived" },
];

const SECTION_FILTERS = [
  { key: "all",       label: "Any section" },
  { key: "flagship",  label: "Flagship" },
  { key: "convening", label: "Convenings" },
  { key: "other",     label: "Other" },
];

const NOTICE_MESSAGES = {
  saved:           "Project saved.",
  deleted:         "Project deleted.",
  "missing-fields": "Title is required.",
  error:           "Operation failed. Please retry.",
};

function buildProjectsPath({ status, section, search }) {
  const params = new URLSearchParams();
  if (status  && status  !== "all") params.set("status",  status);
  if (section && section !== "all") params.set("section", section);
  if (search) params.set("search", search);
  const q = params.toString();
  return q ? `/admin/projects?${q}` : "/admin/projects";
}

export default async function AdminProjectsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const sp = await searchParams;

  const status  = typeof sp?.status  === "string" ? sp.status  : "all";
  const section = typeof sp?.section === "string" ? sp.section : "all";
  const search  = typeof sp?.search  === "string" ? sp.search  : "";
  const notice  = typeof sp?.notice  === "string" ? sp.notice  : "";

  const { projects, error } = await fetchAdminProjects({ supabase });
  const summary  = buildProjectsSummary(projects);
  const filtered = filterAdminProjects(projects, { status, section, search });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Projects register",
        title: "PATNA project archive",
        body: "Manage flagship programmes, regional convenings, and other project records. Link projects to community workspaces.",
      }}
      title="Projects"
      subtitle="Manage published, draft, and archived PATNA projects across all sections."
    >
      {/* Summary stats */}
      <div className="summary-grid">
        <div className="summary-tile">
          <strong>{summary.total}</strong>
          <span>Total</span>
        </div>
        <div className="summary-tile">
          <strong>{summary.flagship}</strong>
          <span>Flagship</span>
        </div>
        <div className="summary-tile">
          <strong>{summary.convening}</strong>
          <span>Convenings</span>
        </div>
        <div className="summary-tile">
          <strong>{summary.published}</strong>
          <span>Published</span>
        </div>
        <div className="summary-tile">
          <strong>{summary.draft}</strong>
          <span>Draft</span>
        </div>
      </div>

      {/* Toolbar */}
      <article className="dashboard-card">
        <div className="stack">
          {/* Status filter tabs */}
          <div className="dashboard-toolbar">
            {STATUS_FILTERS.map((f) => (
              <Link
                className={status === f.key ? "filter-tab active-filter" : "filter-tab"}
                href={buildProjectsPath({ status: f.key, section, search })}
                key={f.key}
              >
                {f.label}
              </Link>
            ))}
            <div className="filter-tab-divider" />
            {SECTION_FILTERS.map((f) => (
              <Link
                className={section === f.key ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                href={buildProjectsPath({ status, section: f.key, search })}
                key={f.key}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {/* Search + actions */}
          <div className="admin-toolbar-actions">
            <form action="/admin/projects" className="inline-filter-form" style={{ flex: 1 }}>
              {status  !== "all" ? <input name="status"  type="hidden" value={status}  /> : null}
              {section !== "all" ? <input name="section" type="hidden" value={section} /> : null}
              <span className="admin-search-icon" aria-hidden="true">⌕</span>
              <input
                defaultValue={search}
                name="search"
                placeholder="Search title, period, partner…"
                style={{ flex: 1, minWidth: "220px" }}
                type="search"
              />
              <button className="secondary-button" type="submit">Filter</button>
            </form>

            <div className="admin-toolbar-right">
              <Link className="secondary-button" href="/projects" rel="noopener noreferrer" target="_blank">
                Public view ↗
              </Link>
              <Link className="primary-button" href="/admin/projects/new">+ Add project</Link>
            </div>
          </div>

          {notice ? (
            <p className={notice === "error" || notice === "missing-fields" ? "form-error" : "form-success"}>
              {NOTICE_MESSAGES[notice] || notice}
            </p>
          ) : null}
          {error ? <p className="form-error">{error.message}</p> : null}

          {(status !== "all" || section !== "all" || search) ? (
            <p className="muted-note">
              Showing {filtered.length} of {projects.length} projects.{" "}
              <Link className="text-link" href="/admin/projects">Clear filters</Link>
            </p>
          ) : null}
        </div>
      </article>

      <AdminProjectsList projects={filtered} />
    </DashboardShell>
  );
}
