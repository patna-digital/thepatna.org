"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSpaceAction } from "../[spaceId]/actions";
import { formatSpaceType, formatSpaceVisibility } from "@/lib/spaces";

const VISIBILITY_CHIP = {
  public_members: "chip-success",
  invite_only:    "chip-warning",
  private:        "chip-muted",
};

const TYPE_CHIP = {
  cohort:        "chip-blue",
  constituency:  "chip-blue",
  working_group: "chip-neutral",
  geography:     "chip-neutral",
};

export function AdminSpacesList({ spaces }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This will remove all memberships. This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteSpaceAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete space");
      }
    });
  }

  if (spaces.length === 0) {
    return (
      <article className="dashboard-card app-list-card">
        <div className="app-row-empty">
          <strong>No spaces found</strong>
          <p>Get started by creating your first space, or adjust your filters.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="dashboard-card app-list-card">
      <div className="app-list">
        {spaces.map((space) => (
          <details key={space.id} className="app-row">
            <summary className="app-row-summary">
              <div className="app-row-primary">
                <div className="app-row-identity">
                  <strong>{space.name}</strong>
                  <span>{space.description?.slice(0, 120) || "No description"}{space.description?.length > 120 ? "..." : ""}</span>
                </div>
                <div className="app-row-signals">
                  <span className={`status-chip ${TYPE_CHIP[space.space_type] || "chip-neutral"}`}>
                    {formatSpaceType(space.space_type)}
                  </span>
                  <span className={`status-chip ${VISIBILITY_CHIP[space.visibility] || "chip-neutral"}`}>
                    {formatSpaceVisibility(space.visibility)}
                  </span>
                  <span className="status-chip chip-neutral">
                    {space.member_count} {space.member_count === 1 ? "member" : "members"}
                  </span>
                  <span className="app-row-expand-hint">Details</span>
                </div>
              </div>
              <div className="app-row-meta">
                {space.lead_name   && <span>Lead: {space.lead_name}</span>}
                {space.partner_org && <span>Partner: {space.partner_org}</span>}
                <span>Slug: {space.slug}</span>
              </div>
            </summary>

            <div className="app-row-detail">
              {/* Tags */}
              {space.tags?.length > 0 && (
                <div className="app-row-tag-section">
                  <span className="app-row-tag-label">Tags</span>
                  <div className="member-directory-tag-row">
                    {space.tags.map((tag) => (
                      <span className="status-chip chip-neutral" key={tag.slug}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="app-row-actions-row">
                <Link className="primary-button" href={`/admin/spaces/${space.id}`}>
                  Edit space
                </Link>
                <Link className="secondary-button" href={`/admin/spaces/${space.id}/members`}>
                  Manage members
                </Link>
                <button
                  className="secondary-button"
                  disabled={isPending}
                  onClick={() => handleDelete(space.id, space.name)}
                  style={{ color: "#b91c1c", borderColor: "#fca5a5" }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </details>
        ))}
      </div>
    </article>
  );
}
