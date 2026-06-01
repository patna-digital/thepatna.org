/**
 * GalleryManager — server component for managing gallery images on admin pages.
 *
 * Usage:
 *   <GalleryManager
 *     contentId={project.id}
 *     contentIdFieldName="project_id"
 *     galleryImages={galleryImages}
 *     addAction={addProjectGalleryImageAction}
 *     removeAction={removeProjectGalleryImageAction}
 *   />
 *
 * Server actions are passed as props from the parent page so this component
 * stays generic and reusable across projects, insights, and events.
 */
export function GalleryManager({
  contentId,
  contentIdFieldName,
  galleryImages = [],
  addAction,
  removeAction,
}) {
  return (
    <div className="gallery-manager">
      <h3 className="form-section-title">Gallery images</h3>

      {galleryImages.length > 0 ? (
        <div className="gallery-manager-grid">
          {galleryImages.map((image) => (
            <div className="gallery-manager-item" key={image.id}>
              <img
                alt={image.alt_text || ""}
                className="gallery-manager-img"
                src={image.image_url}
              />
              {image.caption ? (
                <p className="gallery-manager-caption">{image.caption}</p>
              ) : null}
              <form action={removeAction}>
                <input name="image_id" type="hidden" value={image.id} />
                <input name={contentIdFieldName} type="hidden" value={contentId} />
                <button className="secondary-button" style={{ fontSize: "0.75rem" }} type="submit">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p className="form-hint">No gallery images yet.</p>
      )}

      <details style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
          Add gallery image
        </summary>
        <form action={addAction} style={{ marginTop: "0.75rem" }} className="stack">
          <input name={contentIdFieldName} type="hidden" value={contentId} />
          <div className="form-field">
            <label className="form-label">Image file</label>
            <input
              accept="image/jpeg,image/png,image/webp"
              name="gallery_image_file"
              required
              type="file"
            />
            <span className="form-hint">JPEG, PNG, or WebP · max 10 MB</span>
          </div>
          <div className="form-field">
            <label className="form-label">Alt text</label>
            <input
              className="form-input"
              name="alt_text"
              placeholder="Describe the image for screen readers"
              type="text"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Caption (optional)</label>
            <input
              className="form-input"
              name="caption"
              placeholder="Short caption displayed below the image"
              type="text"
            />
          </div>
          <div>
            <button className="primary-button" type="submit">
              Upload image
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
