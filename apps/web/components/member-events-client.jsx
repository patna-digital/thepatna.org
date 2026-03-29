"use client";

import { useMemo, useState } from "react";

function getEventDateInfo(event) {
  if (event.starts_at) {
    const start = new Date(event.starts_at);

    if (!Number.isNaN(start.getTime())) {
      const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(start).toUpperCase();
      let day = String(start.getUTCDate());

      if (event.ends_at) {
        const end = new Date(event.ends_at);

        if (
          !Number.isNaN(end.getTime()) &&
          end.getUTCFullYear() === start.getUTCFullYear() &&
          end.getUTCMonth() === start.getUTCMonth() &&
          end.getUTCDate() !== start.getUTCDate()
        ) {
          day = `${start.getUTCDate()}-${end.getUTCDate()}`;
        }
      }

      return { month, day };
    }
  }

  const monthOnlyMatch = String(event.display_date || "").match(/^([A-Za-z]+) (\d{4})(?: \(TBC\))?$/i);

  if (monthOnlyMatch) {
    return {
      month: monthOnlyMatch[1].slice(0, 3).toUpperCase(),
      day: /tbc/i.test(event.display_date || "") ? "TBC" : "1",
    };
  }

  return { month: "TBD", day: "TBC" };
}

function getEventSearchText(event) {
  return [
    event.title,
    event.summary,
    event.body,
    event.location,
    event.event_type,
    event.display_date,
    event.visibility,
    event.patna_involvement,
    ...(event.organising_institutions || []),
    ...(event.themes || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getEventTypeLabel(event) {
  return event.event_type || "Event";
}

function isPatnaLedEvent(event) {
  const haystack = [
    event.event_type,
    event.patna_involvement,
    ...(event.organising_institutions || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes("patna");
}

function isCurrentYearEvent(event) {
  if (event.starts_at) {
    const parsed = new Date(event.starts_at);
    return !Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() === new Date().getUTCFullYear();
  }

  const yearMatch = String(event.display_date || "").match(/(\d{4})/);
  return Number(yearMatch?.[1]) === new Date().getUTCFullYear();
}

function getScheduleClass(status) {
  if (status === "upcoming") {
    return "chip-success";
  }

  if (status === "tbc") {
    return "chip-warning";
  }

  return "chip-muted";
}

function getVisibilityClass(visibility) {
  if (visibility === "members") {
    return "chip-warning";
  }

  if (visibility === "restricted") {
    return "chip-muted";
  }

  return "chip-neutral";
}

function formatVisibilityLabel(visibility) {
  if (visibility === "members") {
    return "Members only";
  }

  if (visibility === "restricted") {
    return "Restricted";
  }

  return "Public";
}

function formatScheduleLabel(status) {
  if (status === "tbc") {
    return "TBC";
  }

  return status === "upcoming" ? "Upcoming" : "Past";
}

function getEventTone(event) {
  const type = getEventTypeLabel(event).toLowerCase();

  if (type.includes("internal")) {
    return "policy";
  }

  if (type.includes("international")) {
    return "industry";
  }

  if (isPatnaLedEvent(event)) {
    return "academic";
  }

  return "policy";
}

export function MemberEventsClient({ events }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState(
    events.some((event) => event.schedule_status === "upcoming") ? "upcoming" : "all",
  );
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEventId, setSelectedEventId] = useState("");

  const typeFilters = useMemo(() => {
    const values = [...new Set(events.map((event) => getEventTypeLabel(event)))];
    return values.sort((left, right) => left.localeCompare(right));
  }, [events]);

  const summary = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((event) => event.schedule_status === "upcoming").length,
      past: events.filter((event) => event.schedule_status === "past").length,
      tbc: events.filter((event) => event.schedule_status === "tbc").length,
      thisYear: events.filter(isCurrentYearEvent).length,
      patnaLed: events.filter(isPatnaLedEvent).length,
      memberOnly: events.filter((event) => event.visibility === "members").length,
    }),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      if (scheduleFilter !== "all" && event.schedule_status !== scheduleFilter) {
        return false;
      }

      if (typeFilter !== "all" && getEventTypeLabel(event) !== typeFilter) {
        return false;
      }

      if (normalisedSearch && !getEventSearchText(event).includes(normalisedSearch)) {
        return false;
      }

      return true;
    });
  }, [events, scheduleFilter, searchTerm, typeFilter]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId],
  );

  return (
    <div className="member-events-shell">
      <div className="member-dashboard-summary-grid">
        <article className="member-stat-card tone-blue">
          <strong>{summary.upcoming}</strong>
          <h3>Upcoming events</h3>
          <p>Published PATNA events still ahead on the calendar.</p>
        </article>
        <article className="member-stat-card tone-blue">
          <strong>{summary.thisYear}</strong>
          <h3>This year</h3>
          <p>Visible events currently dated for {new Date().getUTCFullYear()}.</p>
        </article>
        <article className="member-stat-card tone-blue">
          <strong>{summary.patnaLed}</strong>
          <h3>PATNA-led</h3>
          <p>Records marked as PATNA events or showing PATNA involvement.</p>
        </article>
        <article className="member-stat-card tone-orange">
          <strong>{summary.tbc}</strong>
          <h3>TBC dates</h3>
          <p>Events already logged but still carrying incomplete scheduling.</p>
        </article>
      </div>

      <article className="dashboard-card member-events-toolbar-card">
        <div className="member-events-toolbar-main">
          <label className="member-directory-search">
            <span className="sr-only">Search events</span>
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title, organiser, theme, involvement, or location..."
              type="search"
              value={searchTerm}
            />
          </label>
        </div>

        <div className="member-events-filter-row">
          <div className="member-filter-pill-row">
            {[
              { value: "all", label: `All (${summary.total})` },
              { value: "upcoming", label: `Upcoming (${summary.upcoming})` },
              { value: "past", label: `Past (${summary.past})` },
              { value: "tbc", label: `TBC (${summary.tbc})` },
            ].map((filter) => (
              <button
                className={scheduleFilter === filter.value ? "active-filter" : "secondary-button"}
                key={filter.value}
                onClick={() => setScheduleFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="member-filter-pill-row">
            <button
              className={typeFilter === "all" ? "active-filter" : "secondary-button"}
              onClick={() => setTypeFilter("all")}
              type="button"
            >
              All types
            </button>
            {typeFilters.map((type) => (
              <button
                className={typeFilter === type ? "active-filter" : "secondary-button"}
                key={type}
                onClick={() => setTypeFilter(type)}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="member-events-toolbar-meta">
          <strong>{filteredEvents.length} visible</strong>
          <span>{summary.memberOnly} member-only records currently published</span>
        </div>
      </article>

      <div className="member-events-list">
        {filteredEvents.length ? (
          filteredEvents.map((event) => {
            const dateInfo = getEventDateInfo(event);
            const tone = getEventTone(event);

            return (
              <article className={`dashboard-card member-event-archive-card tone-${tone}`} key={event.id}>
                <div className={`member-event-archive-date tone-${tone}`}>
                  <strong>{dateInfo.month}</strong>
                  <span>{dateInfo.day}</span>
                </div>

                <div className="member-event-archive-body">
                  <div className="member-event-archive-top">
                    <div className="member-event-archive-chips">
                      <span className="status-chip chip-neutral">{getEventTypeLabel(event)}</span>
                      <span className={`status-chip ${getScheduleClass(event.schedule_status)}`}>
                        {formatScheduleLabel(event.schedule_status)}
                      </span>
                      <span className={`status-chip ${getVisibilityClass(event.visibility)}`}>
                        {formatVisibilityLabel(event.visibility)}
                      </span>
                    </div>
                    <div className="member-event-archive-actions">
                      <button
                        className="secondary-button"
                        onClick={() => setSelectedEventId(event.id)}
                        type="button"
                      >
                        Event details
                      </button>
                      {event.official_link ? (
                        <a
                          className="primary-button"
                          href={event.official_link}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Official page
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="member-event-archive-copy">
                    <strong>{event.title}</strong>
                    <div className="member-event-archive-meta">
                      <span>{event.display_date || "Date pending"}</span>
                      <span>{event.location || "Location pending"}</span>
                      <span>
                        {event.organising_institutions.length
                          ? event.organising_institutions.join(", ")
                          : "Organiser pending"}
                      </span>
                    </div>
                    <p>{event.summary || "Event summary still being prepared."}</p>
                  </div>

                  {event.themes.length || event.patna_involvement ? (
                    <div className="member-event-archive-footer">
                      {event.themes.length ? (
                        <div className="member-directory-tag-row">
                          {event.themes.map((theme) => (
                            <span className="status-chip chip-neutral" key={theme}>
                              {theme}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="member-directory-footer-note">Themes still being added.</span>
                      )}
                      {event.patna_involvement ? (
                        <span className="member-directory-footer-note">{event.patna_involvement}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <article className="dashboard-card member-module-card">
            <h3>No events match the current filters</h3>
            <p className="member-section-copy">
              Try widening the schedule or type filters, or clear the search term.
            </p>
          </article>
        )}
      </div>

      {selectedEvent ? (
        <div
          aria-modal="true"
          className="member-event-overlay"
          onClick={() => setSelectedEventId("")}
          role="dialog"
        >
          <div
            className="member-event-dialog"
            onClick={(event) => event.stopPropagation()}
            role="document"
          >
            <div className={`member-event-dialog-head tone-${getEventTone(selectedEvent)}`}>
              <div>
                <div className="member-event-archive-chips">
                  <span className="status-chip chip-neutral">{getEventTypeLabel(selectedEvent)}</span>
                  <span className={`status-chip ${getScheduleClass(selectedEvent.schedule_status)}`}>
                    {formatScheduleLabel(selectedEvent.schedule_status)}
                  </span>
                  <span className={`status-chip ${getVisibilityClass(selectedEvent.visibility)}`}>
                    {formatVisibilityLabel(selectedEvent.visibility)}
                  </span>
                </div>
                <h3>{selectedEvent.title}</h3>
                <div className="member-event-dialog-meta">
                  <span>{selectedEvent.display_date || "Date pending"}</span>
                  {selectedEvent.location ? <span>{selectedEvent.location}</span> : null}
                  {selectedEvent.organising_institutions.length ? (
                    <span>{selectedEvent.organising_institutions.join(", ")}</span>
                  ) : null}
                </div>
              </div>
              <button
                aria-label="Close event details"
                className="member-event-close"
                onClick={() => setSelectedEventId("")}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="member-event-dialog-body">
              {selectedEvent.themes.length ? (
                <div className="member-directory-tag-row">
                  {selectedEvent.themes.map((theme) => (
                    <span className="status-chip chip-neutral" key={theme}>
                      {theme}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="member-event-detail-grid">
                <div className="member-detail-card">
                  <dt>About this event</dt>
                  <dd>{selectedEvent.body || selectedEvent.summary || "Summary pending."}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Organising institutions</dt>
                  <dd>
                    {selectedEvent.organising_institutions.length
                      ? selectedEvent.organising_institutions.join(", ")
                      : "Not recorded"}
                  </dd>
                </div>
                <div className="member-detail-card">
                  <dt>PATNA involvement</dt>
                  <dd>{selectedEvent.patna_involvement || "Not recorded"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Visibility</dt>
                  <dd>{formatVisibilityLabel(selectedEvent.visibility)}</dd>
                </div>
              </div>
            </div>

            <div className="member-event-dialog-actions">
              {selectedEvent.official_link ? (
                <a
                  className="primary-button"
                  href={selectedEvent.official_link}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open official page
                </a>
              ) : null}
              <button
                className="secondary-button"
                onClick={() => setSelectedEventId("")}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
