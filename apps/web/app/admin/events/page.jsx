import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { buildAdminEventSummary, fetchAdminEvents, filterAdminEvents } from "@/lib/events";
import { requireAdminContext } from "@/lib/supabase/access";

const PUBLISH_FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "archived", label: "Archived" },
];

const SCHEDULE_FILTERS = [
  { key: "all", label: "Any time" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "tbc", label: "TBC" },
];

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

function getNoticeMessage(notice) {
  const messages = {
    saved: "Event saved.",
    "missing-fields": "Title and either a display date or start date are required.",
    error: "Event update failed. Please retry.",
  };
  return messages[notice] || "";
}

function buildEventsPath({ status, schedule, visibility, search }) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (schedule && schedule !== "all") params.set("schedule", schedule);
  if (visibility && visibility !== "all") params.set("visibility", visibility);
  if (search) params.set("search", search);
  const query = params.toString();
  return query ? `/admin/events?${query}` : "/admin/events";
}

export default async function AdminEventsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolvedSearchParams = await searchParams;

  const publishStatus = typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : "all";
  const scheduleStatus = typeof resolvedSearchParams?.schedule === "string" ? resolvedSearchParams.schedule : "all";
  const visibility = typeof resolvedSearchParams?.visibility === "string" ? resolvedSearchParams.visibility : "all";
  const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";

  const { events, error } = await fetchAdminEvents({ supabase });
  const summary = buildAdminEventSummary(events);
  const filteredEvents = filterAdminEvents(events, { publishStatus, scheduleStatus, search, visibility });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Events register",
        title: "PATNA events with editorial ownership",
        body: "Maintain the live events register after the initial import, with creator and editor metadata preserved on every record.",
      }}
      title="Events"
      subtitle="Manage published, draft, and archived PATNA events with shared admin editing and explicit ownership."
    >
      {/* Summary stats */}
      <div className="summary-grid">
        <div className="summary-tile">
          <strong>{summary.total}</strong>
          <span>Total</span>
        </div>
        <div className="summary-tile">
          <strong>{summary.published}</strong>
          <span>Published</span>
        </div>
        <div className="summary-tile">
          <strong>{summary.upcoming}</strong>
          <span>Upcoming</span>
        </div>
        <div className="summary-tile">
          <strong>{summary.tbc}</strong>
          <span>TBC</span>
        </div>
      </div>

      {/* Toolbar */}
      <article className="dashboard-card">
        <div className="stack">
          {/* Publish status filter tabs */}
          <div className="dashboard-toolbar">
            {PUBLISH_FILTERS.map((f) => (
              <Link
                className={publishStatus === f.key ? "filter-tab active-filter" : "filter-tab"}
                href={buildEventsPath({ status: f.key, schedule: scheduleStatus, visibility, search })}
                key={f.key}
              >
                {f.label}
              </Link>
            ))}
            <div className="filter-tab-divider" />
            {SCHEDULE_FILTERS.map((f) => (
              <Link
                className={scheduleStatus === f.key ? "filter-tab filter-tab-secondary active-filter" : "filter-tab filter-tab-secondary"}
                href={buildEventsPath({ status: publishStatus, schedule: f.key, visibility, search })}
                key={f.key}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {/* Search + visibility + actions */}
          <div className="admin-member-controls">
            <form action="/admin/events" className="inline-filter-form" style={{ flex: 1 }}>
              {publishStatus !== "all" ? <input name="status" type="hidden" value={publishStatus} /> : null}
              {scheduleStatus !== "all" ? <input name="schedule" type="hidden" value={scheduleStatus} /> : null}
              <input
                defaultValue={search}
                name="search"
                placeholder="Search title, institution, theme, location…"
                style={{ flex: 1, minWidth: "200px" }}
              />
              <select defaultValue={visibility} name="visibility" style={{ maxWidth: "140px" }}>
                <option value="all">All visibility</option>
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="restricted">Restricted</option>
              </select>
              <button className="secondary-button" type="submit">Search</button>
            </form>

            <div className="member-toolbar-actions-panel">
              <Link className="secondary-button" href="/events">Public view</Link>
              <Link className="primary-button" href="/admin/events/new">+ Add event</Link>
            </div>
          </div>

          {notice ? (
            <p className={notice === "error" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice)}
            </p>
          ) : null}
          {error ? <p className="form-error">{error.message}</p> : null}

          {search || publishStatus !== "all" || scheduleStatus !== "all" || visibility !== "all" ? (
            <p className="muted-note">
              Showing {filteredEvents.length} of {events.length} events.{" "}
              <Link className="text-link" href="/admin/events">Clear filters</Link>
            </p>
          ) : null}
        </div>
      </article>

      {/* Event list */}
      <article className="dashboard-card app-list-card">
        {filteredEvents.length ? (
          <div className="app-list">
            {filteredEvents.map((event) => {
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
                        <span className="status-chip chip-neutral">{event.event_type || "Event"}</span>
                        <span className={`status-chip ${scheduleChip}`}>{event.schedule_status}</span>
                        <span className={`status-chip ${publishChip}`}>{event.status}</span>
                        <span className="app-row-expand-hint">Details</span>
                      </div>
                    </div>
                    <div className="app-row-meta">
                      <span>{event.display_date || "Date pending"}</span>
                      {event.organising_institutions?.length ? (
                        <span>{event.organising_institutions[0]}{event.organising_institutions.length > 1 ? ` +${event.organising_institutions.length - 1}` : ""}</span>
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
                        <p>{event.display_date || "Pending"}</p>
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
            <strong>No events found</strong>
            <p>No events match the current filters.{" "}
              <Link className="text-link" href="/admin/events">Clear filters</Link>
            </p>
          </div>
        )}
      </article>
    </DashboardShell>
  );
}
