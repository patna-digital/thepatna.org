"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SPACE_TYPES,
  SPACE_VISIBILITY,
  generateSpaceSlug,
} from "@/lib/space-types";

export function SpaceForm({
  space,
  tags,
  action,
  submitLabel = "Save space",
  cancelHref = "/admin/spaces",
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [slugPreview, setSlugPreview] = useState(space?.slug || "");

  const isEdit = Boolean(space?.id);

  function handleNameChange(e) {
    if (!isEdit) {
      setSlugPreview(generateSpaceSlug(e.target.value));
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
      router.push("/admin/spaces?notice=updated");
    }
  }

  // Group tags by category for display
  const tagsByCategory = (tags || []).reduce((acc, tag) => {
    const cat = tag.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {});

  const categoryLabels = {
    constituency: "Constituency",
    domain:       "Thematic / Domain",
    geography:    "Geography",
    process:      "Process / Forum",
    other:        "Other",
  };

  return (
    <form className="insight-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="insight-form-grid">
        {/* Name */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="name">
            Name <span className="required">*</span>
          </label>
          <input
            defaultValue={space?.name || ""}
            id="name"
            name="name"
            onChange={handleNameChange}
            placeholder="E.g. IMO Meeting Support"
            required
            type="text"
          />
          {!isEdit && slugPreview && (
            <p className="field-hint">Slug: {slugPreview}</p>
          )}
        </div>

        {/* Type */}
        <div className="insight-form-field">
          <label htmlFor="space_type">
            Type <span className="required">*</span>
          </label>
          <select
            defaultValue={space?.space_type || "working_group"}
            id="space_type"
            name="space_type"
            required
          >
            {SPACE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div className="insight-form-field">
          <label htmlFor="visibility">
            Visibility <span className="required">*</span>
          </label>
          <select
            defaultValue={space?.visibility || "invite_only"}
            id="visibility"
            name="visibility"
            required
          >
            {SPACE_VISIBILITY.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Lead name */}
        <div className="insight-form-field">
          <label htmlFor="lead_name">Lead name</label>
          <input
            defaultValue={space?.lead_name || ""}
            id="lead_name"
            name="lead_name"
            placeholder="E.g. Professor Wisdom Akpalu"
            type="text"
          />
        </div>

        {/* Partner org */}
        <div className="insight-form-field">
          <label htmlFor="partner_org">Partner organisation</label>
          <input
            defaultValue={space?.partner_org || ""}
            id="partner_org"
            name="partner_org"
            placeholder="E.g. UCL, African Union Commission"
            type="text"
          />
        </div>

        {/* Description */}
        <div className="insight-form-field insight-form-field-full">
          <label htmlFor="description">Description</label>
          <textarea
            defaultValue={space?.description || ""}
            id="description"
            name="description"
            placeholder="Brief description of this space's purpose and scope"
            rows={3}
          />
        </div>

        {/* Tags — grouped by category */}
        <div className="insight-form-field insight-form-field-full">
          <label>Tags</label>
          {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
            <div key={category} className="space-form-tag-group">
              <p className="field-hint" style={{ marginBottom: "0.4rem", fontWeight: 600 }}>
                {categoryLabels[category] || category}
              </p>
              <div className="insight-form-tags">
                {categoryTags.map((tag) => {
                  const isSelected = space?.tags?.some((t) => t.id === tag.id);
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
          ))}
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
