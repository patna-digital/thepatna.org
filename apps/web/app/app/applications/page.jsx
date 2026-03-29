import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { memberApplications } from "@/lib/patna-data";
import { getCurrentUserContext } from "@/lib/supabase/access";
import {
  buildApplicationSummary,
  fetchMemberWorkspaceFrameData,
} from "@/lib/member-workspace";

function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function ApplicationsPage() {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/applications");
  }

  const frameData = await fetchMemberWorkspaceFrameData({ supabase, userId: user.id });

  if (frameData.error || !frameData.member) {
    redirect("/app/profile");
  }

  const summary = buildApplicationSummary(memberApplications);

  return (
    <MemberWorkspaceShell
      eyebrow="Review"
      sidebarUser={frameData.sidebarUser}
      subtitle="A structured review workspace for applicant notes, cohort context, and current decision status."
      title="Applications"
    >
      <div className="member-dashboard-stack">
        <div className="member-dashboard-summary-grid member-dashboard-summary-grid-compact">
          <article className="member-stat-card tone-orange">
            <strong>{summary.total}</strong>
            <h3>Total in queue</h3>
            <p>Applications currently surfaced for review</p>
          </article>
          <article className="member-stat-card tone-blue">
            <strong>{summary.submitted}</strong>
            <h3>Submitted</h3>
            <p>Awaiting first review pass</p>
          </article>
          <article className="member-stat-card tone-orange">
            <strong>{summary.interviewing}</strong>
            <h3>Interviewing</h3>
            <p>Needs notes before admin decision</p>
          </article>
        </div>

        <article className="dashboard-card member-module-card">
          <div className="member-section-heading">
            <div>
              <h3>Current applications</h3>
              <p className="member-section-copy">A compact review queue organized around applicant, cohort, and current status.</p>
            </div>
          </div>
          <div className="member-review-table">
            <div className="member-review-table-head">
              <span>Applicant</span>
              <span>Country / Organisation</span>
              <span>Cohort</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {memberApplications.map((application) => (
              <div className="member-review-row" key={application.name}>
                <strong>{application.name}</strong>
                <span>
                  {application.country} · {application.organisation}
                </span>
                <span className="status-chip chip-neutral">{application.cohort}</span>
                <span
                  className={
                    application.status === "interviewing"
                      ? "status-chip chip-warning"
                      : "status-chip chip-neutral"
                  }
                >
                  {formatStatus(application.status)}
                </span>
                <span className="status-chip chip-neutral">{application.actionLabel}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </MemberWorkspaceShell>
  );
}
