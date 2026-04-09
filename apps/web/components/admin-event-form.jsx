import Link from "next/link";
import { buildEventFormValues } from "@/lib/events";
import { CoverImageUpload } from "@/components/admin/cover-image-upload";
import { EventFormFields } from "@/components/event-form-fields";

const PUBLISH_STATUS_OPTIONS = ["draft", "published", "archived"];
const SCHEDULE_STATUS_OPTIONS = ["upcoming", "past", "tbc"];
const VISIBILITY_OPTIONS = ["public", "members", "restricted"];

export function AdminEventForm({
  action,
  cancelHref = "/admin/events",
  event = null,
  submitLabel = "Save event",
}) {
  const values = buildEventFormValues(event);

  return (
    <form action={action} className="form-card stack">
      <input name="event_id" type="hidden" value={values.id} />
      <EventFormFields values={values} />

      <div className="two-column-grid">
        <div />

        <div className="stack">
          <label>
            Schedule status
            <select defaultValue={values.schedule_status} name="schedule_status">
              {SCHEDULE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Visibility
            <select defaultValue={values.visibility} name="visibility">
              {VISIBILITY_OPTIONS.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {visibility}
                </option>
              ))}
            </select>
          </label>

          <label>
            Publish status
            <select defaultValue={values.status} name="status">
              {PUBLISH_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className="form-label" style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Cover image</p>
        <CoverImageUpload
          currentAlt={values.cover_image_alt}
          currentUrl={values.cover_image_url}
        />
      </div>

      {event?.id ? (
        <div className="field-summary-card">
          <strong>Ownership</strong>
          <p>
            Created by {event.creatorName || "PATNA admin"}.
            {event.updatedByName ? ` Last updated by ${event.updatedByName}.` : ""}
          </p>
        </div>
      ) : null}

      <div className="form-action-row">
        <Link className="secondary-button" href={cancelHref}>
          Back to events
        </Link>
        <button className="primary-button" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
