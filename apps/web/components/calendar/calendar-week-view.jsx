"use client";

import { useMemo } from "react";
import {
  formatDate,
  formatEventTimeLabel,
  getWeekDays,
  groupEventsByDate,
  toLocalDateKey,
} from "@/lib/calendar/core";

/**
 * Calendar Week View Component
 * Displays a 7-day column view with time slots
 */
export function CalendarWeekView({
  currentDate,
  events = [],
  onEventClick,
  onNavigate,
}) {
  const weekDays = useMemo(() => getWeekDays(currentDate, 1), [currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return slots;
  }, []);

  const navigatePrevious = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 7);
    onNavigate?.(prevDate);
  };

  const navigateNext = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 7);
    onNavigate?.(nextDate);
  };

  const navigateToday = () => {
    onNavigate?.(new Date());
  };

  return (
    <div className="calendar-week-view">
      <div className="calendar-week-header">
        <div className="calendar-week-nav">
          <button
            className="calendar-nav-button"
            onClick={navigatePrevious}
            type="button"
            aria-label="Previous week"
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
            aria-label="Next week"
          >
            →
          </button>
        </div>
        <h2 className="calendar-week-title">
          {formatDate(weekDays[0], "short")} - {formatDate(weekDays[6], "short")}
        </h2>
      </div>

      <div className="calendar-week-grid">
        {/* Time column */}
        <div className="calendar-time-column">
          <div className="calendar-time-header" />
          {timeSlots.map((time) => (
            <div key={time} className="calendar-time-slot">
              <span>{time}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((date, index) => {
          const dateKey = toLocalDateKey(date);
          const dayEvents = eventsByDate[dateKey] || [];
          const allDayEvents = dayEvents.filter((event) => event.is_all_day);
          const timedEvents = dayEvents.filter((event) => !event.is_all_day);
          const isToday =
            date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`calendar-day-column ${isToday ? "today" : ""}`}
            >
              <div className="calendar-day-header">
                <span className="day-name">{formatDate(date, "dayName")}</span>
                <span className="day-number">{date.getDate()}</span>
              </div>
              {allDayEvents.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    padding: "0.5rem",
                  }}
                >
                  {allDayEvents.map((event, eventIndex) => (
                    <button
                      key={eventIndex}
                      className={`calendar-event-chip ${event.event_source || "community"}`}
                      onClick={() => onEventClick?.(event)}
                      title={event.title}
                      type="button"
                    >
                      <span className="event-title">{event.title}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="calendar-day-content">
                {timeSlots.map((time) => (
                  <div key={time} className="calendar-hour-cell" />
                ))}
                {timedEvents.map((event, eventIndex) => {
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
                      key={eventIndex}
                      className={`calendar-week-event ${event.event_source || "community"}`}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 24)}px`,
                      }}
                      onClick={() => onEventClick?.(event)}
                      title={event.title}
                    >
                      <span className="event-title">{event.title}</span>
                      <span className="event-time">{formatEventTimeLabel(event)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
