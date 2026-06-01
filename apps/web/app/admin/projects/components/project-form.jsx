"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  CheckCircle2,
  Database,
  FileImage,
  Globe2,
  Layers3,
  Link2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  AFRICAN_COUNTRY_OPTIONS,
} from "@/lib/africa-countries";
import {
  getCountryNameByCodeFromOptions,
  resolveCountryOption,
  toCountryOptions,
} from "@/lib/countries";
import { buildPlaceOptionLabel } from "@/lib/place-lookup";
import { getSelectableParentProjects } from "@/lib/project-hierarchy";
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
} from "@/lib/project-config";
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
  return [item.title, item.content_type].filter(Boolean).join(" — ");
}

function eventLabel(event = {}) {
  let date = event.display_date;
  if (!date && event.starts_at) {
    try {
      date = new Date(event.starts_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      date = null;
    }
  }
  return [event.title, date].filter(Boolean).join(" — ");
}

function projectLabel(project = {}) {
  return [project.title, project.series_phase_label, project.status]
    .filter(Boolean)
    .join(" — ");
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

const PROJECT_FORM_TABS = [
  { icon: Database, id: "essentials", label: "Essentials" },
  { icon: BookOpenText, id: "story", label: "Story" },
  { icon: Globe2, id: "reach", label: "Reach" },
  { icon: Layers3, id: "delivery", label: "Delivery" },
  { icon: Link2, id: "relationships", label: "Relationships" },
  { icon: FileImage, id: "media", label: "Media" },
  { icon: CheckCircle2, id: "review", label: "Review" },
];

function countItems(items) {
  return Array.isArray(items) ? items.length : 0;
}

function getTabCount(project, tabId) {
  if (!project) return 0;

  const counts = {
    essentials: [
      project.section,
      project.project_type,
      project.status,
      project.status_label,
      project.period_label,
      project.parent_project_id,
      project.series_id,
      project.geographic_scope,
      project.partner_line,
    ].filter(Boolean).length,
    delivery:
      countItems(project.project_workstreams) +
      countItems(project.project_activities),
    media:
      (project.cover_image_url ? 1 : 0) +
      countItems(project.project_gallery),
    reach:
      countItems(project.project_countries) +
      countItems(project.project_footprint_hubs),
    relationships:
      countItems(project.project_contributions) +
      countItems(project.project_organization_links) +
      countItems(project.project_event_links) +
      countItems(project.project_content_links),
    story:
      [project.summary, project.body].filter(Boolean).length +
      countItems(project.deliverables) +
      countItems(project.tags) +
      countItems(project.highlights) +
      countItems(project.project_resources),
    review: 0,
  };

  return counts[tabId] || 0;
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
  onCountChange,
}) {
  const [items, setItems] = useState(
    initialValues.length ? initialValues : [createEmptyItem(fields)]
  );

  useEffect(() => { onCountChange?.(items.length); }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

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

const COUNTRY_CLASS_OPTIONS = [
  { value: "A", label: "A — High climate vulnerability (SIDS)" },
  { value: "B", label: "B — Development-constrained (LDC/LLDC)" },
  { value: "C", label: "C — Trade-sensitive economies" },
  { value: "D", label: "D — Hydrocarbon-dependent economies" },
  { value: "E", label: "E — Net food-importing states" },
];

function createEmptyCountryRow(index = 0) {
  return {
    country_class: "",
    country_code: "",
    country_engagement_role: "",
    country_name: "",
    country_phase_label: "",
    country_priority_focus: "",
    country_sort_order: String(index),
  };
}

function CountryBulkField({
  countryOptions = [],
  countryRecords = [],
  initialValues = [],
  onCountChange,
}) {
  const [items, setItems] = useState(
    initialValues.length ? initialValues : [createEmptyCountryRow(0)]
  );
  const [bulkText, setBulkText] = useState("");
  const [unresolved, setUnresolved] = useState([]);

  useEffect(() => { onCountChange?.(items.length); }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => setItems((prev) => [...prev, createEmptyCountryRow(prev.length)]);
  const remove = (index) => setItems((prev) => prev.filter((_, current) => current !== index));
  const update = (index, nextValues) =>
    setItems((prev) =>
      prev.map((item, current) =>
        current === index ? { ...item, ...nextValues } : item
      )
    );

  const resolveBulkCountries = () => {
    const tokens = bulkText
      .split(/[\n,;]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    const nextUnresolved = [];
    const existingCodes = new Set(items.map((item) => item.country_code).filter(Boolean));
    const nextItems = [...items.filter((item) => item.country_code || item.country_name)];

    for (const token of tokens) {
      const match = resolveCountryOption({ countries: countryRecords, name: token });
      if (!match) {
        nextUnresolved.push(token);
        continue;
      }

      if (existingCodes.has(match.code)) continue;

      existingCodes.add(match.code);
      nextItems.push({
        ...createEmptyCountryRow(nextItems.length),
        country_code: match.code,
        country_name: match.name,
        country_sort_order: String(nextItems.length),
      });
    }

    setItems(nextItems.length ? nextItems : [createEmptyCountryRow(0)]);
    setUnresolved(nextUnresolved);
    if (!nextUnresolved.length) setBulkText("");
  };

  return (
    <div className="form-field structured-list-field country-bulk-field">
      <label className="form-label">Countries engaged</label>
      <span className="form-hint">
        Paste a long list once, then refine phase, typology, and focus fields only where needed.
      </span>

      <div className="country-bulk-entry">
        <textarea
          className="form-input"
          onChange={(event) => setBulkText(event.target.value)}
          placeholder="Paste countries separated by commas or new lines"
          rows={3}
          value={bulkText}
        />
        <button className="secondary-button" onClick={resolveBulkCountries} type="button">
          Resolve countries
        </button>
      </div>

      {unresolved.length ? (
        <p className="form-error country-bulk-unresolved">
          Could not match: {unresolved.join(", ")}
        </p>
      ) : null}

      <div className="country-chip-stack">
        {items.map((item, index) => (
          <div className="country-editor-row" key={index}>
            <input name="country_name" type="hidden" value={item.country_name || ""} />
            <input name="country_place_id" type="hidden" value={item.country_place_id || ""} />

            <input name="country_sort_order" type="hidden" value={item.country_sort_order ?? index} />

            <div className="structured-list-grid">
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Country</label>
                <select
                  className="form-input"
                  name="country_code"
                  onChange={(event) => {
                    const countryName = getCountryNameByCodeFromOptions(
                      event.target.value,
                      countryRecords
                    );
                    update(index, {
                      country_code: event.target.value,
                      country_name: countryName,
                    });
                  }}
                  value={item.country_code || ""}
                >
                  <option value="">- Select country -</option>
                  {countryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="structured-list-input">
                <label className="form-label form-label-compact">Phase</label>
                <input
                  className="form-input"
                  name="country_phase_label"
                  onChange={(event) => update(index, { country_phase_label: event.target.value })}
                  placeholder="e.g. Phase II"
                  value={item.country_phase_label || ""}
                />
              </div>

              <div className="structured-list-input">
                <label className="form-label form-label-compact">Typology class</label>
                <select
                  className="form-input"
                  name="country_class"
                  onChange={(event) => update(index, { country_class: event.target.value })}
                  value={item.country_class || ""}
                >
                  <option value="">— None —</option>
                  {COUNTRY_CLASS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="structured-list-input" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label form-label-compact">Engagement role</label>
                <input
                  className="form-input"
                  name="country_engagement_role"
                  onChange={(event) =>
                    update(index, { country_engagement_role: event.target.value })
                  }
                  placeholder="e.g. trade-sensitive, coastal adaptation focus"
                  value={item.country_engagement_role || ""}
                />
              </div>

              <div className="structured-list-input" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label form-label-compact">Priority focus</label>
                <textarea
                  className="form-input"
                  name="country_priority_focus"
                  onChange={(event) =>
                    update(index, { country_priority_focus: event.target.value })
                  }
                  placeholder="Food-security-informed NZF design"
                  rows={2}
                  value={item.country_priority_focus || ""}
                />
              </div>
            </div>

            {items.length > 1 ? (
              <button
                aria-label="Remove country"
                className="icon-button country-remove-button"
                onClick={() => remove(index)}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <button className="secondary-button" onClick={add} type="button">
        + Add country
      </button>
    </div>
  );
}

function createEmptyHubRow(index = 0) {
  return {
    hub_city: "",
    hub_country_code: "",
    hub_description: "",
    hub_label: "",
    hub_latitude: "",
    hub_longitude: "",
    hub_phase_label: "",
    hub_place_address: "",
    hub_place_id: "",
    hub_place_name: "",
    hub_place_source: "",
    hub_place_source_id: "",
    hub_place_type: "",
    hub_related_url: "",
    hub_sort_order: String(index),
    hub_type: "convening",
    lookup_query: "",
  };
}

function FootprintHubField({
  countryOptions = [],
  places = [],
  initialValues = [],
  onCountChange,
}) {
  const [items, setItems] = useState(
    initialValues.length ? initialValues : [createEmptyHubRow(0)]
  );
  const [lookupState, setLookupState] = useState({});

  useEffect(() => { onCountChange?.(items.length); }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => setItems((prev) => [...prev, createEmptyHubRow(prev.length)]);
  const remove = (index) => setItems((prev) => prev.filter((_, current) => current !== index));
  const update = (index, nextValues) =>
    setItems((prev) =>
      prev.map((item, current) =>
        current === index ? { ...item, ...nextValues } : item
      )
    );

  const placesByCountry = useMemo(() => {
    const map = new Map();
    for (const place of places) {
      const code = place.country_code || "";
      if (!map.has(code)) map.set(code, []);
      map.get(code).push(place);
    }
    return map;
  }, [places]);

  const selectPlace = (index, place) => {
    update(index, {
      hub_city: place.locality || place.name || "",
      hub_country_code: place.country_code || "",
      hub_latitude: String(place.latitude ?? ""),
      hub_longitude: String(place.longitude ?? ""),
      hub_place_address: place.address || "",
      hub_place_id: place.id || "",
      hub_place_name: place.name || "",
      hub_place_source: place.source || "seed",
      hub_place_source_id: place.source_id || "",
      hub_place_type: place.place_type || "city",
    });
  };

  const lookupPlace = async (index) => {
    const row = items[index];
    const query = row.lookup_query || row.hub_city || row.hub_label;
    if (!query) return;
    if (!row.hub_country_code) {
      setLookupState((prev) => ({
        ...prev,
        [index]: {
          candidates: [],
          error: "Select a country before searching for a place.",
          loading: false,
        },
      }));
      return;
    }

    setLookupState((prev) => ({
      ...prev,
      [index]: { candidates: [], error: "", loading: true },
    }));

    try {
      const params = new URLSearchParams({
        countryCode: row.hub_country_code || "",
        q: query,
      });
      const response = await fetch(`/api/admin/places/lookup?${params.toString()}`);
      const data = await response.json();

      setLookupState((prev) => ({
        ...prev,
        [index]: {
          candidates: data.candidates || [],
          error: data.error || "",
          loading: false,
        },
      }));
    } catch {
      setLookupState((prev) => ({
        ...prev,
        [index]: {
          candidates: [],
          error: "Lookup failed. Use a saved place or the advanced override.",
          loading: false,
        },
      }));
    }
  };

  return (
    <div className="form-field structured-list-field hub-lookup-field">
      <label className="form-label">Footprint hubs</label>
      <span className="form-hint">
        Select a saved place or search by city/venue. Coordinates are filled automatically and kept editable only in advanced mode.
      </span>

      <div className="structured-list-stack">
        {items.map((item, index) => {
          const countryPlaces = item.hub_country_code
            ? placesByCountry.get(item.hub_country_code) || []
            : places;
          const state = lookupState[index] || {};
          const hasCoordinates = item.hub_latitude && item.hub_longitude;

          return (
            <div className="structured-list-card hub-editor-card" key={index}>
              <input name="hub_place_name" type="hidden" value={item.hub_place_name || ""} />
              <input name="hub_place_type" type="hidden" value={item.hub_place_type || ""} />
              <input name="hub_place_source" type="hidden" value={item.hub_place_source || ""} />
              <input name="hub_place_source_id" type="hidden" value={item.hub_place_source_id || ""} />
              <input name="hub_place_address" type="hidden" value={item.hub_place_address || ""} />

              {/* Row 1: type (fixed width) + label (expands) */}
              <div className="hub-identity-row">
                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Hub type</label>
                  <select
                    className="form-input"
                    name="hub_type"
                    onChange={(event) => update(index, { hub_type: event.target.value })}
                    value={item.hub_type || "convening"}
                  >
                    {PROJECT_FOOTPRINT_HUB_TYPES.map((hubType) => (
                      <option key={hubType.value} value={hubType.value}>
                        {hubType.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Label</label>
                  <input
                    className="form-input"
                    name="hub_label"
                    onChange={(event) => update(index, { hub_label: event.target.value })}
                    placeholder="Dakar Maritime Decarbonisation Workshop"
                    value={item.hub_label || ""}
                  />
                </div>
              </div>

              {/* Row 2: country + saved place */}
              <div className="structured-list-grid">
                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Country</label>
                  <select
                    className="form-input"
                    name="hub_country_code"
                    onChange={(event) =>
                      update(index, {
                        hub_country_code: event.target.value,
                        hub_place_id: "",
                      })
                    }
                    value={item.hub_country_code || ""}
                  >
                    <option value="">- Select country -</option>
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Saved place</label>
                  <select
                    className="form-input"
                    name="hub_place_id"
                    onChange={(event) => {
                      const place = places.find((candidate) => candidate.id === event.target.value);
                      update(index, { hub_place_id: event.target.value });
                      if (place) selectPlace(index, place);
                    }}
                    value={item.hub_place_id || ""}
                  >
                    <option value="">- Select saved place -</option>
                    {countryPlaces.map((place) => (
                      <option key={place.id} value={place.id}>
                        {buildPlaceOptionLabel(place)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="structured-list-input hub-search-input">
                  <label className="form-label form-label-compact">Find city or venue</label>
                  <div className="hub-search-row">
                    <input
                      className="form-input"
                      onChange={(event) => update(index, { lookup_query: event.target.value })}
                      placeholder="Search Dakar, Abuja, IMO London..."
                      type="search"
                      value={item.lookup_query || ""}
                    />
                    <button
                      aria-label="Search places"
                      className="secondary-button hub-search-button"
                      disabled={state.loading}
                      onClick={() => lookupPlace(index)}
                      type="button"
                    >
                      <Search aria-hidden="true" size={16} />
                    </button>
                  </div>
                </div>

                <div className="structured-list-input">
                  <label className="form-label form-label-compact">City / locality</label>
                  <input
                    className="form-input"
                    name="hub_city"
                    onChange={(event) => update(index, { hub_city: event.target.value })}
                    placeholder="Dakar"
                    value={item.hub_city || ""}
                  />
                </div>

                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Phase</label>
                  <input
                    className="form-input"
                    name="hub_phase_label"
                    onChange={(event) => update(index, { hub_phase_label: event.target.value })}
                    placeholder="Phase II"
                    value={item.hub_phase_label || ""}
                  />
                </div>

                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Related URL</label>
                  <input
                    className="form-input"
                    name="hub_related_url"
                    onChange={(event) => update(index, { hub_related_url: event.target.value })}
                    placeholder="/projects/leap-phase-ii"
                    value={item.hub_related_url || ""}
                  />
                </div>

                <div className="structured-list-input hub-description-input">
                  <label className="form-label form-label-compact">Description</label>
                  <textarea
                    className="form-input"
                    name="hub_description"
                    onChange={(event) => update(index, { hub_description: event.target.value })}
                    placeholder="Why this hub matters in the LEAP footprint."
                    rows={3}
                    value={item.hub_description || ""}
                  />
                </div>
              </div>

              {state.error ? <p className="form-error">{state.error}</p> : null}
              {state.candidates?.length ? (
                <div className="hub-candidate-list">
                  {state.candidates.map((candidate) => (
                    <button
                      className="hub-candidate-button"
                      key={`${candidate.source_id}-${candidate.latitude}-${candidate.longitude}`}
                      onClick={() => selectPlace(index, candidate)}
                      type="button"
                    >
                      <MapPin aria-hidden="true" size={15} />
                      <span>{candidate.label || candidate.address || candidate.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className={hasCoordinates ? "hub-preview is-ready" : "hub-preview"}>
                <MapPin aria-hidden="true" size={16} />
                {hasCoordinates ? (
                  <span>
                    Map point ready: {item.hub_latitude}, {item.hub_longitude}
                    {" · "}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${item.hub_latitude}&mlon=${item.hub_longitude}#map=8/${item.hub_latitude}/${item.hub_longitude}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open preview
                    </a>
                  </span>
                ) : (
                  <span>Select or search for a place to generate the map point.</span>
                )}
              </div>

              <details className="hub-advanced-fields">
                <summary>Advanced options</summary>
                <div className="form-row" style={{ marginTop: "0.75rem" }}>
                  <div className="form-field">
                    <label className="form-label form-label-compact">Sort order</label>
                    <input
                      className="form-input"
                      name="hub_sort_order"
                      onChange={(event) => update(index, { hub_sort_order: event.target.value })}
                      style={{ maxWidth: "100px" }}
                      type="number"
                      value={item.hub_sort_order ?? index}
                    />
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: "0.75rem" }}>
                  <div className="form-field">
                    <label className="form-label form-label-compact">Latitude override</label>
                    <input
                      className="form-input"
                      name="hub_latitude"
                      onChange={(event) => update(index, { hub_latitude: event.target.value })}
                      placeholder="-4.6191"
                      step="any"
                      type="number"
                      value={item.hub_latitude || ""}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label form-label-compact">Longitude override</label>
                    <input
                      className="form-input"
                      name="hub_longitude"
                      onChange={(event) => update(index, { hub_longitude: event.target.value })}
                      placeholder="55.4513"
                      step="any"
                      type="number"
                      value={item.hub_longitude || ""}
                    />
                  </div>
                </div>
              </details>

              {items.length > 1 ? (
                <button
                  className="secondary-button"
                  onClick={() => remove(index)}
                  type="button"
                >
                  Remove hub
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <button className="secondary-button" onClick={add} type="button">
        + Add footprint hub
      </button>
    </div>
  );
}

const CONTRIBUTION_TYPE_OPTIONS = PROJECT_CONTRIBUTION_TYPES;

function ContributorListField({
  externalContributors = [],
  initialValues = [],
  members = [],
  onCountChange,
  workstreamOptions = [],
  activityOptions = [],
}) {
  const empty = () => ({
    contribution_activity_code: "",
    contribution_external_contributor_id: "",
    contribution_external_name: "",
    contribution_external_organization_name: "",
    contribution_external_role_title: "",
    contribution_member_profile_id: "",
    contribution_notes: "",
    contribution_role_label: "",
    contribution_sort_order: "0",
    contribution_type: "",
    contribution_workstream_code: "",
    _mode: "member",
  });

  const [items, setItems] = useState(
    initialValues.length
      ? initialValues.map((item) => ({
          ...empty(),
          ...item,
          _mode: item.contribution_member_profile_id ? "member" : "external",
        }))
      : [empty()]
  );

  useEffect(() => { onCountChange?.(items.length); }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => setItems((prev) => [...prev, empty()]);
  const remove = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
  const update = (index, patch) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const setMode = (index, mode) =>
    update(index, {
      _mode: mode,
      contribution_member_profile_id: "",
      contribution_external_contributor_id: "",
      contribution_external_name: "",
      contribution_external_role_title: "",
      contribution_external_organization_name: "",
    });

  return (
    <div className="form-field structured-list-field">
      <label className="form-label">Member and external contributors</label>
      <span className="form-hint">
        Use the toggle to switch between a PATNA member and an external contributor.
      </span>
      <div className="structured-list-stack">
        {items.map((item, index) => (
          <div className="structured-list-card" key={index}>
            <div className="row-mode-toggle">
              <button
                className={item._mode === "member" ? "row-mode-btn is-active" : "row-mode-btn"}
                onClick={() => setMode(index, "member")}
                type="button"
              >
                Member
              </button>
              <button
                className={item._mode === "external" ? "row-mode-btn is-active" : "row-mode-btn"}
                onClick={() => setMode(index, "external")}
                type="button"
              >
                External
              </button>
            </div>

            <div className="row-mode-section">
              {item._mode === "member" ? (
                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Member</label>
                  <select
                    className="form-input"
                    name="contribution_member_profile_id"
                    onChange={(e) => update(index, { contribution_member_profile_id: e.target.value })}
                    value={item.contribution_member_profile_id}
                  >
                    <option value="">— Select member —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {memberLabel(m)}
                      </option>
                    ))}
                  </select>
                  <input name="contribution_external_contributor_id" type="hidden" value="" />
                  <input name="contribution_external_name" type="hidden" value="" />
                  <input name="contribution_external_role_title" type="hidden" value="" />
                  <input name="contribution_external_organization_name" type="hidden" value="" />
                </div>
              ) : (
                <div className="structured-list-grid">
                  <div className="structured-list-input">
                    <label className="form-label form-label-compact">Existing external contributor</label>
                    <select
                      className="form-input"
                      name="contribution_external_contributor_id"
                      onChange={(e) => update(index, { contribution_external_contributor_id: e.target.value })}
                      value={item.contribution_external_contributor_id}
                    >
                      <option value="">— Select or add new below —</option>
                      {externalContributors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {[c.name, c.role_title, c.organization_name].filter(Boolean).join(" — ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!item.contribution_external_contributor_id && (
                    <>
                      <div className="structured-list-input">
                        <label className="form-label form-label-compact">New — full name</label>
                        <input
                          className="form-input"
                          name="contribution_external_name"
                          onChange={(e) => update(index, { contribution_external_name: e.target.value })}
                          placeholder="Dr Jane Example"
                          type="text"
                          value={item.contribution_external_name}
                        />
                      </div>
                      <div className="structured-list-input">
                        <label className="form-label form-label-compact">New — role title</label>
                        <input
                          className="form-input"
                          name="contribution_external_role_title"
                          onChange={(e) => update(index, { contribution_external_role_title: e.target.value })}
                          placeholder="Senior Economist"
                          type="text"
                          value={item.contribution_external_role_title}
                        />
                      </div>
                      <div className="structured-list-input">
                        <label className="form-label form-label-compact">New — organisation</label>
                        <input
                          className="form-input"
                          name="contribution_external_organization_name"
                          onChange={(e) => update(index, { contribution_external_organization_name: e.target.value })}
                          placeholder="Institution name"
                          type="text"
                          value={item.contribution_external_organization_name}
                        />
                      </div>
                    </>
                  )}
                  {item.contribution_external_contributor_id && (
                    <>
                      <input name="contribution_external_name" type="hidden" value="" />
                      <input name="contribution_external_role_title" type="hidden" value="" />
                      <input name="contribution_external_organization_name" type="hidden" value="" />
                    </>
                  )}
                  <input name="contribution_member_profile_id" type="hidden" value="" />
                </div>
              )}
            </div>

            <div className="row-mode-divider">Contribution details</div>

            <div className="structured-list-grid">
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Contribution type</label>
                <select
                  className="form-input"
                  name="contribution_type"
                  onChange={(e) => update(index, { contribution_type: e.target.value })}
                  value={item.contribution_type}
                >
                  <option value="">— Select —</option>
                  {CONTRIBUTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Role label</label>
                <input
                  className="form-input"
                  name="contribution_role_label"
                  onChange={(e) => update(index, { contribution_role_label: e.target.value })}
                  placeholder="Principal Investigator"
                  type="text"
                  value={item.contribution_role_label}
                />
              </div>
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Workstream</label>
                {workstreamOptions.length > 0 ? (
                  <select
                    className="form-input"
                    name="contribution_workstream_code"
                    onChange={(e) => update(index, { contribution_workstream_code: e.target.value })}
                    value={item.contribution_workstream_code}
                  >
                    <option value="">— None —</option>
                    {workstreamOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="form-input"
                    name="contribution_workstream_code"
                    onChange={(e) => update(index, { contribution_workstream_code: e.target.value })}
                    placeholder="WS2"
                    type="text"
                    value={item.contribution_workstream_code}
                  />
                )}
              </div>
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Activity</label>
                {activityOptions.length > 0 ? (
                  <select
                    className="form-input"
                    name="contribution_activity_code"
                    onChange={(e) => update(index, { contribution_activity_code: e.target.value })}
                    value={item.contribution_activity_code}
                  >
                    <option value="">— None —</option>
                    {activityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="form-input"
                    name="contribution_activity_code"
                    onChange={(e) => update(index, { contribution_activity_code: e.target.value })}
                    placeholder="NZF-MODULE-1"
                    type="text"
                    value={item.contribution_activity_code}
                  />
                )}
              </div>
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Notes</label>
                <textarea
                  className="form-input"
                  name="contribution_notes"
                  onChange={(e) => update(index, { contribution_notes: e.target.value })}
                  placeholder="Optional contributor context."
                  rows={2}
                  style={{ gridColumn: "1 / -1" }}
                  value={item.contribution_notes}
                />
              </div>
              <input name="contribution_sort_order" type="hidden" value={item.contribution_sort_order} />
            </div>

            {items.length > 1 && (
              <button className="secondary-button" onClick={() => remove(index)} type="button">
                Remove contributor
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={add} type="button">
        + Add contributor
      </button>
    </div>
  );
}

const ORG_TYPE_OPTIONS = [
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
].map((value) => ({
  label: value.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
  value,
}));

function PartnerListField({
  initialValues = [],
  onCountChange,
  organizations = [],
  workstreamOptions = [],
  activityOptions = [],
}) {
  const empty = () => ({
    organization_activity_code: "",
    organization_id: "",
    organization_label: "",
    organization_name: "",
    organization_notes: "",
    organization_relationship_type: "institutional_partner",
    organization_sort_order: "0",
    organization_type: "other",
    organization_workstream_code: "",
    _mode: "existing",
  });

  const [items, setItems] = useState(
    initialValues.length
      ? initialValues.map((item) => ({
          ...empty(),
          ...item,
          _mode: item.organization_id ? "existing" : "new",
        }))
      : [empty()]
  );

  useEffect(() => { onCountChange?.(items.length); }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => setItems((prev) => [...prev, empty()]);
  const remove = (index) => setItems((prev) => prev.filter((_, i) => i !== index));
  const update = (index, patch) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const setMode = (index, mode) =>
    update(index, { _mode: mode, organization_id: "", organization_name: "", organization_type: "other" });

  return (
    <div className="form-field structured-list-field">
      <label className="form-label">Key institutional partners</label>
      <span className="form-hint">
        Link existing organisations or add a new one. Use relationship type to describe the role.
      </span>
      <div className="structured-list-stack">
        {items.map((item, index) => (
          <div className="structured-list-card" key={index}>
            <div className="row-mode-toggle">
              <button
                className={item._mode === "existing" ? "row-mode-btn is-active" : "row-mode-btn"}
                onClick={() => setMode(index, "existing")}
                type="button"
              >
                Existing
              </button>
              <button
                className={item._mode === "new" ? "row-mode-btn is-active" : "row-mode-btn"}
                onClick={() => setMode(index, "new")}
                type="button"
              >
                Add new
              </button>
            </div>

            <div className="row-mode-section">
              {item._mode === "existing" ? (
                <div className="structured-list-input">
                  <label className="form-label form-label-compact">Organisation</label>
                  <select
                    className="form-input"
                    name="organization_id"
                    onChange={(e) => update(index, { organization_id: e.target.value })}
                    value={item.organization_id}
                  >
                    <option value="">— Select organisation —</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {[org.name, org.acronym].filter(Boolean).join(" — ")}
                      </option>
                    ))}
                  </select>
                  <input name="organization_name" type="hidden" value="" />
                  <input name="organization_type" type="hidden" value="" />
                </div>
              ) : (
                <div className="structured-list-grid">
                  <div className="structured-list-input">
                    <label className="form-label form-label-compact">Organisation name</label>
                    <input
                      className="form-input"
                      name="organization_name"
                      onChange={(e) => update(index, { organization_name: e.target.value })}
                      placeholder="Institution name"
                      type="text"
                      value={item.organization_name}
                    />
                  </div>
                  <div className="structured-list-input">
                    <label className="form-label form-label-compact">Organisation type</label>
                    <select
                      className="form-input"
                      name="organization_type"
                      onChange={(e) => update(index, { organization_type: e.target.value })}
                      value={item.organization_type}
                    >
                      {ORG_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <input name="organization_id" type="hidden" value="" />
                </div>
              )}
            </div>

            <div className="row-mode-divider">Partnership details</div>

            <div className="structured-list-grid">
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Relationship</label>
                <select
                  className="form-input"
                  name="organization_relationship_type"
                  onChange={(e) => update(index, { organization_relationship_type: e.target.value })}
                  value={item.organization_relationship_type}
                >
                  {PROJECT_ORGANIZATION_RELATIONSHIP_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Display label</label>
                <input
                  className="form-input"
                  name="organization_label"
                  onChange={(e) => update(index, { organization_label: e.target.value })}
                  placeholder="Research partner"
                  type="text"
                  value={item.organization_label}
                />
              </div>
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Workstream</label>
                {workstreamOptions.length > 0 ? (
                  <select
                    className="form-input"
                    name="organization_workstream_code"
                    onChange={(e) => update(index, { organization_workstream_code: e.target.value })}
                    value={item.organization_workstream_code}
                  >
                    <option value="">— None —</option>
                    {workstreamOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="form-input"
                    name="organization_workstream_code"
                    onChange={(e) => update(index, { organization_workstream_code: e.target.value })}
                    placeholder="WS2"
                    type="text"
                    value={item.organization_workstream_code}
                  />
                )}
              </div>
              <div className="structured-list-input">
                <label className="form-label form-label-compact">Activity</label>
                {activityOptions.length > 0 ? (
                  <select
                    className="form-input"
                    name="organization_activity_code"
                    onChange={(e) => update(index, { organization_activity_code: e.target.value })}
                    value={item.organization_activity_code}
                  >
                    <option value="">— None —</option>
                    {activityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="form-input"
                    name="organization_activity_code"
                    onChange={(e) => update(index, { organization_activity_code: e.target.value })}
                    placeholder="NZF-MODULE-1"
                    type="text"
                    value={item.organization_activity_code}
                  />
                )}
              </div>
              <div className="structured-list-input" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label form-label-compact">Notes</label>
                <textarea
                  className="form-input"
                  name="organization_notes"
                  onChange={(e) => update(index, { organization_notes: e.target.value })}
                  placeholder="Optional partner context."
                  rows={2}
                  value={item.organization_notes}
                />
              </div>
              <input name="organization_sort_order" type="hidden" value={item.organization_sort_order} />
            </div>

            {items.length > 1 && (
              <button className="secondary-button" onClick={() => remove(index)} type="button">
                Remove partner
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="secondary-button" onClick={add} type="button">
        + Add partner
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
  const [activeTab, setActiveTab] = useState("essentials");
  const [liveCounts, setLiveCounts] = useState({
    countries: countItems(project?.project_countries),
    hubs: countItems(project?.project_footprint_hubs),
    workstreams: countItems(project?.project_workstreams),
    activities: countItems(project?.project_activities),
    events: countItems(project?.project_event_links),
    publications: countItems(project?.project_content_links),
    contributors: countItems(project?.project_contributions),
    partners: countItems(project?.project_organization_links),
  });
  const updateLiveCount = (key) => (n) => setLiveCounts((prev) => ({ ...prev, [key]: n }));

  const workstreamCodeById = new Map(
    (project?.project_workstreams || []).map((workstream) => [workstream.id, workstream.code || ""])
  );
  const activityCodeById = new Map(
    (project?.project_activities || []).map((activity) => [activity.id, activity.code || ""])
  );
  const workstreamOptions = (project?.project_workstreams || [])
    .filter((ws) => ws.code)
    .map((ws) => ({ label: [ws.code, ws.title].filter(Boolean).join(" — "), value: ws.code }));
  const activityOptions = (project?.project_activities || [])
    .filter((act) => act.code)
    .map((act) => ({ label: [act.code, act.title].filter(Boolean).join(" — "), value: act.code }));
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
  const countryRecords = relationOptions.countries || [];
  const countryOptions = useMemo(
    () => toCountryOptions(countryRecords, AFRICAN_COUNTRY_OPTIONS),
    [countryRecords]
  );
  const places = relationOptions.places || [];
  const parentProjectOptions = getSelectableParentProjects(
    relationOptions.parentProjects || [],
    project?.id || null
  );
  const publications = relationOptions.publications || [];
  const seriesOptions = relationOptions.series || [];

  return (
    <form action={action} className="project-editor-form">
      {project?.id ? <input name="project_id" type="hidden" value={project.id} /> : null}

      <div className="project-editor-layout">
        <div
          className="project-editor-tabs"
          aria-label="Project editor sections"
          role="tablist"
        >
          {PROJECT_FORM_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "project-editor-tab is-active" : "project-editor-tab"}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                <span className="project-editor-tab-label">
                  <Icon aria-hidden="true" size={16} />
                  {tab.label}
                </span>
                {getTabCount(project, tab.id) ? (
                  <strong>{getTabCount(project, tab.id)}</strong>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="project-editor-panels">
        <div className="project-editor-save-bar">
          <span className="project-editor-save-bar-title">{title || "Untitled project"}</span>
          <button className="primary-button" type="submit">{submitLabel}</button>
        </div>

        <div className="form-section" style={tabPanelStyle("essentials")}>
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

          <div className="form-field">
            <label className="form-label" htmlFor="parent_project_id">
              Parent project
            </label>
            <select
              className="form-input"
              defaultValue={project?.parent_project_id || ""}
              id="parent_project_id"
              name="parent_project_id"
            >
              <option value="">- None -</option>
              {parentProjectOptions.map((parentProject) => (
                <option key={parentProject.id} value={parentProject.id}>
                  {projectLabel(parentProject)}
                </option>
              ))}
            </select>
            <span className="form-hint">
              Use this when a substantial work package should keep its own page while rolling up to a wider project.
            </span>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="series_id">
                Project series
              </label>
              <select
                className="form-input"
                defaultValue={project?.series_id || ""}
                id="series_id"
                name="series_id"
              >
                <option value="">- None -</option>
                {seriesOptions.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="series_phase_label">
                Series phase
              </label>
              <input
                className="form-input"
                defaultValue={project?.series_phase_label || ""}
                id="series_phase_label"
                name="series_phase_label"
                placeholder="e.g. Phase III"
                type="text"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="series_phase_order">
                Phase order
              </label>
              <input
                className="form-input"
                defaultValue={project?.series_phase_order || ""}
                id="series_phase_order"
                name="series_phase_order"
                placeholder="3"
                type="number"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="phase_summary">
                Phase summary
              </label>
              <textarea
                className="form-input"
                defaultValue={project?.phase_summary || ""}
                id="phase_summary"
                name="phase_summary"
                placeholder="One sentence on how this phase fits into the wider series."
                rows={2}
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

        <div className="form-section" style={tabPanelStyle("essentials")}>
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

        <div className="form-section" style={tabPanelStyle("story")}>
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
        </div>

        <div className="form-section" style={tabPanelStyle("reach")}>
          <h3 className="form-section-title">Countries and footprint</h3>

          <CountryBulkField
            countryOptions={countryOptions}
            countryRecords={countryRecords}
            onCountChange={updateLiveCount("countries")}
            initialValues={(project?.project_countries || []).map((country, index) => ({
              country_code: country.country_code || "",
              country_name: country.country || "",
              country_class: country.country_class || "",
              country_engagement_role: country.engagement_role || "",
              country_phase_label: country.phase_label || "",
              country_sort_order: String(country.sort_order ?? index),
              country_priority_focus: country.priority_focus || "",
            }))}
          />

          <FootprintHubField
            countryOptions={countryOptions}
            onCountChange={updateLiveCount("hubs")}
            initialValues={(project?.project_footprint_hubs || []).map((hub, index) => ({
              hub_type: hub.hub_type || "",
              hub_label: hub.label || "",
              hub_city: hub.city || "",
              hub_country_code: hub.country_code || "",
              hub_latitude: String(hub.latitude ?? ""),
              hub_longitude: String(hub.longitude ?? ""),
              hub_phase_label: hub.phase_label || "",
              hub_place_id: hub.place_id || "",
              hub_place_name: hub.place?.name || hub.city || "",
              hub_place_source: hub.place?.source || "",
              hub_place_source_id: hub.place?.source_id || "",
              hub_place_type: hub.place?.place_type || "",
              hub_place_address: hub.place?.address || "",
              hub_related_url: hub.related_url || "",
              hub_sort_order: String(hub.sort_order ?? index),
              hub_description: hub.description || "",
            }))}
            places={places}
          />
        </div>

        <div className="form-section" style={tabPanelStyle("delivery")}>
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
            onCountChange={updateLiveCount("workstreams")}
            note="Use stable codes such as WS1, WS2, WSA, or WSB so activities can reference them."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("delivery")}>
          <h3 className="form-section-title">Activities</h3>
          <StructuredListField
            addLabel="+ Add activity"
            fields={[
              { label: "Code", name: "activity_code", placeholder: "NZF-MODULE-1" },
              { label: "Title", name: "activity_title", placeholder: "NZF Impact Assessment for Africa" },
              workstreamOptions.length > 0
                ? { label: "Workstream", name: "activity_workstream_code", options: [{ label: "— None —", value: "" }, ...workstreamOptions] }
                : { label: "Workstream code", name: "activity_workstream_code", placeholder: "WS2" },
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
            onCountChange={updateLiveCount("activities")}
            note="Activities can represent research modules, convenings, negotiation support, milestones, or fellowship actions."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("relationships")}>
          <h3 className="form-section-title">Contributors</h3>
          <ContributorListField
            activityOptions={activityOptions}
            externalContributors={externalContributors}
            onCountChange={updateLiveCount("contributors")}
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
              contribution_workstream_code: workstreamCodeById.get(contribution.workstream_id) || "",
              contribution_activity_code: activityCodeById.get(contribution.activity_id) || "",
            }))}
            members={members}
            workstreamOptions={workstreamOptions}
          />
        </div>

        <div className="form-section" style={tabPanelStyle("relationships")}>
          <h3 className="form-section-title">Partners</h3>
          <PartnerListField
            activityOptions={activityOptions}
            onCountChange={updateLiveCount("partners")}
            initialValues={(project?.project_organization_links || []).map((link, index) => ({
              organization_id: link.organization_id || "",
              organization_label: link.label || "",
              organization_name: "",
              organization_notes: link.notes || "",
              organization_relationship_type: link.relationship_type || "institutional_partner",
              organization_sort_order: String(link.sort_order ?? index),
              organization_type: link.organizations?.organization_type || "other",
              organization_workstream_code: workstreamCodeById.get(link.workstream_id) || "",
              organization_activity_code: activityCodeById.get(link.activity_id) || "",
            }))}
            organizations={organizations}
            workstreamOptions={workstreamOptions}
          />
        </div>

        <div className="form-section" style={tabPanelStyle("relationships")}>
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
              workstreamOptions.length > 0
                ? { label: "Workstream", name: "event_workstream_code", options: [{ label: "— None —", value: "" }, ...workstreamOptions] }
                : { label: "Workstream code", name: "event_workstream_code", placeholder: "WS2" },
              activityOptions.length > 0
                ? { label: "Activity", name: "event_activity_code", options: [{ label: "— None —", value: "" }, ...activityOptions] }
                : { label: "Activity code", name: "event_activity_code", placeholder: "NZF-MODULE-1" },
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
              event_workstream_code:
                workstreamCodeById.get(link.workstream_id) || "",
              event_activity_code:
                activityCodeById.get(link.activity_id) || "",
            }))}
            label="Connected events"
            onCountChange={updateLiveCount("events")}
            note="Link existing event records instead of repeating event details inside the project body."
          />
        </div>

        <div className="form-section" style={tabPanelStyle("relationships")}>
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
              workstreamOptions.length > 0
                ? { label: "Workstream", name: "content_workstream_code", options: [{ label: "— None —", value: "" }, ...workstreamOptions] }
                : { label: "Workstream code", name: "content_workstream_code", placeholder: "WS2" },
              activityOptions.length > 0
                ? { label: "Activity", name: "content_activity_code", options: [{ label: "— None —", value: "" }, ...activityOptions] }
                : { label: "Activity code", name: "content_activity_code", placeholder: "NZF-MODULE-1" },
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
              content_workstream_code:
                workstreamCodeById.get(link.workstream_id) || "",
              content_activity_code:
                activityCodeById.get(link.activity_id) || "",
            }))}
            label="Connected reports, briefs, tools, and publications"
            onCountChange={updateLiveCount("publications")}
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

        <div className="form-section review-section" style={tabPanelStyle("review")}>
          <h3 className="form-section-title">Review before saving</h3>
          <div className="project-review-grid">
            <div>
              <span className="form-hint">Project</span>
              <strong>{title || "Untitled project"}</strong>
              <p>{slug || "project-slug"}</p>
            </div>
            <div>
              <span className="form-hint">Reach</span>
              <strong>{liveCounts.countries} {liveCounts.countries === 1 ? "country" : "countries"}</strong>
              <p>{liveCounts.hubs} footprint {liveCounts.hubs === 1 ? "hub" : "hubs"}</p>
            </div>
            <div>
              <span className="form-hint">Delivery</span>
              <strong>{liveCounts.workstreams} {liveCounts.workstreams === 1 ? "workstream" : "workstreams"}</strong>
              <p>{liveCounts.activities} {liveCounts.activities === 1 ? "activity" : "activities"}</p>
            </div>
            <div>
              <span className="form-hint">Relationships</span>
              <strong>{liveCounts.contributors + liveCounts.partners} people &amp; orgs</strong>
              <p>{liveCounts.events + liveCounts.publications} events &amp; publications</p>
            </div>
          </div>
          <p className="form-hint">
            Counts update as you edit — save when everything looks right. Draft records remain hidden from public project pages.
          </p>
        </div>

        <div className="form-actions">
          <button className="primary-button" type="submit">
            {submitLabel}
          </button>
        </div>
        </div>
      </div>
    </form>
  );
}
