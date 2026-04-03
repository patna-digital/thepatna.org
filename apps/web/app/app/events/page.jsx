import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MemberEventsClient } from "@/components/member-events-client";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberEvents } from "@/lib/events";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { getCurrentUserContext } from "@/lib/supabase/access";

export default async function MemberEventsPage() {
  const t = await getTranslations();
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/events");
  }

  const [frameData, memberEventsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchMemberEvents({ supabase }),
  ]);

  // Allow navigation even with incomplete profile
  const sidebarUser = frameData.sidebarUser || null;

  return (
    <MemberWorkspaceShell
      eyebrow={t("appEvents.eyebrow")}
      headerActions={(
        <Link className="primary-button" href="/contact">
          {t("appEvents.btnSubmit")}
        </Link>
      )}
      sidebarUser={sidebarUser}
      subtitle={t("appEvents.subtitle")}
      title={t("appEvents.title")}
    >
      {memberEventsResult.error ? (
        <article className="dashboard-card member-module-card">
          <h3>{t("appEvents.warningTitle")}</h3>
          <p className="member-section-copy">
            {t("appEvents.warningText")}
          </p>
        </article>
      ) : null}
      <MemberEventsClient events={memberEventsResult.events} />
    </MemberWorkspaceShell>
  );
}
