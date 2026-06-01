import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminEventForm } from "@/components/admin-event-form";
import { adminNav } from "@/lib/patna-data";
import { fetchAdminEventById } from "@/lib/events";
import { requireAdminContext } from "@/lib/supabase/access";
import { saveAdminEventAction } from "../actions";
import { addEventGalleryImageAction, removeEventGalleryImageAction } from "../gallery-actions";
import { GalleryManager } from "@/components/admin/gallery-manager";

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

export default async function AdminEventDetailPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { eventId } = await params;
  const resolvedSearchParams = await searchParams;
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const [{ event, error }, galleryResult] = await Promise.all([
    fetchAdminEventById({ eventId, supabase }),
    supabase
      .from("event_gallery")
      .select("id, image_url, alt_text, caption, sort_order")
      .eq("event_id", eventId)
      .order("sort_order"),
  ]);

  const galleryImages = galleryResult.data || [];

  if (error || !event) {
    redirect("/admin/events");
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Ownership",
        title: event.creatorName || "PATNA event",
        body: `Created by ${event.creatorName || "PATNA admin"} and last updated by ${event.updatedByName || "PATNA admin"}.`,
      }}
      title={event.title}
      subtitle="Edit event details, visibility, publication state, and ownership-aware metadata."
    >
      {notice ? <p className={notice === "saved" ? "form-success" : "form-error"}>{getNoticeMessage(notice)}</p> : null}
      <AdminEventForm action={saveAdminEventAction} event={event} submitLabel="Save event" />

      <div className="form-card" style={{ marginTop: "1rem" }}>
        <GalleryManager
          addAction={addEventGalleryImageAction}
          contentId={event.id}
          contentIdFieldName="event_id"
          galleryImages={galleryImages}
          removeAction={removeEventGalleryImageAction}
        />
      </div>
    </DashboardShell>
  );
}
