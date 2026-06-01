import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireAdminContext } from "@/lib/supabase/access";
import { getAdminNavWithPipelineBadges } from "@/lib/admin-pipeline-badges";
import { LeadsStatusSelect } from "./status-select";

export const metadata = { title: "Leads | PATNA Admin" };

// ── Constants ──────────────────────────────────────────────────

const SOURCE_CHIP = {
  service:       "chip-neutral",
  partnership:   "chip-success",
  collaboration: "chip-warning",
};

const STATUS_CHIP = {
  new:            "chip-new",
  in_review:      "chip-warning",
  in_progress:    "chip-warning",
  review:         "chip-warning",
  active:         "chip-success",
  contacted:      "chip-warning",
  in_discussion:  "chip-warning",
  proposal_sent:  "chip-warning",
  negotiation:    "chip-warning",
  agreed:         "chip-success",
  closed_won:     "chip-success",
  completed:      "chip-success",
  closed:         "chip-muted",
  declined:       "chip-muted",
  closed_lost:    "chip-muted",
  cancelled:      "chip-muted",
};

// ── Helpers ─────────────────────────────────────────────────────

function buildLeadsPath({ source, status, search }) {
  const params = new URLSearchParams();
  if (source && source !== "all") params.set("source", source);
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  const q = params.toString();
  return q ? `/admin/leads?${q}` : "/admin/leads";
}

function matchesSearch(item, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [
    item.contact_name, item.contact_email, item.organisation, item.category, item.status,
  ].some((v) => v && v.toLowerCase().includes(q));
}

function formatDate(value, locale) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale || "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

// ── Data fetch ──────────────────────────────────────────────────

async function fetchAllLeads(supabase) {
  const [svcRes, partRes, collabRes] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id, requester_name, requester_email, organisation, request_type, status, created_at, assigned_to_user_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("partnership_leads")
      .select("id, name, email, organisation, org_type, status, created_at, assigned_to_user_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("collaboration_leads")
      .select("id, name, email, organisation, collaboration_type, status, created_at, assigned_to_user_id")
      .order("created_at", { ascending: false }),
  ]);

  const service = (svcRes.data || []).map((r) => ({
    _source:       "service",
    id:            r.id,
    contact_name:  r.requester_name,
    contact_email: r.requester_email,
    organisation:  r.organisation || "",
    category:      r.request_type || "",
    status:        r.status || "new",
    created_at:    r.created_at,
    href:          `/admin/service-requests/${r.id}`,
  }));

  const partnership = (partRes.data || []).map((r) => ({
    _source:       "partnership",
    id:            r.id,
    contact_name:  r.name,
    contact_email: r.email,
    organisation:  r.organisation || "",
    category:      r.org_type || "",
    status:        r.status || "new",
    created_at:    r.created_at,
    href:          `/admin/partnership-leads/${r.id}`,
  }));

  const collab = (collabRes.data || []).map((r) => ({
    _source:       "collaboration",
    id:            r.id,
    contact_name:  r.name,
    contact_email: r.email,
    organisation:  r.organisation || "",
    category:      r.collaboration_type || "",
    status:        r.status || "new",
    created_at:    r.created_at,
    href:          `/admin/collaboration-leads/${r.id}`,
  }));

  // Merge and sort by date desc
  const all = [...service, ...partnership, ...collab].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const error = svcRes.error || partRes.error || collabRes.error;
  return { leads: all, error };
}

// ── Page ─────────────────────────────────────────────────────────

