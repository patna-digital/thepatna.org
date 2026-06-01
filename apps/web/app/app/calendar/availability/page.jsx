import { redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchAvailabilityRules, fetchBookingSettings } from "@/lib/calendar/data";
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

  const [frameData, rulesResult, settingsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchAvailabilityRules({ memberId: user.id, supabase }),
    fetchBookingSettings({ memberId: user.id, supabase }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;

  const headerActions = (
    <>
      <Link href="/app/calendar" className="secondary-button">
        ← Back to Calendar
      </Link>
      <Link href="/app/calendar/settings" className="secondary-button">
        Calendar Sync →
      </Link>
    </>
  );

  return (
    <MemberWorkspaceShell
      eyebrow="Calendar"
      headerActions={headerActions}
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle="Set when you are available for bookings"
      title="Availability"
    >
      <div className="availability-page-content">
        <AvailabilityEditorClient
          initialRules={rulesResult.rules}
          initialBookingSettings={settingsResult.settings}
          memberId={user.id}
        />
        <div className="availability-flow-footer">
          <div className="availability-flow-footer-copy">
            <strong>Next: Connect your calendars</strong>
            <p>Sync Google, Outlook, or iCal to reflect real-time availability in your booking page.</p>
          </div>
          <Link className="primary-button" href="/app/calendar/settings">
            Go to Calendar Sync →
          </Link>
        </div>
      </div>
    </MemberWorkspaceShell>
  );
}
