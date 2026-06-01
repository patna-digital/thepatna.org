"use client";

import { useState, useTransition } from "react";
import { saveFeaturedPartnersAction } from "../actions";

const TYPE_LABEL = {
  partnership:   "Institutional",
  collaboration: "Research",
  service:       "Service",
};

export function FeaturedPartnersPicker({ partners }) {
  const [featured, setFeatured] = useState(
    () => new Set(partners.filter((p) => p.is_featured).map((p) => p.id))
  );
  const [notice, setNotice]       = useState(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id) {
    setFeatured((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setNotice(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    featured.forEach((id) => formData.append("featured_partner_ids", id));

    startTransition(async () => {
      const result = await saveFeaturedPartnersAction(formData);
      setNotice(result?.error ? "error" : "saved");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="featured-partners-picker">
      {notice === "saved" && (
        <div className="form-feedback-banner success" role="status" style={{ marginBottom: "1rem" }}>
          ✓ Featured partners saved.
        </div>
      )}
      {notice === "error" && (
        <div className="form-feedback-banner error" role="alert" style={{ marginBottom: "1rem" }}>
          ✕ Something went wrong. Please try again.
        </div>
      )}

      <div className="featured-partners-list">
        {partners.map((partner) => {
          const checked = featured.has(partner.id);
          return (
            <label
              key={partner.id}
              className={`featured-partner-row${checked ? " is-featured" : ""}`}
            >
              <input
                aria-label={`Feature ${partner.name}`}
                checked={checked}
                className="featured-partner-checkbox"
                onChange={() => toggle(partner.id)}
                type="checkbox"
              />
              <span className="featured-partner-name">{partner.name}</span>
              {partner.partnership_type && (
                <span className="status-chip chip-neutral">
                  {TYPE_LABEL[partner.partnership_type] || partner.partnership_type}
                </span>
              )}
              {checked && (
                <span className="status-chip chip-warning" aria-hidden="true">★ Featured</span>
              )}
            </label>
          );
        })}
      </div>

      <div className="featured-partners-footer">
        <span className="featured-partners-count">
          {featured.size} partner{featured.size !== 1 ? "s" : ""} featured
        </span>
        <button
          className="primary-button"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save featured partners"}
        </button>
      </div>
    </form>
  );
}
