"use client";

import Link from "next/link";
import { getTranslations } from "next-intl";

function formatDateLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default function AdminServiceRequestsList({ serviceRequests, t }) {
  if (serviceRequests.length === 0) {
    return (
      <p className="empty-state">
        {t("admin.serviceRequests.messages.emptyState")}
      </p>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>{t("admin.serviceRequests.table.headers.requester")}</th>
          <th>{t("admin.serviceRequests.table.headers.organisation")}</th>
          <th>{t("admin.serviceRequests.table.headers.type")}</th>
          <th>{t("admin.serviceRequests.table.headers.details")}</th>
          <th>{t("admin.serviceRequests.table.headers.status")}</th>
          <th>{t("admin.serviceRequests.table.headers.assigned")}</th>
          <th>{t("admin.serviceRequests.table.headers.created")}</th>
          <th>{t("admin.serviceRequests.table.headers.actions")}</th>
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
              {request.details}
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
                <Link
                  href={`/admin/service-requests/${request.id}`}
                  className="icon-button"
                  title={t("admin.serviceRequests.actions.viewDetails")}
                >
                  👁️
                </Link>
                <Link
                  href={`/admin/service-requests/${request.id}/edit`}
                  className="icon-button"
                  title={t("admin.serviceRequests.actions.editRequest")}
                >
                  ✏️
                </Link>
                <form
                  action={"/admin/service-requests"}
                  method="POST"
                  style={{ display: "inline" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    // This would trigger delete action in a real implementation
                  }}
                >
                  <input type="hidden" name="request_id" value={request.id} />
                  <button type="submit" className="icon-button" title={t("admin.serviceRequests.actions.deleteRequest")}>
                    🗑︭
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