export default async function AdminLeadsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolved = await searchParams;
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);

  const sourceFilter = typeof resolved?.source === "string" ? resolved.source : "all";
  const statusFilter = typeof resolved?.status === "string" ? resolved.status : "all";
  const search       = typeof resolved?.search === "string" ? resolved.search : "";
  const notice       = typeof resolved?.notice === "string" ? resolved.notice : "";

  const [{ leads, error }, navItems] = await Promise.all([
    fetchAllLeads(supabase),
    getAdminNavWithPipelineBadges(supabase),
  ]);

  // Compute summary counts before any filter
  const counts = {
    total:         leads.length,
    new:           leads.filter((l) => l.status === "new").length,
    service:       leads.filter((l) => l._source === "service").length,
    partnership:   leads.filter((l) => l._source === "partnership").length,
    collaboration: leads.filter((l) => l._source === "collaboration").length,
  };

  // Collect all unique statuses for the status selector
  const allStatuses = [...new Set(leads.map((l) => l.status))].sort();

  // Apply filters
  const filtered = leads.filter((l) => {
    if (sourceFilter !== "all" && l._source !== sourceFilter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (!matchesSearch(l, search)) return false;
    return true;
  });

  const isFiltered = sourceFilter !== "all" || statusFilter !== "all" || search;

  const KNOWN_STATUSES = new Set(["new","in_review","in_progress","review","active","closed","contacted","in_discussion","proposal_sent","negotiation","agreed","closed_won","completed","declined","closed_lost","cancelled"]);
  const KNOWN_CATEGORIES = new Set(["technical","research","content","events","partnership","training","ngo","government","academic","private","foundation","multilateral","advocacy"]);
  const tStatus = (s) => KNOWN_STATUSES.has(s) ? t(`admin.leads.statuses.${s}`) : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const tCategory = (c) => KNOWN_CATEGORIES.has(c) ? t(`admin.leads.categories.${c}`) : c.replace(/_/g, " ");

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel={t("admin.brandLabel")}
      eyebrow={t("admin.leads.eyebrow")}
      breadcrumb={[
        { label: t("admin.title"), href: "/admin" },
        { label: t("admin.leads.breadcrumb.parent") },
        { label: t("admin.leads.breadcrumb.self") },
      ]}
      navItems={navItems}
      title={t("admin.leads.title")}
      subtitle={t("admin.leads.subtitle")}
    >
      {/* Stats */}
      <div className="admin-stat-grid admin-stat-grid-4">
        <div className="admin-stat-card">
          <strong>{counts.total}</strong>
          <h4>{t("admin.leads.stats.total")}</h4>
        </div>
        <div className="admin-stat-card tone-warning">
          <strong>{counts.new}</strong>
          <h4>{t("admin.leads.stats.new")}</h4>
          <p>{t("admin.leads.stats.awaitingReview")}</p>
        </div>
        <div className="admin-stat-card">
          <strong>{counts.service}</strong>
          <h4>{t("admin.leads.stats.service")}</h4>
        </div>
        <div className="admin-stat-card">
          <strong>{counts.partnership + counts.collaboration}</strong>
          <h4>{t("admin.leads.stats.partnershipCollab")}</h4>
        </div>
      </div>

      {/* Toolbar */}
      <article className="dashboard-card">
        <div className="stack">
          {/* Source tabs */}
          <div className="dashboard-toolbar">
            {[
              { key: "all",           label: `${t("admin.leads.sources.all")} (${leads.length})` },
              { key: "service",       label: `${t("admin.leads.sources.service")} (${counts.service})` },
              { key: "partnership",   label: `${t("admin.leads.sources.partnership")} (${counts.partnership})` },
              { key: "collaboration", label: `${t("admin.leads.sources.collaboration")} (${counts.collaboration})` },
            ].map((f) => (
              <Link
                key={f.key}
                className={sourceFilter === f.key ? "filter-tab active-filter" : "filter-tab"}
                href={buildLeadsPath({ source: f.key, status: statusFilter, search })}
              >
                {f.label}
              </Link>
            ))}

            <div className="filter-tab-divider" />

            {/* Status selector */}
            <LeadsStatusSelect
              current={statusFilter}
              search={search}
              source={sourceFilter}
              statuses={allStatuses}
            />
          </div>

          {/* Search + add actions */}
          <div className="admin-toolbar-actions">
            <form className="admin-search-form" method="get">
              {sourceFilter !== "all" && <input name="source" type="hidden" value={sourceFilter} />}
              {statusFilter !== "all" && <input name="status" type="hidden" value={statusFilter} />}
              <span className="admin-search-icon" aria-hidden="true">⌕</span>
              <input
                defaultValue={search}
                name="search"
                placeholder={t("admin.leads.toolbar.searchPlaceholder")}
                type="search"
              />
              <button className="secondary-button" type="submit">{t("admin.leads.toolbar.searchButton")}</button>
            </form>
            <div className="admin-toolbar-right">
              <Link className="secondary-button" href="/admin/service-requests/new">{t("admin.leads.toolbar.addService")}</Link>
              <Link className="secondary-button" href="/admin/partnership-leads/new">{t("admin.leads.toolbar.addPartnership")}</Link>
              <Link className="secondary-button" href="/admin/collaboration-leads/new">{t("admin.leads.toolbar.addCollaboration")}</Link>
            </div>
          </div>

          {notice === "deleted" && (
            <p className="form-success">{t("admin.leads.notices.deleted")}</p>
          )}
          {notice === "error" && (
            <p className="form-error">{t("admin.leads.notices.error")}</p>
          )}
          {error && <p className="form-error">{t("admin.leads.notices.loadError")}</p>}

          {isFiltered && (
            <p className="muted-note">
              {t("admin.leads.showingFiltered", { filtered: filtered.length, total: leads.length })}{" "}
              <Link className="text-link" href="/admin/leads">{t("admin.leads.clearFilters")}</Link>
            </p>
          )}
        </div>
      </article>

      {/* Table */}
      {filtered.length === 0 ? (
        <article className="dashboard-card">
          <div className="app-row-empty">
            <strong>{t("admin.leads.noResults")}</strong>
            <Link className="text-link" href="/admin/leads">{t("admin.leads.clearFilters")}</Link>
          </div>
        </article>
      ) : (
        <div className="leads-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("admin.leads.tableHeaders.type")}</th>
                <th>{t("admin.leads.tableHeaders.contact")}</th>
                <th>{t("admin.leads.tableHeaders.organisation")}</th>
                <th>{t("admin.leads.tableHeaders.category")}</th>
                <th>{t("admin.leads.tableHeaders.status")}</th>
                <th>{t("admin.leads.tableHeaders.submitted")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={`${lead._source}-${lead.id}`}>
                  <td>
                    <span className={`status-chip ${SOURCE_CHIP[lead._source]}`}>
                      {t(`admin.leads.sources.${lead._source}`)}
                    </span>
                  </td>
                  <td>
                    <div className="leads-contact-cell">
                      <span className="leads-contact-name">{lead.contact_name}</span>
                      {lead.contact_email && (
                        <a
                          className="leads-contact-email"
                          href={`mailto:${lead.contact_email}`}
                        >
                          {lead.contact_email}
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{lead.organisation || "—"}</td>
                  <td>
                    {lead.category ? (
                      <span className="status-chip chip-neutral">
                        {tCategory(lead.category)}
                      </span>
                    ) : "—"}
                  </td>
                  <td>
                    <span className={`status-chip ${STATUS_CHIP[lead.status] || "chip-neutral"}`}>
                      {tStatus(lead.status)}
                    </span>
                  </td>
                  <td className="leads-date">{formatDate(lead.created_at, locale)}</td>
                  <td>
                    <Link className="text-link" href={lead.href}>{t("admin.leads.viewLink")}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
