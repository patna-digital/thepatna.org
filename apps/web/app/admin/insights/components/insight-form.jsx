"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  INSIGHT_CONTENT_TYPES,
  INSIGHT_STATUSES,
  INSIGHT_VISIBILITY,
  generateInsightSlug,
} from "@/lib/insights";
import { RichTextEditor } from "@/components/rich-text-editor";

export function InsightForm({
  insight,
  tags,
  action,
  submitLabel = "Save publication",
  cancelHref = "/admin/insights",
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [slugPreview, setSlugPreview] = useState(insight?.slug || "");

  const isEdit = Boolean(insight?.id);

  function handleTitleChange(e) {
    if (!isEdit) {
      setSlugPreview(generateInsightSlug(e.target.value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.target);
    if (!isEdit) {
      formData.set("slug", slugPreview);
    }

    const result = await action(formData);

    if (result?.ok === false) {
      setError(result.error);
      setIsPending(false);
    } else if (result?.ok === true) {
      router.refresh();
      router.push("/admin/insights?notice=updated");
    }
  }

  return (
    <form className="insight-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="insight-form-grid">
        {/* Title */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            defaultValue={insight?.title || ""}
            id="title"
            name="title"
            onChange={handleTitleChange}
            placeholder="Enter publication title"
            required
            type="text"
          />
          {!isEdit && slugPreview && (
            <p className="field-hint">URL slug: {slugPreview}</p>
          )}
        </div>

        {/* Content Type */}
        <div className="insight-form-field">
          <label htmlFor="content_type">
            Type <span className="required">*</span>
          </label>
          <select
            defaultValue={insight?.content_type || "report"}
            id="content_type"
            name="content_type"
            required
          >
            {INSIGHT_CONTENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="insight-form-field">
          <label htmlFor="publish_status">
            Status <span className="required">*</span>
          </label>
          <select
            defaultValue={insight?.publish_status || "draft"}
            id="publish_status"
            name="publish_status"
            required
          >
            {INSIGHT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div className="insight-form-field">
          <label htmlFor="visibility">
            Visibility <span className="required">*</span>
          </label>
          <select
            defaultValue={insight?.visibility || "members"}
            id="visibility"
            name="visibility"
            required
          >
            {INSIGHT_VISIBILITY.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Featured */}
        <div className="insight-form-field insight-form-field-full">
          <label className="insight-form-checkbox-label">
            <input
              defaultChecked={insight?.featured || false}
              name="featured"
              type="checkbox"
              value="true"
            />
            <span>Feature this publication (shown prominently across the platform)</span>
          </label>
        </div>

        {/* Cover Image URL */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="cover_image_url">Cover image URL</label>
          <input
            defaultValue={insight?.cover_image_url || ""}
            id="cover_image_url"
            name="cover_image_url"
            placeholder="https://… (use the Supabase storage URL)"
            type="url"
          />
          <p className="field-hint">
            Upload the image to <strong>publications/covers/</strong> in Supabase Storage and paste the public URL here.
          </p>
        </div>

        {/* Cover Image Alt */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="cover_image_alt">Cover image alt text</label>
          <input
            defaultValue={insight?.cover_image_alt || ""}
            id="cover_image_alt"
            name="cover_image_alt"
            placeholder="Descriptive alt text for the cover image"
            type="text"
          />
        </div>

        {/* Meta Description */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="meta_description">SEO description</label>
          <textarea
            defaultValue={insight?.meta_description || ""}
            id="meta_description"
            name="meta_description"
            placeholder="Short description for search engines and social sharing (150–250 characters)"
            rows={2}
          />
        </div>

        {/* Tags */}
        <div className="insight-form-field insight-form-field-full">
          <label>Tags</label>
          <div className="insight-form-tags">
            {tags?.map((tag) => {
              const isSelected = insight?.tags?.some((t) => t.slug === tag.slug);
              return (
                <label key={tag.id} className="insight-form-tag-option">
                  <input
                    defaultChecked={isSelected}
                    name="tag_ids"
                    type="checkbox"
                    value={tag.id}
                  />
                  <span className="status-chip chip-neutral">{tag.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="summary">Summary</label>
          <textarea
            defaultValue={insight?.summary || ""}
            id="summary"
            name="summary"
            placeholder="Brief summary shown in publication lists and cards"
            rows={3}
          />
        </div>

        {/* Body — Rich text */}
        <div className="insight-form-field insight-form-field-full">
          <label>Body content</label>
          <RichTextEditor
            defaultValue={insight?.body || ""}
            name="body"
            placeholder="Write the full content of this publication. Use the toolbar for headings, lists, bold, links, and blockquotes."
          />
        </div>
      </div>

      <div className="insight-form-actions">
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? (
            <>
              <span className="settings-spinner" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
        <Link className="secondary-button" href={cancelHref}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
