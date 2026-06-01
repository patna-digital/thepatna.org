import Link from "next/link";

/**
 * ThreadCard — a thread row in the space thread list.
 * Compact social feed style: title, author, timestamp, reply count.
 */
export function ThreadCard({ thread, href }) {
  const { title, excerpt, author, createdAt, commentCount } = thread;

  return (
    <Link className="thread-card-item" href={href}>
      <div className="thread-card-title">{title}</div>
      {excerpt && <p className="thread-card-excerpt">{excerpt}</p>}
      <div className="thread-card-meta">
        <div className="thread-card-who">
          <span className="thread-avatar thread-avatar-xs" aria-hidden="true">
            {author?.initials || "?"}
          </span>
          <span className="thread-card-author">{author?.name}</span>
          <span className="thread-meta-dot">·</span>
          <span className="thread-timestamp">{formatRelative(createdAt)}</span>
        </div>
        <span className="thread-card-reply-count">
          {commentCount} {commentCount === 1 ? "reply" : "replies"}
        </span>
      </div>
    </Link>
  );
}

function formatRelative(dateStr) {
  if (!dateStr) return "";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60) return `${Math.max(1, mins)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(dateStr));
}
