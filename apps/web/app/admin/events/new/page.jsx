import { DashboardShell } from "@/components/dashboard-shell";
import { AdminEventForm } from "@/components/admin-event-form";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { saveAdminEventAction } from "../actions";

function buildDraftFromSearchParams(searchParams) {
  const dateParam = typeof searchParams?.date === "string" ? searchParams.date : "";
  const startsOn = typeof searchParams?.starts_on === "string" ? searchParams.starts_on : dateParam;
  const endsOn = typeof searchParams?.ends_on === "string" ? searchParams.ends_on : startsOn;

  return {
    title: typeof searchParams?.title === "string" ? searchParams.title : "",
    event_type: typeof searchParams?.event_type === "string" ? searchParams.event_type : "",
    location: typeof searchParams?.location === "string" ? searchParams.location : "",
    display_date: typeof searchParams?.display_date === "string" ? searchParams.display_date : "",
    starts_at: startsOn ? `${startsOn}T00:00:00.000Z` : null,
    ends_at: endsOn ? `${endsOn}T23:59:59.000Z` : null,
    summary: "",
    body: "",
    patna_involvement: "",
    official_link: "",
    organising_institutions: [],
    themes: [],
    visibility: "members",
    status: "draft",
    schedule_status: "upcoming",
  };
}

function getNoticeMessage(notice) {
  if (notice === "missing-fields") {
    return "Title and either a display date or start date are required.";
  }

  if (notice === "error") {
    return "Event creation failed. Please retry.";
  }

  return "";
}

export default async function NewAdminEventPage({ searchParams }) {
  await requireAdminContext();
  const resolvedSearchParams = await searchParams;
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const draftEvent = buildDraftFromSearchParams(resolvedSearchParams || {});

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "New record",
        title: "Add a PATNA event",
        body: "Create a new event record here. Ownership is tied to the saving admin and remains editable by other admins.",
      }}
      title="Add event"
      subtitle="Create a new PATNA event record for the public and community event archive."
    >
      {notice ? <p className="form-error">{getNoticeMessage(notice)}</p> : null}
      <AdminEventForm action={saveAdminEventAction} event={draftEvent} submitLabel="Create event" />
    </DashboardShell>
  );
}
