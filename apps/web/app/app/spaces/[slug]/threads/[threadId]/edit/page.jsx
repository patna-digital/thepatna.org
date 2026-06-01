import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { ThreadEditCompose } from "@/components/thread-edit-compose";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchSpaceBySlug } from "@/lib/spaces";
import { fetchThreadById } from "@/lib/threads";
import { updateThreadAction } from "../../../actions";

export default async function EditThreadPage({ params }) {
  const { slug, threadId } = await params;

  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect(`/auth/login?next=/app/spaces/${slug}/threads/${threadId}/edit`);
  }

  const [frameData, { space, error: spaceError }, { thread, error: threadError }] =
    await Promise.all([
      fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
      fetchSpaceBySlug({ supabase, slug, userId: user.id }),
      fetchThreadById(supabase, threadId),
    ]);

  if (spaceError || !space || threadError || !thread) {
    notFound();
  }

  const isAuthor = thread.author?.id === user.id;
  const canEdit  = isAuthor || ["moderator", "lead"].includes(space.currentUserRole);

  if (!canEdit) {
    redirect(`/app/spaces/${slug}/threads/${threadId}`);
  }

  const sidebarUser = frameData.sidebarUser || null;

  return (
    <MemberWorkspaceShell
      eyebrow={
        <Link href={`/app/spaces/${slug}/threads/${threadId}`} style={{ color: "inherit", textDecoration: "none" }}>
          ← Back to thread
        </Link>
      }
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle="Update the title or body of this thread."
      title="Edit Thread"
    >
      <div className="member-dashboard-stack">
        <article className="dashboard-card member-module-card">
          <ThreadEditCompose
            action={updateThreadAction}
            spaceSlug={slug}
            thread={thread}
            threadId={threadId}
          />
        </article>
      </div>
    </MemberWorkspaceShell>
  );
}
