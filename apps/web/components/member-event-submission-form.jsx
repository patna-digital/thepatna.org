import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { buildEventFormValues } from "@/lib/events";
import { EventFormFields } from "@/components/event-form-fields";

export async function MemberEventSubmissionForm({
  action,
  cancelHref = "/app/events",
  draft = null,
  submitLabel,
}) {
  const t = await getTranslations();
  const values = buildEventFormValues(draft);

  return (
    <form action={action} className="form-card stack">
      <div className="field-summary-card">
        <strong>{t("appEvents.submitReviewTitle")}</strong>
        <p>
          {t("appEvents.submitReviewBody")}
        </p>
      </div>

      <EventFormFields values={values} />

      <div className="form-action-row">
        <Link className="secondary-button" href={cancelHref}>
          {t("appEvents.backToEvents")}
        </Link>
        <button className="primary-button" type="submit">
          {submitLabel || t("appEvents.submitForReview")}
        </button>
      </div>
    </form>
  );
}
