"use client";

import Link from "next/link";
import { getTranslations } from "next-intl";

function formatCurrency(value) {
  if (!value) return "";
  
  // Simple currency formatting - in a real app, you'd use a proper currency library
  const numValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  if (isNaN(numValue)) return value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numValue);
}

export default function AdminPartnershipLeadsList({ partnershipLeads, t }) {
  if (partnershipLeads.length === 0) {
    return (
      <p className="empty-state">
        {t("admin.partnershipLeads.messages.emptyState")}
      </p>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>{t("admin.partnershipLeads.table.headers.organisation")}</th>
          <th>{t("admin.partnershipLeads.table.headers.contact")}</th>
          <th>{t("admin.partnershipLeads.table.headers.type")}</th>
          <th>{t("admin.partnershipLeads.table.headers.focusAreas")}</th>
          <th>{t("admin.partnershipLeads.table.headers.status")}</th>
          <th>{t("admin.partnershipLeads.table.headers.assigned")}</th>
          <th>{t("admin.partnershipLeads.table.headers.value")}</th>
          <th>{t("admin.partnershipLeads.table.headers.actions")}</th>
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
            <td>
              {lead.budget_range ? (
                <span className="budget-range">{formatCurrency(lead.budget_range)}</span>
              ) : (
                "-"
              )}
            </td>
            <td className="actions-cell">
              <div className="action-buttons">
                <Link
                  href={`/admin/partnership-leads/${lead.id}`}
                  className="icon-button"
                  title={t("admin.partnershipLeads.actions.viewDetails")}
                >
                  👁️
                </Link>
                <Link
                  href={`/admin/partnership-leads/${lead.id}/edit`}
                  className="icon-button"
                  title={t("admin.partnershipLeads.actions.editLead")}
                >
                  ✏️
                </Link>
                <form
                  action={"/admin/partnership-leads"}
                  method="POST"
                  style={{ display: "inline" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    // This would trigger delete action in a real implementation
                  }}
                >
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <button type="submit" className="icon-button" title={t("admin.partnershipLeads.actions.deleteLead")}>
                    🗑️
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}