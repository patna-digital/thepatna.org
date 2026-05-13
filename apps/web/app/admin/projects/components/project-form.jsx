"use client";

import { useCallback, useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  AFRICAN_COUNTRY_OPTIONS,
  getAfricanCountryNameByCode,
} from "@/lib/africa-countries";
import {
  PROJECT_FOOTPRINT_HUB_TYPES,
  PROJECT_ACTIVITY_TYPES,
  PROJECT_CONTENT_RELATIONSHIP_TYPES,
  PROJECT_CONTRIBUTION_TYPES,
  PROJECT_EVENT_RELATIONSHIP_TYPES,
  PROJECT_ORGANIZATION_RELATIONSHIP_TYPES,
  PROJECT_TYPES,
  PROJECT_SECTIONS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_ICON_TYPES,
  PROJECT_WORKSTREAM_STATUSES,
  generateProjectSlug,
} from "@/lib/projects";
import { CoverImageUpload } from "@/components/admin/cover-image-upload";

function createEmptyItem(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue || ""]));
}

function memberLabel(member = {}) {
  const name = [member.first_name, member.surname].filter(Boolean).join(" ").trim();
  const role = [member.role_title, member.organisation_name].filter(Boolean).join(" · ");
  return [name || member.email, role].filter(Boolean).join(" — ");
}

function contentLabel(item = {}) {
  return [item.title, item.content_type, item.publish_status].filter(Boolean).join(" — ");
}

function eventLabel(event = {}) {
  return [event.title, event.display_date || event.starts_at, event.status].filter(Boolean).join(" — ");
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

const PROJECT_FORM_TABS = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "workstreams", label: "Workstreams" },
  { id: "activities", label: "Activities" },
  { id: "contributors", label: "Contributors" },
  { id: "partners", label: "Partners" },
  { id: "events", label: "Events" },
  { id: "publications", label: "Publications" },
  { id: "media", label: "Media" },
];

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

