import Link from "next/link";

const TYPE_CHIP_CLASS = {
  report: "chip-neutral",
  brief: "chip-success",
  case_study: "chip-warning",
  article: "chip-muted",
  blog: "chip-muted",
  news: "chip-muted",
  event_output: "chip-neutral",
  learning_note: "chip-neutral",
  workshop_proceedings: "chip-neutral",
};

export function PublicationArchiveCard({ publication, labels = {} }) {
  const {
    title,
    slug,
    summary,
    content_type,
    published_at,
    cover_image_url,
    cover_image_alt,
  } = publication;

  const href = `/publications/${slug}`;
  const typeLabel = publication.contentTypeLabel || content_type || "Publication";
  const chipClass = TYPE_CHIP_CLASS[content_type] || "chip-neutral";
  const dateLabel = published_at
    ? new Date(published_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <article className="publication-card">
      <Link
        aria-hidden="true"
        className="publication-card-image-link"
        href={href}
        tabIndex={-1}
      >
        <div className="publication-card-image">
          {cover_image_url ? (
            <img
              alt={cover_image_alt || title}
              loading="lazy"
              src={cover_image_url}
            />
          ) : (
            <div className="publication-card-image-placeholder">
              <span>{typeLabel}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="publication-card-body">
        <div className="publication-card-meta">
          <span className={`status-chip ${chipClass}`}>{typeLabel}</span>
          {dateLabel && (
            <time className="publication-card-date">{dateLabel}</time>
          )}
        </div>

        <Link className="publication-card-title-link" href={href}>
          <h3 className="publication-card-title">{title}</h3>
        </Link>

        {summary && (
          <p className="publication-card-summary">{summary}</p>
        )}

        <div className="publication-card-footer">
          <Link className="publication-card-read-link" href={href}>
            {labels.readMore || "Read more →"}
          </Link>
        </div>
      </div>
    </article>
  );
}
