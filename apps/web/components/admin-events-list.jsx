"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const PUBLISH_CHIP = {
  published: "chip-success",
  draft: "chip-neutral",
  archived: "chip-muted",
};

const SCHEDULE_CHIP = {
  upcoming: "chip-warning",
  past: "chip-muted",
  tbc: "chip-neutral",
};

function getSearchText(event) {
  return [
    event.title,
    event.sourceTitle,
    event.location,
    event.sourceLocation,
    event.summary,
    event.sourceSummary,
    event.displayDateDisplay,
    event.display_date,
    event.patna_involvement,
    event.sourcePatnaInvolvement,
    ...(event.organising_institutions || []),
    ...(event.sourceOrganisingInstitutions || []),
    ...(event.themes || []),
    ...(event.sourceThemes || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function AdminEventsList({ events }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => getSearchText(e).includes(q));
  }, [events, search]);

  return (
    <>
      {/* Results count */}
      {search ? (
        <p className="muted-note">
          Showing {filtered.length} of {events.length} events matching "{search}".
        </p>
      ) : null}

      {/* Event list */}
      <article className="dashboard-card app-list-card">
        {filtered.length ? (
          <div className="app-list">
            {filtered.map((event) => {
              const publishChip = PUBLISH_CHIP[event.status] || "chip-neutral";
              const scheduleChip = SCHEDULE_CHIP[event.schedule_status] || "chip-neutral";

              return (
                <details className="app-row" key={event.id}>
                  <summary className="app-row-summary">
                    <div className="app-row-primary">
                      <div className="app-row-identity">
                        <strong>{event.title}</strong>
                        {event.location ? <span>{event.location}</span> : null}
                      </div>
                      <div className="app-row-signals">
                        <span className="status-chip chip-neutral">{event.eventTypeDisplay || event.event_type || "Event"}</span>
                        <span className={`status-chip ${scheduleChip}`}>{event.schedule_status}</span>
                        <span className={`status-chip ${publishChip}`}>{event.status}</span>
                        <span className="app-row-expand-hint">Details</span>
                      </div>
                    </div>
                    <div className="app-row-meta">
                      <span>{event.displayDateDisplay || event.display_date || "Date pending"}</span>
                      {event.organising_institutions?.length ? (
                        <span>
                          {event.organising_institutions[0]}
                          {event.organising_institutions.length > 1 ? ` +${event.organising_institutions.length - 1}` : ""}
                        </span>
                      ) : null}
                      <span>Visibility: {event.visibility}</span>
                    </div>
                  </summary>

                  <div className="app-row-detail">
                    {event.summary ? (
                      <p className="app-row-detail-motivation">{event.summary}</p>
                    ) : null}

                    <div className="app-row-detail-grid">
                      <div className="app-row-detail-field">
                        <strong>Location</strong>
                        <p>{event.location || "Not provided"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Date</strong>
                        <p>{event.displayDateDisplay || event.display_date || "Pending"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Institutions</strong>
                        <p>{event.organising_institutions?.length ? event.organising_institutions.join(", ") : "Not provided"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>PATNA involvement</strong>
                        <p>{event.patna_involvement || "Not provided"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Visibility</strong>
                        <p>{event.visibility}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Creator</strong>
                        <p>{event.creatorName || "Not recorded"}</p>
                      </div>
                      <div className="app-row-detail-field">
                        <strong>Last editor</strong>
                        <p>{event.updatedByName || "Not recorded"}</p>
                      </div>
                    </div>

                    {event.themes?.length ? (
                      <div className="app-row-tag-section">
                        <span className="app-row-tag-label">Themes</span>
                        <div className="member-directory-tag-row">
                          {event.themes.map((theme) => (
                            <span className="status-chip chip-neutral" key={theme}>{theme}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="app-row-actions-row">
                      <Link className="primary-button" href={`/admin/events/${event.id}`}>
                        Edit event
                      </Link>
                      <Link className="secondary-button" href="/events">
                        Public view
                      </Link>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="app-row-empty">
            <strong>{search ? "No events match your search." : "No events found"}</strong>
            {search ? <p>Try a different title, institution, theme, or location.</p> : null}
          </div>
        )}
      </article>
    </>
  );
}
