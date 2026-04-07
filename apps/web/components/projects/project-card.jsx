import Link from "next/link";

const STATUS_CHIP = {
  Active:    "chip-success",
  Ongoing:   "chip-success",
  Completed: "chip-muted",
  Upcoming:  "chip-warning",
};

function ProjectIcon({ type }) {
  switch (type) {
    case "globe":
      return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    case "team":
      return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "layers":
      return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case "calendar":
      return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect height="18" rx="2" width="18" x="3" y="4" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case "chart":
      return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      );
    case "check":
      return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      );
    default:
      return (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export function ProjectCard({ project }) {
  const {
    title,
    summary,
    status_label,
    period_label,
    partner_line,
    external_url,
    slug,
    icon_type,
    tags = [],
    linked_space,
  } = project;

  const chipClass = STATUS_CHIP[status_label] || "chip-neutral";

  return (
    <article className="project-card project-card-rich">
      {/* Header row: title + icon */}
      <div className="project-card-rich-head">
        <h3 className="project-card-rich-title">{title}</h3>
        <div className="project-card-rich-icon">
          <ProjectIcon type={icon_type} />
        </div>
      </div>

      {/* Meta */}
      <div className="project-card-rich-meta">
        {status_label && (
          <span className={`status-chip ${chipClass}`}>{status_label}</span>
        )}
        {period_label && (
          <span className="project-card-rich-period">{period_label}</span>
        )}
      </div>

      {/* Summary */}
      {summary && <p className="project-card-rich-summary">{summary}</p>}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="project-card-rich-tags">
          {tags.map((tag, i) => (
            <span className="status-chip chip-neutral project-card-rich-tag" key={i}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="project-card-rich-footer">
        {partner_line && (
          <span className="project-card-rich-partner">{partner_line}</span>
        )}
        {linked_space && (
          <Link
            className="status-chip chip-neutral"
            href={`/app/spaces`}
            style={{ fontSize: "0.7rem" }}
          >
            {linked_space.name}
          </Link>
        )}
        {external_url && (
          <a
            className="project-card-rich-link"
            href={external_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            Read more →
          </a>
        )}
        {!external_url && slug && (
          <Link className="project-card-rich-link" href={`/projects/${slug}`}>
            View project →
          </Link>
        )}
      </div>
    </article>
  );
}
