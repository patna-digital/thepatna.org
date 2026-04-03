"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

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
          day = `${start.getUTCDate()}–${end.getUTCDate()}`;
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
  const involvement = (event.patna_involvement || "").toLowerCase();
  return involvement.includes("lead organiser") || involvement.includes("co-organiser");
}

function isCurrentYearEvent(event) {
  if (event.starts_at) {
    const parsed = new Date(event.starts_at);
    return !Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() === new Date().getUTCFullYear();
  }

  const yearMatch = String(event.display_date || "").match(/(\d{4})/);
  return Number(yearMatch?.[1]) === new Date().getUTCFullYear();
}

function getEventTone(event) {
  if (isPatnaLedEvent(event)) {
    return "academic";
  }

  const type = getEventTypeLabel(event).toLowerCase();

  if (type.includes("imo") || type.includes("mepc") || type.includes("iswg")) {
    return "policy";
  }

  if (type.includes("cop") || type.includes("unfccc")) {
    return "policy";
  }

  if (type.includes("conference") || type.includes("summit")) {
    return "industry";
  }

  return "policy";
}

function formatScheduleLabel(status, t) {
  if (status === "tbc") return t("appEvents.tbc");
  return status === "upcoming" ? t("appEvents.scheduleUpcoming") : t("appEvents.schedulePast");
}

function getScheduleClass(status) {
  if (status === "upcoming") return "chip-success";
  if (status === "tbc") return "chip-warning";
  return "chip-muted";
}

