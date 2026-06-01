import Link from "next/link";
import { buildEventFormValues } from "@/lib/events";
import { EventFormFields } from "@/components/event-form-fields";

const PUBLISH_STATUS_OPTIONS = ["draft", "published", "archived"];
const SCHEDULE_STATUS_OPTIONS = ["upcoming", "past", "tbc"];
const VISIBILITY_OPTIONS = ["public", "members", "restricted"];

function getDefaultScheduleStatus(submission) {
  if (submission.starts_at) {
    return new Date(submission.starts_at).getTime() < Date.now() ? "past" : "upcoming";
  }

  return submission.display_date ? "tbc" : "upcoming";
}

export function AdminEventSubmissionReviewForm({
  submission,
  action,
  rejectAction,
  cancelHref = "/admin/events",
}) {
  const values = buildEventFormValues(submission);
  const hasApprovedEvent = Boolean(submission.approved_event_id);

  return (
    <div className="stack">
      <form action={action} className="form-card stack">
        <input name="submission_id" type="hidden" value={submission.id} />
        <EventFormFields values={values} />

        <div className="two-column-grid">
          <label>
            Schedule status
            <select defaultValue={getDefaultScheduleStatus(submission)} name="schedule_status">
              {SCHEDULE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Visibility
            <select defaultValue="members" name="visibility">
              {VISIBILITY_OPTIONS.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {visibility}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="two-column-grid">
          <label>
            Publish status
            <select defaultValue="published" name="status">
              {PUBLISH_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Reviewer note
            <textarea
              defaultValue={submission.review_notes || ""}
              name="review_notes"
              placeholder="Optional context for the submitter or future editors."
            />
          </label>
        </div>

        <div className="form-action-row">
          <Link className="secondary-button" href={cancelHref}>
            Back to queue
          </Link>
          <button className="primary-button" type="submit">
            {hasApprovedEvent ? "Update approved event" : "Approve and create event"}
          </button>
        </div>
      </form>

      <form action={rejectAction} className="form-card stack">
        <input name="submission_id" type="hidden" value={submission.id} />
        <label>
          Reject or send back
          <textarea
            defaultValue={submission.submission_status === "rejected" ? submission.review_notes || "" : ""}
            name="review_notes"
            placeholder="Tell the member what needs to change before this can be approved."
          />
        </label>

        <div className="form-action-row">
          <div className="muted-note">Rejecting keeps the submission in the queue with reviewer context attached.</div>
          <button className="secondary-button button-danger-muted" type="submit">
            Reject submission
          </button>
        </div>
      </form>
    </div>
  );
}
