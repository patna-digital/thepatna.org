"use client";

import { useDeferredValue, useState } from "react";
import { ArchiveSearchInput } from "@/components/public/archive-search-input";
import { EventArchiveCard } from "@/components/public/event-archive-card";

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

export function EventsArchiveClient({
  events,
  searchLabel,
  placeholder,
  clearLabel,
  emptyTitle,
  emptyBody,
  defaultResultsLabel,
  searchResultsLabel,
  cardLabels,
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredEvents = normalizedQuery
    ? events.filter((event) => matchesEvent(event, normalizedQuery))
    : events;

  const resultsText = normalizedQuery
    ? searchResultsLabel
        .replace("{count}", String(filteredEvents.length))
        .replace("{query}", deferredQuery.trim())
    : defaultResultsLabel.replace("{count}", String(events.length));

  return (
    <div className="archive-list-shell">
      <ArchiveSearchInput
        clearLabel={clearLabel}
        label={searchLabel}
        onChange={setQuery}
        placeholder={placeholder}
        value={query}
      />

      <p className="archive-search-results">{resultsText}</p>

      {filteredEvents.length ? (
        <div className="publications-grid">
          {filteredEvents.map((event) => (
            <EventArchiveCard event={event} key={event.id || event.slug} labels={cardLabels} />
          ))}
        </div>
      ) : (
        <article className="archive-empty-state">
          <h3>{emptyTitle}</h3>
          <p>{emptyBody}</p>
        </article>
      )}
    </div>
  );
}
