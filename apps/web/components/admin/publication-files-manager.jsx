export function PublicationFilesManager({
  addAction,
  attachments = [],
  contentId,
  removeAction,
  setPrimaryAction,
  slug,
}) {
  return (
    <div className="gallery-manager">
      <h3 className="form-section-title">Publication files</h3>

      {attachments.length > 0 ? (
        <div className="stack" style={{ gap: "0.75rem" }}>
          {attachments.map((attachment) => (
            <div className="dashboard-card" key={attachment.id} style={{ padding: "1rem" }}>
              <div className="stack" style={{ gap: "0.5rem" }}>
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="stack" style={{ gap: "0.25rem" }}>
                    <strong>{attachment.title}</strong>
                    <span className="field-hint">
                      {attachment.source_kind === "storage" ? "Managed storage" : "External link"}
                      {attachment.file_type ? ` · ${attachment.file_type}` : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {attachment.is_primary ? (
                      <span className="status-chip chip-success">Primary download</span>
                    ) : (
                      <span className="status-chip chip-neutral">Archive</span>
                    )}
                    <a className="secondary-button" href={attachment.file_url} rel="noreferrer" target="_blank">
                      Open file
                    </a>
                  </div>
                </div>

                {attachment.original_url && attachment.original_url !== attachment.file_url ? (
                  <a className="text-link" href={attachment.original_url} rel="noreferrer" target="_blank">
                    View original source
                  </a>
                ) : null}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {!attachment.is_primary ? (
                    <form action={setPrimaryAction}>
                      <input name="attachment_id" type="hidden" value={attachment.id} />
                      <input name="content_id" type="hidden" value={contentId} />
                      <input name="slug" type="hidden" value={slug} />
                      <button className="secondary-button" type="submit">
                        Make primary
                      </button>
                    </form>
                  ) : null}

                  <form action={removeAction}>
                    <input name="attachment_id" type="hidden" value={attachment.id} />
                    <input name="content_id" type="hidden" value={contentId} />
                    <input name="slug" type="hidden" value={slug} />
                    <button className="secondary-button" style={{ color: "#b91c1c", borderColor: "#fca5a5" }} type="submit">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="form-hint">No publication files yet.</p>
      )}

      <details style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
          Upload managed file
        </summary>
        <form action={addAction} className="stack" style={{ marginTop: "0.75rem" }}>
          <input name="content_id" type="hidden" value={contentId} />
          <input name="slug" type="hidden" value={slug} />
          <div className="form-field">
            <label className="form-label" htmlFor="attachment_file">
              File
            </label>
            <input id="attachment_file" name="attachment_file" required type="file" />
            <span className="form-hint">PDF, DOC, DOCX, JPG, PNG, or WebP · max 50 MB</span>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="attachment_title">
              Title
            </label>
            <input className="form-input" id="attachment_title" name="title" placeholder="2026 report PDF" type="text" />
          </div>
          <label className="insight-form-checkbox-label">
            <input name="is_primary" type="checkbox" value="true" />
            <span>Set as primary publication file</span>
          </label>
          <div>
            <button className="primary-button" type="submit">
              Upload file
            </button>
          </div>
        </form>
      </details>

      <details style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
          Add external document link
        </summary>
        <form action={addAction} className="stack" style={{ marginTop: "0.75rem" }}>
          <input name="content_id" type="hidden" value={contentId} />
          <input name="slug" type="hidden" value={slug} />
          <div className="form-field">
            <label className="form-label" htmlFor="external_file_url">
              External URL
            </label>
            <input
              className="form-input"
              id="external_file_url"
              name="external_file_url"
              placeholder="https://..."
              required
              type="url"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="external_title">
              Title
            </label>
            <input className="form-input" id="external_title" name="title" placeholder="Legacy report link" type="text" />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="external_file_type">
              File type
            </label>
            <input
              className="form-input"
              id="external_file_type"
              name="external_file_type"
              placeholder="application/pdf"
              type="text"
            />
          </div>
          <label className="insight-form-checkbox-label">
            <input name="is_primary" type="checkbox" value="true" />
            <span>Set as primary publication file</span>
          </label>
          <div>
            <button className="primary-button" type="submit">
              Save link
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
