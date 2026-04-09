import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MemberEventsClient } from "@/components/member-events-client";
import { MemberEventSubmissionsPanel } from "@/components/member-event-submissions-panel";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberEventSubmissions } from "@/lib/event-submissions";
import { fetchMemberEvents } from "@/lib/events";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { getCurrentUserContext } from "@/lib/supabase/access";

export default async function MemberEventsPage({ searchParams }) {
  const t = await getTranslations();
  const { user, supabase, isAdmin } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: true,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/events");
  }

  const resolvedSearchParams = await searchParams;
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const [frameData, memberEventsResult, submissionsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchMemberEvents({ supabase, memberId: user.id, isAdmin }),
    isAdmin
      ? Promise.resolve({ submissions: [], error: null })
      : fetchMemberEventSubmissions({ supabase, memberId: user.id }),
  ]);

  // Allow navigation even with incomplete profile
  const sidebarUser = frameData.sidebarUser || null;

  return (
    <MemberWorkspaceShell
      eyebrow={t("appEvents.eyebrow")}
      headerActions={(
        <Link className="primary-button" href={isAdmin ? "/admin/events/new" : "/app/events/submit"}>
          {t("appEvents.btnSubmit")}
        </Link>
      )}
      sidebarUser={sidebarUser}
      subtitle={t("appEvents.subtitle")}
      title={t("appEvents.title")}
    >
      {notice === "submitted" ? <p className="form-success">{t("appEvents.submitSuccess")}</p> : null}
      {memberEventsResult.error ? (
        <article className="dashboard-card member-module-card">
          <h3>{t("appEvents.warningTitle")}</h3>
          <p className="member-section-copy">
            {t("appEvents.warningText")}
          </p>
        </article>
      ) : null}
      {!isAdmin ? (
        <>
          {submissionsResult.error ? (
            <article className="dashboard-card member-module-card">
              <h3>{t("appEvents.submissionStatusUnavailableTitle")}</h3>
              <p className="member-section-copy">
                {t("appEvents.submissionStatusUnavailableText")}
              </p>
            </article>
          ) : null}
          <MemberEventSubmissionsPanel submissions={submissionsResult.submissions} />
        </>
      ) : null}
      <MemberEventsClient events={memberEventsResult.events} />
    </MemberWorkspaceShell>
  );
}
