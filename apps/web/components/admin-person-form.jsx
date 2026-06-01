"use client";

import { useState, useTransition } from "react";
import { LogoCropUpload } from "@/components/admin/logo-crop-upload";

const SECTION_OPTIONS = [
  { value: "board",       label: "Board of Directors" },
  { value: "secretariat", label: "Secretariat" },
  { value: "research",    label: "Research Contributors (UCL)" },
];

export function PersonProfileForm({ action, person = null, defaultSection = "board" }) {
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(person?.is_active ?? true);
  const isEdit = Boolean(person?.id);

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    startTransition(() => action(fd));
  }

  return (
    <form className="person-form dashboard-card" onSubmit={handleSubmit}>
      {person?.id && <input name="person_id" type="hidden" value={person.id} />}
      <input name="is_active" type="hidden" value={String(isActive)} />

      {/* Photo */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Profile photo</h3>
          <p>Square crop · displayed on the About page and in admin. Max 5 MB.</p>
        </div>
        {/* Reuse LogoCropUpload at 1:1 aspect ratio for portrait photos */}
        <LogoCropUpload
          aspectRatio={1}
          currentLogoUrl={person?.photo_url || ""}
          maxOutputWidthPx={400}
          name="photo_file"
        />
      </div>

      {/* Identity */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Identity</h3>
        </div>
        <div className="form-grid-2">
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" htmlFor={`pf-name-${person?.id || "new"}`}>
              Full name <span className="form-required">*</span>
            </label>
            <input
              className="form-input"
              defaultValue={person?.full_name || ""}
              id={`pf-name-${person?.id || "new"}`}
              name="full_name"
              placeholder="Dr Jane Okonkwo"
              required
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`pf-title-${person?.id || "new"}`}>
              Title / role
            </label>
            <input
              className="form-input"
              defaultValue={person?.title || ""}
              id={`pf-title-${person?.id || "new"}`}
              name="title"
              placeholder="Co-Chair of the Board"
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`pf-org-${person?.id || "new"}`}>
              Organisation
            </label>
            <input
              className="form-input"
              defaultValue={person?.organisation || ""}
              id={`pf-org-${person?.id || "new"}`}
              name="organisation"
              placeholder="UCL Energy Institute"
              type="text"
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor={`pf-bio-${person?.id || "new"}`}>
            Biography
          </label>
          <textarea
            className="form-textarea"
            defaultValue={person?.bio || ""}
            id={`pf-bio-${person?.id || "new"}`}
            name="bio"
            placeholder="Short professional biography displayed on the About page…"
            rows={5}
          />
        </div>
      </div>

      {/* Contact & Social */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Contact &amp; social</h3>
          <p>Email is shown publicly on the About page if provided.</p>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor={`pf-email-${person?.id || "new"}`}>
              Email address
            </label>
            <input
              className="form-input"
              defaultValue={person?.email || ""}
              id={`pf-email-${person?.id || "new"}`}
              name="email"
              placeholder="jane@thepatna.org"
              type="email"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`pf-linkedin-${person?.id || "new"}`}>
              LinkedIn profile URL
            </label>
            <input
              className="form-input"
              defaultValue={person?.linkedin_url || ""}
              id={`pf-linkedin-${person?.id || "new"}`}
              name="linkedin_url"
              placeholder="https://linkedin.com/in/username"
              type="url"
            />
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="form-section">
        <div className="form-section-header">
          <h3>Classification &amp; display</h3>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-label" htmlFor={`pf-section-${person?.id || "new"}`}>
              Section <span className="form-required">*</span>
            </label>
            <select
              className="form-select"
              defaultValue={person?.section || defaultSection}
              id={`pf-section-${person?.id || "new"}`}
              name="section"
              required
            >
              {SECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor={`pf-order-${person?.id || "new"}`}>
              Display order
              <span className="form-label-optional"> (lower = first)</span>
            </label>
            <input
              className="form-input"
              defaultValue={person?.display_order ?? 0}
              id={`pf-order-${person?.id || "new"}`}
              min={0}
              name="display_order"
              type="number"
            />
          </div>
        </div>

        <label className="form-checkbox-label" style={{ marginTop: "0.75rem" }}>
          <input
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            type="checkbox"
          />
          <span>Show publicly on the About page</span>
        </label>
        {!isActive && (
          <p className="form-hint" style={{ marginTop: "0.35rem", color: "#d97706" }}>
            This profile is hidden from the website.
          </p>
        )}
      </div>

      <div className="form-actions-bar">
        <button className="primary-button" disabled={isPending} type="submit">
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add profile"}
        </button>
      </div>
    </form>
  );
}