export function ProjectForm({
  action,
  project,
  relationOptions = {},
  spaces = [],
  submitLabel = "Save project",
}) {
  const isNew = !project;

  const [title, setTitle] = useState(project?.title || "");
  const [slug, setSlug] = useState(project?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [activeTab, setActiveTab] = useState("overview");
  const workstreamCodeById = new Map(
    (project?.project_workstreams || []).map((workstream) => [workstream.id, workstream.code || ""])
  );
  const tabPanelStyle = (tabId) => ({
    display: activeTab === tabId ? "block" : "none",
  });

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

  const organizations = relationOptions.organizations || [];
  const externalContributors = relationOptions.externalContributors || [];
  const members = relationOptions.members || [];
  const events = relationOptions.events || [];
  const publications = relationOptions.publications || [];

  return (
    <form action={action}>
      {project?.id ? <input name="project_id" type="hidden" value={project.id} /> : null}

      <div className="form-stack">
        <div
          aria-label="Project editor sections"
          role="tablist"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.25rem",
          }}
        >
          {PROJECT_FORM_TABS.map((tab) => (
            <button
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "primary-button" : "secondary-button"}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              style={{
                borderRadius: "8px",
                fontSize: "0.8rem",
                padding: "0.45rem 0.75rem",
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="form-section" style={tabPanelStyle("overview")}>
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
              <label className="form-label" htmlFor="short_title">
                Short title
              </label>
              <input
                className="form-input"
                defaultValue={project?.short_title || ""}
                id="short_title"
                name="short_title"
                placeholder="e.g. LEAP Phase III"
                type="text"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="project_code">
                Project code
              </label>
              <input
                className="form-input"
                defaultValue={project?.project_code || ""}
                id="project_code"
                name="project_code"
                placeholder="e.g. LEAP-III"
                type="text"
              />
            </div>
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

        <div className="form-section" style={tabPanelStyle("overview")}>
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

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="start_date">
                Start date
              </label>
              <input
                className="form-input"
                defaultValue={project?.start_date || ""}
                id="start_date"
                name="start_date"
                type="date"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="end_date">
                End date
              </label>
              <input
                className="form-input"
                defaultValue={project?.end_date || ""}
                id="end_date"
                name="end_date"
                type="date"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="geographic_scope">
              Geographic scope
            </label>
            <input
              className="form-input"
              defaultValue={project?.geographic_scope || ""}
              id="geographic_scope"
              name="geographic_scope"
              placeholder="e.g. Continental Africa with ACP+ exchange"
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

        <div className="form-section" style={tabPanelStyle("content")}>
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
                label: "Class",
                name: "country_class",
                options: ["A", "B", "C", "D", "E"].map((value) => ({ label: value, value })),
                placeholder: "-",
                style: { maxWidth: "120px" },
              },
              {
                label: "Engagement role",
                name: "country_engagement_role",
                placeholder: "e.g. trade-sensitive typology",
              },
              {
                label: "Priority focus",
                multiline: true,
                name: "country_priority_focus",
                placeholder: "e.g. Food-security-informed NZF design",
                rows: 2,
                style: { gridColumn: "1 / -1" },
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
              country_class: country.country_class || "",
              country_engagement_role: country.engagement_role || "",
              country_phase_label: country.phase_label || "",
              country_sort_order: String(country.sort_order ?? index),
              country_priority_focus: country.priority_focus || "",
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

        <div className="form-section" style={tabPanelStyle("workstreams")}>
          <h3 className="form-section-title">Workstreams</h3>
          <StructuredListField
            addLabel="+ Add workstream"
            fields={[
              { label: "Code", name: "workstream_code", placeholder: "WS1" },
              { label: "Title", name: "workstream_title", placeholder: "Continental Technical Coordination" },
              {
                label: "Status",
                name: "workstream_status",
                options: PROJECT_WORKSTREAM_STATUSES,
              },
              {
                label: "Sort order",
                name: "workstream_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
              { label: "Start", name: "workstream_starts_on", type: "date" },
              { label: "End", name: "workstream_ends_on", type: "date" },
              {
                label: "Summary",
                multiline: true,
                name: "workstream_summary",
                placeholder: "Short workstream description.",
                rows: 2,
                style: { gridColumn: "1 / -1" },
              },
              {
                label: "Objective",
                multiline: true,
                name: "workstream_objective",
                placeholder: "What this workstream is trying to achieve.",
                rows: 2,
                style: { gridColumn: "1 / -1" },
              },
              {
                label: "Methodology",
                multiline: true,
                name: "workstream_methodology",
                placeholder: "How the workstream is delivered.",
                rows: 2,
                style: { gridColumn: "1 / -1" },
              },
            ]}
            initialValues={(project?.project_workstreams || []).map((workstream, index) => ({
              workstream_code: workstream.code || "",
              workstream_ends_on: workstream.ends_on || "",
              workstream_methodology: workstream.methodology || "",
              workstream_objective: workstream.objective || "",
              workstream_sort_order: String(workstream.sort_order ?? index),
              workstream_starts_on: workstream.starts_on || "",
              workstream_status: workstream.status || "planned",
              workstream_summary: workstream.summary || "",
              workstream_title: workstream.title || "",
            }))}
            label="Project workstreams"
            note="Use stable codes such as WS1, WS2, WSA, or WSB so activities can reference them."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("activities")}>
          <h3 className="form-section-title">Activities</h3>
          <StructuredListField
            addLabel="+ Add activity"
            fields={[
              { label: "Code", name: "activity_code", placeholder: "NZF-MODULE-1" },
              { label: "Title", name: "activity_title", placeholder: "NZF Impact Assessment for Africa" },
              { label: "Workstream code", name: "activity_workstream_code", placeholder: "WS2" },
              { label: "Type", name: "activity_type", options: PROJECT_ACTIVITY_TYPES },
              { label: "Status", name: "activity_status", options: PROJECT_WORKSTREAM_STATUSES },
              { label: "Location", name: "activity_location", placeholder: "London, UK or virtual" },
              { label: "Starts", name: "activity_starts_at", type: "datetime-local" },
              { label: "Ends", name: "activity_ends_at", type: "datetime-local" },
              {
                label: "Sort order",
                name: "activity_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
              {
                label: "Summary",
                multiline: true,
                name: "activity_summary",
                placeholder: "Short activity description.",
                rows: 3,
                style: { gridColumn: "1 / -1" },
              },
            ]}
            initialValues={(project?.project_activities || []).map((activity, index) => ({
              activity_code: activity.code || "",
              activity_ends_at: toDatetimeLocal(activity.ends_at),
              activity_location: activity.location || "",
              activity_sort_order: String(activity.sort_order ?? index),
              activity_starts_at: toDatetimeLocal(activity.starts_at),
              activity_status: activity.status || "planned",
              activity_summary: activity.summary || "",
              activity_title: activity.title || "",
              activity_type: activity.activity_type || "other",
              activity_workstream_code:
                workstreamCodeById.get(activity.workstream_id) || "",
            }))}
            label="Project activities"
            note="Activities can represent research modules, convenings, negotiation support, milestones, or fellowship actions."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("contributors")}>
          <h3 className="form-section-title">Contributors</h3>
          <StructuredListField
            addLabel="+ Add contributor"
            fields={[
              {
                label: "Member contributor",
                name: "contribution_member_profile_id",
                options: members.map((member) => ({ label: memberLabel(member), value: member.id })),
                placeholder: "- Select member -",
              },
              {
                label: "Existing external contributor",
                name: "contribution_external_contributor_id",
                options: externalContributors.map((contributor) => ({
                  label: [contributor.name, contributor.role_title, contributor.organization_name].filter(Boolean).join(" — "),
                  value: contributor.id,
                })),
                placeholder: "- Select external -",
              },
              { label: "New external name", name: "contribution_external_name", placeholder: "Dr Jane Example" },
              { label: "External role title", name: "contribution_external_role_title", placeholder: "Technical lead" },
              { label: "External organisation", name: "contribution_external_organization_name", placeholder: "Institution name" },
              { label: "Contribution type", name: "contribution_type", options: PROJECT_CONTRIBUTION_TYPES },
              { label: "Role label", name: "contribution_role_label", placeholder: "Principal Investigator" },
              {
                label: "Sort order",
                name: "contribution_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
              {
                label: "Notes",
                multiline: true,
                name: "contribution_notes",
                placeholder: "Optional contributor context.",
                rows: 2,
                style: { gridColumn: "1 / -1" },
              },
            ]}
            initialValues={(project?.project_contributions || []).map((contribution, index) => ({
              contribution_external_contributor_id: contribution.external_contributor_id || "",
              contribution_external_name: "",
              contribution_external_organization_name: "",
              contribution_external_role_title: "",
              contribution_member_profile_id: contribution.member_profile_id || "",
              contribution_notes: contribution.notes || "",
              contribution_role_label: contribution.role_label || "",
              contribution_sort_order: String(contribution.sort_order ?? index),
              contribution_type: contribution.contribution_type || "other",
            }))}
            label="Member and external contributors"
            note="Choose either a member or an external contributor per row. New external people are created automatically."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("partners")}>
          <h3 className="form-section-title">Partners</h3>
          <StructuredListField
            addLabel="+ Add partner"
            fields={[
              {
                label: "Existing organization",
                name: "organization_id",
                options: organizations.map((organization) => ({
                  label: [organization.name, organization.acronym, organization.organization_type].filter(Boolean).join(" — "),
                  value: organization.id,
                })),
                placeholder: "- Select organization -",
              },
              { label: "New organization", name: "organization_name", placeholder: "Institution name" },
              {
                label: "New organization type",
                name: "organization_type",
                options: [
                  "government",
                  "intergovernmental",
                  "regional_body",
                  "research",
                  "university",
                  "ngo",
                  "funder",
                  "coalition",
                  "private_sector",
                  "other",
                ].map((value) => ({ label: value.replaceAll("_", " "), value })),
              },
              {
                label: "Relationship",
                name: "organization_relationship_type",
                options: PROJECT_ORGANIZATION_RELATIONSHIP_TYPES,
              },
              { label: "Display label", name: "organization_label", placeholder: "Research partner" },
              {
                label: "Sort order",
                name: "organization_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
              {
                label: "Notes",
                multiline: true,
                name: "organization_notes",
                placeholder: "Optional partner context.",
                rows: 2,
                style: { gridColumn: "1 / -1" },
              },
            ]}
            initialValues={(project?.project_organization_links || []).map((link, index) => ({
              organization_id: link.organization_id || "",
              organization_label: link.label || "",
              organization_name: "",
              organization_notes: link.notes || "",
              organization_relationship_type: link.relationship_type || "institutional_partner",
              organization_sort_order: String(link.sort_order ?? index),
              organization_type: link.organizations?.organization_type || "other",
            }))}
            label="Key institutional partners"
            note="Use organization records for funders, hosts, research partners, strategic partners, and implementing partners."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("events")}>
          <h3 className="form-section-title">Events</h3>
          <StructuredListField
            addLabel="+ Link event"
            fields={[
              {
                label: "Event",
                name: "event_link_id",
                options: events.map((event) => ({ label: eventLabel(event), value: event.id })),
                placeholder: "- Select event -",
              },
              { label: "Relationship", name: "event_relationship_type", options: PROJECT_EVENT_RELATIONSHIP_TYPES },
              { label: "Display label", name: "event_link_label", placeholder: "Dakar Maritime Decarbonisation Workshop" },
              {
                label: "Sort order",
                name: "event_link_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
              {
                label: "Notes",
                multiline: true,
                name: "event_link_notes",
                placeholder: "Optional event connection context.",
                rows: 2,
                style: { gridColumn: "1 / -1" },
              },
            ]}
            initialValues={(project?.project_event_links || []).map((link, index) => ({
              event_link_id: link.event_id || "",
              event_link_label: link.label || "",
              event_link_notes: link.notes || "",
              event_link_sort_order: String(link.sort_order ?? index),
              event_relationship_type: link.relationship_type || "participation",
            }))}
            label="Connected events"
            note="Link existing event records instead of repeating event details inside the project body."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("publications")}>
          <h3 className="form-section-title">Publications</h3>
          <StructuredListField
            addLabel="+ Link publication"
            fields={[
              {
                label: "Publication / insight",
                name: "content_link_id",
                options: publications.map((item) => ({ label: contentLabel(item), value: item.id })),
                placeholder: "- Select publication -",
              },
              { label: "Relationship", name: "content_relationship_type", options: PROJECT_CONTENT_RELATIONSHIP_TYPES },
              { label: "Display label", name: "content_link_label", placeholder: "NZF Impact Assessment for Africa" },
              {
                label: "Sort order",
                name: "content_link_sort_order",
                placeholder: "0",
                style: { maxWidth: "120px" },
                type: "number",
              },
              {
                label: "Notes",
                multiline: true,
                name: "content_link_notes",
                placeholder: "Optional publication connection context.",
                rows: 2,
                style: { gridColumn: "1 / -1" },
              },
            ]}
            initialValues={(project?.project_content_links || []).map((link, index) => ({
              content_link_id: link.content_id || "",
              content_link_label: link.label || "",
              content_link_notes: link.notes || "",
              content_link_sort_order: String(link.sort_order ?? index),
              content_relationship_type: link.relationship_type || "reference",
            }))}
            label="Connected reports, briefs, tools, and publications"
            note="Link existing content items so project pages can show the latest publication state and downloads."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("media")}>
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
