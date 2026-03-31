"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDate, getCalendarDays } from "@/lib/calendar/core";
import { setEventRsvp } from "../../app/app/calendar/actions";

function getYearMonths(year) {
  return Array.from({ length: 12 }, (_, month) => new Date(year, month, 1));
}

function getDateKey(value) {
  return new Date(value).toISOString().split("T")[0];
}

function getMonthEvents(events, year, month) {
  return events
    .filter((event) => {
      const eventDate = new Date(event.starts_at);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    })
    .sort((left, right) => new Date(left.starts_at) - new Date(right.starts_at));
}

function getEventTimeLabel(event) {
  if (!event.starts_at) {
    return event.display_date || "Date TBC";
  }

  if (!event.ends_at) {
    return formatDate(event.starts_at, "datetime");
  }

  return `${formatDate(event.starts_at, "datetime")} - ${formatDate(event.ends_at, "time")}`;
}

function getEventSourceLabel(event) {
  return event.event_source === "personal" ? "Meeting" : event.event_type_label || "Event";
}

function isCommunityEvent(event) {
  return event.event_source === "community";
}

export function CalendarShell({ initialEvents = [], initialYear, isAdmin = false }) {
  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState("all");
  const [pendingEventIds, setPendingEventIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [, startTransition] = useTransition();

  const yearEvents = useMemo(
    () =>
      events.filter((event) => {
        const eventDate = new Date(event.starts_at);
        return eventDate.getFullYear() === selectedYear;
      }),
    [events, selectedYear],
  );

  const filteredEvents = useMemo(
    () =>
      yearEvents.filter((event) => {
        if (filter === "community") {
          return isCommunityEvent(event);
        }

        if (filter === "rsvped") {
          return isCommunityEvent(event) && event.is_rsvped;
        }

        return true;
      }),
    [filter, yearEvents],
  );

  const summary = useMemo(
    () => ({
      totalItems: yearEvents.length,
      communityEvents: yearEvents.filter(isCommunityEvent).length,
      rsvpedEvents: yearEvents.filter((event) => isCommunityEvent(event) && event.is_rsvped).length,
      bookedMeetings: yearEvents.filter((event) => event.event_source === "personal").length,
    }),
    [yearEvents],
  );

  const monthSections = useMemo(
    () =>
      getYearMonths(selectedYear).map((monthDate) => {
        const month = monthDate.getMonth();
        const monthEvents = getMonthEvents(filteredEvents, selectedYear, month);
        const eventsByDate = monthEvents.reduce((grouped, event) => {
          const dateKey = getDateKey(event.starts_at);
          grouped[dateKey] = grouped[dateKey] || [];
          grouped[dateKey].push(event);
          return grouped;
        }, {});

        return {
          monthDate,
          monthEvents,
          eventsByDate,
          days: getCalendarDays(month, selectedYear),
        };
      }),
    [filteredEvents, selectedYear],
  );

  const handleRsvp = (eventId) => {
    if (pendingEventIds.includes(eventId)) {
      return;
    }

    setNotice("");
    setPendingEventIds((current) => [...current, eventId]);

    startTransition(() => {
      void (async () => {
        const result = await setEventRsvp(eventId);

        setPendingEventIds((current) => current.filter((value) => value !== eventId));

        if (!result.success) {
          setNotice(result.error || "We could not save your RSVP right now.");
          return;
        }

        setEvents((current) =>
          current.map((event) =>
            event.id === eventId ? { ...event, is_rsvped: true } : event,
          ),
        );
        setNotice("Your RSVP has been saved.");
      })();
    });
  };

  return (
    <div className="calendar-year-shell">
      <div className="calendar-year-toolbar">
        <div>
          <p className="calendar-year-kicker">Member calendar</p>
          <h2>{selectedYear} year view</h2>
          <p>
            PATNA events are laid out month by month below. External calendar sync is coming
            soon, but you can already RSVP here and track what you are attending.
          </p>
        </div>

        <div className="calendar-year-toolbar-actions">
          <div className="calendar-year-nav">
            <button onClick={() => setSelectedYear((year) => year - 1)} type="button">
              ← {selectedYear - 1}
            </button>
            <button className="current-year" onClick={() => setSelectedYear(new Date().getFullYear())} type="button">
              This year
            </button>
            <button onClick={() => setSelectedYear((year) => year + 1)} type="button">
              {selectedYear + 1} →
            </button>
          </div>

          <div className="calendar-year-filter">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
              type="button"
            >
              All items
            </button>
            <button
              className={filter === "community" ? "active" : ""}
              onClick={() => setFilter("community")}
              type="button"
            >
              Events only
            </button>
            <button
              className={filter === "rsvped" ? "active" : ""}
              onClick={() => setFilter("rsvped")}
              type="button"
            >
              My RSVPs
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-year-summary">
        <article>
          <strong>{summary.totalItems}</strong>
          <span>Items this year</span>
        </article>
        <article>
          <strong>{summary.communityEvents}</strong>
          <span>Community events</span>
        </article>
        <article>
          <strong>{summary.rsvpedEvents}</strong>
          <span>RSVP&apos;d events</span>
        </article>
        <article>
          <strong>{summary.bookedMeetings}</strong>
          <span>Meetings</span>
        </article>
      </div>

      <div className="calendar-year-note">
        <span className="calendar-year-note-badge">Coming soon</span>
        <p>Google, Outlook, and personal calendar sync will land later. For now, PATNA events and member bookings live here.</p>
      </div>

      {isAdmin ? (
        <div className="calendar-year-admin-note">
          Administrator accounts are automatically marked as RSVP&apos;d for community events.
        </div>
      ) : null}

      {notice ? <div className="calendar-year-feedback">{notice}</div> : null}

      <div className="calendar-year-grid">
        {monthSections.map(({ monthDate, monthEvents, eventsByDate, days }) => (
          <article className="calendar-year-month-card" key={monthDate.toISOString()}>
            <div className="calendar-year-month-header">
              <div>
                <h3>{formatDate(monthDate, "monthYear")}</h3>
                <p>{monthEvents.length ? `${monthEvents.length} scheduled` : "No scheduled items yet"}</p>
              </div>
            </div>

            <div className="calendar-year-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-year-month-grid">
              {days.map(({ date, isCurrentMonth, isToday }) => {
                const dateKey = getDateKey(date);
                const dayEvents = eventsByDate[dateKey] || [];

                return (
                  <div
                    className={`calendar-year-day ${isCurrentMonth ? "current" : "other"} ${isToday ? "today" : ""}`}
                    key={dateKey}
                  >
                    <span className="calendar-year-day-number">{date.getDate()}</span>
                    <div className="calendar-year-day-items">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          className={`calendar-year-day-chip ${event.event_source || "community"} ${event.is_rsvped ? "rsvped" : ""}`}
                          key={event.id}
                          title={event.title}
                        >
                          {event.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 ? (
                        <span className="calendar-year-day-more">+{dayEvents.length - 2}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="calendar-year-month-events">
              {monthEvents.length ? (
                monthEvents.map((event) => {
                  const isPending = pendingEventIds.includes(event.id);
                  const isEventRsvped = Boolean(event.is_rsvped);

                  return (
                    <div className="calendar-year-event-card" key={event.id}>
                      <div className="calendar-year-event-main">
                        <div className="calendar-year-event-meta">
                          <span className={`calendar-year-type ${event.event_source || "community"}`}>
                            {getEventSourceLabel(event)}
                          </span>
                          {isCommunityEvent(event) && isEventRsvped ? (
                            <span className="calendar-year-rsvp-pill">RSVP&apos;d</span>
                          ) : null}
                        </div>

                        <strong>{event.title}</strong>
                        <p>{getEventTimeLabel(event)}</p>
                        {event.location ? <p>{event.location}</p> : null}
                        {event.summary ? <p className="calendar-year-event-summary">{event.summary}</p> : null}
                      </div>

                      <div className="calendar-year-event-actions">
                        {isCommunityEvent(event) ? (
                          isEventRsvped ? (
                            <span className="calendar-year-rsvp-status">Added to your PATNA calendar</span>
                          ) : (
                            <button
                              className="primary-button"
                              disabled={isPending}
                              onClick={() => handleRsvp(event.id)}
                              type="button"
                            >
                              {isPending ? "Saving..." : "RSVP"}
                            </button>
                          )
                        ) : (
                          <span className="calendar-year-rsvp-status">Booking confirmed</span>
                        )}

                        {event.official_link ? (
                          <a
                            className="secondary-button"
                            href={event.official_link}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Event link
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="calendar-year-empty">
                  {filter === "rsvped"
                    ? "No RSVP&apos;d events in this month yet."
                    : "No events or meetings have been added for this month yet."}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      <style jsx>{`
        .calendar-year-shell {
          display: grid;
          gap: 1.5rem;
        }

        .calendar-year-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 1.25rem;
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          background:
            linear-gradient(135deg, rgba(14, 116, 144, 0.1), rgba(15, 23, 42, 0.04)),
            var(--white);
        }

        .calendar-year-kicker {
          margin: 0 0 0.35rem;
          font-size: var(--text-xs);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        .calendar-year-toolbar h2 {
          margin: 0;
          font-size: clamp(1.7rem, 2vw, 2.2rem);
          color: var(--ink);
        }

        .calendar-year-toolbar p {
          margin: 0.5rem 0 0;
          max-width: 60ch;
          color: var(--ink-soft);
        }

        .calendar-year-toolbar-actions {
          display: grid;
          gap: 0.9rem;
          align-content: start;
          justify-items: end;
        }

        .calendar-year-nav,
        .calendar-year-filter {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .calendar-year-nav button,
        .calendar-year-filter button {
          padding: 0.7rem 0.95rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--white);
          color: var(--ink);
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }

        .calendar-year-nav button:hover,
        .calendar-year-filter button:hover {
          transform: translateY(-1px);
          border-color: rgba(14, 116, 144, 0.35);
          background: rgba(14, 116, 144, 0.08);
        }

        .calendar-year-filter button.active,
        .calendar-year-nav .current-year {
          background: var(--ink);
          color: var(--white);
          border-color: var(--ink);
        }

        .calendar-year-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .calendar-year-summary article,
        .calendar-year-note,
        .calendar-year-admin-note,
        .calendar-year-feedback {
          padding: 1rem 1.1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background: var(--white);
        }

        .calendar-year-summary strong {
          display: block;
          font-size: 1.65rem;
          color: var(--ink);
        }

        .calendar-year-summary span {
          color: var(--ink-soft);
          font-size: var(--text-sm);
        }

        .calendar-year-note,
        .calendar-year-admin-note,
        .calendar-year-feedback {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .calendar-year-note p,
        .calendar-year-admin-note,
        .calendar-year-feedback {
          margin: 0;
          color: var(--ink-soft);
        }

        .calendar-year-note-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.16);
          color: #92400e;
          font-size: var(--text-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .calendar-year-feedback {
          border-color: rgba(14, 116, 144, 0.2);
          background: rgba(14, 116, 144, 0.08);
        }

        .calendar-year-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.2rem;
        }

        .calendar-year-month-card {
          display: grid;
          gap: 1rem;
          padding: 1.1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          background: var(--white);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }

        .calendar-year-month-header h3 {
          margin: 0;
          color: var(--ink);
          font-size: 1.15rem;
        }

        .calendar-year-month-header p {
          margin: 0.3rem 0 0;
          color: var(--ink-soft);
          font-size: var(--text-sm);
        }

        .calendar-year-weekdays,
        .calendar-year-month-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 0.35rem;
        }

        .calendar-year-weekdays span {
          text-align: center;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        .calendar-year-day {
          min-height: 6.25rem;
          padding: 0.45rem;
          border-radius: 0.9rem;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #fcfdfe;
        }

        .calendar-year-day.other {
          opacity: 0.45;
          background: rgba(148, 163, 184, 0.08);
        }

        .calendar-year-day.today {
          border-color: rgba(14, 116, 144, 0.45);
          background: rgba(14, 116, 144, 0.08);
        }

        .calendar-year-day-number {
          display: inline-flex;
          width: 1.8rem;
          height: 1.8rem;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--ink);
        }

        .calendar-year-day-items {
          display: grid;
          gap: 0.25rem;
          margin-top: 0.45rem;
        }

        .calendar-year-day-chip,
        .calendar-year-day-more {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0.15rem 0.35rem;
          border-radius: 0.55rem;
          font-size: 0.66rem;
          line-height: 1.3;
        }

        .calendar-year-day-chip.community {
          background: rgba(14, 116, 144, 0.12);
          color: #155e75;
        }

        .calendar-year-day-chip.personal {
          background: rgba(15, 23, 42, 0.1);
          color: #334155;
        }

        .calendar-year-day-chip.rsvped {
          box-shadow: inset 0 0 0 1px rgba(14, 116, 144, 0.25);
        }

        .calendar-year-day-more {
          color: var(--ink-soft);
          background: rgba(148, 163, 184, 0.12);
        }

        .calendar-year-month-events {
          display: grid;
          gap: 0.8rem;
        }

        .calendar-year-event-card {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.95rem;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: var(--radius-lg);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
        }

        .calendar-year-event-main {
          min-width: 0;
        }

        .calendar-year-event-main strong {
          display: block;
          margin-top: 0.35rem;
          color: var(--ink);
        }

        .calendar-year-event-main p {
          margin: 0.3rem 0 0;
          color: var(--ink-soft);
        }

        .calendar-year-event-summary {
          max-width: 62ch;
        }

        .calendar-year-event-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .calendar-year-type,
        .calendar-year-rsvp-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .calendar-year-type.community {
          background: rgba(14, 116, 144, 0.12);
          color: #155e75;
        }

        .calendar-year-type.personal {
          background: rgba(15, 23, 42, 0.1);
          color: #334155;
        }

        .calendar-year-rsvp-pill {
          background: rgba(22, 163, 74, 0.12);
          color: #166534;
        }

        .calendar-year-event-actions {
          display: grid;
          gap: 0.6rem;
          justify-items: end;
          align-content: start;
        }

        .calendar-year-rsvp-status {
          font-size: var(--text-sm);
          color: #166534;
          font-weight: 600;
          text-align: right;
        }

        .calendar-year-empty {
          margin: 0;
          color: var(--ink-soft);
          padding: 0.4rem 0.1rem;
        }

        @media (max-width: 1100px) {
          .calendar-year-grid {
            grid-template-columns: 1fr;
          }

          .calendar-year-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .calendar-year-toolbar,
          .calendar-year-event-card {
            flex-direction: column;
          }

          .calendar-year-toolbar-actions,
          .calendar-year-event-actions {
            justify-items: stretch;
          }

          .calendar-year-summary {
            grid-template-columns: 1fr;
          }

          .calendar-year-day {
            min-height: 5.4rem;
          }
        }
      `}</style>
    </div>
  );
}
