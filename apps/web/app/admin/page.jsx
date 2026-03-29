import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";

export default async function AdminPage() {
  const { supabase } = await requireAdminContext();

  const [
    { count: applicationsCount },
    { count: submittedCount },
    { count: interviewingCount },
    { count: membersCount },
    { count: pendingInviteCount },
  ] =
    await Promise.all([
      supabase.from("community_applications").select("*", { count: "exact", head: true }),
      supabase
        .from("community_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted"),
      supabase
        .from("community_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "interviewing"),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "member"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("migration_batch_id", "is", null)
        .is("invited_at", null),
    ]);

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Live workflow",
        title: "Community application review",
        body: "This area is already writing to Supabase, so design changes now sit on top of a working operational workflow.",
      }}
      title="Admin overview"
      subtitle="This area is now connected to live Supabase data, starting with the community application review workflow."
    >
      <div className="summary-grid">
        <div className="summary-tile">
          <strong>{applicationsCount ?? 0}</strong>
          <span>Total applications</span>
        </div>
        <div className="summary-tile">
          <strong>{submittedCount ?? 0}</strong>
          <span>Submitted</span>
        </div>
        <div className="summary-tile">
          <strong>{interviewingCount ?? 0}</strong>
          <span>Interviewing</span>
        </div>
        <div className="summary-tile">
          <strong>{membersCount ?? 0}</strong>
          <span>Members</span>
        </div>
        <div className="summary-tile">
          <strong>{pendingInviteCount ?? 0}</strong>
          <span>Imported, not contacted</span>
        </div>
      </div>

      <div className="card-grid">
        <article className="dashboard-card">
          <h3>Applications</h3>
          <p>Review community applications, capture notes, update status, and prepare invite decisions.</p>
          <div className="content-meta">
            <Link className="primary-button" href="/admin/applications">
              Open review queue
            </Link>
          </div>
        </article>
        <article className="dashboard-card">
          <h3>Members</h3>
          <p>Review imported cohort members, inspect onboarding status, and send login emails when you are ready.</p>
          <div className="content-meta">
            <Link className="primary-button" href="/admin/members">
              Open member queue
            </Link>
          </div>
        </article>
        <article className="dashboard-card">
          <h3>Content</h3>
          <p>Manage insights, projects, attachments, events, and partner records.</p>
        </article>
        <article className="dashboard-card">
          <h3>Pipelines</h3>
          <p>Track service requests, partnership leads, and collaboration proposals from the public site.</p>
        </article>
      </div>
    </DashboardShell>
  );
}
