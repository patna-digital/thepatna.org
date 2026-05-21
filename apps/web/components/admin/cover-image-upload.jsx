"use client";

import { useState } from "react";

export function CoverImageUpload({ currentUrl = "", currentAlt = "" }) {
  const [preview, setPreview] = useState(currentUrl);
  const [fileName, setFileName] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
    }
  }

  return (
    <div className="cover-image-upload">
      {preview ? (
        <div className="cover-image-preview">
          <img alt={currentAlt || "Cover image preview"} src={preview} />
          <span className="form-hint" style={{ display: "block", marginTop: "0.35rem" }}>Cover image</span>
        </div>
      ) : null}

      <input name="cover_image_url" type="hidden" value={currentUrl} />

      <div className="form-field">
        <label className="form-label">Cover image</label>
        <div className="file-upload-row">
          <label className="file-upload-trigger">
            <span>{preview ? "Replace image" : "Choose file"}</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              name="cover_image_file"
              onChange={handleFileChange}
              type="file"
            />
          </label>
          {fileName ? (
            <span className="file-upload-name">{fileName}</span>
          ) : (
            <span className="file-upload-name">JPEG, PNG, or WebP · max 10 MB</span>
          )}
        </div>
      </div>

      <div className="form-field">
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
