import Link from "next/link";
import { formatProjectType } from "@/lib/projects";

const STATUS_CHIP = {
  Active:    "chip-success",
  Ongoing:   "chip-success",
  Completed: "chip-muted",
  Upcoming:  "chip-warning",
};

export function FlagshipProjectCard({ project }) {
  const {
    title,
    summary,
    project_type,
    status_label,
    period_label,
    partner_line,
    external_url,
    slug,
    deliverables = [],
    tags = [],
    linked_space,
  } = project;

  const chipClass = STATUS_CHIP[status_label] || "chip-neutral";

  return (
    <article className="flagship-project-card">
      <div className="flagship-project-accent" />
      <div className="flagship-project-body">
        {/* Meta row */}
        <div className="flagship-project-meta">
          {project_type && (
            <span className="status-chip chip-neutral flagship-project-type">
              {formatProjectType(project_type)}
            </span>
          )}
          {status_label && (
            <span className={`status-chip ${chipClass}`}>{status_label}</span>
          )}
          {period_label && (
            <span className="flagship-project-period">{period_label}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="flagship-project-title">{title}</h3>

        {/* Summary */}
        {summary && <p className="flagship-project-summary">{summary}</p>}

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <div className="flagship-project-deliverables">
            <h4 className="flagship-project-deliverables-label">Key deliverables</h4>
            <ul className="flagship-project-deliverables-list">
              {deliverables.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flagship-project-tags">
            {tags.map((tag, i) => (
              <span className="flagship-project-tag" key={i}>{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flagship-project-footer">
          <div className="flagship-project-footer-left">
            {partner_line && (
              <span className="flagship-project-partner">{partner_line}</span>
            )}
            {linked_space && (
              <Link
                className="status-chip chip-neutral flagship-project-workspace-badge"
                href={`/app/spaces`}
              >
                Community workspace: {linked_space.name}
              </Link>
            )}
          </div>
          <div className="flagship-project-footer-right">
            {external_url ? (
              <a
                className="flagship-project-link"
                href={external_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Read project page →
              </a>
            ) : (
              <Link className="flagship-project-link" href={`/projects/${slug}`}>
                View project →
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
