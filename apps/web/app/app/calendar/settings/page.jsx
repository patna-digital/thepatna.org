import { redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchCalendarConnections, fetchBookingSettings } from "@/lib/calendar/data";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { CalendarSettingsClient } from "./calendar-settings-client";

export const metadata = {
  title: "Calendar Sync | PATNA",
  description: "Connect your calendars and manage booking preferences",
};

function getCalendarSettingsNotice(searchParams) {
  const success = typeof searchParams?.success === "string" ? searchParams.success : "";
  const error = typeof searchParams?.error === "string" ? searchParams.error : "";
  const provider = typeof searchParams?.provider === "string" ? searchParams.provider : "calendar";
  const sync = typeof searchParams?.sync === "string" ? searchParams.sync : "";
  const providerLabel = {
    google: "Google Calendar",
    microsoft: "Outlook Calendar",
    zoho: "Zoho Calendar",
  }[provider] || "calendar";

  if (error === "oauth_denied") {
    return {
      message: `${providerLabel} connection was cancelled.`,
      tone: "error",
    };
  }

  if (error) {
    return {
      message: `There was a problem connecting ${providerLabel}. Please try again.`,
      tone: "error",
    };
  }

  if (success === "connected" && sync === "partial") {
    return {
      message: `${providerLabel} connected, but some calendars still need a retry. Use Sync now if items are missing.`,
      tone: "warning",
    };
  }

  if (success === "connected") {
    return {
      message: `${providerLabel} connected and initial import completed.`,
      tone: "success",
    };
  }

  return {
    message: "",
    tone: "success",
  };
}

export default async function CalendarSettingsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
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
  const notice = getCalendarSettingsNotice(resolvedSearchParams);

  const headerActions = (
    <>
      <Link href="/app/calendar" className="secondary-button">
        View Calendar
      </Link>
      <Link href="/app/calendar/availability" className="secondary-button">
        ← Availability
      </Link>
    </>
  );

  return (
    <MemberWorkspaceShell
      eyebrow="Calendar"
      headerActions={headerActions}
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle="Connect your calendars and configure booking preferences"
      title="Calendar Sync"
    >
      <div className="calendar-settings-content">
        <CalendarSettingsClient
          connections={connectionsResult.connections}
          initialMessage={notice.message}
          initialMessageTone={notice.tone}
          settings={settingsResult.settings}
          memberId={user.id}
        />
      </div>
    </MemberWorkspaceShell>
  );
}
