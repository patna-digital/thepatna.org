"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { sanitizeProseHtml } from "@/lib/threads";

/**
 * CommentList — flat list of replies with inline edit/delete for own comments.
 * Compact social-media-style: avatar, author, timestamp, body.
 */
export function CommentList({
  comments,
  currentUserId,
  spaceSlug,
  threadId,
  updateAction,
  deleteAction,
}) {
  if (comments.length === 0) return null;

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <CommentItem
          comment={comment}
          currentUserId={currentUserId}
          deleteAction={deleteAction}
          key={comment.id}
          spaceSlug={spaceSlug}
          threadId={threadId}
          updateAction={updateAction}
        />
      ))}
    </div>
  );
}

function CommentItem({ comment, currentUserId, spaceSlug, threadId, updateAction, deleteAction }) {
  const [editing, setEditing] = useState(false);
  const isOwn = comment.author?.id === currentUserId;
  const wasEdited =
    comment.updatedAt &&
    comment.createdAt &&
    new Date(comment.updatedAt) - new Date(comment.createdAt) > 5_000;

  return (
    <div className="comment-item">
      <div className="comment-item-avatar">
        <div className="thread-avatar thread-avatar-sm" aria-hidden="true">
          {comment.author?.initials || "?"}
        </div>
      </div>

      <div className="comment-item-body">
        <div className="comment-item-header">
          <span className="thread-author-name">{comment.author?.name}</span>
          <span className="thread-timestamp">
            {formatRelative(comment.createdAt)}
            {wasEdited && <span className="thread-edited-badge"> · edited</span>}
          </span>
          {isOwn && !editing && (
            <div className="comment-item-controls">
              <button className="thread-text-btn" onClick={() => setEditing(true)} type="button">Edit</button>
              <form action={deleteAction} style={{ display: "inline" }}>
                <input name="commentId" type="hidden" value={comment.id} />
                <input name="threadId" type="hidden" value={threadId} />
                <input name="spaceSlug" type="hidden" value={spaceSlug} />
                <button className="thread-text-btn thread-text-btn-danger" type="submit">Delete</button>
              </form>
            </div>
          )}
        </div>

        {editing ? (
          <form action={updateAction} className="comment-edit-form">
            <input name="commentId" type="hidden" value={comment.id} />
            <input name="threadId" type="hidden" value={threadId} />
            <input name="spaceSlug" type="hidden" value={spaceSlug} />
            <RichTextEditor defaultValue={comment.body} name="body" placeholder="Edit your reply…" required />
            <div className="comment-compose-actions" style={{ marginTop: "0.6rem" }}>
              <button className="primary-button" type="submit">Save</button>
              <button className="secondary-button" onClick={() => setEditing(false)} type="button">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="rte-prose comment-body" dangerouslySetInnerHTML={{ __html: sanitizeProseHtml(comment.body) }} />
        )}
      </div>
    </div>
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
