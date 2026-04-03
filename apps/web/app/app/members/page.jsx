import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MemberDirectoryClient } from "@/components/member-directory-client";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchActiveMemberDirectory } from "@/lib/member-profiles";
import {
  buildMemberDirectoryView,
  fetchMemberWorkspaceFrameData,
} from "@/lib/member-workspace";

export default async function MembersPage() {
  const t = await getTranslations();
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/members");
  }

  const adminClient = createSupabaseAdminClient();
  const [{ error, members }, frameData] = await Promise.all([
    fetchActiveMemberDirectory({ adminClient }),
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
  ]);

  // Allow navigation even with incomplete profile
  const sidebarUser = frameData.sidebarUser || null;

  const cohortCount = new Set(members.map((member) => member.primaryCohort?.slug).filter(Boolean)).size;

  return (
    <MemberWorkspaceShell
      eyebrow={t("members.eyebrow")}
      headerActions={<span className="member-lock-chip">{t("members.membersOnly")}</span>}
      sidebarUser={sidebarUser}
      subtitle={t("members.subtitle", { count: members.length, cohortCount })}
      title={t("members.title")}
    >
      {error ? (
        <article className="dashboard-card">
          <h3>{t("members.errorTitle")}</h3>
          <p>{error.message}</p>
        </article>
      ) : (
        <MemberDirectoryClient
          directory={buildMemberDirectoryView({ currentUserId: user.id, members })}
        />
      )}
    </MemberWorkspaceShell>
  );
}
