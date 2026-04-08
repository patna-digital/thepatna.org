"use client";

import { useCallback, useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  AFRICAN_COUNTRY_OPTIONS,
  getAfricanCountryNameByCode,
} from "@/lib/africa-countries";
import {
  PROJECT_FOOTPRINT_HUB_TYPES,
  PROJECT_TYPES,
  PROJECT_SECTIONS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_ICON_TYPES,
  generateProjectSlug,
} from "@/lib/projects";
import { CoverImageUpload } from "@/components/admin/cover-image-upload";

function createEmptyItem(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue || ""]));
}

function DynamicList({ label, name, initialValues = [], placeholder = "Enter value..." }) {
  const [items, setItems] = useState(initialValues.length ? initialValues : [""]);

  const add = () => setItems((prev) => [...prev, ""]);
  const remove = (index) => setItems((prev) => prev.filter((_, current) => current !== index));
  const update = (index, value) =>
    setItems((prev) => prev.map((item, current) => (current === index ? value : item)));

  return (
    <div className="form-field dynamic-list-field">
      <label className="form-label">{label}</label>
      {items.map((value, index) => (
        <div className="dynamic-list-row" key={index}>
          <input
            className="form-input"
            name={name}
            onChange={(e) => update(index, e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1 }}
            type="text"
            value={value}
          />
          {items.length > 1 ? (
            <button
              className="secondary-button"
              onClick={() => remove(index)}
              style={{ flexShrink: 0, padding: "0.35rem 0.75rem" }}
              type="button"
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}
      <button className="secondary-button" onClick={add} type="button">
        + Add {label.toLowerCase()}
      </button>
    </div>
  );
}

function StructuredListField({
  addLabel,
  fields,
  initialValues = [],
  label,
  note,
}) {
  const [items, setItems] = useState(
    initialValues.length ? initialValues : [createEmptyItem(fields)]
  );

  const add = () => setItems((prev) => [...prev, createEmptyItem(fields)]);
  const remove = (index) => setItems((prev) => prev.filter((_, current) => current !== index));
  const update = (index, nextValues) =>
    setItems((prev) =>
      prev.map((item, current) =>
        current === index ? { ...item, ...nextValues } : item
      )
    );

  return (
    <div className="form-field structured-list-field">
      <label className="form-label">{label}</label>
      {note ? <span className="form-hint">{note}</span> : null}
      <div className="structured-list-stack">
        {items.map((item, index) => (
          <div className="structured-list-card" key={index}>
            <div className="structured-list-grid">
              {fields.map((field) => (
                <div className="structured-list-input" key={field.name}>
                  <label className="form-label form-label-compact">{field.label}</label>
                  {field.options ? (
                    <select
                      className="form-input"
                      name={field.name}
                      onChange={(e) =>
                        update(index, {
                          [field.name]: e.target.value,
                          ...(typeof field.onSelect === "function" ? field.onSelect(e.target.value) : {}),
                        })
                      }
                      style={field.style}
                      value={item[field.name] || ""}
                    >
                      <option value="">{field.placeholder || "- Select -"}</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.multiline ? (
                    <textarea
                      className="form-input"
                      name={field.name}
                      onChange={(e) => update(index, { [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={field.rows || 3}
                      style={field.style}
                      value={item[field.name] || ""}
                    />
                  ) : (
                    <input
                      className="form-input"
                      name={field.name}
                      onChange={(e) => update(index, { [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      style={field.style}
                      type={field.type || "text"}
                      value={item[field.name] || ""}
                    />
                  )}
                </div>
              ))}
            </div>
            {Object.entries(item)
              .filter(([key]) => !fields.some((field) => field.name === key))
              .map(([key, value]) => (
                <input key={`${index}-${key}`} name={key} type="hidden" value={value || ""} />
              ))}
            {items.length > 1 ? (
              <button
                className="secondary-button"
                onClick={() => remove(index)}
                type="button"
              >
                Remove row
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={add} type="button">
        {addLabel}
      </button>
    </div>
  );
}

export function ProjectForm({ action, project, spaces = [], submitLabel = "Save project" }) {
  const isNew = !project;

  const [title, setTitle] = useState(project?.title || "");
  const [slug, setSlug] = useState(project?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const handleTitleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setTitle(value);
      if (!slugTouched) {
        setSlug(generateProjectSlug(value));
      }
    },
    [slugTouched]
  );

  const handleSlugChange = useCallback((e) => {
    setSlug(e.target.value);
    setSlugTouched(true);
  }, []);

  return (
    <form action={action}>
      {project?.id ? <input name="project_id" type="hidden" value={project.id} /> : null}

      <div className="form-stack">
        <div className="form-section">
          <h3 className="form-section-title">Identity</h3>

          <div className="form-field">
            <label className="form-label" htmlFor="title">
              Title *
            </label>
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
            {isNew ? (
              <span className="form-hint">
                Auto-generated from title. Only editable on creation.
              </span>
            ) : null}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="section">
                Section *
              </label>
              <select
                className="form-input"
                defaultValue={project?.section || "other"}
                id="section"
                name="section"
                required
              >
                {PROJECT_SECTIONS.map((section) => (
                  <option key={section.value} value={section.value}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="project_type">
                Project type
              </label>
              <select
                className="form-input"
                defaultValue={project?.project_type || ""}
                id="project_type"
                name="project_type"
              >
                <option value="">- Select -</option>
                {PROJECT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="status">
                Publish status *
              </label>
              <select
                className="form-input"
                defaultValue={project?.status || "draft"}
                id="status"
                name="status"
                required
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="status_label">
                Status label
              </label>
              <select
                className="form-input"
                defaultValue={project?.status_label || ""}
                id="status_label"
                name="status_label"
              >
                <option value="">- Select -</option>
                {PROJECT_STATUS_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="sort_order">
                Sort order
              </label>
              <input
                className="form-input"
                defaultValue={project?.sort_order ?? 0}
                id="sort_order"
                name="sort_order"
                style={{ maxWidth: "100px" }}
                type="number"
              />
              <span className="form-hint">
                Lower numbers appear first within each section.
              </span>
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

        <div className="form-section">
          <h3 className="form-section-title">Display metadata</h3>

          <div className="form-field">
            <label className="form-label" htmlFor="period_label">
              Period / Date label
            </label>
            <input
              className="form-input"
              defaultValue={project?.period_label || ""}
              id="period_label"
              name="period_label"
              placeholder="e.g. 2025 - ongoing or 1-2 March 2025 · Abuja, Nigeria"
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="partner_line">
              Partner line
            </label>
            <input
              className="form-input"
              defaultValue={project?.partner_line || ""}
              id="partner_line"
              name="partner_line"
              placeholder="e.g. In partnership with UCL Energy Institute"
              type="text"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="external_url">
              External URL
            </label>
            <input
              className="form-input"
              defaultValue={project?.external_url || ""}
              id="external_url"
              name="external_url"
              placeholder="https://thepatna.org/projects/..."
              type="url"
            />
            <span className="form-hint">
              Optional legacy or archive URL. Public cards still route to the internal PATNA page first.
            </span>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="icon_type">
                Card icon
              </label>
              <select
                className="form-input"
                defaultValue={project?.icon_type || ""}
                id="icon_type"
                name="icon_type"
              >
                <option value="">- None -</option>
                {PROJECT_ICON_TYPES.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </select>
              <span className="form-hint">Used on convening and other cards.</span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="linked_space_id">
                Linked community workspace
              </label>
              <select
                className="form-input"
                defaultValue={project?.linked_space_id || ""}
                id="linked_space_id"
                name="linked_space_id"
              >
                <option value="">- None -</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name} ({space.space_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <StructuredListField
            addLabel="+ Add highlight"
            fields={[
              {
                label: "Value",
                name: "highlight_value",
                placeholder: "e.g. 25+",
              },
              {
                label: "Label",
                name: "highlight_label",
                placeholder: "e.g. member states engaged",
              },
            ]}
            initialValues={(project?.highlights || []).map((item) => ({
              highlight_value: item.value || "",
              highlight_label: item.label || "",
            }))}
            label="Highlights"
            note="Shown as short stat cards on project pages and flagship cards."
          />
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Content</h3>

          <div className="form-field">
            <label className="form-label" htmlFor="summary">
              Summary
            </label>
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
            <label className="form-label">Body</label>
            <RichTextEditor
              defaultValue={project?.body || ""}
              name="body"
              placeholder="Write a concise, high-level project narrative with headings and lists where useful."
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

          <StructuredListField
            addLabel="+ Add resource"
            fields={[
              {
                label: "Title",
                name: "resource_title",
                placeholder: "Resource title",
              },
              {
                label: "URL",
                name: "resource_url",
                placeholder: "/publications or https://...",
                type: "text",
              },
              {
                label: "Type",
                name: "resource_type",
                placeholder: "e.g. Publication archive",
              },
            ]}
            initialValues={project?.project_resources || []}
            label="Resources"
            note="Internal links such as /publications are allowed."
          />

          <StructuredListField
            addLabel="+ Add country"
            fields={[
              {
                label: "Country",
                name: "country_code",
                onSelect: (value) => ({
                  country_name: getAfricanCountryNameByCode(value),
                }),
                options: AFRICAN_COUNTRY_OPTIONS,
                placeholder: "- Select country -",
              },
              {
                label: "Phase label",
                name: "country_phase_label",
                placeholder: "e.g. Phase II",
              },
              {
                label: "Sort order",
                name: "country_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
            ]}
            initialValues={(project?.project_countries || []).map((country, index) => ({
              country_code: country.country_code || "",
              country_name: country.country || "",
              country_phase_label: country.phase_label || "",
              country_sort_order: String(country.sort_order ?? index),
            }))}
            label="Countries engaged"
            note="Used on detail pages and the LEAP countries section."
          />

          <StructuredListField
            addLabel="+ Add footprint hub"
            fields={[
              {
                label: "Hub type",
                name: "hub_type",
                options: PROJECT_FOOTPRINT_HUB_TYPES.map((hubType) => ({
                  label: hubType.label,
                  value: hubType.value,
                })),
                placeholder: "- Select type -",
              },
              {
                label: "Label",
                name: "hub_label",
                placeholder: "e.g. PATNA Secretariat",
              },
              {
                label: "City",
                name: "hub_city",
                placeholder: "e.g. Victoria",
              },
              {
                label: "Country",
                name: "hub_country_code",
                options: AFRICAN_COUNTRY_OPTIONS,
                placeholder: "- Select country -",
              },
              {
                label: "Latitude",
                name: "hub_latitude",
                placeholder: "-4.6191",
                style: { maxWidth: "160px" },
                type: "number",
              },
              {
                label: "Longitude",
                name: "hub_longitude",
                placeholder: "55.4513",
                style: { maxWidth: "160px" },
                type: "number",
              },
              {
                label: "Phase label",
                name: "hub_phase_label",
                placeholder: "e.g. Phase III",
              },
              {
                label: "Related URL",
                name: "hub_related_url",
                placeholder: "/projects/leap-phase-ii or https://...",
              },
              {
                label: "Sort order",
                name: "hub_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
              {
                label: "Description",
                multiline: true,
                name: "hub_description",
                placeholder: "Short explanation of why this hub matters in the LEAP footprint.",
                rows: 3,
                style: { gridColumn: "1 / -1" },
              },
            ]}
            initialValues={(project?.project_footprint_hubs || []).map((hub, index) => ({
              hub_type: hub.hub_type || "",
              hub_label: hub.label || "",
              hub_city: hub.city || "",
              hub_country_code: hub.country_code || "",
              hub_latitude: String(hub.latitude ?? ""),
              hub_longitude: String(hub.longitude ?? ""),
              hub_phase_label: hub.phase_label || "",
              hub_related_url: hub.related_url || "",
              hub_sort_order: String(hub.sort_order ?? index),
              hub_description: hub.description || "",
            }))}
            label="Footprint hubs"
            note="These markers power the reusable Africa map and can represent convenings, partner anchors, or PATNA coordination nodes."
          />
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Cover image</h3>
          <CoverImageUpload
            currentAlt={project?.cover_image_alt || ""}
            currentUrl={project?.cover_image_url || ""}
          />
        </div>

        <div className="form-actions">
          <button className="primary-button" type="submit">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
