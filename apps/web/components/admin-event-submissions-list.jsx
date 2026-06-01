import Link from "next/link";
import { buildEventSubmissionSummary } from "@/lib/event-submissions";

function getSubmissionChipClass(status) {
  if (status === "approved") {
    return "chip-success";
  }

  if (status === "rejected") {
    return "chip-danger";
  }

  return "chip-warning";
}

export function AdminEventSubmissionsList({ submissions = [] }) {
  const summary = buildEventSubmissionSummary(submissions);

  return (
    <article className="dashboard-card app-list-card">
      <div className="admin-event-submissions-head">
        <div>
          <h3>Submission queue</h3>
          <p className="member-section-copy">
            Review proposed events from members before they become live PATNA events.
          </p>
        </div>

        <div className="admin-event-submissions-stats">
          <span className="status-chip chip-warning">Submitted {summary.submitted}</span>
          <span className="status-chip chip-success">Approved {summary.approved}</span>
          <span className="status-chip chip-danger">Rejected {summary.rejected}</span>
        </div>
      </div>

      {submissions.length ? (
        <div className="app-list">
          {submissions.map((submission) => (
            <div className="admin-event-submission-item" key={submission.id}>
              <div className="admin-event-submission-copy">
                <strong>{submission.title}</strong>
                <span>
                  {submission.submittedByName || "Member submission"}
                  {submission.location ? ` · ${submission.location}` : ""}
                </span>
              </div>
              <div className="admin-event-submission-actions">
                <span className={`status-chip ${getSubmissionChipClass(submission.submission_status)}`}>
                  {submission.submission_status}
                </span>
                <Link className="secondary-button" href={`/admin/events/submissions/${submission.id}`}>
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="app-row-empty">
          <strong>No submissions yet</strong>
          <p>Member-submitted events will appear here for admin review.</p>
        </div>
      )}
    </article>
  );
}
