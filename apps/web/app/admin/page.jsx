import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";

export default async function AdminPage() {
  const t = await getTranslations();
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
      brandLabel={t("admin.brandLabel")}
      eyebrow={t("admin.eyebrow")}
      navItems={adminNav}
      spotlight={{
        label: t("admin.spotlightLabel"),
        title: t("admin.spotlightTitle"),
        body: t("admin.spotlightBody"),
      }}
      title={t("admin.title")}
      subtitle={t("admin.subtitle")}
    >
      <div className="admin-stat-grid admin-stat-grid-5">
        <div className="admin-stat-card">
          <strong>{applicationsCount ?? 0}</strong>
          <h4>{t("admin.tileTotalApplications")}</h4>
          <p>All time</p>
        </div>
        <div className="admin-stat-card tone-warning">
          <strong>{submittedCount ?? 0}</strong>
          <h4>{t("admin.tileSubmitted")}</h4>
          <p>Awaiting review</p>
        </div>
        <div className="admin-stat-card tone-muted">
          <strong>{interviewingCount ?? 0}</strong>
          <h4>{t("admin.tileInterviewing")}</h4>
          <p>In progress</p>
        </div>
        <div className="admin-stat-card tone-success">
          <strong>{membersCount ?? 0}</strong>
          <h4>{t("admin.tileTotalMembers")}</h4>
          <p>Active role holders</p>
        </div>
        <div className="admin-stat-card tone-warning">
          <strong>{pendingInviteCount ?? 0}</strong>
          <h4>{t("admin.tilePendingInvites")}</h4>
          <p>Not yet contacted</p>
        </div>
      </div>

      <div className="admin-action-grid">
        <article className="admin-action-card">
          <div className="admin-action-card-label">Review queue</div>
          <h3>{t("admin.applicationsTitle")}</h3>
          <p>{t("admin.applicationsText")}</p>
          <div className="admin-action-card-footer">
            <Link className="primary-button" href="/admin/applications">
              {t("admin.btnApplicationsQueue")}
            </Link>
          </div>
        </article>
        <article className="admin-action-card">
          <div className="admin-action-card-label">Cohort directory</div>
          <h3>{t("admin.membersTitle")}</h3>
          <p>{t("admin.membersText")}</p>
          <div className="admin-action-card-footer">
            <Link className="primary-button" href="/admin/members">
              {t("admin.btnMembersQueue")}
            </Link>
          </div>
        </article>
        <article className="admin-action-card">
          <div className="admin-action-card-label">Scheduling</div>
          <h3>{t("admin.eventsTitle")}</h3>
          <p>{t("admin.eventsText")}</p>
          <div className="admin-action-card-footer">
            <Link className="primary-button" href="/admin/events">
              {t("admin.btnEventsWorkspace")}
            </Link>
          </div>
        </article>
        <article className="admin-action-card">
          <div className="admin-action-card-label">Spaces</div>
          <h3>Community spaces</h3>
          <p>Manage working groups, cohort rooms, and constituency spaces — control membership, tags, and visibility.</p>
          <div className="admin-action-card-footer">
            <Link className="primary-button" href="/admin/spaces">
              Open spaces
            </Link>
          </div>
        </article>
        <article className="admin-action-card">
          <div className="admin-action-card-label">Knowledge</div>
          <h3>Insights library</h3>
          <p>Publish reports, briefs, and articles to the member knowledge base. Manage editorial status and visibility.</p>
          <div className="admin-action-card-footer">
            <Link className="primary-button" href="/admin/insights">
              Open insights
            </Link>
          </div>
        </article>
        <article className="admin-action-card is-disabled">
          <div className="admin-action-card-label">Coming soon</div>
          <h3>{t("admin.pipelinesTitle")}</h3>
          <p>{t("admin.pipelinesText")}</p>
          <div className="admin-action-card-footer">
            <span className="status-chip chip-muted">{t("admin.pipelinesNotAvailable")}</span>
          </div>
        </article>
      </div>
    </DashboardShell>
  );
}
