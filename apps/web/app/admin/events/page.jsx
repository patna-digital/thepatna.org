import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import {
  buildAdminEventSummary,
  fetchAdminEvents,
  filterAdminEvents,
} from "@/lib/events";
import { requireAdminContext } from "@/lib/supabase/access";

function getNoticeMessage(notice) {
  if (notice === "saved") {
    return "Event saved.";
  }

  if (notice === "missing-fields") {
    return "Title and either a display date or start date are required.";
  }

  if (notice === "error") {
    return "Event update failed. Please retry.";
  }

  return "";
}

export default async function AdminEventsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolvedSearchParams = await searchParams;
  const publishStatus =
    typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : "all";
  const scheduleStatus =
    typeof resolvedSearchParams?.schedule === "string" ? resolvedSearchParams.schedule : "all";
  const visibility =
    typeof resolvedSearchParams?.visibility === "string" ? resolvedSearchParams.visibility : "all";
  const search =
    typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const { events, error } = await fetchAdminEvents({ supabase });
  const summary = buildAdminEventSummary(events);
  const filteredEvents = filterAdminEvents(events, {
    publishStatus,
    scheduleStatus,
    search,
    visibility,
  });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Events register",
        title: "PATNA events with editorial ownership",
        body: "Maintain the live events register here after the initial spreadsheet import, with creator and last-editor metadata preserved on every record.",
      }}
      title="Events"
      subtitle="Manage published, draft, and archived PATNA events with shared admin editing and explicit ownership."
    >
      <div className="summary-grid">
        <div className="summary-tile">
          <strong>{summary.total}</strong>
          <span>Total events</span>
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
          <span>TBC dates</span>
        </div>
      </div>

      <article className="dashboard-card">
        <div className="stack">
          <div className="dashboard-toolbar">
            <Link className="primary-button" href="/admin/events/new">
              Add event
            </Link>
            <Link className="secondary-button" href="/events">
              View public events
            </Link>
          </div>

          <p className="muted-note">
            Initial register import:
            {" "}
            <code>pnpm events:import -- --input /path/to/PATNA_Events_Register.xlsx</code>
          </p>

          <form action="/admin/events" className="inline-filter-form">
            <label>
              Search
              <input defaultValue={search} name="search" placeholder="Title, institution, theme, location" />
            </label>
            <label>
              Publish status
              <select defaultValue={publishStatus} name="status">
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Schedule
              <select defaultValue={scheduleStatus} name="schedule">
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="tbc">TBC</option>
              </select>
            </label>
            <label>
              Visibility
              <select defaultValue={visibility} name="visibility">
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="restricted">Restricted</option>
              </select>
            </label>
            <button className="secondary-button" type="submit">
              Apply filters
            </button>
          </form>

          {notice ? <p className="form-success">{getNoticeMessage(notice)}</p> : null}
          {error ? <p className="form-error">{error.message}</p> : null}
        </div>
      </article>

      <div className="stack">
        {filteredEvents.length ? (
          filteredEvents.map((event) => (
            <article className="dashboard-card" key={event.id}>
              <div className="list-row">
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.summary || "No event summary yet."}</p>
                </div>
                <div className="item-meta">
                  <span className="status-chip chip-neutral">{event.event_type || "Event"}</span>
                  <span className="status-chip chip-neutral">{event.schedule_status}</span>
                  <span className="status-chip chip-neutral">{event.status}</span>
                  <span>{event.display_date || "Date pending"}</span>
                </div>
              </div>

              <div className="member-definition-grid">
                <div className="member-detail-card">
                  <dt>Location</dt>
                  <dd>{event.location || "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Institutions</dt>
                  <dd>{event.organising_institutions.length ? event.organising_institutions.join(", ") : "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>PATNA involvement</dt>
                  <dd>{event.patna_involvement || "Not provided"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Creator</dt>
                  <dd>{event.creatorName || "Not recorded"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Last editor</dt>
                  <dd>{event.updatedByName || "Not recorded"}</dd>
                </div>
                <div className="member-detail-card">
                  <dt>Visibility</dt>
                  <dd>{event.visibility}</dd>
                </div>
              </div>

              <div className="member-action-row">
                <div className="content-meta">
                  {event.themes.map((theme) => (
                    <span key={theme}>{theme}</span>
                  ))}
                </div>
                <Link className="primary-button" href={`/admin/events/${event.id}`}>
                  Edit event
                </Link>
              </div>
            </article>
          ))
        ) : (
          <article className="dashboard-card">
            <h3>No events found</h3>
            <p>No events match the current filters.</p>
          </article>
        )}
      </div>
    </DashboardShell>
  );
}
