"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArchiveSearchInput } from "@/components/public/archive-search-input";
import { EventArchiveCard } from "@/components/public/event-archive-card";

const PAGE_SIZE = 4;

function matchesEvent(event, query) {
  const haystack = [
    event.title,
    event.summary,
    event.location,
    event.eventTypeDisplay,
    event.event_type,
    event.displayDateDisplay,
    event.display_date,
    event.patna_involvement,
    ...(event.organising_institutions || []),
    ...(event.themes || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getEventDate(event) {
  if (event.starts_at) return new Date(event.starts_at);
  return null;
}

export function EventsArchiveClient({ events, cardLabels }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const eventTypes = useMemo(
    () =>
      [...new Set(events.map((e) => e.eventTypeDisplay || e.event_type).filter(Boolean))].sort(),
    [events]
  );

  const filtered = useMemo(() => {
    let results = events.filter((event) => {
      if (normalizedQuery && !matchesEvent(event, normalizedQuery)) return false;
      if (typeFilter && (event.eventTypeDisplay || event.event_type) !== typeFilter) return false;
      if (statusFilter && event.schedule_status !== statusFilter) return false;
      return true;
    });

    if (sortBy === "newest") {
      results = [...results].sort((a, b) => {
        const da = getEventDate(a);
        const db = getEventDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      });
    } else if (sortBy === "oldest") {
      results = [...results].sort((a, b) => {
        const da = getEventDate(a);
        const db = getEventDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
      });
    } else if (sortBy === "az") {
      results = [...results].sort((a, b) => a.title.localeCompare(b.title));
    }

    return results;
  }, [events, normalizedQuery, typeFilter, statusFilter, sortBy]);

  function resetCount(setter) {
    return (value) => {
      setter(value);
      setVisibleCount(PAGE_SIZE);
    };
  }

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const remaining = filtered.length - visibleCount;
  const isFiltered = !!normalizedQuery || !!typeFilter || !!statusFilter;

  return (
    <div className="events-archive-shell">
      {/* ── Toolbar ── */}
      <div className="events-toolbar">
        <ArchiveSearchInput
          label={null}
          placeholder="Search events, locations, themes…"
          value={query}
          onChange={(v) => { setQuery(v); setVisibleCount(PAGE_SIZE); }}
          clearLabel="Clear"
        />

        <div className="events-toolbar-filters">
          <select
            className="events-filter-select"
            value={typeFilter}
            onChange={(e) => resetCount(setTypeFilter)(e.target.value)}
            aria-label="Filter by event type"
          >
            <option value="">All types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="events-filter-select"
            value={statusFilter}
            onChange={(e) => resetCount(setStatusFilter)(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="tbc">Date TBC</option>
            <option value="past">Past</option>
          </select>

          <select
            className="events-filter-select"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setVisibleCount(PAGE_SIZE); }}
            aria-label="Sort events"
          >
            <option value="default">Default order</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z</option>
          </select>

          <span className="events-result-count">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            {isFiltered ? " found" : ""}
          </span>
        </div>
      </div>

      {/* ── Results ── */}
      {filtered.length > 0 ? (
        <>
          <div className="publications-grid events-archive-grid">
            {visible.map((event) => (
              <EventArchiveCard
                event={event}
                key={event.id || event.slug}
                labels={cardLabels}
              />
            ))}
          </div>

          {hasMore && (
            <div className="events-show-more-row">
              <button
                className="events-show-more-btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Show more events
                <span className="events-show-more-count">
                  {remaining} remaining
                </span>
              </button>
            </div>
          )}
        </>
      ) : (
        <article className="archive-empty-state">
          <h3>No events found</h3>
          <p>
            {isFiltered
              ? "Try adjusting your search or filters."
              : "No events have been published yet."}
          </p>
        </article>
      )}
    </div>
  );
}
