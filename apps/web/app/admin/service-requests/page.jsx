import Link from "next/link";
import { AdminServiceRequestsList } from "@/components/admin-service-requests-list";
import { DashboardShell } from "@/components/dashboard-shell";
import { buildServiceRequestSummary, fetchAdminServiceRequests, filterAdminServiceRequests } from "@/lib/service-requests";
import { requireAdminContext } from "@/lib/supabase/access";
import { getTranslations } from "next-intl/server";
import { deleteAdminServiceRequestAction } from "./actions";
import { getAdminNavWithPipelineBadges } from "@/lib/admin-pipeline-badges";

function buildServiceRequestsPath({ status, requestType, search }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (requestType && requestType !== "all") params.set("requestType", requestType);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/admin/service-requests?${query}` : "/admin/service-requests";
}

export default async function AdminServiceRequestsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations();

  const STATUS_FILTERS = [
    { key: "all", label: t("admin.serviceRequests.filters.status.all") },
    { key: "new", label: t("admin.serviceRequests.filters.status.new") },
    { key: "in_progress", label: t("admin.serviceRequests.filters.status.inProgress") },
    { key: "review", label: t("admin.serviceRequests.filters.status.review") },
    { key: "completed", label: t("admin.serviceRequests.filters.status.completed") },
    { key: "cancelled", label: t("admin.serviceRequests.filters.status.cancelled") },
  ];

  const REQUEST_TYPE_FILTERS = [
    { key: "all", label: t("admin.serviceRequests.filters.type.all") },
    { key: "technical", label: t("admin.serviceRequests.filters.type.technical") },
    { key: "research", label: t("admin.serviceRequests.filters.type.research") },
    { key: "content", label: t("admin.serviceRequests.filters.type.content") },
    { key: "events", label: t("admin.serviceRequests.filters.type.events") },
    { key: "partnership", label: t("admin.serviceRequests.filters.type.partnership") },
    { key: "training", label: t("admin.serviceRequests.filters.type.training") },
  ];

  const statusFilter = typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : "all";
  const requestTypeFilter = typeof resolvedSearchParams?.requestType === "string" ? resolvedSearchParams.requestType : "all";
  const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const sortBy = typeof resolvedSearchParams?.sortBy === "string" ? resolvedSearchParams.sortBy : "created_at";
  const sortDir = resolvedSearchParams?.sortDir === "asc" ? "asc" : "desc";

  const [{ serviceRequests, error }, navItems] = await Promise.all([
    fetchAdminServiceRequests({ supabase }),
    getAdminNavWithPipelineBadges(supabase),
  ]);
  const summary = buildServiceRequestSummary(serviceRequests);
  const filteredServiceRequests = filterAdminServiceRequests(serviceRequests, {
    status: statusFilter,
    requestType: requestTypeFilter,
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
        label: t("admin.serviceRequests.spotlightLabel"),
        title: t("admin.serviceRequests.spotlightTitle"),
        body: t("admin.serviceRequests.spotlightBody"),
      }}
      title={t("admin.serviceRequests.title")}
      subtitle={t("admin.serviceRequests.subtitle")}
    >
       {/* Summary stats */}
       <div className="summary-grid">
         <div className="summary-tile">
           <strong>{summary.total}</strong>
           <span>{t("admin.serviceRequests.summary.total")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.new}</strong>
           <span>{t("admin.serviceRequests.summary.new")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.inProgress}</strong>
           <span>{t("admin.serviceRequests.summary.inProgress")}</span>
         </div>
         <div className="summary-tile">
           <strong>{summary.completed}</strong>
           <span>{t("admin.serviceRequests.summary.completed")}</span>
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
                 href={buildServiceRequestsPath({ status: f.key, requestType: requestTypeFilter, search })}
               >
                 {f.label}
               </Link>
             ))}
             <div className="filter-tab-divider" />
             {REQUEST_TYPE_FILTERS.map((f) => (
               <Link
                 key={f.key}
                 className={requestTypeFilter === f.key ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                 href={buildServiceRequestsPath({ status: statusFilter, requestType: f.key, search })}
               >
                 {f.label}
               </Link>
             ))}
           </div>

           {/* Search + Actions */}
           <div className="admin-toolbar-actions">
             <form className="admin-search-form" method="get">
               {statusFilter !== "all" && <input name="status" type="hidden" value={statusFilter} />}
               {requestTypeFilter !== "all" && <input name="requestType" type="hidden" value={requestTypeFilter} />}
               <span className="admin-search-icon" aria-hidden="true">⌕</span>
               <input
                 defaultValue={search}
                 name="search"
                 placeholder={t("admin.serviceRequests.actions.search")}
                 type="search"
               />
               <button className="secondary-button" type="submit">{t("admin.serviceRequests.actions.search")}</button>
             </form>

             <div className="admin-toolbar-right">
               <Link className="primary-button" href="/admin/service-requests/new">
                 {t("admin.serviceRequests.actions.addRequest")}
               </Link>
             </div>
          </div>

           {notice && (
             <p className={notice === "error" ? "form-error" : "form-success"}>
               {t(`admin.serviceRequests.messages.${notice}`)}
             </p>
           )}
           {error && <p className="form-error">{t("admin.serviceRequests.messages.error")}</p>}

           {(search || statusFilter !== "all" || requestTypeFilter !== "all") && (
             <p className="muted-note">
               {t("admin.serviceRequests.actions.showingFiltered", { count: filteredServiceRequests.length, total: serviceRequests.length })}
               <Link className="text-link" href="/admin/service-requests">
                 {t("admin.serviceRequests.actions.clearFilters")}
               </Link>
             </p>
           )}
        </div>
      </article>

       {/* Service Requests List */}
       <AdminServiceRequestsList
         serviceRequests={filteredServiceRequests}
         deleteAction={deleteAdminServiceRequestAction}
         sortBy={sortBy}
         sortDir={sortDir}
       />
    </DashboardShell>
  );
}