export function MemberEventsClient({ events }) {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState(
    events.some((e) => e.schedule_status === "upcoming" || e.schedule_status === "tbc") ? "upcoming" : "past",
  );
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEventId, setSelectedEventId] = useState("");

  const typeFilters = useMemo(() => {
    const values = [...new Set(events.map((e) => getEventTypeLabel(e)))];
    return values.sort((a, b) => a.localeCompare(b));
  }, [events]);

  const summary = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((e) => e.schedule_status === "upcoming").length,
      upcomingAndTbc: events.filter((e) => e.schedule_status === "upcoming" || e.schedule_status === "tbc").length,
      past: events.filter((e) => e.schedule_status === "past").length,
      tbc: events.filter((e) => e.schedule_status === "tbc").length,
      thisYear: events.filter(isCurrentYearEvent).length,
      patnaLed: events.filter(isPatnaLedEvent).length,
    }),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      if (scheduleFilter === "upcoming" && event.schedule_status !== "upcoming" && event.schedule_status !== "tbc") {
        return false;
      }

      if (scheduleFilter === "past" && event.schedule_status !== "past") {
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
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId],
  );

  return (
    <div className="member-events-shell">
      <div className="member-events-stats-row">
        <div className="member-events-stat-card tone-policy">
          <div className="member-events-stat-icon">
            <svg fill="none" height="18" viewBox="0 0 20 20" width="18" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          </div>
          <strong>{summary.upcomingAndTbc}</strong>
          <span>{t("appEvents.upcomingEvents")}</span>
        </div>
        <div className="member-events-stat-card tone-academic">
          <div className="member-events-stat-icon">
            <svg fill="none" height="18" viewBox="0 0 20 20" width="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/>
            </svg>
          </div>
          <strong>{summary.patnaLed}</strong>
          <span>{t("appEvents.patnaOrganised")}</span>
        </div>
        <div className="member-events-stat-card tone-policy">
          <div className="member-events-stat-icon">
            <svg fill="none" height="18" viewBox="0 0 20 20" width="18" xmlns="http://www.w3.org/2000/svg">
              <rect height="13.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="14" x="3" y="4.75"/>
              <path d="M3 8.25h14" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 3v3.5M13 3v3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
            </svg>
          </div>
          <strong>{summary.past}</strong>
          <span>{t("appEvents.pastEvents")}</span>
        </div>
        <div className="member-events-stat-card tone-industry">
          <div className="member-events-stat-icon">
            <svg fill="none" height="18" viewBox="0 0 20 20" width="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2.5l2.45 4.97 5.48.8-3.97 3.87.94 5.46L10 15.05l-4.9 2.57.94-5.46L2.07 8.27l5.48-.8L10 2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5"/>
            </svg>
          </div>
          <strong>{summary.tbc}</strong>
          <span>{t("appEvents.tbcDates")}</span>
        </div>
      </div>

      <div className="member-events-filter-bar">
        <div className="member-events-schedule-tabs">
          <button
            className={scheduleFilter === "upcoming" ? "member-events-tab-active" : "member-events-tab"}
            onClick={() => setScheduleFilter("upcoming")}
            type="button"
          >
            {t("appEvents.tabUpcoming", { count: summary.upcomingAndTbc })}
          </button>
          <button
            className={scheduleFilter === "past" ? "member-events-tab-active" : "member-events-tab"}
            onClick={() => setScheduleFilter("past")}
            type="button"
          >
            {t("appEvents.tabPast", { count: summary.past })}
          </button>
        </div>

        <div className="member-events-type-chips">
          <button
            className={typeFilter === "all" ? "member-events-type-chip member-events-type-chip-active" : "member-events-type-chip"}
            onClick={() => setTypeFilter("all")}
            type="button"
          >
            {t("appEvents.filterAll")}
          </button>
          {typeFilters.map((type) => (
            <button
              className={typeFilter === type ? "member-events-type-chip member-events-type-chip-active" : "member-events-type-chip"}
              key={type}
              onClick={() => setTypeFilter(type)}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="member-events-list">
        {filteredEvents.length ? (
          filteredEvents.map((event) => {
            const dateInfo = getEventDateInfo(event);
            const tone = getEventTone(event);
            const typeLabel = getEventTypeLabel(event);

            return (
              <article className={`member-event-archive-card tone-${tone}`} key={event.id}>
                <div className={`member-event-archive-date tone-${tone}`}>
                  <strong>{dateInfo.month}</strong>
                  <span>{dateInfo.day}</span>
                </div>

                <div className="member-event-archive-body">
                  <div className="member-event-archive-top">
                    <div className="member-event-archive-chips">
                      <span className={`status-chip member-event-type-chip-${tone}`}>{typeLabel}</span>
                      <span className={`status-chip ${getScheduleClass(event.schedule_status)}`}>
                        {formatScheduleLabel(event.schedule_status, t)}
                      </span>
                    </div>
                    <div className="member-event-archive-actions">
                      <button
                        className="member-event-details-button"
                        onClick={() => setSelectedEventId(event.id)}
                        type="button"
                      >
                        {t("appEvents.detailsBtn")}
                      </button>
                      {event.schedule_status === "upcoming" && event.official_link ? (
                        <a
                          className="member-event-rsvp-button"
                          href={event.official_link}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {t("appEvents.rsvpBtn")}
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="member-event-archive-copy">
                    <strong>{event.title}</strong>
                    <div className="member-event-archive-meta">
                      {event.display_date ? <span>{event.display_date}</span> : null}
                      {event.location ? <span>{event.location}</span> : null}
                      {isPatnaLedEvent(event) ? <span>{event.patna_involvement}</span> : null}
                    </div>
                    {event.summary ? <p>{event.summary}</p> : null}
                  </div>

                  {event.themes?.length ? (
                    <div className="member-event-archive-tags">
                      {event.themes.slice(0, 4).map((theme) => (
                        <span className="status-chip chip-neutral" key={theme}>
                          {theme}
                        </span>
                      ))}
                      {event.themes.length > 4 ? (
                        <span className="status-chip chip-muted">+{event.themes.length - 4}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <article className="dashboard-card member-module-card">
            <h3>{t("appEvents.noMatchTitle")}</h3>
            <p className="member-section-copy">{t("appEvents.noMatchText")}</p>
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
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className={`member-event-dialog-head tone-${getEventTone(selectedEvent)}`}>
              <div className="member-event-dialog-head-content">
                <div className="member-event-archive-chips">
                  <span className="status-chip member-event-dialog-type-chip">{getEventTypeLabel(selectedEvent)}</span>
                  <span className={`status-chip member-event-dialog-type-chip ${getScheduleClass(selectedEvent.schedule_status)}`}>
                    {formatScheduleLabel(selectedEvent.schedule_status, t)}
                  </span>
                </div>
                <h3>{selectedEvent.title}</h3>
                <div className="member-event-dialog-meta">
                  {selectedEvent.display_date ? (
                    <span>
                      <svg fill="none" height="13" viewBox="0 0 16 16" width="13" xmlns="http://www.w3.org/2000/svg"><rect height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" width="12" x="2" y="3.5"/><path d="M2 7h12" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 2v3M10.5 2v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3"/></svg>
                      {selectedEvent.display_date}
                    </span>
                  ) : null}
                  {selectedEvent.location ? (
                    <span>
                      <svg fill="none" height="13" viewBox="0 0 16 16" width="13" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3.75-4.5 8.5-4.5 8.5S3.5 9.75 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="6" fill="currentColor" r="1.5"/></svg>
                      {selectedEvent.location}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                aria-label={t("appEvents.dialogClose")}
                className="member-event-close"
                onClick={() => setSelectedEventId("")}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="member-event-dialog-body">
              {selectedEvent.themes?.length ? (
                <div className="member-directory-tag-row">
                  {selectedEvent.themes.map((theme) => (
                    <span className="status-chip chip-neutral" key={theme}>
                      {theme}
                    </span>
                  ))}
                </div>
              ) : null}

              {(selectedEvent.body || selectedEvent.summary) ? (
                <div className="member-event-detail-section">
                  <dt>{t("appEvents.dialogAbout")}</dt>
                  <dd>{selectedEvent.body || selectedEvent.summary}</dd>
                </div>
              ) : null}

              {selectedEvent.organising_institutions?.length ? (
                <div className="member-event-detail-section">
                  <dt>{t("appEvents.dialogInstitutions")}</dt>
                  <dd>{selectedEvent.organising_institutions.join(" · ")}</dd>
                </div>
              ) : null}

              {selectedEvent.patna_involvement ? (
                <div className="member-event-detail-section">
                  <dt>{t("appEvents.dialogPatnaInvolvement")}</dt>
                  <dd>{selectedEvent.patna_involvement}</dd>
                </div>
              ) : null}
            </div>

            <div className="member-event-dialog-actions">
              {selectedEvent.official_link ? (
                <a
                  className="primary-button"
                  href={selectedEvent.official_link}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("appEvents.dialogOfficialPage")}
                </a>
              ) : null}
              <button
                className="secondary-button"
                onClick={() => setSelectedEventId("")}
                type="button"
              >
                {t("appEvents.dialogCloseBtn")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
