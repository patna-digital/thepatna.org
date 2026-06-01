"use client";

import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";

/**
 * ThreadCompose — form for creating a new thread in a space.
 */
export function ThreadCompose({ action, spaceId, spaceSlug }) {
  const router = useRouter();

  return (
    <form action={action}>
      <input name="spaceId" type="hidden" value={spaceId} />
      <input name="spaceSlug" type="hidden" value={spaceSlug} />

      <div className="form-field">
        <label className="form-label" htmlFor="thread-title">
          Title
        </label>
        <input
          autoFocus
          className="form-input"
          id="thread-title"
          maxLength={200}
          name="title"
          placeholder="What is this thread about?"
          required
          type="text"
        />
      </div>

      <div className="form-field" style={{ marginTop: "1.25rem" }}>
        <label className="form-label" htmlFor="thread-body">
          Body
        </label>
        <RichTextEditor
          name="body"
          placeholder="Share your question, update, or thoughts with this space…"
          required
        />
      </div>

      <div className="form-action-row" style={{ marginTop: "1.25rem" }}>
        <button className="primary-button" type="submit">Post thread</button>
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
