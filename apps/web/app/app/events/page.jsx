import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberEventsClient } from "@/components/member-events-client";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberEvents } from "@/lib/events";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { getCurrentUserContext } from "@/lib/supabase/access";

export default async function MemberEventsPage() {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/events");
  }

  const [frameData, memberEventsResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchMemberEvents({ supabase }),
  ]);

  if (frameData.error || !frameData.member) {
    redirect("/app/profile");
  }

  return (
    <MemberWorkspaceShell
      eyebrow="Calendar"
      headerActions={(
        <>
          <Link className="secondary-button" href="/events">
            Public archive
          </Link>
          <Link className="primary-button" href="/contact">
            Submit an event
          </Link>
        </>
      )}
      sidebarUser={frameData.sidebarUser}
      subtitle="Workshops, summits, and coordination meetings across the live PATNA events register, organised into upcoming, past, and still-to-be-confirmed records."
      title="Events"
    >
      {memberEventsResult.error ? (
        <article className="dashboard-card member-module-card">
          <h3>Live sync warning</h3>
          <p className="member-section-copy">
            The live events register could not be refreshed, so you are seeing the current fallback archive instead.
          </p>
        </article>
      ) : null}
      <MemberEventsClient events={memberEventsResult.events} />
    </MemberWorkspaceShell>
  );
}
