import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminEventSubmissionReviewForm } from "@/components/admin-event-submission-review-form";
import { adminNav } from "@/lib/patna-data";
import { fetchAdminEventSubmissionById } from "@/lib/event-submissions";
import { requireAdminContext } from "@/lib/supabase/access";
import { approveEventSubmissionAction, rejectEventSubmissionAction } from "../../actions";

function getNoticeMessage(notice) {
  if (notice === "approved") {
    return "Submission approved and synced to the PATNA events register.";
  }

  if (notice === "rejected") {
    return "Submission marked as rejected.";
  }

  if (notice === "missing-fields") {
    return "Title and either a display date or start date are required.";
  }

  if (notice === "error") {
    return "The review action failed. Please retry.";
  }

  return "";
}

function formatDateTime(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminEventSubmissionDetailPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { submissionId } = await params;
  const resolvedSearchParams = await searchParams;
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const { submission, error } = await fetchAdminEventSubmissionById({
    submissionId,
    supabase,
  });

  if (error || !submission) {
    redirect("/admin/events");
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Member submission",
        title: submission.submittedByName || "Event submission",
        body: `Submitted ${formatDateTime(submission.created_at)}${submission.reviewedByName ? ` · reviewed by ${submission.reviewedByName}` : ""}.`,
      }}
      title={submission.title}
      subtitle="Review, edit, approve, or reject this member-submitted event."
    >
      {notice ? <p className={notice === "approved" ? "form-success" : "form-error"}>{getNoticeMessage(notice)}</p> : null}

      <div className="summary-grid">
        <div className="summary-tile">
          <strong>{submission.submission_status}</strong>
          <span>Current status</span>
        </div>
        <div className="summary-tile">
          <strong>{submission.submittedByName || "Member"}</strong>
          <span>Submitted by</span>
        </div>
        <div className="summary-tile">
          <strong>{formatDateTime(submission.created_at)}</strong>
          <span>Submitted at</span>
        </div>
        <div className="summary-tile">
          <strong>{submission.reviewedByName || "Pending"}</strong>
          <span>Reviewed by</span>
        </div>
      </div>

      {submission.approved_event_id ? (
        <article className="dashboard-card">
          <h3>Approved event</h3>
          <p className="member-section-copy">
            This submission is linked to a live event record.
          </p>
          <Link className="secondary-button" href={`/admin/events/${submission.approved_event_id}`}>
            Open approved event
          </Link>
        </article>
      ) : null}

      <AdminEventSubmissionReviewForm
        action={approveEventSubmissionAction}
        rejectAction={rejectEventSubmissionAction}
        submission={submission}
      />
    </DashboardShell>
  );
}
