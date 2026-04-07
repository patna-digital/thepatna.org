"use client";

import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";

/**
 * ThreadEditCompose — pre-populated form for editing an existing thread.
 */
export function ThreadEditCompose({ action, thread, threadId, spaceSlug }) {
  const router = useRouter();

  return (
    <form action={action}>
      <input name="threadId" type="hidden" value={threadId} />
      <input name="spaceSlug" type="hidden" value={spaceSlug} />

      <div className="form-field">
        <label className="form-label" htmlFor="thread-title">
          Title
        </label>
        <input
          autoFocus
          className="form-input"
          defaultValue={thread.title}
          id="thread-title"
          maxLength={200}
          name="title"
          required
          type="text"
        />
      </div>

      <div className="form-field" style={{ marginTop: "1.25rem" }}>
        <label className="form-label" htmlFor="thread-body">
          Body
        </label>
        <RichTextEditor
          defaultValue={thread.body}
          name="body"
          placeholder="Write the thread content…"
          required
        />
      </div>

      <div className="form-action-row" style={{ marginTop: "1.25rem" }}>
        <button className="primary-button" type="submit">Save changes</button>
        <button
          className="secondary-button"
          onClick={() => router.back()}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
