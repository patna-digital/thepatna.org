import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";

const PATHWAY_TABS = [
  { value: "all",           label: "All partners" },
  { value: "partnership",   label: "Institutional" },
  { value: "collaboration", label: "Research / Collaboration" },
  { value: "service",       label: "Service" },
];

const PATHWAY_LABELS = {
  partnership:   "Institutional",
  collaboration: "Research",
  service:       "Service",
};

const STATUS_CHIP = {
  active:   "chip-success",
  inactive: "chip-muted",
  prospect: "chip-warning",
};

function getNoticeMessage(notice) {
  const messages = {
    saved:           "Partner saved successfully.",
    deleted:         "Partner deleted.",
    error:           "Something went wrong. Please try again.",
    "contact-saved": "Contact saved.",
    "contact-deleted": "Contact removed.",
  };
  return messages[notice] || "";
}

export const metadata = {
  title: "Partners | PATNA Admin",
};

export default async function AdminPartnersPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolved = await searchParams;
  const pathway = typeof resolved?.pathway === "string" ? resolved.pathway : "all";
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  let query = supabase
    .from("partners")
    .select("id, name, slug, pathway, partnership_type, country, status, is_featured, logo_url, created_at")
    .order("name", { ascending: true });

  if (pathway !== "all") {
    query = query.eq("pathway", pathway);
  }

  const { data: partners, error } = await query;

  const grouped = {
    active:   (partners || []).filter((p) => p.status === "active"),
    prospect: (partners || []).filter((p) => p.status === "prospect"),
    inactive: (partners || []).filter((p) => p.status === "inactive"),
  };

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Partnerships"
      navItems={adminNav}
      spotlight={{
        label: "Partner registry",
        title: "Institutional partners, collaborators & service clients",
        body: "Manage confirmed partnerships, track contacts, and update partnership profiles.",
      }}
      title="Partners"
      subtitle="All confirmed partnerships. Use tabs to filter by pathway."
    >
      <div className="admin-stat-grid admin-stat-grid-4">
        {["active", "prospect", "inactive"].map((s) => (
          <div className={`admin-stat-card${s === "active" ? " tone-success" : s === "prospect" ? " tone-warning" : ""}`} key={s}>
            <strong>{grouped[s].length}</strong>
            <h4>{s.charAt(0).toUpperCase() + s.slice(1)}</h4>
          </div>
        ))}
        <div className="admin-stat-card">
          <strong>{(partners || []).filter((p) => p.is_featured).length}</strong>
          <h4>Featured</h4>
          <p>Shown on home page</p>
        </div>
      </div>

      <article className="dashboard-card admin-toolbar-card">
        <div className="stack">
          <div className="admin-toolbar-main">
            <div className="dashboard-toolbar">
              {PATHWAY_TABS.map((tab) => (
                <Link
                  className={pathway === tab.value ? "filter-tab active-filter" : "filter-tab"}
                  href={tab.value === "all" ? "/admin/partners" : `/admin/partners?pathway=${tab.value}`}
                  key={tab.value}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <Link className="primary-button" href="/admin/partners/new">
              + Add partner
            </Link>
          </div>
          {notice && (
            <p className={notice === "error" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice)}
            </p>
          )}
          {error && <p className="form-error">{error.message}</p>}
        </div>
      </article>

      {(partners || []).length === 0 ? (
        <article className="dashboard-card">
          <div className="app-row-empty">
            <strong>No partners found.</strong>
            <p>Add your first partner or adjust the pathway filter.</p>
            <Link className="primary-button" href="/admin/partners/new">Add partner</Link>
          </div>
        </article>
      ) : (
        <article className="dashboard-card partners-list-card">
          <div className="partners-list">
            {(partners || []).map((partner) => (
              <Link className="partner-row" href={`/admin/partners/${partner.id}`} key={partner.id}>
                <div className="partner-row-logo">
                  {partner.logo_url ? (
                    <img alt={partner.name} src={partner.logo_url} />
                  ) : (
                    <span className="partner-row-logo-placeholder">
                      {partner.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="partner-row-body">
                  <div className="partner-row-title">
                    <strong>{partner.name}</strong>
                    {partner.is_featured && (
                      <span className="status-chip chip-warning" title="Featured on home page">★ Featured</span>
                    )}
                  </div>
                  <div className="partner-row-meta">
                    {partner.country && <span>{partner.country}</span>}
                    {partner.partnership_type && <span>{partner.partnership_type}</span>}
                    <span className={`status-chip ${STATUS_CHIP[partner.status] || "chip-neutral"}`}>
                      {partner.status}
                    </span>
                    <span className="status-chip chip-neutral">
                      {PATHWAY_LABELS[partner.pathway] || partner.pathway}
                    </span>
                  </div>
                </div>
                <span className="partner-row-arrow">→</span>
              </Link>
            ))}
          </div>
        </article>
      )}
    </DashboardShell>
  );
}
