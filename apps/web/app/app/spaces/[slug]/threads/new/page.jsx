import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { ThreadCompose } from "@/components/thread-compose";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchSpaceBySlug } from "@/lib/spaces";
import { createThreadAction } from "../../actions";

export default async function NewThreadPage({ params }) {
  const { slug } = await params;

  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect(`/auth/login?next=/app/spaces/${slug}/threads/new`);
  }

  const [frameData, { space, error: spaceError }] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchSpaceBySlug({ supabase, slug, userId: user.id }),
  ]);

  if (spaceError || !space) {
    notFound();
  }

  if (!space.isMember) {
    redirect(`/app/spaces/${slug}`);
  }

  const sidebarUser = frameData.sidebarUser || null;

  return (
    <MemberWorkspaceShell
      eyebrow={
        <Link href={`/app/spaces/${slug}`} style={{ color: "inherit", textDecoration: "none" }}>
          ← {space.name}
        </Link>
      }
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle="Share a question, update, or topic with this space."
      title="New Thread"
    >
      <div className="member-dashboard-stack">
        <article className="dashboard-card member-module-card">
          <ThreadCompose
            action={createThreadAction}
            spaceId={space.id}
            spaceSlug={slug}
          />
        </article>
      </div>
    </MemberWorkspaceShell>
  );
}
