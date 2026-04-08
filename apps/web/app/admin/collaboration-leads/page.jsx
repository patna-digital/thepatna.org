import Link from "next/link";
import { AdminCollaborationLeadsList } from "@/components/admin-collaboration-leads-list";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { buildCollaborationLeadSummary, fetchAdminCollaborationLeads, filterAdminCollaborationLeads } from "@/lib/collaboration-leads";
import { requireAdminContext } from "@/lib/supabase/access";
import { getTranslations } from "next-intl/server";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "in_discussion", label: "In Discussion" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "negotiation", label: "Negotiation" },
  { key: "agreed", label: "Agreed" },
  { key: "declined", label: "Declined" },
];

const COLLABORATION_TYPE_FILTERS = [
  { key: "all", label: "All Types" },
  { key: "research", label: "Research" },
  { key: "content", label: "Content" },
  { key: "events", label: "Events" },
  { key: "training", label: "Training" },
  { key: "advocacy", label: "Advocacy" },
  { key: "technical", label: "Technical Assistance" },
];

function getNoticeMessage(notice) {
  const messages = {
    saved: "Collaboration lead saved.",
    deleted: "Collaboration lead deleted.",
    error: "Operation failed. Please retry.",
  };
  return messages[notice] || "";
}

function buildCollaborationLeadsPath({ status, collabType, search }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (collabType && collabType !== "all") params.set("collabType", collabType);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/admin/collaboration-leads?${query}` : "/admin/collaboration-leads";
}

export default async function AdminCollaborationLeadsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations();

  const statusFilter = typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : "all";
  const collabTypeFilter = typeof resolvedSearchParams?.collabType === "string" ? resolvedSearchParams.collabType : "all";
  const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";

  const { collaborationLeads, error } = await fetchAdminCollaborationLeads({ supabase });
  const summary = buildCollaborationLeadSummary(collaborationLeads);
  const filteredCollaborationLeads = filterAdminCollaborationLeads(collaborationLeads, {
    status: statusFilter,
    collabType: collabTypeFilter,
    search,
  });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel={t("admin.brandLabel")}
      eyebrow={t("admin.eyebrow")}
      navItems={adminNav}
      spotlight={{
        label: t("admin.collaborationLeads.spotlightLabel"),
        title: t("admin.collaborationLeads.spotlightTitle"),
        body: t("admin.collaborationLeads.spotlightBody"),
      }}
      title={t("admin.collaborationLeads.title")}
      subtitle={t("admin.collaborationLeads.subtitle")}
    >
       {/* Summary stats */}
       <div className="summary-grid">
         <div className="summary-tile">
           <strong>{summary.total}</strong>
           <span>{t("admin.collaborationLeads.summary.total")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.new}</strong>
           <span>{t("admin.collaborationLeads.summary.new")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.inDiscussion}</strong>
           <span>{t("admin.collaborationLeads.summary.inDiscussion")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.agreed}</strong>
           <span>{t("admin.collaborationLeads.summary.agreed")}</span>
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
                 href={buildCollaborationLeadsPath({ status: f.key, collabType: collabTypeFilter, search })}
               >
                 {f.label}
               </Link>
             ))}
             <div className="filter-tab-divider" />
             {COLLABORATION_TYPE_FILTERS.map((f) => (
               <Link
                 key={f.key}
                 className={collabTypeFilter === f.key ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                 href={buildCollaborationLeadsPath({ status: statusFilter, collabType: f.key, search })}
               >
                 {f.label}
               </Link>
             ))}
           </div>

           {/* Search + Actions */}
           <div className="admin-toolbar-actions">
             <form className="admin-search-form" method="get">
               {statusFilter !== "all" && <input name="status" type="hidden" value={statusFilter} />}
               {collabTypeFilter !== "all" && <input name="collabType" type="hidden" value={collabTypeFilter} />}
               <span className="admin-search-icon" aria-hidden="true">⌕</span>
               <input
                 defaultValue={search}
                 name="search"
                 placeholder={t("admin.collaborationLeads.actions.search")}
                 type="search"
               />
               <button className="secondary-button" type="submit">{t("admin.collaborationLeads.actions.search")}</button>
             </form>

             <div className="admin-toolbar-right">
               <Link className="primary-button" href="/admin/collaboration-leads/new">
                 {t("admin.collaborationLeads.actions.addLead")}
               </Link>
             </div>
          </div>

           {notice && (
             <p className={notice === "error" ? "form-error" : "form-success"}>
               {t(`admin.collaborationLeads.messages.${notice}`)}
             </p>
           )}
           {error && <p className="form-error">{t("admin.collaborationLeads.messages.error")}</p>}

           {(search || statusFilter !== "all" || collabTypeFilter !== "all") && (
             <p className="muted-note">
               {t("admin.collaborationLeads.actions.showingFiltered", { count: filteredCollaborationLeads.length, total: collaborationLeads.length })}
               <Link className="text-link" href="/admin/collaboration-leads">
                 {t("admin.collaborationLeads.actions.clearFilters")}
               </Link>
             </p>
           )}
        </div>
      </article>

       {/* Collaboration Leads List */}
       <AdminCollaborationLeadsList collaborationLeads={filteredCollaborationLeads} />
    </DashboardShell>
  );
}