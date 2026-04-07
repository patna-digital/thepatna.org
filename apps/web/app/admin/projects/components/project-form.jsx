"use client";

import { useCallback, useState } from "react";
import {
  PROJECT_TYPES,
  PROJECT_SECTIONS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_ICON_TYPES,
  generateProjectSlug,
} from "@/lib/projects";

function DynamicList({ label, name, initialValues = [], placeholder = "Enter value…" }) {
  const [items, setItems] = useState(initialValues.length ? initialValues : [""]);

  const add = () => setItems((prev) => [...prev, ""]);
  const remove = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const update = (i, val) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? val : item)));

  return (
    <div className="form-field dynamic-list-field">
      <label className="form-label">{label}</label>
      {items.map((val, i) => (
        <div className="dynamic-list-row" key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <input
            className="form-input"
            name={name}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1 }}
            type="text"
            value={val}
          />
          {items.length > 1 && (
            <button
              className="secondary-button"
              onClick={() => remove(i)}
              style={{ flexShrink: 0, padding: "0.25rem 0.6rem" }}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button className="secondary-button" onClick={add} style={{ marginTop: "0.25rem" }} type="button">
        + Add {label.toLowerCase()}
      </button>
    </div>
  );
}

export function ProjectForm({ action, project, spaces = [], submitLabel = "Save project" }) {
  const isNew = !project;

  const [title, setTitle] = useState(project?.title || "");
  const [slug, setSlug] = useState(project?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const handleTitleChange = useCallback((e) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugTouched) {
      setSlug(generateProjectSlug(val));
    }
  }, [slugTouched]);

  const handleSlugChange = useCallback((e) => {
    setSlug(e.target.value);
    setSlugTouched(true);
  }, []);

  return (
    <form action={action}>
      {project?.id && <input name="project_id" type="hidden" value={project.id} />}

      <div className="form-stack">

        {/* Core identity */}
        <div className="form-section">
          <h3 className="form-section-title">Identity</h3>

          <div className="form-field">
            <label className="form-label" htmlFor="title">Title *</label>
            <input
              className="form-input"
              id="title"
              name="title"
              onChange={handleTitleChange}
              placeholder="Project title"
              required
              type="text"
              value={title}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="slug">
              Slug {isNew ? "(auto-derived from title)" : ""}
            </label>
            <input
              className="form-input"
              id="slug"
              name="slug"
              onChange={handleSlugChange}
              placeholder="project-slug"
              readOnly={!isNew}
              required
              type="text"
              value={slug}
            />
            {isNew && (
              <span className="form-hint">Auto-generated from title. Only editable on creation.</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="section">Section *</label>
              <select
                className="form-input"
                defaultValue={project?.section || "other"}
                id="section"
                name="section"
                required
              >
                {PROJECT_SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="project_type">Project type</label>
              <select
                className="form-input"
                defaultValue={project?.project_type || ""}
                id="project_type"
                name="project_type"
              >
                <option value="">— Select —</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="status">Publish status *</label>
              <select
                className="form-input"
                defaultValue={project?.status || "draft"}
                id="status"
                name="status"
                required
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="status_label">Status label</label>
              <select
                className="form-input"
                defaultValue={project?.status_label || ""}
                id="status_label"
                name="status_label"
              >
                <option value="">— Select —</option>
                {PROJECT_STATUS_LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="sort_order">Sort order</label>
              <input
                className="form-input"
                defaultValue={project?.sort_order ?? 0}
                id="sort_order"
                name="sort_order"
                style={{ maxWidth: "100px" }}
                type="number"
              />
              <span className="form-hint">Lower numbers appear first within each section.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="featured">
                <input
                  defaultChecked={project?.featured || false}
                  id="featured"
                  name="featured"
                  type="checkbox"
                  value="true"
                />
                {" "}Featured
              </label>
            </div>
          </div>
        </div>

        {/* Display metadata */}
        <div className="form-section">
          <h3 className="form-section-title">Display metadata</h3>

          <div className="form-field">
            <label className="form-label" htmlFor="period_label">Period / Date label</label>
            <input
              className="form-input"
              defaultValue={project?.period_label || ""}
              id="period_label"
              name="period_label"
              placeholder="e.g. 2025 – ongoing or 1–2 March 2025 · Abuja, Nigeria"
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="partner_line">Partner line</label>
            <input
              className="form-input"
              defaultValue={project?.partner_line || ""}
              id="partner_line"
              name="partner_line"
              placeholder="e.g. In partnership with UCL Energy Institute · Supported by MOWCA"
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="external_url">External URL</label>
            <input
              className="form-input"
              defaultValue={project?.external_url || ""}
              id="external_url"
              name="external_url"
              placeholder="https://thepatna.org/projects/..."
              type="url"
            />
            <span className="form-hint">If set, project cards link here instead of /projects/[slug].</span>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="icon_type">Card icon</label>
              <select
                className="form-input"
                defaultValue={project?.icon_type || ""}
                id="icon_type"
                name="icon_type"
              >
                <option value="">— None —</option>
                {PROJECT_ICON_TYPES.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
              <span className="form-hint">Used on convening/other section cards.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="linked_space_id">Linked community workspace</label>
              <select
                className="form-input"
                defaultValue={project?.linked_space_id || ""}
                id="linked_space_id"
                name="linked_space_id"
              >
                <option value="">— None —</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.space_type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="form-section">
          <h3 className="form-section-title">Content</h3>

          <div className="form-field">
            <label className="form-label" htmlFor="summary">Summary</label>
            <textarea
              className="form-input"
              defaultValue={project?.summary || ""}
              id="summary"
              name="summary"
              placeholder="One or two sentences describing this project."
              rows={3}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="body">Body</label>
            <textarea
              className="form-input"
              defaultValue={project?.body || ""}
              id="body"
              name="body"
              placeholder="Full project description (HTML supported)."
              rows={10}
            />
          </div>

          <DynamicList
            initialValues={project?.deliverables || []}
            label="Deliverables"
            name="deliverables"
            placeholder="e.g. Six national shipping GHG emissions inventories"
          />

          <DynamicList
            initialValues={project?.tags || []}
            label="Tags"
            name="tags"
            placeholder="e.g. Socioeconomic modelling"
          />
        </div>

        {/* Cover image */}
        <div className="form-section">
          <h3 className="form-section-title">Cover image</h3>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="cover_image_url">Image URL</label>
              <input
                className="form-input"
                defaultValue={project?.cover_image_url || ""}
                id="cover_image_url"
                name="cover_image_url"
                type="url"
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="cover_image_alt">Alt text</label>
              <input
                className="form-input"
                defaultValue={project?.cover_image_alt || ""}
                id="cover_image_alt"
                name="cover_image_alt"
                type="text"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button className="primary-button" type="submit">{submitLabel}</button>
        </div>
      </div>
    </form>
  );
}
