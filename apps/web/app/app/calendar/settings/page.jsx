import { redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchCalendarConnections, fetchBookingSettings } from "@/lib/calendar/data";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { CalendarSettingsClient } from "./calendar-settings-client";

export const metadata = {
  title: "Calendar Settings | PATNA",
  description: "Manage your calendar connections and booking preferences",
};

export default async function CalendarSettingsPage() {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/calendar/settings");
  }

  const [frameData, connectionsResult, settingsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchCalendarConnections({ memberId: user.id, supabase }),
    fetchBookingSettings({ memberId: user.id, supabase }),
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
      subtitle="Manage your calendar connections and booking preferences"
      title="Calendar Settings"
    >
      <div className="calendar-settings-content">
        <CalendarSettingsClient
          connections={connectionsResult.connections}
          settings={settingsResult.settings}
          memberId={user.id}
        />
      </div>
    </MemberWorkspaceShell>
  );
}
