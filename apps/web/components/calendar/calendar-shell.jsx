"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDate, getCalendarDays, getMonthName, getNextMonth, getPreviousMonth } from "@/lib/calendar/core";
import { setEventRsvp } from "../../app/app/calendar/actions";

// ── helpers ────────────────────────────────────────────────────────────────────

function dateKey(value) {
  return new Date(value).toISOString().split("T")[0];
}

function eventsForMonth(events, year, month) {
  return events.filter((e) => {
    const d = new Date(e.starts_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function formatTime(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
}

function formatEventDate(event) {
  if (!event.starts_at) return event.display_date || "Date TBC";
  const start = new Date(event.starts_at);
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(start);
  const time = formatTime(event.starts_at);
  const endTime = event.ends_at ? formatTime(event.ends_at) : null;
  if (!time) return day;
  return endTime ? `${day} · ${time} – ${endTime}` : `${day} · ${time}`;
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

function EventCard({ event, isExpanded, onToggle, onRsvp, isPending }) {
  const isRsvped = Boolean(event.is_rsvped);
  const isCommunity = event.event_source === "community";
  const isExternal = event.event_source === "external";
  const isPersonal = event.event_source === "personal";

  return (
    <div className={`cal-event-item ${isExpanded ? "expanded" : ""}`}>
      <button className="cal-event-row" onClick={onToggle} type="button">
        <TypeTag event={event} />
        <span className="cal-event-row-title">{event.title}</span>
        <span className="cal-event-row-date">{formatEventDate(event)}</span>
        {isCommunity && isRsvped && <span className="cal-rsvped-dot" title="RSVP'd" />}
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
              <span className="cal-event-rsvped-badge">RSVP&apos;d</span>
            )}
          </div>

          <h4 className="cal-event-detail-title">{event.title}</h4>

          <dl className="cal-event-detail-meta">
            <div>
              <dt>When</dt>
              <dd>{formatEventDate(event)}</dd>
            </div>
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
            {isExternal && event.connection?.provider && (
              <div>
                <dt>Source</dt>
                <dd>{event.event_type_label}</dd>
              </div>
            )}
            {event.organizer?.displayName && (
              <div>
                <dt>Organiser</dt>
                <dd>{event.organizer.displayName}</dd>
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
          </div>
        </div>
      )}
    </div>
  );
}

function EventList({ events, pendingEventIds, onRsvp }) {
  const [expandedId, setExpandedId] = useState(null);

  function toggle(id) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  if (!events.length) {
    return <p className="cal-empty">No scheduled items this month.</p>;
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

// ── Month view ─────────────────────────────────────────────────────────────────

function MonthView({ year, month, events, filter, pendingEventIds, onRsvp, onBack, onMonthChange }) {
  const days = useMemo(() => getCalendarDays(month, year), [month, year]);
  const monthEvents = useMemo(() => eventsForMonth(events, year, month), [events, year, month]);

  const filteredEvents = useMemo(() => {
    if (filter === "community") return monthEvents.filter((e) => e.event_source === "community");
    if (filter === "rsvped") return monthEvents.filter((e) => e.event_source === "community" && e.is_rsvped);
    return monthEvents;
  }, [monthEvents, filter]);

  const eventsByDate = useMemo(() =>
    filteredEvents.reduce((acc, e) => {
      const k = dateKey(e.starts_at);
      acc[k] = acc[k] || [];
      acc[k].push(e);
      return acc;
    }, {}),
  [filteredEvents]);

  const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);
  const { month: nextMonth, year: nextYear } = getNextMonth(month, year);

  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(year, month, 1));

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
          {filteredEvents.length} {filteredEvents.length === 1 ? "item" : "items"}
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
            const k = dateKey(date);
            const dayEvents = eventsByDate[k] || [];
            return (
              <div
                className={`cal-day ${isCurrentMonth ? "current" : "other"} ${isToday ? "today" : ""} ${dayEvents.length ? "has-events" : ""}`}
                key={k}
              >
                <span className="cal-day-num">{date.getDate()}</span>
                {dayEvents.length > 0 && (
                  <div className="cal-day-dots">
                    {dayEvents.slice(0, 3).map((e) => {
                      const cfg = getEventTypeLabel(e);
                      return (
                        <span
                          className="cal-day-dot"
                          key={e.id}
                          style={{ background: cfg.color }}
                          title={e.title}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="cal-day-dot-more">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      <EventList events={filteredEvents} onRsvp={onRsvp} pendingEventIds={pendingEventIds} />
    </div>
  );
}

// ── Year view ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function YearView({ year, events, filter, onYearChange, onMonthSelect }) {
  const yearEvents = useMemo(
    () => events.filter((e) => new Date(e.starts_at).getFullYear() === year),
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
          const dotDays = [...new Set(monthEvts.map((e) => new Date(e.starts_at).getDate()))].slice(0, 7);

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

export function CalendarShell({ initialEvents = [], initialYear, isAdmin = false }) {
  const today = new Date();
  const [view, setView] = useState("year");
  const [selectedYear, setSelectedYear] = useState(initialYear || today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState(initialEvents);
  const [pendingEventIds, setPendingEventIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [, startTransition] = useTransition();

  const summary = useMemo(() => {
    const yr = events.filter((e) => new Date(e.starts_at).getFullYear() === selectedYear);
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

      <style jsx>{`
        /* ── Shell ────────────────────────────────── */
        .cal-shell {
          display: grid;
          gap: 1rem;
        }

        /* ── Toolbar ──────────────────────────────── */
        .cal-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cal-toolbar-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cal-view-toggle {
          display: inline-flex;
          border: 1px solid var(--border);
          border-radius: 999px;
          overflow: hidden;
        }

        .cal-view-toggle button {
          padding: 0.45rem 1.05rem;
          font-size: var(--text-sm);
          font-weight: 500;
          background: var(--white);
          color: var(--ink-soft);
          border: none;
          cursor: pointer;
          transition: background 0.14s, color 0.14s;
        }

        .cal-view-toggle button.active {
          background: var(--ink);
          color: var(--white);
        }

        .cal-filter-row {
          display: inline-flex;
          gap: 0.4rem;
        }

        .cal-filter-btn {
          padding: 0.45rem 1rem;
          font-size: var(--text-sm);
          font-weight: 500;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--white);
          color: var(--ink-soft);
          cursor: pointer;
          transition: border-color 0.14s, background 0.14s, color 0.14s;
        }

        .cal-filter-btn.active {
          background: var(--ink);
          color: var(--white);
          border-color: var(--ink);
        }

        /* ── Summary tiles ────────────────────────── */
        .cal-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .cal-summary-tile {
          padding: 1rem 1.1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--white);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .cal-summary-tile strong {
          font-size: 1.65rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1;
        }

        .cal-summary-tile span {
          font-size: var(--text-sm);
          color: var(--ink-soft);
        }

        /* ── Notice / admin note ─────────────────── */
        .cal-notice {
          padding: 0.8rem 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(14, 116, 144, 0.25);
          background: rgba(14, 116, 144, 0.07);
          font-size: var(--text-sm);
          color: #0e7490;
        }

        .cal-admin-note {
          padding: 0.7rem 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background: var(--white);
          font-size: var(--text-sm);
          color: var(--ink-soft);
        }

        /* ── Year view ────────────────────────────── */
        .cal-year-view {
          display: grid;
          gap: 1rem;
        }

        .cal-year-nav-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: center;
        }

        .cal-year-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0;
          min-width: 5ch;
          text-align: center;
        }

        .cal-nav-btn {
          padding: 0.45rem 0.95rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--white);
          color: var(--ink);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.14s, background 0.14s;
        }

        .cal-nav-btn:hover {
          border-color: rgba(14, 116, 144, 0.35);
          background: rgba(14, 116, 144, 0.06);
        }

        .cal-year-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .cal-year-month-card {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--white);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.14s, box-shadow 0.14s, transform 0.1s;
        }

        .cal-year-month-card:hover {
          border-color: rgba(14, 116, 144, 0.4);
          box-shadow: 0 4px 16px rgba(14, 116, 144, 0.1);
          transform: translateY(-1px);
        }

        .cal-year-month-card.current-month {
          border-color: rgba(14, 116, 144, 0.45);
          background: linear-gradient(135deg, rgba(14, 116, 144, 0.05), var(--white));
        }

        .cal-year-month-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.55rem;
        }

        .cal-year-month-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--ink);
        }

        .cal-year-month-count {
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(14, 116, 144, 0.12);
          color: #0e7490;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
        }

        .cal-year-dot-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          align-items: center;
        }

        .cal-year-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(14, 116, 144, 0.5);
          flex-shrink: 0;
        }

        .cal-year-dot-overflow {
          font-size: 10px;
          color: var(--ink-soft);
        }

        .cal-year-month-empty {
          font-size: var(--text-xs);
          color: var(--ink-soft);
        }

        /* ── Month view ───────────────────────────── */
        .cal-month-view {
          display: grid;
          gap: 1rem;
        }

        .cal-month-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cal-back-btn {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--ink-soft);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.35rem 0.6rem;
          border-radius: var(--radius-sm);
          transition: color 0.12s, background 0.12s;
        }

        .cal-back-btn:hover {
          color: var(--ink);
          background: rgba(148, 163, 184, 0.12);
        }

        .cal-month-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cal-month-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0;
          min-width: 16ch;
          text-align: center;
        }

        .cal-month-count {
          font-size: var(--text-sm);
          color: var(--ink-soft);
          white-space: nowrap;
        }

        /* ── Day grid ─────────────────────────────── */
        .cal-grid-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          background: var(--white);
          overflow: hidden;
          padding: 1.1rem;
        }

        .cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          margin-bottom: 0.5rem;
        }

        .cal-weekdays span {
          text-align: center;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-soft);
          padding: 0.3rem 0;
        }

        .cal-days-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 0.3rem;
        }

        .cal-day {
          min-height: 5rem;
          padding: 0.4rem;
          border-radius: 0.75rem;
          border: 1px solid transparent;
          transition: border-color 0.12s, background 0.12s;
        }

        .cal-day.current {
          background: rgba(248, 250, 253, 1);
          border-color: rgba(209, 228, 245, 0.5);
        }

        .cal-day.other {
          opacity: 0.35;
        }

        .cal-day.today {
          border-color: rgba(14, 116, 144, 0.5);
          background: rgba(14, 116, 144, 0.06);
        }

        .cal-day.has-events {
          border-color: rgba(14, 116, 144, 0.2);
        }

        .cal-day-num {
          display: inline-flex;
          width: 1.7rem;
          height: 1.7rem;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--ink);
        }

        .today .cal-day-num {
          background: var(--ink);
          color: var(--white);
        }

        .cal-day-dots {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          margin-top: 0.3rem;
        }

        .cal-day-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          flex-shrink: 0;
          opacity: 0.85;
        }

        .cal-day-dot-more {
          font-size: 9px;
          color: var(--ink-soft);
          line-height: 1;
        }

        /* ── Event list ───────────────────────────── */
        .cal-event-list {
          display: grid;
          gap: 0.4rem;
        }

        .cal-empty {
          color: var(--ink-soft);
          font-size: var(--text-sm);
          padding: 1.2rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--white);
          margin: 0;
        }

        .cal-event-item {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--white);
          overflow: hidden;
          transition: border-color 0.14s;
        }

        .cal-event-item.expanded {
          border-color: rgba(14, 116, 144, 0.3);
          box-shadow: 0 4px 16px rgba(14, 116, 144, 0.08);
        }

        .cal-event-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          width: 100%;
          padding: 0.8rem 1rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.12s;
        }

        .cal-event-row:hover {
          background: rgba(241, 248, 254, 0.7);
        }

        .cal-event-item.expanded .cal-event-row {
          background: rgba(241, 248, 254, 0.5);
          border-bottom: 1px solid rgba(209, 232, 245, 0.7);
        }

        .cal-type-tag {
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          white-space: nowrap;
        }

        .cal-event-row-title {
          flex: 1;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cal-event-row-date {
          flex-shrink: 0;
          font-size: var(--text-xs);
          color: var(--ink-soft);
          white-space: nowrap;
        }

        .cal-rsvped-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #16a34a;
          flex-shrink: 0;
        }

        .cal-chevron {
          flex-shrink: 0;
          color: var(--ink-soft);
          transition: transform 0.2s;
        }

        .cal-chevron.open {
          transform: rotate(180deg);
        }

        /* ── Event detail card ────────────────────── */
        .cal-event-detail {
          padding: 1.1rem 1.2rem 1.2rem;
        }

        .cal-event-detail-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.6rem;
        }

        .cal-event-rsvped-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: rgba(22, 163, 74, 0.12);
          color: #166534;
        }

        .cal-event-detail-title {
          margin: 0 0 0.8rem;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.3;
        }

        .cal-event-detail-meta {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.6rem 1.2rem;
          margin: 0 0 0.8rem;
          padding: 0;
        }

        .cal-event-detail-meta > div {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .cal-event-detail-meta dt {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--ink-soft);
        }

        .cal-event-detail-meta dd {
          font-size: var(--text-sm);
          color: var(--ink);
          margin: 0;
        }

        .cal-event-detail-summary {
          font-size: var(--text-sm);
          color: var(--ink-soft);
          line-height: 1.6;
          margin: 0 0 0.85rem;
          max-width: 68ch;
        }

        .cal-event-detail-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(209, 228, 245, 0.7);
        }

        .cal-event-detail-status {
          font-size: var(--text-sm);
          font-weight: 600;
        }

        .cal-event-detail-status.confirmed { color: #166534; }
        .cal-event-detail-status.external  { color: #6b21a8; }

        /* ── Responsive ───────────────────────────── */
        @media (max-width: 900px) {
          .cal-year-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .cal-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .cal-year-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .cal-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .cal-filter-row {
            justify-content: center;
          }
          .cal-month-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
          .cal-month-nav {
            justify-content: center;
          }
          .cal-event-row-date {
            display: none;
          }
          .cal-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
