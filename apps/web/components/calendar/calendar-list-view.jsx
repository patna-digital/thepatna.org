"use client";

import { useMemo } from "react";
import { formatDate, isPastDate } from "@/lib/calendar/core";

/**
 * Calendar List View Component
 * Agenda-style list of events
 */
export function CalendarListView({
  events = [],
  onEventClick,
  groupByDate = true,
}) {
  const groupedEvents = useMemo(() => {
    if (!groupByDate) {
      return { "All Events": events };
    }

    const groups = {};
    events.forEach((event) => {
      const date = new Date(event.starts_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (
        date.toDateString() ===
        new Date(today.setDate(today.getDate() + 1)).toDateString()
      ) {
        groupKey = "Tomorrow";
      } else if (date < new Date()) {
        groupKey = "Past";
      } else {
        groupKey = formatDate(date, "long");
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });

    // Sort groups: Today, Tomorrow, Future dates, Past
    const sortedGroups = {};
    const priority = ["Today", "Tomorrow"];
    
    priority.forEach((key) => {
      if (groups[key]) {
        sortedGroups[key] = groups[key];
      }
    });

    Object.keys(groups)
      .filter((key) => !priority.includes(key) && key !== "Past")
      .sort((a, b) => new Date(a) - new Date(b))
      .forEach((key) => {
        sortedGroups[key] = groups[key];
      });

    if (groups["Past"]) {
      sortedGroups["Past"] = groups["Past"];
    }

    return sortedGroups;
  }, [events, groupByDate]);

  if (events.length === 0) {
    return (
      <div className="calendar-list-empty">
        <div className="calendar-empty-icon">📅</div>
        <h3>No events found</h3>
        <p>There are no events scheduled for this period</p>
      </div>
    );
  }

  return (
    <div className="calendar-list-view">
      {Object.entries(groupedEvents).map(([groupName, groupEvents]) => (
        <div key={groupName} className="calendar-list-group">
          <h3 className="calendar-list-group-header">
            {groupName}
            <span className="event-count">({groupEvents.length})</span>
          </h3>
          <div className="calendar-list-events">
            {groupEvents.map((event, index) => (
              <div
                key={index}
                className={`calendar-list-item ${event.event_source || "community"} ${
                  isPastDate(event.starts_at) ? "past" : ""
                }`}
                onClick={() => onEventClick?.(event)}
              >
                <div className="calendar-list-item-time">
                  <span className="time-start">
                    {formatDate(event.starts_at, "time")}
                  </span>
                  <span className="time-separator">-</span>
                  <span className="time-end">
                    {formatDate(event.ends_at, "time")}
                  </span>
                </div>
                <div className="calendar-list-item-content">
                  <div className={`event-source-badge ${event.event_source || "community"}`}>
                    {event.source_label || (event.event_source === "personal" ? "PATNA Booking" : event.event_source === "external" ? "Connected Calendar" : "PATNA Event")}
                  </div>
                  <h4 className="event-title">{event.title}</h4>
                  {event.summary && (
                    <p className="event-summary">{event.summary}</p>
                  )}
                  <div className="event-meta">
                    {event.location && (
                      <span className="event-location">
                        <span className="meta-icon">📍</span>
                        {event.location}
                      </span>
                    )}
                    {event.event_type && (
                      <span className="event-type">{event.event_type}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
