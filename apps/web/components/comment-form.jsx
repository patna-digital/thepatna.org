"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";

/**
 * CommentForm — collapsed reply prompt that expands to a full editor on click.
 * Feels like a social media comment box (Facebook / Reddit pattern).
 */
export function CommentForm({ action, threadId, spaceSlug, spaceId }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="comment-compose-area">
      {!expanded ? (
        <button
          className="reply-prompt"
          onClick={() => setExpanded(true)}
          type="button"
        >
          <span className="reply-prompt-avatar" aria-hidden="true">✎</span>
          <span>Write a reply…</span>
        </button>
      ) : (
        <form action={action} className="comment-compose-form">
          <input name="threadId" type="hidden" value={threadId} />
          <input name="spaceSlug" type="hidden" value={spaceSlug} />
          {spaceId && <input name="spaceId" type="hidden" value={spaceId} />}
          <RichTextEditor
            name="body"
            placeholder="Write your reply…"
            required
          />
          <div className="comment-compose-actions">
            <button className="primary-button" type="submit">Post reply</button>
            <button
              className="secondary-button"
              onClick={() => setExpanded(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
