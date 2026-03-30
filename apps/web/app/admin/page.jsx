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
        body: "This workspace supports application review, member preparation, and operational coordination across PATNA.",
      }}
      title="Admin overview"
      subtitle="Monitor applications, imported members, and the operational queues that support PATNA’s community workflows."
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
          <span>Total members</span>
        </div>
        <div className="summary-tile">
          <strong>{pendingInviteCount ?? 0}</strong>
          <span>Pending invites</span>
        </div>
        <div className="summary-tile is-disabled">
          <strong>—</strong>
          <span>Active events</span>
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
          <h3>Events</h3>
          <p>Manage the PATNA events register, publication state, and ownership-aware event metadata.</p>
          <div className="content-meta">
            <Link className="primary-button" href="/admin/events">
              Open events workspace
            </Link>
          </div>
        </article>
        <article className="dashboard-card is-disabled">
          <h3>Pipelines <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-soft)', marginLeft: '0.5rem' }}>(Coming soon)</span></h3>
          <p>Track service requests, partnership leads, and collaboration proposals from the public site.</p>
          <div className="content-meta">
            <span className="status-chip chip-muted">Not available</span>
          </div>
        </article>
      </div>
    </DashboardShell>
  );
}
