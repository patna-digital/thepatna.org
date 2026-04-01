"use client";

import { useMemo } from "react";
import { formatDate } from "@/lib/calendar/core";

/**
 * Calendar Day View Component
 * Detailed view of a single day with events
 */
export function CalendarDayView({
  currentDate,
  events = [],
  onEventClick,
  onNavigate,
}) {
  const dayEvents = useMemo(() => {
    const dateKey = currentDate.toISOString().split("T")[0];
    return events
      .filter((event) => {
        const eventDate = new Date(event.starts_at).toISOString().split("T")[0];
        return eventDate === dateKey;
      })
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }, [events, currentDate]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return slots;
  }, []);

  const navigatePrevious = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    onNavigate?.(prevDate);
  };

  const navigateNext = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    onNavigate?.(nextDate);
  };

  const navigateToday = () => {
    onNavigate?.(new Date());
  };

  const isToday =
    currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="calendar-day-view">
      <div className="calendar-day-header-bar">
        <div className="calendar-day-nav">
          <button
            className="calendar-nav-button"
            onClick={navigatePrevious}
            type="button"
            aria-label="Previous day"
          >
            ←
          </button>
          <button
            className="calendar-nav-button calendar-today-button"
            onClick={navigateToday}
            type="button"
          >
            Today
          </button>
          <button
            className="calendar-nav-button"
            onClick={navigateNext}
            type="button"
            aria-label="Next day"
          >
            →
          </button>
        </div>
        <h2 className={`calendar-day-title ${isToday ? "today" : ""}`}>
          {formatDate(currentDate, "long")}
        </h2>
      </div>

      <div className="calendar-day-content-wrapper">
        <div className="calendar-time-grid">
          {timeSlots.map((time) => (
            <div key={time} className="calendar-time-row">
              <div className="calendar-time-label">{time}</div>
              <div className="calendar-time-content" />
            </div>
          ))}

          {dayEvents.map((event, index) => {
            const startHour = new Date(event.starts_at).getHours();
            const startMinute = new Date(event.starts_at).getMinutes();
            const endHour = new Date(event.ends_at).getHours();
            const endMinute = new Date(event.ends_at).getMinutes();
            
            const top = (startHour + startMinute / 60) * 60;
            const height =
              ((endHour - startHour) * 60 + (endMinute - startMinute)) *
              (60 / 60);

            return (
              <div
                key={index}
                className={`calendar-day-event ${event.event_source || "community"}`}
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 40)}px`,
                }}
                onClick={() => onEventClick?.(event)}
              >
                <div className="event-time-badge">
                  {formatDate(event.starts_at, "time")} -{" "}
                  {formatDate(event.ends_at, "time")}
                </div>
                <div className="event-title">{event.title}</div>
                {event.summary && (
                  <div className="event-summary">{event.summary}</div>
                )}
                {event.location && (
                  <div className="event-location">
                    <span className="location-icon">📍</span>
                    {event.location}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {dayEvents.length === 0 && (
          <div className="calendar-no-events">
            <p>No events scheduled for this day</p>
          </div>
        )}
      </div>
    </div>
  );
}
