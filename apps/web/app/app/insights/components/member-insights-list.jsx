"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { formatContentType } from "@/lib/content-types";

const TYPE_CHIP_CLASSES = {
  report: "chip-neutral",
  brief: "chip-success",
  case_study: "chip-warning",
  article: "chip-muted",
  workshop_proceedings: "chip-neutral",
};

export function MemberInsightsList({ insights }) {
  const locale = useLocale();

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="member-insight-list">
      {insights.map((insight) => (
        <Link
          key={insight.id}
          className="member-insight-row-link"
          href={`/app/insights/${insight.slug}`}
        >
          <article className="member-insight-row">
            <div className="member-insight-row-top">
              <span className={`status-chip ${TYPE_CHIP_CLASSES[insight.content_type] || "chip-neutral"}`}>
                {insight.contentTypeLabel || formatContentType(insight.content_type)}
              </span>
              <span className="member-insight-date">
                {formatDate(insight.published_at, locale)}
              </span>
            </div>
            <strong>{insight.title}</strong>
            <p>{insight.summary}</p>
            <div className="member-insight-row-footer">
              {insight.tags?.slice(0, 3).map((tag) => (
                <span className="status-chip chip-neutral" key={tag.slug}>
                  {tag.name}
                </span>
              ))}
              {insight.attachments?.length > 0 && (
                <span className="member-insight-attachment-indicator">📎</span>
              )}
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

function formatDate(value, locale = "en") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}
