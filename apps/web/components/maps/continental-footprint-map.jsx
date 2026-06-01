"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  getAfricanCountryByName,
  isAfricaGeographyName,
} from "@/lib/africa-countries";
import {
  FOOTPRINT_HUB_TYPES,
  FOOTPRINT_PHASES,
} from "@/lib/project-footprints";

const GEOGRAPHY_URL = "/maps/world-countries-50m.json";

const PHASE_STYLES = {
  "phase-i": { fill: "#d5ecf7", stroke: "#8ab9d3" },
  "phase-ii": { fill: "#72b9df", stroke: "#2f7fb2" },
  "phase-iii": { fill: "#03529d", stroke: "#012f5a" },
};

const HUB_STYLES = {
  convening: { fill: "#ff8b61", stroke: "#5b250f" },
  partner: { fill: "#2f9e78", stroke: "#0f4633" },
  secretariat: { fill: "#0f2d52", stroke: "#d5ecf7" },
};

function matchesPhase(item, activePhase) {
  return activePhase === "all" || item.phaseKeys?.includes(activePhase);
}

function isActivationKey(event) {
  return event.key === "Enter" || event.key === " ";
}

function buildTooltipPosition(event, container) {
  const rect = container?.getBoundingClientRect();
  if (!rect) {
    return { x: 0, y: 0 };
  }

  const maxX = Math.max(12, rect.width - 220);
  const maxY = Math.max(12, rect.height - 110);
  const x = Math.min(Math.max(event.clientX - rect.left + 14, 12), maxX);
  const y = Math.min(Math.max(event.clientY - rect.top + 14, 12), maxY);

  return { x, y };
}

function renderHubShape(kind) {
  switch (kind) {
    case "partner":
      return <rect height="12" rx="2" transform="rotate(45)" width="12" x="-6" y="-6" />;
    case "secretariat":
      return <rect height="12" rx="2" width="12" x="-6" y="-6" />;
    default:
      return <circle cx="0" cy="0" r="6" />;
  }
}

