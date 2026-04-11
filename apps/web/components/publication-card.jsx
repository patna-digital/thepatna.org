import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { findPrimaryPublicationAttachment } from "@/lib/publication-attachments";

/**
 * PublicationCard — reusable card for publications across the marketing and community apps.
 *
 * Props:
 *  - publication: content_items row (title, slug, summary, content_type, published_at,
 *                 cover_image_url, cover_image_alt, attachments[])
 *  - href: link destination (defaults to /publications/{slug})
 *  - featured: render in featured variant (larger, highlighted)
 *  - showDownload: whether to show a download button when an attachment exists
 */
export async function PublicationCard({
  publication,
  href,
  featured = false,
  showDownload = true,
}) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const {
    title,
    slug,
    summary,
    content_type,
    published_at,
    cover_image_url,
    cover_image_alt,
    attachments = [],
  } = publication;

  const cardHref = href || `/publications/${slug}`;
  const pdfAttachment = findPrimaryPublicationAttachment(attachments);
  const typeLabel = publication.contentTypeLabel || CONTENT_TYPE_LABELS[content_type] || content_type;

  return (
    <article className={`publication-card${featured ? " publication-card-featured" : ""}`}>
      <Link className="publication-card-image-link" href={cardHref} tabIndex={-1} aria-hidden="true">
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
          <span className={`status-chip ${TYPE_CHIP_CLASS[content_type] || "chip-neutral"}`}>
            {typeLabel}
          </span>
          {published_at && (
            <time className="publication-card-date" dateTime={published_at}>
              {formatDate(published_at, locale)}
            </time>
          )}
        </div>

        <Link className="publication-card-title-link" href={cardHref}>
          <h3 className="publication-card-title">{title}</h3>
        </Link>

        {summary && (
          <p className="publication-card-summary">{summary}</p>
        )}

        <div className="publication-card-footer">
          <Link className="publication-card-read-link" href={cardHref}>
            {t("publicationUi.readMore")}
          </Link>
          {showDownload && pdfAttachment && (
            <a
              className="publication-download-btn"
              href={pdfAttachment.file_url}
              rel="noreferrer"
              target="_blank"
            >
              {t("publicationUi.download")}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * FeaturedPublicationCard — full-width hero card for the most recent/featured publication.
 */
export async function FeaturedPublicationCard({ publication, href }) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const {
    title,
    slug,
    summary,
    content_type,
    published_at,
    cover_image_url,
    cover_image_alt,
    attachments = [],
    tags = [],
  } = publication;

  const cardHref = href || `/publications/${slug}`;
  const pdfAttachment = findPrimaryPublicationAttachment(attachments);
  const typeLabel = publication.contentTypeLabel || CONTENT_TYPE_LABELS[content_type] || content_type;

  return (
    <article className="featured-publication-card">
      {cover_image_url && (
        <Link className="featured-publication-image-wrap" href={cardHref} tabIndex={-1} aria-hidden="true">
          <img
            alt={cover_image_alt || title}
            className="featured-publication-image"
            loading="eager"
            src={cover_image_url}
          />
        </Link>
      )}

      <div className="featured-publication-body">
        <div className="featured-publication-meta">
          <span className={`status-chip ${TYPE_CHIP_CLASS[content_type] || "chip-neutral"}`}>
            {typeLabel}
          </span>
          {published_at && (
            <time className="publication-card-date" dateTime={published_at}>
              {formatDate(published_at, locale)}
            </time>
          )}
          <span className="featured-label">{t("publicationUi.latest")}</span>
        </div>

        <Link href={cardHref}>
          <h2 className="featured-publication-title">{title}</h2>
        </Link>

        {summary && <p className="featured-publication-summary">{summary}</p>}

        {tags.length > 0 && (
          <div className="featured-publication-tags">
            {tags.slice(0, 4).map((tag) => (
              <span className="status-chip chip-neutral" key={tag.slug}>{tag.name}</span>
            ))}
          </div>
        )}

        <div className="featured-publication-actions">
          <Link className="primary-button" href={cardHref}>
            {t("publicationUi.readPublication")}
          </Link>
          {pdfAttachment && (
            <a
              className="secondary-button"
              download
              href={pdfAttachment.file_url}
              rel="noreferrer"
              target="_blank"
            >
              {t("publicationUi.downloadPdf")}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS = {
  report: "Report",
  brief: "Brief",
  case_study: "Case Study",
  article: "Article",
  blog: "Article",
  news: "News",
  event_output: "Event Output",
  learning_note: "Learning Note",
  workshop_proceedings: "Workshop Proceedings",
};

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

function formatDate(value, locale = "en") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}
