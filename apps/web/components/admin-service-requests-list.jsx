"use client";

import Link from "next/link";

function formatDateLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function AdminServiceRequestsList({ serviceRequests }) {
  if (serviceRequests.length === 0) {
    return (
      <p className="empty-state">
        No service requests found.
      </p>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Requester</th>
          <th>Organisation</th>
          <th>Type</th>
          <th>Details</th>
          <th>Status</th>
          <th>Assigned To</th>
          <th>Created</th>
          <th>Actions</th>
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
                  title="View details"
                >
                  👁️
                </Link>
                <Link
                  href={`/admin/service-requests/${request.id}/edit`}
                  className="icon-button"
                  title="Edit request"
                >
                  ✏️
                </Link>
                <form
                  action={"/admin/service-requests"}
                  method="POST"
                  style={{ display: "inline" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <input type="hidden" name="request_id" value={request.id} />
                  <button type="submit" className="icon-button" title="Delete request">
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
