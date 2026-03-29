import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MemberDirectoryClient } from "@/components/member-directory-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchActiveMemberDirectory } from "@/lib/member-profiles";

export default async function MembersPage() {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/members");
  }

  const adminClient = createSupabaseAdminClient();
  const { error, members } = await fetchActiveMemberDirectory({ adminClient });

  return (
    <DashboardShell
      title="Member directory"
      subtitle="All onboarded members with active profiles are visible here. Missing optional details can still be completed later without removing anyone from the directory."
    >
      {error ? (
        <article className="dashboard-card">
          <h3>Directory unavailable</h3>
          <p>{error.message}</p>
        </article>
      ) : (
        <MemberDirectoryClient currentUserId={user.id} members={members} />
      )}
    </DashboardShell>
  );
}
