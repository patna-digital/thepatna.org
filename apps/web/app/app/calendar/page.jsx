import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { CalendarShell } from "@/components/calendar/calendar-shell";
import { fetchCalendarEvents } from "@/lib/calendar/data";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { getCurrentUserContext } from "@/lib/supabase/access";
import Link from "next/link";

export const metadata = {
  title: "Calendar | PATNA",
  description: "View community events and manage your schedule",
};

export default async function CalendarPage() {
  const { user, supabase, isAdmin } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: true,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/calendar");
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear - 1, 0, 1);
  const endOfYear = new Date(currentYear + 1, 11, 31);

  const startDate = startOfYear.toISOString().split("T")[0];
  const endDate = endOfYear.toISOString().split("T")[0];

  const [frameData, eventsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchCalendarEvents({
      memberId: user.id,
      startDate,
      endDate,
      supabase,
      isAdmin,
    }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;

  const headerActions = (
    <>
      <Link href="/app/calendar/settings" className="secondary-button">
        Settings
      </Link>
      <Link href="/app/calendar/availability" className="primary-button">
        Set Availability
      </Link>
    </>
  );

  return (
    <MemberWorkspaceShell
      eyebrow="Calendar"
      headerActions={headerActions}
      sidebarUser={sidebarUser}
      subtitle="A year-at-a-glance member calendar for PATNA events, RSVPs, and booked time"
      title="Calendar"
    >
      <div className="calendar-page-content">
        {eventsResult.error ? (
          <article className="dashboard-card member-module-card">
            <h3>Calendar warning</h3>
            <p className="member-section-copy">
              There was an issue loading your calendar events. Please try again later.
            </p>
          </article>
        ) : (
          <CalendarShell
            initialEvents={eventsResult.events || []}
            initialYear={currentYear}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </MemberWorkspaceShell>
  );
}
