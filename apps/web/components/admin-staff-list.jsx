"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { grantStaffRoleAction, revokeStaffRoleAction } from "@/app/admin/staff/actions";

function StatusChip({ staff }) {
  if (staff.todayLog?.isFlagged) {
    return <span className="chip chip-warning">Needs attention</span>;
  }

  if (staff.todayLog?.hasCheckedOut) {
    return <span className="chip chip-success">Checked out</span>;
  }

  if (staff.todayLog?.hasCheckedIn) {
    return <span className="chip chip-neutral">Checked in</span>;
  }

  return <span className="chip chip-muted">Not started</span>;
}

function StaffRow({ staff }) {
  return (
    <tr>
      <td>
        <Link href={`/admin/staff/${staff.id}`}>{staff.name || "—"}</Link>
      </td>
      <td>{staff.email}</td>
      <td>{staff.roleTitle || "—"}</td>
      <td>{staff.lineManagerName || "—"}</td>
      <td>
        <StatusChip staff={staff} />
      </td>
      <td>
        <form
          action={revokeStaffRoleAction}
          onSubmit={(event) => {
            if (!window.confirm(`Remove staff access for ${staff.email}?`)) {
              event.preventDefault();
            }
          }}
        >
          <input name="user_id" type="hidden" value={staff.id} />
          <button className="btn btn-sm btn-danger-outline" type="submit">
            Remove
          </button>
        </form>
      </td>
    </tr>
  );
}

export function AdminStaffList({ managers, staff }) {
  const formRef = useRef(null);
  const [formError, setFormError] = useState("");

  function handleAddSubmit(event) {
    const email = event.currentTarget.elements.email?.value?.trim();
    const lineManagerId = event.currentTarget.elements.line_manager_id?.value?.trim();

    if (!email || !email.includes("@")) {
      event.preventDefault();
      setFormError("Enter a valid email address.");
      return;
    }

    if (!lineManagerId) {
      event.preventDefault();
      setFormError("Select a line manager.");
      return;
    }

    setFormError("");
  }

  return (
    <div className="stack">
      <article className="dashboard-card">
        <div className="stack">
          <div>
            <h3 className="card-heading">Add staff</h3>
            <p className="text-muted">
              Enter the person&apos;s email and assign a line manager. If they don&apos;t have a PATNA account yet,
              they will receive an invitation email and staff access will be granted for when they complete sign-up.
            </p>
          </div>
          <form action={grantStaffRoleAction} className="inline-form" onSubmit={handleAddSubmit} ref={formRef}>
            <input className="form-input" name="email" placeholder="Email address" type="email" />
            <select className="form-input" name="line_manager_id" defaultValue="">
              <option disabled value="">
                Select line manager
              </option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit">
              Grant staff access
            </button>
          </form>
          {formError ? <p className="form-error">{formError}</p> : null}
        </div>
      </article>

      <article className="dashboard-card">
        <div className="stack">
          <h3 className="card-heading">Staff roster</h3>
          {staff.length === 0 ? (
            <p className="empty-state">No staff members yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Line manager</th>
                  <th>Today</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <StaffRow key={member.id} staff={member} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </div>
  );
}
