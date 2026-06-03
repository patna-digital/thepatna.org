"use client";

import { useRef, useState } from "react";
import { grantAdminRoleAction, revokeAdminRoleAction } from "../app/admin/admins/actions";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function AdminRow({ admin, currentUserId, isSuperAdmin }) {
  const isCurrentUser = admin.user_id === currentUserId;
  const isProtected = admin.is_super_admin || isCurrentUser;

  function renderActions() {
    if (!isSuperAdmin) return null;
    if (isProtected) {
      return (
        <span className="text-muted text-sm">
          {admin.is_super_admin ? "Protected" : "You"}
        </span>
      );
    }
    return (
      <form action={revokeAdminRoleAction}>
        <input type="hidden" name="user_id" value={admin.user_id} />
        <button
          className="btn btn-sm btn-danger-outline"
          type="submit"
          onClick={(e) => {
            if (!window.confirm(`Remove admin access for ${admin.email}?`)) {
              e.preventDefault();
            }
          }}
        >
          Remove
        </button>
      </form>
    );
  }

  return (
    <tr>
      <td>
        <div className="stack-row stack-row-sm">
          <span className="member-name">
            {[admin.first_name, admin.surname].filter(Boolean).join(" ") || "—"}
          </span>
          {admin.is_super_admin && (
            <span className="chip chip-warning">Super Admin</span>
          )}
        </div>
      </td>
      <td>{admin.email}</td>
      <td>{admin.role_title || "—"}</td>
      <td>{formatDate(admin.granted_at)}</td>
      {isSuperAdmin && <td>{renderActions()}</td>}
    </tr>
  );
}

export function AdminAdminsList({ admins, currentUserId, isSuperAdmin }) {
  const formRef = useRef(null);
  const [searchError, setSearchError] = useState("");

  function handleAddSubmit(e) {
    const email = e.currentTarget.elements.email?.value?.trim();
    if (!email || !email.includes("@")) {
      e.preventDefault();
      setSearchError("Enter a valid email address.");
    } else {
      setSearchError("");
    }
  }

  return (
    <div className="stack">
      {/* Add admin form — super admin only */}
      {isSuperAdmin ? (
        <article className="dashboard-card">
          <div className="stack">
            <div>
              <h3 className="card-heading">Add an admin</h3>
              <p className="text-muted">
                Enter an email address to grant administrator access. If the person doesn&apos;t have a PATNA account yet, they will receive an invitation email and admin access will be pre-granted for when they complete sign-up.
              </p>
            </div>
            <form
              action={grantAdminRoleAction}
              className="inline-form"
              onSubmit={handleAddSubmit}
              ref={formRef}
            >
              <input
                className="form-input"
                name="email"
                placeholder="Email address"
                type="email"
              />
              <button className="btn btn-primary" type="submit">
                Grant admin access
              </button>
            </form>
            {searchError && (
              <p className="form-error">{searchError}</p>
            )}
          </div>
        </article>
      ) : null}

      {/* Current admins table */}
      <article className="dashboard-card">
        <div className="stack">
          <h3 className="card-heading">Current admins</h3>
          {admins.length === 0 ? (
            <p className="empty-state">No admins found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Title</th>
                  <th>Admin since</th>
                  {isSuperAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <AdminRow
                    admin={admin}
                    currentUserId={currentUserId}
                    isSuperAdmin={isSuperAdmin}
                    key={admin.user_id}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </div>
  );
}