function DetailPanel({ activeItem, activePhase, countries, hubs, onClear }) {
  if (!activeItem) {
    return (
      <div className="continental-footprint-panel-card">
        <div className="section-label">Map guide</div>
        <h3 className="continental-footprint-panel-title">How to read the footprint</h3>
        <p className="continental-footprint-panel-body">
          Country fills show where LEAP has documented reach by phase, while markers surface
          convenings, partner anchors, and PATNA coordination nodes that shape regional influence.
        </p>
        <dl className="continental-footprint-panel-meta">
          <div>
            <dt>Visible countries</dt>
            <dd>{countries.filter((country) => matchesPhase(country, activePhase)).length}</dd>
          </div>
          <div>
            <dt>Visible hubs</dt>
            <dd>{hubs.filter((hub) => matchesPhase(hub, activePhase)).length}</dd>
          </div>
          <div>
            <dt>Filter</dt>
            <dd>{FOOTPRINT_PHASES.find((phase) => phase.key === activePhase)?.label || "All"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (activeItem.kind === "country") {
    return (
      <div className="continental-footprint-panel-card">
        <div className="continental-footprint-panel-head">
          <div>
            <div className="section-label">Country footprint</div>
            <h3 className="continental-footprint-panel-title">{activeItem.name}</h3>
          </div>
          {activeItem.isPinned ? (
            <button className="text-link" onClick={onClear} type="button">
              Clear
            </button>
          ) : null}
        </div>
        <p className="continental-footprint-panel-body">
          Documented across {activeItem.phaseLabels.join(", ")} through LEAP programme delivery,
          research activity, and related convenings.
        </p>
        <div className="continental-footprint-badges">
          {activeItem.phaseLabels.map((phaseLabel) => (
            <span className="status-chip chip-neutral" key={phaseLabel}>
              {phaseLabel}
            </span>
          ))}
        </div>
        <div className="continental-footprint-panel-section">
          <strong>Related project pages</strong>
          <div className="continental-footprint-links">
            {activeItem.relatedProjects.map((project) => (
              <Link className="text-link" href={project.href} key={project.slug}>
                {project.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hubTypeLabel =
    FOOTPRINT_HUB_TYPES.find((hubType) => hubType.value === activeItem.kind)?.label ||
    activeItem.kind;

  return (
    <div className="continental-footprint-panel-card">
      <div className="continental-footprint-panel-head">
        <div>
          <div className="section-label">{hubTypeLabel}</div>
          <h3 className="continental-footprint-panel-title">{activeItem.label}</h3>
        </div>
        {activeItem.isPinned ? (
          <button className="text-link" onClick={onClear} type="button">
            Clear
          </button>
        ) : null}
      </div>
      <p className="continental-footprint-panel-body">
        {activeItem.city}, {activeItem.countryName}
      </p>
      {activeItem.description ? (
        <p className="continental-footprint-panel-body">{activeItem.description}</p>
      ) : null}
      <div className="continental-footprint-badges">
        {activeItem.phaseLabels.map((phaseLabel) => (
          <span className="status-chip chip-neutral" key={phaseLabel}>
            {phaseLabel}
          </span>
        ))}
      </div>
      <div className="continental-footprint-panel-section">
        <strong>Related project page</strong>
        <div className="continental-footprint-links">
          <Link className="text-link" href={activeItem.relatedProjectHref}>
            {activeItem.relatedProjectTitle}
          </Link>
          {activeItem.relatedUrl ? (
            <a
              className="text-link"
              href={activeItem.relatedUrl}
              rel="noreferrer"
              target="_blank"
            >
              Reference link
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ContinentalFootprintMap({
  footprint,
  title,
  subtitle,
  metrics,
}) {
  const containerRef = useRef(null);
  const [activePhase, setActivePhase] = useState("all");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [pinnedItem, setPinnedItem] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const countries = footprint?.countries || [];
  const hubs = footprint?.hubs || [];
  const displayMetrics = metrics?.length ? metrics : footprint?.metrics || [];

  const countriesByCode = Object.fromEntries(
    countries.map((country) => [country.countryCode, country])
  );

  useEffect(() => {
    if (!pinnedItem) {
      return;
    }

    const sourceItems = pinnedItem.kind === "country" ? countries : hubs;
    const stillVisible = sourceItems.some(
      (item) =>
        item.id === pinnedItem.id ||
        item.countryCode === pinnedItem.countryCode ||
        item.label === pinnedItem.label
    );

    if (!stillVisible || !matchesPhase(pinnedItem, activePhase)) {
      setPinnedItem(null);
    }
  }, [activePhase, countries, hubs, pinnedItem]);

  const activeItem = pinnedItem || hoveredItem || null;

  if (!countries.length && !hubs.length) {
    return null;
  }

  function showTooltip(event, item) {
    const position = buildTooltipPosition(event, containerRef.current);
    setTooltip({
      ...position,
      item,
    });
  }

  function clearTooltip() {
    setTooltip(null);
  }

  function pinItem(item) {
    setPinnedItem(item);
  }

  return (
    <div className="continental-footprint">
      {(title || subtitle || displayMetrics.length > 0) ? (
        <div className="continental-footprint-head">
          <div className="stack">
            {title ? <h3 className="continental-footprint-title">{title}</h3> : null}
            {subtitle ? <p className="continental-footprint-subtitle">{subtitle}</p> : null}
          </div>
          {displayMetrics.length > 0 ? (
            <div className="continental-footprint-metrics">
              {displayMetrics.map((metric) => (
                <div className="continental-footprint-metric" key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="continental-footprint-shell">
        <div className="continental-footprint-map-column">
          <div className="continental-footprint-toolbar">
            <div className="continental-footprint-filters" aria-label="Footprint phase filter" role="group">
              {FOOTPRINT_PHASES.map((phase) => (
                <button
                  aria-pressed={activePhase === phase.key}
                  className={`continental-footprint-filter${activePhase === phase.key ? " is-active" : ""}`}
                  key={phase.key}
                  onClick={() => setActivePhase(phase.key)}
                  type="button"
                >
                  {phase.label}
                </button>
              ))}
            </div>
            <div className="continental-footprint-legend" aria-label="Map legend">
              <span><i className="phase-swatch phase-swatch-i" />Phase I</span>
              <span><i className="phase-swatch phase-swatch-ii" />Phase II</span>
              <span><i className="phase-swatch phase-swatch-iii" />Phase III</span>
              <span><i className="hub-swatch hub-swatch-convening" />Convening</span>
              <span><i className="hub-swatch hub-swatch-partner" />Partner</span>
              <span><i className="hub-swatch hub-swatch-secretariat" />Secretariat</span>
            </div>
          </div>

          <div className="continental-footprint-map-wrap" ref={containerRef}>
            <ComposableMap
              height={720}
              projection="geoMercator"
              projectionConfig={{ center: [20, 2], scale: 430 }}
              width={860}
            >
              <Geographies geography={GEOGRAPHY_URL}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => isAfricaGeographyName(geo.properties?.name))
                    .map((geo) => {
                      const geoCountry = getAfricanCountryByName(geo.properties?.name);
                      const country = geoCountry ? countriesByCode[geoCountry.code] : null;
                      const isVisible = country && matchesPhase(country, activePhase);
                      const latestPhaseStyle = country?.latestPhaseKey
                        ? PHASE_STYLES[country.latestPhaseKey]
                        : null;
                      const fill = isVisible
                        ? latestPhaseStyle?.fill || "#dbe5ee"
                        : "#dbe5ee";
                      const stroke = isVisible
                        ? latestPhaseStyle?.stroke || "#9ab4ca"
                        : "#b8cad8";

                      const interactiveProps = country
                        ? {
                            onBlur: () => {
                              setHoveredItem(null);
                              clearTooltip();
                            },
                            onClick: () =>
                              pinItem({
                                ...country,
                                id: country.countryCode,
                                isPinned: true,
                                kind: "country",
                              }),
                            onFocus: () =>
                              setHoveredItem({
                                ...country,
                                id: country.countryCode,
                                isPinned: false,
                                kind: "country",
                              }),
                            onKeyDown: (event) => {
                              if (!isActivationKey(event)) {
                                return;
                              }

                              event.preventDefault();
                              pinItem({
                                ...country,
                                id: country.countryCode,
                                isPinned: true,
                                kind: "country",
                              });
                            },
                            onMouseEnter: (event) => {
                              const item = {
                                ...country,
                                id: country.countryCode,
                                isPinned: false,
                                kind: "country",
                              };
                              setHoveredItem(item);
                              showTooltip(event, item);
                            },
                            onMouseLeave: () => {
                              setHoveredItem(null);
                              clearTooltip();
                            },
                            onMouseMove: (event) =>
                              showTooltip(event, {
                                ...country,
                                id: country.countryCode,
                                isPinned: false,
                                kind: "country",
                              }),
                            "aria-label": `${country.name} footprint, ${country.phaseLabels.join(", ")}`,
                            role: "button",
                            tabIndex: 0,
                          }
                        : {};

                      return (
                        <Geography
                          className={country ? "continental-footprint-country is-interactive" : "continental-footprint-country"}
                          geography={geo}
                          key={geo.rsmKey}
                          style={{
                            default: { fill, outline: "none", stroke, strokeWidth: 0.8 },
                            hover: { fill, outline: "none", stroke, strokeWidth: 1.1 },
                            pressed: { fill, outline: "none", stroke, strokeWidth: 1.1 },
                          }}
                          {...interactiveProps}
                        />
                      );
                    })
                }
              </Geographies>

              {hubs
                .filter((hub) => matchesPhase(hub, activePhase))
                .map((hub) => {
                  const item = {
                    ...hub,
                    isPinned: false,
                    kind: hub.kind,
                  };
                  const style = HUB_STYLES[hub.kind] || HUB_STYLES.convening;

                  return (
                    <Marker coordinates={hub.coordinates} key={hub.id}>
                      <g
                        className="continental-footprint-marker"
                        onBlur={() => {
                          setHoveredItem(null);
                          clearTooltip();
                        }}
                        onClick={() => pinItem({ ...hub, isPinned: true, kind: hub.kind })}
                        onFocus={() => setHoveredItem(item)}
                        onKeyDown={(event) => {
                          if (!isActivationKey(event)) {
                            return;
                          }

                          event.preventDefault();
                          pinItem({ ...hub, isPinned: true, kind: hub.kind });
                        }}
                        onMouseEnter={(event) => {
                          setHoveredItem(item);
                          showTooltip(event, item);
                        }}
                        onMouseLeave={() => {
                          setHoveredItem(null);
                          clearTooltip();
                        }}
                        onMouseMove={(event) => showTooltip(event, item)}
                        aria-label={`${hub.label}, ${hub.city}, ${hub.countryName}`}
                        role="button"
                        tabIndex={0}
                      >
                        <g
                          fill={style.fill}
                          stroke={style.stroke}
                          strokeWidth="1.5"
                          transform="translate(0 0)"
                        >
                          {renderHubShape(hub.kind)}
                        </g>
                      </g>
                    </Marker>
                  );
                })}
            </ComposableMap>

            {tooltip?.item ? (
              <div
                className="continental-footprint-tooltip"
                style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
              >
                <strong>{tooltip.item.kind === "country" ? tooltip.item.name : tooltip.item.label}</strong>
                <span>
                  {tooltip.item.kind === "country"
                    ? tooltip.item.phaseLabels.join(", ")
                    : `${tooltip.item.city}, ${tooltip.item.countryName}`}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="continental-footprint-panel">
          <DetailPanel
            activeItem={activeItem}
            activePhase={activePhase}
            countries={countries}
            hubs={hubs}
            onClear={() => setPinnedItem(null)}
          />
        </aside>
      </div>

      <div className="continental-footprint-fallback">
        <div className="continental-footprint-fallback-section">
          <div className="section-label">Country list</div>
          <div className="continental-footprint-fallback-grid">
            {countries
              .filter((country) => matchesPhase(country, activePhase))
              .map((country) => (
                <button
                  className="continental-footprint-fallback-item"
                  key={country.countryCode}
                  onClick={() =>
                    pinItem({
                      ...country,
                      id: country.countryCode,
                      isPinned: true,
                      kind: "country",
                    })
                  }
                  type="button"
                >
                  <strong>{country.name}</strong>
                  <span>{country.phaseLabels.join(", ")}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="continental-footprint-fallback-section">
          <div className="section-label">Hubs and convenings</div>
          <div className="continental-footprint-fallback-grid">
            {hubs
              .filter((hub) => matchesPhase(hub, activePhase))
              .map((hub) => (
                <button
                  className="continental-footprint-fallback-item"
                  key={hub.id}
                  onClick={() => pinItem({ ...hub, isPinned: true, kind: hub.kind })}
                  type="button"
                >
                  <strong>{hub.label}</strong>
                  <span>{hub.city}, {hub.countryName}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
