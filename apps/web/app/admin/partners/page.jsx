import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";

const STATUS_CHIP = {
  active:   "chip-success",
  inactive: "chip-muted",
  prospect: "chip-warning",
};

const NOTICE_KEY = {
  saved:             "admin.partners.notices.saved",
  deleted:           "admin.partners.notices.deleted",
  error:             "admin.partners.notices.error",
  "contact-saved":   "admin.partners.notices.contactSaved",
  "contact-deleted": "admin.partners.notices.contactDeleted",
};

export const metadata = {
  title: "Partners | PATNA Admin",
};

export default async function AdminPartnersPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolved = await searchParams;
  const t = await getTranslations();
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

  const PATHWAY_TABS = [
    { value: "all",           label: t("admin.partners.tabs.all") },
    { value: "partnership",   label: t("admin.partners.tabs.partnership") },
    { value: "collaboration", label: t("admin.partners.tabs.collaboration") },
    { value: "service",       label: t("admin.partners.tabs.service") },
  ];

  const KNOWN_PATHWAYS = new Set(["partnership", "collaboration", "service"]);
  const tPathway = (p) => KNOWN_PATHWAYS.has(p) ? t(`admin.partners.pathwayLabels.${p}`) : p;

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel={t("admin.brandLabel")}
      eyebrow={t("admin.partners.eyebrow")}
      breadcrumb={[
        { label: t("admin.title"), href: "/admin" },
        { label: t("admin.partners.breadcrumb.parent") },
        { label: t("admin.partners.breadcrumb.self") },
      ]}
      navItems={adminNav}
      spotlight={{
        label: t("admin.partners.spotlight.label"),
        title: t("admin.partners.spotlight.title"),
        body:  t("admin.partners.spotlight.body"),
      }}
      title={t("admin.partners.title")}
      subtitle={t("admin.partners.subtitle")}
    >
      <div className="admin-stat-grid admin-stat-grid-4">
        {["active", "prospect", "inactive"].map((s) => (
          <div className={`admin-stat-card${s === "active" ? " tone-success" : s === "prospect" ? " tone-warning" : ""}`} key={s}>
            <strong>{grouped[s].length}</strong>
            <h4>{t(`admin.partners.stats.${s}`)}</h4>
          </div>
        ))}
        <div className="admin-stat-card">
          <strong>{(partners || []).filter((p) => p.is_featured).length}</strong>
          <h4>{t("admin.partners.stats.featured")}</h4>
          <p>{t("admin.partners.stats.shownOnHome")}</p>
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
              {t("admin.partners.addPartner")}
            </Link>
          </div>
          {notice && NOTICE_KEY[notice] && (
            <p className={notice === "error" ? "form-error" : "form-success"}>
              {t(NOTICE_KEY[notice])}
            </p>
          )}
          {error && <p className="form-error">{error.message}</p>}
        </div>
      </article>

      {(partners || []).length === 0 ? (
        <article className="dashboard-card">
          <div className="app-row-empty">
            <strong>{t("admin.partners.emptyState.title")}</strong>
            <p>{t("admin.partners.emptyState.text")}</p>
            <Link className="primary-button" href="/admin/partners/new">{t("admin.partners.addPartnerAction")}</Link>
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
                      <span className="status-chip chip-warning" title={t("admin.partners.stats.shownOnHome")}>{t("admin.partners.featured")}</span>
                    )}
                  </div>
                  <div className="partner-row-meta">
                    {partner.country && <span>{partner.country}</span>}
                    {partner.partnership_type && <span>{partner.partnership_type}</span>}
                    <span className={`status-chip ${STATUS_CHIP[partner.status] || "chip-neutral"}`}>
                      {STATUS_CHIP[partner.status] ? t(`admin.partners.stats.${partner.status}`) : partner.status}
                    </span>
                    <span className="status-chip chip-neutral">
                      {tPathway(partner.pathway)}
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
