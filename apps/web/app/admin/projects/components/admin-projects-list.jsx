"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatProjectType, formatProjectSection } from "@/lib/projects";

const STATUS_CHIP = {
  published: "chip-success",
  draft:     "chip-neutral",
  archived:  "chip-muted",
};

const LABEL_CHIP = {
  Active:    "chip-success",
  Ongoing:   "chip-success",
  Completed: "chip-muted",
  Upcoming:  "chip-warning",
};

export function AdminProjectsList({ projects }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.title, p.summary, p.status_label, p.period_label, p.partner_line, p.section]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [projects, search]);

  return (
    <>
      {search ? (
        <p className="muted-note">
          Showing {filtered.length} of {projects.length} projects matching "{search}".
        </p>
      ) : null}

      <article className="dashboard-card app-list-card">
        {filtered.length ? (
          <div className="app-list">
            {filtered.map((project) => {
              const publishChip = STATUS_CHIP[project.status] || "chip-neutral";
              const labelChip   = LABEL_CHIP[project.status_label] || "chip-neutral";

              return (
                <details className="app-row" key={project.id}>
                  <summary className="app-row-summary">
                    <div className="app-row-primary">
                      <div className="app-row-identity">
                        <strong>{project.title}</strong>
                        {project.period_label ? <span>{project.period_label}</span> : null}
                      </div>
                      <div className="app-row-signals">
                        <span className="status-chip chip-neutral">
                          {formatProjectSection(project.section)}
                        </span>
                        {project.status_label && (
                          <span className={`status-chip ${labelChip}`}>{project.status_label}</span>
                        )}
                        <span className={`status-chip ${publishChip}`}>{project.status}</span>
                        <span className="app-row-expand-hint">Details</span>
                      </div>
                    </div>
                    <div className="app-row-meta">
                      {project.project_type && (
                        <span>{formatProjectType(project.project_type)}</span>
                      )}
                      {project.partner_line && <span>{project.partner_line}</span>}
                      <span>Order: {project.sort_order}</span>
                    </div>
                  </summary>

                  <div className="app-row-detail">
                    {project.summary ? (
                      <p className="app-row-detail-motivation">{project.summary}</p>
                    ) : null}

                    <div className="app-row-detail-grid">
                      <div className="app-row-detail-field">
                        <strong>Section</strong>
                        <p>{formatProjectSection(project.section)}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Type</strong>
                        <p>{formatProjectType(project.project_type) || "Not set"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Status label</strong>
                        <p>{project.status_label || "Not set"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Period</strong>
                        <p>{project.period_label || "Not set"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Deliverables</strong>
                        <p>{(project.deliverables || []).length} items</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Countries</strong>
                        <p>{(project.project_countries || []).length} countries</p>
                      </div>
                      {project.linked_space && (
                        <div className="app-row-detail-field">
                          <strong>Linked workspace</strong>
                          <p>{project.linked_space.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="app-row-actions">
                      <Link className="secondary-button" href={`/admin/projects/${project.id}`}>
                        Edit
                      </Link>
                      <Link
                        className="secondary-button"
                        href={`/projects/${project.slug}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View public ↗
                      </Link>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="app-row-empty">
            <strong>No projects found.</strong>
            <p>Try adjusting the filters or search, or add a new project.</p>
          </div>
        )}
      </article>
    </>
  );
}
