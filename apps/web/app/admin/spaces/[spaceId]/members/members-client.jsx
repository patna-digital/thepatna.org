"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ROLE_CHIP = {
  lead:      "chip-blue",
  moderator: "chip-warning",
  member:    "chip-neutral",
};

export function SpaceMembersClient({
  spaceId,
  spaceName,
  members,
  roles,
  eligibleProfiles,
  handleAdd,
  handleUpdateRole,
  handleRemove,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [roleErrors, setRoleErrors] = useState({});

  async function onAdd(e) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(false);
    const formData = new FormData(e.target);

    startTransition(async () => {
      const result = await handleAdd(formData);
      if (result.ok) {
        setAddSuccess(true);
        e.target.reset();
        router.refresh();
      } else {
        setAddError(result.error || "Failed to add member");
      }
    });
  }

  async function onUpdateRole(userId, e) {
    e.preventDefault();
    setRoleErrors((prev) => ({ ...prev, [userId]: null }));
    const formData = new FormData(e.target);

    startTransition(async () => {
      const result = await handleUpdateRole(formData);
      if (!result.ok) {
        setRoleErrors((prev) => ({ ...prev, [userId]: result.error || "Failed to update role" }));
      } else {
        router.refresh();
      }
    });
  }

  async function onRemove(userId, name) {
    if (!confirm(`Remove ${name} from "${spaceName}"?`)) return;

    startTransition(async () => {
      const result = await handleRemove(userId);
      if (!result.ok) {
        alert(result.error || "Failed to remove member");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="member-dashboard-stack">
      {/* Add member panel */}
      <article className="dashboard-card">
        <h3>Add member</h3>
        <form className="insight-form" onSubmit={onAdd} style={{ marginTop: "1rem" }}>
          {addError   && <p className="form-error">{addError}</p>}
          {addSuccess && <p className="form-success">Member added successfully.</p>}

          <div className="insight-form-grid">
            <div className="insight-form-field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="user_id">
                Member <span className="required">*</span>
              </label>
              {eligibleProfiles.length === 0 ? (
                <p className="muted-note">All active members are already in this space.</p>
              ) : (
                <select id="user_id" name="user_id" required>
                  <option value="">— Select a member —</option>
                  {eligibleProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.surname}
                      {p.organisation_name ? ` · ${p.organisation_name}` : ""}
                      {" "}({p.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="insight-form-field">
              <label htmlFor="add_role">Role</label>
              <select defaultValue="member" id="add_role" name="role">
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {eligibleProfiles.length > 0 && (
            <div className="insight-form-actions" style={{ marginTop: "1rem" }}>
              <button className="primary-button" disabled={isPending} type="submit">
                {isPending ? "Adding…" : "Add to space"}
              </button>
            </div>
          )}
        </form>
      </article>

      {/* Current members list */}
      <article className="dashboard-card app-list-card">
        <div className="member-section-heading" style={{ marginBottom: "0.75rem" }}>
          <div>
            <h3>Current members</h3>
            <p className="member-section-copy">
              {members.length} {members.length === 1 ? "member" : "members"} in this space
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="app-row-empty">
            <strong>No members yet</strong>
            <p>Add members using the form above.</p>
          </div>
        ) : (
          <div className="app-list">
            {members.map((m) => {
              const profile  = m.profile;
              const userId   = profile?.id;
              const fullName = profile ? `${profile.first_name || ""} ${profile.surname || ""}`.trim() : "Unknown";

              return (
                <div className="app-row" key={userId || fullName}>
                  <div className="app-row-summary" style={{ cursor: "default" }}>
                    <div className="app-row-primary">
                      <div className="app-row-identity">
                        <strong>{fullName}</strong>
                        <span>
                          {profile?.email}
                          {profile?.organisation_name ? ` · ${profile.organisation_name}` : ""}
                        </span>
                      </div>
                      <div className="app-row-signals">
                        <span className={`status-chip ${ROLE_CHIP[m.role] || "chip-neutral"}`}>
                          {m.role}
                        </span>
                        <span className="status-chip chip-neutral">
                          Joined {formatDate(m.joined_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline role update + remove */}
                  <div className="app-row-detail" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                    {roleErrors[userId] && (
                      <p className="form-error" style={{ width: "100%" }}>{roleErrors[userId]}</p>
                    )}
                    <form
                      onSubmit={(e) => onUpdateRole(userId, e)}
                      style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
                    >
                      <input name="user_id" type="hidden" value={userId} />
                      <select defaultValue={m.role} name="role" style={{ minWidth: "9rem" }}>
                        {roles.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button className="secondary-button" disabled={isPending} type="submit">
                        Update role
                      </button>
                    </form>

                    <button
                      className="secondary-button"
                      disabled={isPending}
                      onClick={() => onRemove(userId, fullName)}
                      style={{ color: "#b91c1c", borderColor: "#fca5a5" }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link className="secondary-button" href={`/admin/spaces/${spaceId}`}>
          ← Back to space
        </Link>
        <Link className="secondary-button" href="/admin/spaces">
          All spaces
        </Link>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}
