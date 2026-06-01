import { sanitizeProseHtml } from "@/lib/threads";

/**
 * ThreadDetail — renders the thread body with author attribution.
 * Styled like a social media post: compact author row, clean body.
 */
export function ThreadDetail({ thread }) {
  const { body, author, createdAt, updatedAt } = thread;
  const wasEdited =
    updatedAt && createdAt && new Date(updatedAt) - new Date(createdAt) > 5_000;

  return (
    <article className="thread-post-card">
      <div className="thread-post-author">
        <div className="thread-avatar thread-avatar-md" aria-hidden="true">
          {author?.initials || "?"}
        </div>
        <div className="thread-post-author-info">
          <span className="thread-author-name">{author?.name}</span>
          <span className="thread-timestamp">
            {formatDate(createdAt)}
            {wasEdited && <span className="thread-edited-badge"> · edited</span>}
          </span>
        </div>
      </div>

      <div
        className="rte-prose thread-body"
        dangerouslySetInnerHTML={{ __html: sanitizeProseHtml(body) }}
      />
    </article>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}
