"use client";

import { useMemo } from "react";
import {
  groupEventsByDate,
  getCalendarDays,
  formatEventTimeLabel,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
  toLocalDateKey,
} from "@/lib/calendar/core";

/**
 * Calendar Month View Component
 * Displays a grid of days for a month with events
 */
export function CalendarMonthView({
  currentDate,
  events = [],
  onDateClick,
  onEventClick,
  onNavigate,
}) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const days = useMemo(() => getCalendarDays(month, year), [month, year]);

  // Group events by date
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);
  const { month: nextMonth, year: nextYear } = getNextMonth(month, year);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="calendar-month-view">
      <div className="calendar-month-header">
        <button
          className="calendar-nav-button"
          onClick={() => onNavigate(prevMonth, prevYear)}
          type="button"
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="calendar-month-title">
          {getMonthName(month)} {year}
        </h2>
        <button
          className="calendar-nav-button"
          onClick={() => onNavigate(nextMonth, nextYear)}
          type="button"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days-grid">
        {days.map(({ date, isCurrentMonth, isToday }, index) => {
          const dateKey = toLocalDateKey(date);
          const dayEvents = eventsByDate[dateKey] || [];
          const dayNumber = date.getDate();

          return (
            <div
              key={index}
              className={`calendar-day ${isCurrentMonth ? "current-month" : "other-month"} ${
                isToday ? "today" : ""
              }`}
              onClick={() => onDateClick?.(date)}
              role="button"
              tabIndex={0}
            >
              <div className="calendar-day-number">{dayNumber}</div>
              <div className="calendar-day-events">
                {dayEvents.slice(0, 3).map((event, eventIndex) => {
                  const timeLabel = formatEventTimeLabel(event);

                  return (
                    <div
                      key={eventIndex}
                      className={`calendar-event-chip ${event.event_source || "community"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={event.title}
                    >
                      {timeLabel && (
                        <span className="event-time">{timeLabel}</span>
                      )}
                      <span className="event-title">{event.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="calendar-more-events">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
