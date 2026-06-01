"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function AdminServiceRequestsList({ serviceRequests, deleteAction, sortBy = "created_at", sortDir = "desc" }) {
  const t = useTranslations("admin.serviceRequests");
  const locale = useLocale();

  function formatDateLabel(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  }

  if (serviceRequests.length === 0) {
    return <p className="empty-state">{t("messages.emptyState")}</p>;
  }

  function sortLink(col) {
    const newDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    params.set("sortBy", col);
    params.set("sortDir", newDir);
    return `?${params.toString()}`;
  }

  function sortIndicator(col) {
    if (sortBy !== col) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th><Link href={sortLink("requester_name")} className="sort-header">{t("table.headers.requester")}{sortIndicator("requester_name")}</Link></th>
          <th><Link href={sortLink("organisation")} className="sort-header">{t("table.headers.organisation")}{sortIndicator("organisation")}</Link></th>
          <th><Link href={sortLink("request_type")} className="sort-header">{t("table.headers.type")}{sortIndicator("request_type")}</Link></th>
          <th>{t("table.headers.details")}</th>
          <th><Link href={sortLink("status")} className="sort-header">{t("table.headers.status")}{sortIndicator("status")}</Link></th>
          <th>{t("table.headers.assigned")}</th>
          <th><Link href={sortLink("created_at")} className="sort-header">{t("table.headers.created")}{sortIndicator("created_at")}</Link></th>
          <th>{t("table.headers.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {serviceRequests.map((request) => (
          <tr key={request.id}>
            <td>
              <Link href={`/admin/service-requests/${request.id}`}>
                {request.requester_name}
              </Link>
            </td>
            <td>{request.organisation || "-"}</td>
            <td>
              <span className={`status-tag status-${request.request_type}`}>
                {request.request_type.replace(/_/g, " ").toUpperCase()}
              </span>
            </td>
            <td className="details-cell">
              {request.details ? (request.details.length > 100 ? request.details.substring(0, 100) + "..." : request.details) : "-"}
            </td>
            <td>
              <span className={`status-tag status-${request.status}`}>
                {request.status.replace(/_/g, " ").toUpperCase()}
              </span>
            </td>
            <td>
              {request.assigned_to_profile ? (
                <Link href={`/admin/members/${request.assigned_to_profile.id}`}>
                  {request.assigned_to_profile.first_name || request.assigned_to_profile.email}
                </Link>
              ) : (
                "-"
              )}
            </td>
            <td>{formatDateLabel(request.created_at)}</td>
            <td className="actions-cell">
              <div className="action-buttons">
                <Link href={`/admin/service-requests/${request.id}`} className="icon-button" title={t("actions.viewDetails")}>👁️</Link>
                <Link href={`/admin/service-requests/${request.id}/edit`} className="icon-button" title={t("actions.editRequest")}>✏️</Link>
                {deleteAction && (
                  <form action={deleteAction} style={{ display: "inline" }}>
                    <input type="hidden" name="request_id" value={request.id} />
                    <button
                      type="submit"
                      className="icon-button"
                      title={t("actions.deleteRequest")}
                      onClick={(e) => {
                        if (!window.confirm(t("messages.deleteConfirm"))) {
                          e.preventDefault();
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </form>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
