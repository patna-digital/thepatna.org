"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function AdminPartnershipLeadsList({ partnershipLeads, deleteAction, sortBy = "created_at", sortDir = "desc" }) {
  const t = useTranslations("admin.partnershipLeads");

  if (partnershipLeads.length === 0) {
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
          <th><Link href={sortLink("organisation")} className="sort-header">{t("table.headers.organisation")}{sortIndicator("organisation")}</Link></th>
          <th>{t("table.headers.contact")}</th>
          <th><Link href={sortLink("org_type")} className="sort-header">{t("table.headers.type")}{sortIndicator("org_type")}</Link></th>
          <th>{t("table.headers.focusAreas")}</th>
          <th><Link href={sortLink("status")} className="sort-header">{t("table.headers.status")}{sortIndicator("status")}</Link></th>
          <th>{t("table.headers.assigned")}</th>
          <th>{t("table.headers.value")}</th>
          <th><Link href={sortLink("created_at")} className="sort-header">{t("table.headers.created")}{sortIndicator("created_at")}</Link></th>
          <th>{t("table.headers.actions")}</th>
        </tr>
      </thead>
      <tbody>
        {partnershipLeads.map((lead) => (
          <tr key={lead.id}>
            <td>
              <Link href={`/admin/partnership-leads/${lead.id}`}>
                {lead.organisation}
              </Link>
            </td>
            <td>
              <Link href={`/admin/partnership-leads/${lead.id}`}>
                {lead.name} ({lead.email})
              </Link>
            </td>
            <td>
              <span className={`status-tag status-${lead.org_type}`}>
                {lead.org_type.replace(/_/g, " ").toUpperCase()}
              </span>
            </td>
            <td>{lead.focus_areas || "-"}</td>
            <td>
              <span className={`status-tag status-${lead.status}`}>
                {lead.status.replace(/_/g, " ").toUpperCase()}
              </span>
            </td>
            <td>
              {lead.assigned_to_profile ? (
                <Link href={`/admin/members/${lead.assigned_to_profile.id}`}>
                  {lead.assigned_to_profile.first_name || lead.assigned_to_profile.email}
                </Link>
              ) : (
                "-"
              )}
            </td>
            <td>{lead.budget_range ? <span className="budget-range">{lead.budget_range}</span> : "-"}</td>
            <td>{formatDate(lead.created_at)}</td>
            <td className="actions-cell">
              <div className="action-buttons">
                <Link href={`/admin/partnership-leads/${lead.id}`} className="icon-button" title={t("actions.viewDetails")}>👁️</Link>
                <Link href={`/admin/partnership-leads/${lead.id}/edit`} className="icon-button" title={t("actions.editLead")}>✏️</Link>
                {deleteAction && (
                  <form action={deleteAction} style={{ display: "inline" }}>
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <button
                      type="submit"
                      className="icon-button"
                      title={t("actions.deleteLead")}
                      onClick={(e) => {
                        if (!window.confirm("Delete this partnership lead? This cannot be undone.")) {
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
