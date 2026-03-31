"use client";

import Link from "next/link";
import { formatContentType } from "@/lib/insights";

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
  if (!publications || publications.length === 0) return null;

  return (
    <div className="publications-list-grid">
      {publications.map((pub) => {
        const pdfAttachment = pub.attachments?.find(
          (a) => a.file_type === "pdf" || a.file_url?.endsWith(".pdf")
        );

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
                    <span>{formatContentType(pub.content_type)}</span>
                  </div>
                )}
              </div>
            </Link>

            <div className="publication-list-card-body">
              <div className="publication-card-meta">
                <span
                  className={`status-chip ${TYPE_CHIP_CLASSES[pub.content_type] || "chip-neutral"}`}
                >
                  {formatContentType(pub.content_type)}
                </span>
                {pub.published_at && (
                  <time className="publication-card-date" dateTime={pub.published_at}>
                    {formatDate(pub.published_at)}
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
                    href={pdfAttachment.file_url}
                    rel="noreferrer"
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ↓ Download
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

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}
