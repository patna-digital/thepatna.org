import { redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchAvailabilityRules } from "@/lib/calendar/data";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { AvailabilityEditorClient } from "./availability-editor-client";

export const metadata = {
  title: "Set Availability | PATNA",
  description: "Manage your availability for bookings",
};

export default async function AvailabilityPage() {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/calendar/availability");
  }

  const [frameData, rulesResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchAvailabilityRules({ memberId: user.id, supabase }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;

  const headerActions = (
    <Link href="/app/calendar" className="secondary-button">
      ← Back to Calendar
    </Link>
  );

  return (
    <MemberWorkspaceShell
      eyebrow="Calendar"
      headerActions={headerActions}
      sidebarUser={sidebarUser}
      subtitle="Set when you are available for bookings"
      title="Availability"
    >
      <div className="availability-page-content">
        <AvailabilityEditorClient
          initialRules={rulesResult.rules}
          memberId={user.id}
        />
      </div>
    </MemberWorkspaceShell>
  );
}
