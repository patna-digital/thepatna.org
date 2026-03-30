"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  INSIGHT_CONTENT_TYPES,
  INSIGHT_STATUSES,
  INSIGHT_VISIBILITY,
  formatContentType,
  generateInsightSlug,
} from "@/lib/insights";

export function InsightForm({
  insight,
  tags,
  action,
  submitLabel = "Save insight",
  cancelHref = "/admin/insights",
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [slugPreview, setSlugPreview] = useState(insight?.slug || "");

  const isEdit = Boolean(insight?.id);

  function handleTitleChange(e) {
    const title = e.target.value;
    if (!isEdit) {
      setSlugPreview(generateInsightSlug(title));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.target);
    
    // Add slug if creating new
    if (!isEdit) {
      formData.set("slug", slugPreview);
    }

    const result = await action(formData);

    if (result?.ok === false) {
      setError(result.error);
      setIsPending(false);
    } else if (result?.ok === true) {
      // Update successful, refresh and redirect
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
            placeholder="Enter insight title"
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
            placeholder="Brief summary of the insight (shown in lists)"
            rows={3}
          />
        </div>

        {/* Body */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="body">Body Content</label>
          <textarea
            className="insight-form-body"
            defaultValue={insight?.body || ""}
            id="body"
            name="body"
            placeholder="Full content of the insight (supports markdown)"
            rows={12}
          />
          <p className="field-hint">Full content. Markdown formatting supported.</p>
        </div>
      </div>

      <div className="insight-form-actions">
        <button
          className="primary-button"
          disabled={isPending}
          type="submit"
        >
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
