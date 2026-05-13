"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatContentType } from "@/lib/content-types";
import {
  findPrimaryPublicationAttachment,
  getPublicationAttachmentFileUrl,
} from "@/lib/publication-attachments";

const TYPE_CHIP_CLASSES = {
  report: "chip-neutral",
  brief: "chip-success",
  case_study: "chip-warning",
  article: "chip-muted",
  blog: "chip-muted",
  news: "chip-muted",
  event_output: "chip-neutral",
  workshop_proceedings: "chip-neutral",
};

export function MemberPublicationsList({ publications }) {
  const t = useTranslations();
  const locale = useLocale();

  if (!publications || publications.length === 0) return null;

  return (
    <div className="publications-list-grid">
      {publications.map((pub) => {
        const pdfAttachment = findPrimaryPublicationAttachment(pub.attachments);
        const downloadHref = getPublicationAttachmentFileUrl(pdfAttachment);

        return (
          <article key={pub.id} className="publication-list-card">
            <Link
              className="publication-list-card-image-link"
              href={`/app/publications/${pub.slug}`}
              tabIndex={-1}
              aria-hidden="true"
            >
              <div className="publication-list-card-image">
                {pub.cover_image_url ? (
                  <img
                    alt={pub.cover_image_alt || pub.title}
                    loading="lazy"
                    src={pub.cover_image_url}
                  />
                ) : (
                  <div className="publication-card-image-placeholder">
                    <span>{pub.contentTypeLabel || formatContentType(pub.content_type)}</span>
                  </div>
                )}
              </div>
            </Link>

            <div className="publication-list-card-body">
              <div className="publication-card-meta">
                <span
                  className={`status-chip ${TYPE_CHIP_CLASSES[pub.content_type] || "chip-neutral"}`}
                >
                  {pub.contentTypeLabel || formatContentType(pub.content_type)}
                </span>
                {pub.published_at && (
                  <time className="publication-card-date" dateTime={pub.published_at}>
                    {formatDate(pub.published_at, locale)}
                  </time>
                )}
              </div>

              <Link href={`/app/publications/${pub.slug}`}>
                <strong className="publication-list-card-title">{pub.title}</strong>
              </Link>

              {pub.summary && (
                <p className="publication-list-card-summary">{pub.summary}</p>
              )}

              <div className="publication-list-card-footer">
                {pub.tags?.slice(0, 3).map((tag) => (
                  <span className="status-chip chip-neutral" key={tag.slug}>
                    {tag.name}
                  </span>
                ))}
                {pdfAttachment && (
                  <a
                    className="publication-download-btn"
                    download
                    href={downloadHref}
                    rel="noreferrer"
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("publicationUi.download")}
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function formatDate(value, locale = "en") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}
