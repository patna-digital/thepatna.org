import { getTranslations } from "next-intl/server";

function formatSubmissionDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getSubmissionChipClass(status) {
  if (status === "approved") {
    return "chip-success";
  }

  if (status === "rejected") {
    return "chip-danger";
  }

  return "chip-warning";
}

export async function MemberEventSubmissionsPanel({ submissions = [] }) {
  const t = await getTranslations();

  if (!submissions.length) {
    return null;
  }

  return (
    <article className="dashboard-card member-event-submissions-card">
      <div className="member-event-submissions-header">
        <div>
          <h3>{t("appEvents.mySubmissionsTitle")}</h3>
          <p className="member-section-copy">
            {t("appEvents.mySubmissionsSubtitle")}
          </p>
        </div>
      </div>

      <div className="member-event-submissions-list">
        {submissions.map((submission) => (
          <div className="member-event-submission-row" key={submission.id}>
            <div className="member-event-submission-row-main">
              <div className="member-event-submission-copy">
                <strong>{submission.title}</strong>
                <span>
                  {submission.display_date || formatSubmissionDate(submission.starts_at) || t("appEvents.datePending")}
                  {submission.location ? ` · ${submission.location}` : ""}
                </span>
              </div>
              <span className={`status-chip ${getSubmissionChipClass(submission.submission_status)}`}>
                {submission.submission_status}
              </span>
            </div>

            {submission.review_notes ? (
              <p className="member-event-submission-note">
                {submission.submission_status === "rejected"
                  ? `${t("appEvents.reviewNotePrefix")}: `
                  : `${t("appEvents.adminNotePrefix")}: `}
                {submission.review_notes}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}
