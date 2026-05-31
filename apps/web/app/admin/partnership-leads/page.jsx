import Link from "next/link";
import { AdminPartnershipLeadsList } from "@/components/admin-partnership-leads-list";
import { DashboardShell } from "@/components/dashboard-shell";
import { buildPartnershipLeadSummary, fetchAdminPartnershipLeads, filterAdminPartnershipLeads } from "@/lib/partnership-leads";
import { requireAdminContext } from "@/lib/supabase/access";
import { getTranslations } from "next-intl/server";
import { deleteAdminPartnershipLeadAction } from "./actions";
import { getAdminNavWithPipelineBadges } from "@/lib/admin-pipeline-badges";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "in_discussion", label: "In Discussion" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

const ORG_TYPE_FILTERS = [
  { key: "all", label: "All Types" },
  { key: "ngo", label: "NGO/Non-profit" },
  { key: "government", label: "Government" },
  { key: "academic", label: "Academic/Research" },
  { key: "private", label: "Private Sector" },
  { key: "foundation", label: "Foundation" },
  { key: "multilateral", label: "Multilateral" },
];

function getNoticeMessage(notice) {
  const messages = {
    saved: "Partnership lead saved.",
    deleted: "Partnership lead deleted.",
    error: "Operation failed. Please retry.",
  };
  return messages[notice] || "";
}

function buildPartnershipLeadsPath({ status, orgType, search }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (orgType && orgType !== "all") params.set("orgType", orgType);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/admin/partnership-leads?${query}` : "/admin/partnership-leads";
}

export default async function AdminPartnershipLeadsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations();

  const statusFilter = typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : "all";
  const orgTypeFilter = typeof resolvedSearchParams?.orgType === "string" ? resolvedSearchParams.orgType : "all";
  const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const sortBy = typeof resolvedSearchParams?.sortBy === "string" ? resolvedSearchParams.sortBy : "created_at";
  const sortDir = resolvedSearchParams?.sortDir === "asc" ? "asc" : "desc";

  const [{ partnershipLeads, error }, navItems] = await Promise.all([
    fetchAdminPartnershipLeads({ supabase }),
    getAdminNavWithPipelineBadges(supabase),
  ]);
  const summary = buildPartnershipLeadSummary(partnershipLeads);
  const filteredPartnershipLeads = filterAdminPartnershipLeads(partnershipLeads, {
    status: statusFilter,
    orgType: orgTypeFilter,
    search,
    sortBy,
    sortDir,
  });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel={t("admin.brandLabel")}
      eyebrow={t("admin.eyebrow")}
      navItems={navItems}
      spotlight={{
        label: t("admin.partnershipLeads.spotlightLabel"),
        title: t("admin.partnershipLeads.spotlightTitle"),
        body: t("admin.partnershipLeads.spotlightBody"),
      }}
      title={t("admin.partnershipLeads.title")}
      subtitle={t("admin.partnershipLeads.subtitle")}
    >
       {/* Summary stats */}
       <div className="summary-grid">
         <div className="summary-tile">
           <strong>{summary.total}</strong>
           <span>{t("admin.partnershipLeads.summary.total")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.new}</strong>
           <span>{t("admin.partnershipLeads.summary.new")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.inDiscussion}</strong>
           <span>{t("admin.partnershipLeads.summary.inDiscussion")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.closedWon}</strong>
           <span>{t("admin.partnershipLeads.summary.closedWon")}</span>
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
                 href={buildPartnershipLeadsPath({ status: f.key, orgType: orgTypeFilter, search })}
               >
                 {f.label}
               </Link>
             ))}
             <div className="filter-tab-divider" />
             {ORG_TYPE_FILTERS.map((f) => (
               <Link
                 key={f.key}
                 className={orgTypeFilter === f.key ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                 href={buildPartnershipLeadsPath({ status: statusFilter, orgType: f.key, search })}
               >
                 {f.label}
               </Link>
             ))}
           </div>

           {/* Search + Actions */}
           <div className="admin-toolbar-actions">
             <form className="admin-search-form" method="get">
               {statusFilter !== "all" && <input name="status" type="hidden" value={statusFilter} />}
               {orgTypeFilter !== "all" && <input name="orgType" type="hidden" value={orgTypeFilter} />}
               <span className="admin-search-icon" aria-hidden="true">⌕</span>
               <input
                 defaultValue={search}
                 name="search"
                 placeholder={t("admin.partnershipLeads.actions.search")}
                 type="search"
               />
               <button className="secondary-button" type="submit">{t("admin.partnershipLeads.actions.search")}</button>
             </form>

             <div className="admin-toolbar-right">
               <Link className="primary-button" href="/admin/partnership-leads/new">
                 {t("admin.partnershipLeads.actions.addLead")}
               </Link>
             </div>
          </div>

           {notice && (
             <p className={notice === "error" ? "form-error" : "form-success"}>
               {t(`admin.partnershipLeads.messages.${notice}`)}
             </p>
           )}
           {error && <p className="form-error">{t("admin.partnershipLeads.messages.error")}</p>}

           {(search || statusFilter !== "all" || orgTypeFilter !== "all") && (
             <p className="muted-note">
               {t("admin.partnershipLeads.actions.showingFiltered", { count: filteredPartnershipLeads.length, total: partnershipLeads.length })}
               <Link className="text-link" href="/admin/partnership-leads">
                 {t("admin.partnershipLeads.actions.clearFilters")}
               </Link>
             </p>
           )}
        </div>
      </article>

       {/* Partnership Leads List */}
       <AdminPartnershipLeadsList
         partnershipLeads={filteredPartnershipLeads}
         deleteAction={deleteAdminPartnershipLeadAction}
         sortBy={sortBy}
         sortDir={sortDir}
       />
    </DashboardShell>
  );
}