"use client";

import Link from "next/link";

export function AdminPartnershipLeadsList({ partnershipLeads }) {
  if (partnershipLeads.length === 0) {
    return (
      <p className="empty-state">
        No partnership leads found.
      </p>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Organisation</th>
          <th>Contact</th>
          <th>Type</th>
          <th>Focus Areas</th>
          <th>Status</th>
          <th>Assigned To</th>
          <th>Value</th>
          <th>Actions</th>
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
                <span className="budget-range">{lead.budget_range}</span>
              ) : (
                "-"
              )}
            </td>
            <td className="actions-cell">
              <div className="action-buttons">
                <Link
                  href={`/admin/partnership-leads/${lead.id}`}
                  className="icon-button"
                  title="View details"
                >
                  👁️
                </Link>
                <Link
                  href={`/admin/partnership-leads/${lead.id}/edit`}
                  className="icon-button"
                  title="Edit lead"
                >
                  ✏️
                </Link>
                <form
                  action={"/admin/partnership-leads"}
                  method="POST"
                  style={{ display: "inline" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <button type="submit" className="icon-button" title="Delete lead">
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
