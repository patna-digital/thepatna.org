"use client";

import { useState } from "react";

/**
 * Drop-in replacement for the plain URL inputs in admin forms.
 * Shows a preview of the current image. When a new file is selected, previews it
 * locally before upload. The actual upload happens when the parent form is submitted.
 *
 * Props:
 *   currentUrl  - existing image URL from DB (displayed as preview)
 *   currentAlt  - existing alt text
 */
export function CoverImageUpload({ currentUrl = "", currentAlt = "" }) {
  const [preview, setPreview] = useState(currentUrl);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  return (
    <div className="cover-image-upload">
      {preview ? (
        <div className="cover-image-preview">
          <img alt={currentAlt || "Cover image preview"} src={preview} />
        </div>
      ) : null}

      {/* Hidden input preserves the existing URL when no new file is chosen */}
      <input name="cover_image_url" type="hidden" value={currentUrl} />

      <div className="form-field">
        <label className="form-label" htmlFor="cover_image_file">
          Cover image
        </label>
        <input
          accept="image/jpeg,image/png,image/webp"
          id="cover_image_file"
          name="cover_image_file"
          onChange={handleFileChange}
          type="file"
        />
        <span className="form-hint">JPEG, PNG, or WebP · max 10 MB</span>
      </div>

      <div className="form-field" style={{ marginTop: "0.5rem" }}>
        <label className="form-label" htmlFor="cover_image_alt">
          Alt text
        </label>
        <input
          className="form-input"
          defaultValue={currentAlt}
          id="cover_image_alt"
          name="cover_image_alt"
          placeholder="Describe the image for screen readers"
          type="text"
        />
      </div>
    </div>
  );
}
