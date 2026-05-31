"use client";

import { useState, useTransition } from "react";
import { LogoCropUpload } from "@/components/admin/logo-crop-upload";

const PATHWAY_OPTIONS = [
  { value: "partnership",   label: "Institutional partnership" },
  { value: "collaboration", label: "Research / collaboration" },
  { value: "service",       label: "Service" },
];

const TYPE_OPTIONS = [
  { value: "",                 label: "— select type —" },
  { value: "intergovernmental",label: "Intergovernmental" },
  { value: "governmental",     label: "Governmental / public authority" },
  { value: "academic",         label: "Academic institution" },
  { value: "ngo",              label: "NGO / civil society" },
  { value: "industry",         label: "Industry / private sector" },
  { value: "institutional",    label: "Institutional (other)" },
];

const STATUS_OPTIONS = [
  { value: "active",   label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
];

export function PartnerForm({ action, partner = null }) {
  const [isPending, startTransition] = useTransition();
  const [isFeatured, setIsFeatured] = useState(partner?.is_featured ?? false);
  const isEdit = Boolean(partner?.id);

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    startTransition(() => action(fd));
  }

  return (
    <form className="partner-form dashboard-card" onSubmit={handleSubmit}>
      {partner?.id && <input name="partner_id" type="hidden" value={partner.id} />}

      {/* Logo */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Logo</h3>
          <p>Displayed in the partner directory, home page marquee, and project pages.</p>
        </div>
        <LogoCropUpload
          aspectRatio={3}
          currentLogoUrl={partner?.logo_url || ""}
          maxOutputWidthPx={600}
          name="logo_file"
        />
      </div>

      {/* Core fields */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Organisation details</h3>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="partner-name">
              Name <span className="form-required">*</span>
            </label>
            <input
              className="form-input"
              defaultValue={partner?.name || ""}
              id="partner-name"
              name="name"
              placeholder="African Union Commission"
              required
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="partner-country">Country / region</label>
            <input
              className="form-input"
              defaultValue={partner?.country || ""}
              id="partner-country"
              name="country"
              placeholder="e.g. Ethiopia · Pan-African"
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="partner-type">Organisation type</label>
            <select
              className="form-select"
              defaultValue={partner?.partnership_type || ""}
              id="partner-type"
              name="partnership_type"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="partner-website">Website</label>
            <input
              className="form-input"
              defaultValue={partner?.website_url || ""}
              id="partner-website"
              name="website_url"
              placeholder="https://example.org"
              type="url"
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="partner-description">Description</label>
          <textarea
            className="form-textarea"
            defaultValue={partner?.description || ""}
            id="partner-description"
            name="description"
            placeholder="Brief overview of the organisation and its relationship with PATNA."
            rows={4}
          />
        </div>
      </div>

      {/* Partnership classification */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Classification</h3>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor="partner-pathway">Pathway</label>
            <select
              className="form-select"
              defaultValue={partner?.pathway || "partnership"}
              id="partner-pathway"
              name="pathway"
            >
              {PATHWAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="partner-status">Status</label>
            <select
              className="form-select"
              defaultValue={partner?.status || "active"}
              id="partner-status"
              name="status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="form-checkbox-label">
          <input
            checked={isFeatured}
            name="is_featured"
            onChange={(e) => setIsFeatured(e.target.checked)}
            type="checkbox"
          />
          <span>Feature on home page (shown in partner marquee)</span>
        </label>
      </div>

      {/* Internal notes */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Internal notes</h3>
          <p>Not publicly visible.</p>
        </div>
        <div className="form-field">
          <textarea
            className="form-textarea"
            defaultValue={partner?.notes || ""}
            name="notes"
            placeholder="MOU signed date, relationship owner, renewal notes…"
            rows={3}
          />
        </div>
      </div>

      <div className="form-actions-bar">
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add partner"}
        </button>
      </div>
    </form>
  );
}
