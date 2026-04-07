"use client";

import { useMemo, useState, useEffect, useRef, useTransition } from "react";
import {
  createLocalDateFromKey,
  eventOccursInMonth,
  eventOccursInYear,
  formatEventTimeLabel,
  getCalendarDays,
  getDateKeysForEvent,
  getDisplayRangeForEvent,
  getNextMonth,
  getPreviousMonth,
  groupEventsByDate,
  toLocalDateKey,
} from "@/lib/calendar/core";
import { getConferenceCtaLabel } from "@/lib/calendar/conference";
import { setEventRsvp } from "../../app/app/calendar/actions";
import "./calendar-styles.css";

// ── helpers ────────────────────────────────────────────────────────────────────

function eventsForMonth(events, year, month) {
  return events.filter((event) => eventOccursInMonth(event, year, month));
}

function formatTime(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
}

function formatEventDate(event) {
  if (!event.starts_at) return event.display_date || "Date TBC";

  const { start, end } = getDisplayRangeForEvent(event);
  if (!start || !end) return event.display_date || "Date TBC";

  const dayFormatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = formatEventTimeLabel(event);

  if (event.is_all_day) {
    const startLabel = dayFormatter.format(start);
    const endLabel = dayFormatter.format(end);
    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  }

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;
  const startLabel = dayFormatter.format(startDate);

  if (!timeLabel) {
    return startLabel;
  }

  if (endDate && toLocalDateKey(startDate) !== toLocalDateKey(endDate)) {
    return `${startLabel} ${formatTime(event.starts_at)} – ${dayFormatter.format(endDate)} ${formatTime(event.ends_at)}`;
  }

  return `${startLabel} · ${timeLabel}`;
}

function formatDateFromKey(dateKey, options) {
  const date = createLocalDateFromKey(dateKey);
  return date ? new Intl.DateTimeFormat("en-GB", options).format(date) : "";
}

// Event type tag config
const EVENT_TYPE_CONFIG = {
  // Community event_type values
  policy:     { label: "Policy",       color: "#0369a1", bg: "rgba(3,105,161,0.1)" },
  academic:   { label: "Academic",     color: "#166534", bg: "rgba(22,101,52,0.1)" },
  industry:   { label: "Industry",     color: "#92400e", bg: "rgba(146,64,14,0.1)" },
  workshop:   { label: "Workshop",     color: "#6b21a8", bg: "rgba(107,33,168,0.1)" },
  conference: { label: "Conference",   color: "#0f5fa3", bg: "rgba(15,95,163,0.1)" },
  webinar:    { label: "Webinar",      color: "#0e7490", bg: "rgba(14,116,144,0.1)" },
  meeting:    { label: "Meeting",      color: "#334155", bg: "rgba(51,65,85,0.1)" },
  // sources
  personal:   { label: "Meeting",      color: "#334155", bg: "rgba(51,65,85,0.1)" },
  external:   { label: "External",     color: "#6b21a8", bg: "rgba(107,33,168,0.1)" },
  community:  { label: "Event",        color: "#0e7490", bg: "rgba(14,116,144,0.1)" },
};

function getEventTypeConfig(event) {
  if (event.event_source === "personal") return EVENT_TYPE_CONFIG.personal;
  if (event.event_source === "external") return EVENT_TYPE_CONFIG.external;
  const t = (event.event_type || "").toLowerCase();
  return EVENT_TYPE_CONFIG[t] || EVENT_TYPE_CONFIG.community;
}

function getEventTypeLabel(event) {
  if (event.event_source === "personal") {
    const mt = event.meeting_type;
    if (mt === "consultation") return { ...EVENT_TYPE_CONFIG.meeting, label: "Consultation" };
    if (mt === "group") return { ...EVENT_TYPE_CONFIG.meeting, label: "Group Meeting" };
    return EVENT_TYPE_CONFIG.meeting;
  }
  if (event.event_source === "external") {
    return { ...EVENT_TYPE_CONFIG.external, label: event.event_type_label || "External" };
  }
  return getEventTypeConfig(event);
}

function getOrganizerName(event) {
  return event.organizer?.displayName || event.organizer?.name || null;
}

// ── sub-components ─────────────────────────────────────────────────────────────

