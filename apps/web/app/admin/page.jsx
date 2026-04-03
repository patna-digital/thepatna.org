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
      <div className="summary-grid">
        <div className="summary-tile">
          <strong>{applicationsCount ?? 0}</strong>
          <span>{t("admin.tileTotalApplications")}</span>
        </div>
        <div className="summary-tile">
          <strong>{submittedCount ?? 0}</strong>
          <span>{t("admin.tileSubmitted")}</span>
        </div>
        <div className="summary-tile">
          <strong>{interviewingCount ?? 0}</strong>
          <span>{t("admin.tileInterviewing")}</span>
        </div>
        <div className="summary-tile">
          <strong>{membersCount ?? 0}</strong>
          <span>{t("admin.tileTotalMembers")}</span>
        </div>
        <div className="summary-tile">
          <strong>{pendingInviteCount ?? 0}</strong>
          <span>{t("admin.tilePendingInvites")}</span>
        </div>
        <div className="summary-tile is-disabled">
          <strong>—</strong>
          <span>{t("admin.tileActiveEvents")}</span>
        </div>
      </div>

      <div className="card-grid">
        <article className="dashboard-card">
          <h3>{t("admin.applicationsTitle")}</h3>
          <p>{t("admin.applicationsText")}</p>
          <div className="content-meta">
            <Link className="primary-button" href="/admin/applications">
              {t("admin.btnApplicationsQueue")}
            </Link>
          </div>
        </article>
        <article className="dashboard-card">
          <h3>{t("admin.membersTitle")}</h3>
          <p>{t("admin.membersText")}</p>
          <div className="content-meta">
            <Link className="primary-button" href="/admin/members">
              {t("admin.btnMembersQueue")}
            </Link>
          </div>
        </article>
        <article className="dashboard-card">
          <h3>{t("admin.eventsTitle")}</h3>
          <p>{t("admin.eventsText")}</p>
          <div className="content-meta">
            <Link className="primary-button" href="/admin/events">
              {t("admin.btnEventsWorkspace")}
            </Link>
          </div>
        </article>
        <article className="dashboard-card is-disabled">
          <h3>{t("admin.pipelinesTitle")} <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-soft)", marginLeft: "0.5rem" }}>{t("admin.pipelinesComingSoon")}</span></h3>
          <p>{t("admin.pipelinesText")}</p>
          <div className="content-meta">
            <span className="status-chip chip-muted">{t("admin.pipelinesNotAvailable")}</span>
          </div>
        </article>
      </div>
    </DashboardShell>
  );
}
