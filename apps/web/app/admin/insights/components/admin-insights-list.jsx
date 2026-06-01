"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatContentType, formatPublishStatus } from "@/lib/content-types";
import { getPublicationAttachmentFileUrl } from "@/lib/publication-attachments";
import { deleteInsightAction } from "../[insightId]/actions";

const STATUS_CHIP_CLASSES = {
  published: "chip-success",
  draft: "chip-warning",
  archived: "chip-muted",
};

export function AdminInsightsList({ insights }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this insight? This action cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteInsightAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete insight");
      }
    });
  }

  if (insights.length === 0) {
    return (
      <article className="dashboard-card app-list-card">
        <div className="app-row-empty">
          <strong>No insights found</strong>
          <p>
            {insights.length === 0 
              ? "Get started by adding your first insight." 
              : "No insights match your current filters."}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="dashboard-card app-list-card">
      <div className="app-list">
        {insights.map((insight) => (
          <details key={insight.id} className="app-row">
            <summary className="app-row-summary">
              <div className="app-row-primary">
                <div className="app-row-identity">
                  <strong>{insight.title}</strong>
                  <span>{insight.summary?.slice(0, 120) || "No summary provided"}{insight.summary?.length > 120 ? "..." : ""}</span>
                </div>
                <div className="app-row-signals">
                  <span className="status-chip chip-neutral">
                    {formatContentType(insight.content_type)}
                  </span>
                  <span className={`status-chip ${STATUS_CHIP_CLASSES[insight.publish_status] || "chip-neutral"}`}>
                    {formatPublishStatus(insight.publish_status)}
                  </span>
                  <span className="status-chip chip-neutral">
                    {insight.visibility}
                  </span>
                  {insight.needs_review && (
                    <span className="status-chip chip-warning" title="This publication has been flagged as needing review">
                      Needs review
                    </span>
                  )}
                  <span className="app-row-expand-hint">Details</span>
                </div>
              </div>
              <div className="app-row-meta">
                <span>Created: {formatDate(insight.created_at)}</span>
                <span>Updated: {formatDate(insight.updated_at)}</span>
                {insight.creator && (
                  <span>By: {insight.creator.email}</span>
                )}
              </div>
            </summary>

            <div className="app-row-detail">
              {/* Tags */}
              {insight.tags?.length > 0 && (
                <div className="app-row-tag-section">
                  <span className="app-row-tag-label">Tags</span>
                  <div className="member-directory-tag-row">
                    {insight.tags.map((tag) => (
                      <span className="status-chip chip-neutral" key={tag.slug}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {insight.attachments?.length > 0 && (
                <div className="app-row-tag-section">
                  <span className="app-row-tag-label">Attachments</span>
                  <div className="member-directory-tag-row">
                    {insight.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={getPublicationAttachmentFileUrl(attachment, { disposition: "inline" })}
                        target="_blank"
                        rel="noreferrer"
                        className="status-chip chip-neutral"
                      >
                        📎 {attachment.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="app-row-actions-row">
                <Link
                  className="primary-button"
                  href={`/admin/insights/${insight.id}`}
                >
                  Edit insight
                </Link>
                <Link
                  className="secondary-button"
                  href={`/app/publications/${insight.slug}`}
                  target="_blank"
                >
                  View in app
                </Link>
                <Link
                  className="secondary-button"
                  href={`/publications/${insight.slug}`}
                  target="_blank"
                >
                  View public
                </Link>
                <button
                  className="secondary-button"
                  disabled={isPending}
                  onClick={() => handleDelete(insight.id)}
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

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}