function TypeTag({ event }) {
  const cfg = getEventTypeLabel(event);
  return (
    <span
      className="cal-type-tag"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function SourceBadge({ event }) {
  if (!event.source_label) {
    return null;
  }

  return (
    <span className={`cal-source-badge ${event.event_source || "community"}`}>
      {event.source_label}
    </span>
  );
}

function EventCard({ event, isExpanded, onToggle, onRsvp, isPending }) {
  const isRsvped = Boolean(event.is_rsvped);
  const isCommunity = event.event_source === "community";
  const isExternal = event.event_source === "external";
  const isPersonal = event.event_source === "personal";

  return (
    <div className={`cal-event-item ${isExpanded ? "expanded" : ""}`}>
      <button className="cal-event-row" onClick={onToggle} type="button">
        <TypeTag event={event} />
        <span className="cal-event-row-main">
          <span className="cal-event-row-title">{event.title}</span>
          <SourceBadge event={event} />
        </span>
        <span className="cal-event-row-date">{formatEventDate(event)}</span>
        {isCommunity && isRsvped && <span className="cal-rsvped-dot" title="Attending" />}
        <svg
          className={`cal-chevron ${isExpanded ? "open" : ""}`}
          fill="none"
          height="14"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="14"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="cal-event-detail">
          <div className="cal-event-detail-header">
            <TypeTag event={event} />
            {isCommunity && isRsvped && (
              <span className="cal-event-rsvped-badge">Attending</span>
            )}
          </div>

          <h4 className="cal-event-detail-title">{event.title}</h4>

          <dl className="cal-event-detail-meta">
            <div>
              <dt>When</dt>
              <dd>{formatEventDate(event)}</dd>
            </div>
            {event.source_label && (
              <div>
                <dt>Source</dt>
                <dd>
                  {event.source_label}
                  {event.source_detail ? ` · ${event.source_detail}` : ""}
                </dd>
              </div>
            )}
            {event.location && (
              <div>
                <dt>Where</dt>
                <dd>{event.location}</dd>
              </div>
            )}
            {event.location_type && !event.location && (
              <div>
                <dt>Format</dt>
                <dd style={{ textTransform: "capitalize" }}>{event.location_type.replace("_", " ")}</dd>
              </div>
            )}
            {getOrganizerName(event) && (
              <div>
                <dt>Organiser</dt>
                <dd>{getOrganizerName(event)}</dd>
              </div>
            )}
            {isPersonal && event.booker_name && (
              <div>
                <dt>With</dt>
                <dd>{event.booker_name}{event.booker_organisation ? ` · ${event.booker_organisation}` : ""}</dd>
              </div>
            )}
            {Array.isArray(event.attendees) && event.attendees.length > 0 && (
              <div>
                <dt>Attendees</dt>
                <dd>{event.attendees.length} invited</dd>
              </div>
            )}
          </dl>

          {event.summary && <p className="cal-event-detail-summary">{event.summary}</p>}
          {event.description && event.event_source !== "community" && (
            <p className="cal-event-detail-summary">{event.description}</p>
          )}

          <div className="cal-event-detail-actions">
            {isCommunity && !isRsvped && (
              <button
                className="primary-button"
                disabled={isPending}
                onClick={(e) => { e.stopPropagation(); onRsvp(event.id); }}
                type="button"
              >
                {isPending ? "Saving…" : "RSVP"}
              </button>
            )}
            {isCommunity && isRsvped && (
              <span className="cal-event-detail-status confirmed">Added to your calendar</span>
            )}
            {isPersonal && (
              <span className="cal-event-detail-status confirmed">Booking confirmed</span>
            )}
            {isExternal && (
              <span className="cal-event-detail-status external">From connected calendar</span>
            )}
            {event.official_link && (
              <a
                className="secondary-button"
                href={event.official_link}
                rel="noreferrer"
                target="_blank"
              >
                Event page
              </a>
            )}
            {event.meeting_url && (
              <a
                className="secondary-button"
                href={event.meeting_url}
                rel="noreferrer"
                target="_blank"
              >
                {getConferenceCtaLabel(event.meeting_provider)}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EventList({
  events,
  pendingEventIds,
  onRsvp,
  expandedId: controlledExpandedId,
  onExpandedIdChange,
  emptyMessage = "No scheduled items this month.",
}) {
  const [uncontrolledExpandedId, setUncontrolledExpandedId] = useState(null);
  const isControlled = controlledExpandedId !== undefined;
  const expandedId = isControlled ? controlledExpandedId : uncontrolledExpandedId;

  useEffect(() => {
    if (isControlled) {
      return;
    }
    setUncontrolledExpandedId((current) =>
      events.some((event) => event.id === current) ? current : null
    );
  }, [events, isControlled]);

  function toggle(id) {
    const nextId = expandedId === id ? null : id;
    if (!isControlled) {
      setUncontrolledExpandedId(nextId);
    }
    onExpandedIdChange?.(nextId);
  }

  if (!events.length) {
    return <p className="cal-empty">{emptyMessage}</p>;
  }

  return (
    <div className="cal-event-list">
      {events.map((event) => (
        <EventCard
          event={event}
          isPending={pendingEventIds.includes(event.id)}
          isExpanded={expandedId === event.id}
          key={event.id}
          onRsvp={onRsvp}
          onToggle={() => toggle(event.id)}
        />
      ))}
    </div>
  );
}

function DayEventsModal({
  dayKey,
  events,
  expandedId,
  onExpandedIdChange,
  pendingEventIds,
  onClose,
  onRsvp,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = dayKey ? `cal-day-modal-title-${dayKey}` : "cal-day-modal-title";
  const dayLabel = formatDateFromKey(dayKey, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="cal-day-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="cal-day-modal"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="cal-day-modal-header">
          <div className="cal-day-modal-header-copy">
            <p className="cal-day-modal-kicker">
              {events.length} {events.length === 1 ? "item" : "items"} scheduled
            </p>
            <h3 className="cal-day-modal-title" id={titleId}>
              {dayLabel}
            </h3>
          </div>
          <button
            aria-label="Close event list"
            className="cal-day-modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="cal-day-modal-body">
          <EventList
            emptyMessage="No scheduled items on this day."
            events={events}
            expandedId={expandedId}
            onExpandedIdChange={onExpandedIdChange}
            onRsvp={onRsvp}
            pendingEventIds={pendingEventIds}
          />
        </div>
      </div>
    </div>
  );
}

// ── Month view ─────────────────────────────────────────────────────────────────

function MonthView({ year, month, events, filter, pendingEventIds, onRsvp, onBack, onMonthChange }) {
  const days = useMemo(() => getCalendarDays(month, year), [month, year]);
  const monthEvents = useMemo(() => eventsForMonth(events, year, month), [events, year, month]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const selectedDayTriggerRef = useRef(null);

  // Reset selection when the month changes
  useEffect(() => {
    setSelectedDay(null);
    setExpandedEventId(null);
    selectedDayTriggerRef.current = null;
  }, [month, year]);

  const filteredEvents = useMemo(() => {
    if (filter === "community") return monthEvents.filter((e) => e.event_source === "community");
    if (filter === "rsvped") return monthEvents.filter((e) => e.event_source === "community" && e.is_rsvped);
    return monthEvents;
  }, [monthEvents, filter]);

  const eventsByDate = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);
  const selectedDayEvents = useMemo(
    () => (selectedDay ? (eventsByDate[selectedDay] || []) : []),
    [eventsByDate, selectedDay],
  );

  const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);
  const { month: nextMonth, year: nextYear } = getNextMonth(month, year);

  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(year, month, 1));

  useEffect(() => {
    if (!selectedDay) {
      setExpandedEventId(null);
      return;
    }

    if (!selectedDayEvents.length) {
      setSelectedDay(null);
      setExpandedEventId(null);
      selectedDayTriggerRef.current = null;
      return;
    }

    setExpandedEventId((current) =>
      current && selectedDayEvents.some((event) => event.id === current)
        ? current
        : selectedDayEvents[0]?.id || null
    );
  }, [selectedDay, selectedDayEvents]);

  function closeDayModal({ restoreFocus = true } = {}) {
    const trigger = selectedDayTriggerRef.current;
    setSelectedDay(null);
    setExpandedEventId(null);
    selectedDayTriggerRef.current = null;

    if (restoreFocus && trigger && typeof trigger.focus === "function") {
      requestAnimationFrame(() => {
        trigger.focus();
      });
    }
  }

  function handleDayClick(dayKey, dayEvents, triggerElement) {
    if (!dayEvents.length) {
      return;
    }

    selectedDayTriggerRef.current = triggerElement;
    setSelectedDay(dayKey);
    setExpandedEventId((current) =>
      dayKey === selectedDay && current ? current : dayEvents[0]?.id || null
    );
  }

  return (
    <div className="cal-month-view">
      {/* Header */}
      <div className="cal-month-header">
        <button className="cal-back-btn" onClick={onBack} type="button">
          ← {year} year view
        </button>
        <div className="cal-month-nav">
          <button
            className="cal-nav-btn"
            onClick={() => onMonthChange(prevMonth, prevYear)}
            type="button"
          >
            ←
          </button>
          <h2 className="cal-month-title">{monthLabel}</h2>
          <button
            className="cal-nav-btn"
            onClick={() => onMonthChange(nextMonth, nextYear)}
            type="button"
          >
            →
          </button>
        </div>
        <span className="cal-month-count">
          {selectedDay ? (
            <>
              Viewing {selectedDayEvents.length} {selectedDayEvents.length === 1 ? "item" : "items"} on{" "}
              {formatDateFromKey(selectedDay, { day: "numeric", month: "short" })}
            </>
          ) : (
            <>{filteredEvents.length} {filteredEvents.length === 1 ? "item" : "items"}</>
          )}
        </span>
      </div>

      {/* Day grid */}
      <div className="cal-grid-card">
        <div className="cal-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="cal-days-grid">
          {days.map(({ date, isCurrentMonth, isToday }) => {
            const k = toLocalDateKey(date);
            const dayEvents = eventsByDate[k] || [];
            const isSelected = selectedDay === k;
            return (
              <div
                className={`cal-day ${isCurrentMonth ? "current" : "other"} ${isToday ? "today" : ""} ${dayEvents.length ? "has-events" : ""} ${isSelected ? "selected" : ""}`}
                key={k}
                aria-expanded={dayEvents.length ? isSelected : undefined}
                aria-haspopup={dayEvents.length ? "dialog" : undefined}
                onClick={(event) => handleDayClick(k, dayEvents, event.currentTarget)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleDayClick(k, dayEvents, event.currentTarget);
                  }
                }}
              >
                <span className="cal-day-num">{date.getDate()}</span>
                {dayEvents.length > 0 && (
                  <div className="cal-day-event-labels">
                    {dayEvents.slice(0, 3).map((e) => {
                      const cfg = getEventTypeLabel(e);
                      return (
                        <span
                          className="cal-day-event-label"
                          key={e.id}
                          style={{ background: cfg.bg, color: cfg.color }}
                          title={e.title}
                        >
                          {e.title}
                        </span>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="cal-day-label-more">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && selectedDayEvents.length > 0 ? (
        <DayEventsModal
          dayKey={selectedDay}
          events={selectedDayEvents}
          expandedId={expandedEventId}
          onClose={() => closeDayModal()}
          onExpandedIdChange={setExpandedEventId}
          onRsvp={onRsvp}
          pendingEventIds={pendingEventIds}
        />
      ) : null}
    </div>
  );
}

// ── Year view ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function YearView({ year, events, filter, onYearChange, onMonthSelect }) {
  const yearEvents = useMemo(
    () => events.filter((event) => eventOccursInYear(event, year)),
    [events, year],
  );

  const filteredYearEvents = useMemo(() => {
    if (filter === "community") return yearEvents.filter((e) => e.event_source === "community");
    if (filter === "rsvped") return yearEvents.filter((e) => e.event_source === "community" && e.is_rsvped);
    return yearEvents;
  }, [yearEvents, filter]);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return (
    <div className="cal-year-view">
      <div className="cal-year-nav-row">
        <button className="cal-nav-btn" onClick={() => onYearChange(year - 1)} type="button">← {year - 1}</button>
        <h2 className="cal-year-title">{year}</h2>
        <button className="cal-nav-btn" onClick={() => onYearChange(year + 1)} type="button">{year + 1} →</button>
      </div>

      <div className="cal-year-grid">
        {Array.from({ length: 12 }, (_, m) => {
          const monthEvts = eventsForMonth(filteredYearEvents, year, m);
          const isCurrentMonth = year === currentYear && m === currentMonth;

          // collect day keys with events for mini dots
          const dotDays = [
            ...new Set(
              monthEvts.flatMap((event) =>
                getDateKeysForEvent(event)
                  .map((dateKey) => createLocalDateFromKey(dateKey))
                  .filter((date) => date && date.getFullYear() === year && date.getMonth() === m)
                  .map((date) => date.getDate())
              )
            ),
          ].slice(0, 7);

          return (
            <button
              className={`cal-year-month-card ${isCurrentMonth ? "current-month" : ""}`}
              key={m}
              onClick={() => onMonthSelect(m)}
              type="button"
            >
              <div className="cal-year-month-label">
                <span className="cal-year-month-name">{MONTH_NAMES[m]}</span>
                {monthEvts.length > 0 && (
                  <span className="cal-year-month-count">{monthEvts.length}</span>
                )}
              </div>
              {dotDays.length > 0 ? (
                <div className="cal-year-dot-row">
                  {dotDays.map((day) => (
                    <span className="cal-year-dot" key={day} />
                  ))}
                  {monthEvts.length > 7 && (
                    <span className="cal-year-dot-overflow">+{monthEvts.length - 7}</span>
                  )}
                </div>
              ) : (
                <span className="cal-year-month-empty">No items</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main shell ─────────────────────────────────────────────────────────────────

export function CalendarShell({ initialEvents = [], initialWarning = "", initialYear, isAdmin = false }) {
  const today = new Date();
  const [view, setView] = useState("month");
  const [selectedYear, setSelectedYear] = useState(initialYear || today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState(initialEvents);
  const [warning] = useState(initialWarning);
  const [pendingEventIds, setPendingEventIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [, startTransition] = useTransition();

  const summary = useMemo(() => {
    const yr = events.filter((event) => eventOccursInYear(event, selectedYear));
    return {
      total: yr.length,
      community: yr.filter((e) => e.event_source === "community").length,
      rsvped: yr.filter((e) => e.event_source === "community" && e.is_rsvped).length,
      external: yr.filter((e) => e.event_source === "external").length,
    };
  }, [events, selectedYear]);

  function handleRsvp(eventId) {
    if (pendingEventIds.includes(eventId)) return;
    setNotice("");
    setPendingEventIds((c) => [...c, eventId]);
    startTransition(() => {
      void (async () => {
        const result = await setEventRsvp(eventId);
        setPendingEventIds((c) => c.filter((v) => v !== eventId));
        if (!result.success) {
          setNotice(result.error || "Could not save your RSVP right now.");
          return;
        }
        setEvents((c) => c.map((e) => e.id === eventId ? { ...e, is_rsvped: true } : e));
        setNotice("RSVP saved.");
      })();
    });
  }

  function openMonth(month, year) {
    setSelectedMonth(month);
    setSelectedYear(year);
    setView("month");
  }

  function goToYear() {
    setView("year");
  }

  return (
    <div className="cal-shell">
      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <div className="cal-view-toggle">
            <button
              className={view === "year" ? "active" : ""}
              onClick={goToYear}
              type="button"
            >
              Year
            </button>
            <button
              className={view === "month" ? "active" : ""}
              onClick={() => setView("month")}
              type="button"
            >
              Month
            </button>
          </div>
        </div>

        <div className="cal-filter-row">
          {[
            { id: "all", label: "All" },
            { id: "community", label: "Events" },
            { id: "rsvped", label: "My RSVPs" },
          ].map((f) => (
            <button
              className={`cal-filter-btn ${filter === f.id ? "active" : ""}`}
              key={f.id}
              onClick={() => setFilter(f.id)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="cal-summary">
        <div className="cal-summary-tile">
          <strong>{summary.total}</strong>
          <span>{selectedYear} items</span>
        </div>
        <div className="cal-summary-tile">
          <strong>{summary.community}</strong>
          <span>Community events</span>
        </div>
        <div className="cal-summary-tile">
          <strong>{summary.rsvped}</strong>
          <span>RSVP&apos;d</span>
        </div>
        <div className="cal-summary-tile">
          <strong>{summary.external}</strong>
          <span>External events</span>
        </div>
      </div>

      {/* Notices */}
      {warning && (
        <div className="cal-notice warning">{warning}</div>
      )}
      {notice && (
        <div className="cal-notice">{notice}</div>
      )}
      {isAdmin && (
        <div className="cal-admin-note">
          You are automatically RSVP&apos;d for all community events as an administrator.
        </div>
      )}

      {/* Views */}
      {view === "year" ? (
        <YearView
          events={events}
          filter={filter}
          onMonthSelect={(m) => openMonth(m, selectedYear)}
          onYearChange={setSelectedYear}
          year={selectedYear}
        />
      ) : (
        <MonthView
          events={events}
          filter={filter}
          month={selectedMonth}
          onBack={goToYear}
          onMonthChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
          onRsvp={handleRsvp}
          pendingEventIds={pendingEventIds}
          year={selectedYear}
        />
      )}

    </div>
  );
}
