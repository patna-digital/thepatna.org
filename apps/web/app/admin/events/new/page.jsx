import { DashboardShell } from "@/components/dashboard-shell";
import { AdminEventForm } from "@/components/admin-event-form";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { saveAdminEventAction } from "../actions";

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
      <AdminEventForm action={saveAdminEventAction} submitLabel="Create event" />
    </DashboardShell>
  );
}
