import Link from "next/link";
import { AdminEventsList } from "@/components/admin-events-list";
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
          <span>Dates TBC</span>
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

          {/* Filters + actions */}
          <div className="admin-toolbar-actions">
            <form action="/admin/events" className="inline-filter-form" style={{ flex: 1 }}>
              {publishStatus !== "all" ? <input name="status" type="hidden" value={publishStatus} /> : null}
              {scheduleStatus !== "all" ? <input name="schedule" type="hidden" value={scheduleStatus} /> : null}
              <span className="admin-search-icon" aria-hidden="true">⌕</span>
              <input
                defaultValue={search}
                name="search"
                placeholder="Search title, institution, theme, location…"
                style={{ flex: 1, minWidth: "220px" }}
                type="search"
              />
              <select defaultValue={visibility} name="visibility" style={{ maxWidth: "160px" }}>
                <option value="all">All visibility</option>
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="restricted">Restricted</option>
              </select>
              <button className="secondary-button" type="submit">Filter</button>
            </form>

            <div className="admin-toolbar-right">
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

      <AdminEventsList events={filteredEvents} />
    </DashboardShell>
  );
}
