import { redirect } from "next/navigation";
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

  if (frameData.error || !frameData.member) {
    redirect("/app/profile");
  }

  return (
    <MemberWorkspaceShell
      eyebrow="Community"
      headerActions={<span className="member-lock-chip">Members only</span>}
      sidebarUser={frameData.sidebarUser}
      subtitle={`${members.length} active members across ${new Set(members.map((member) => member.primaryCohort?.slug).filter(Boolean)).size} cohorts, visible to current PATNA members.`}
      title="Member directory"
    >
      {error ? (
        <article className="dashboard-card">
          <h3>Directory unavailable</h3>
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
