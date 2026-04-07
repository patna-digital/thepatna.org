import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { ThreadDetail } from "@/components/thread-detail";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchSpaceBySlug } from "@/lib/spaces";
import { fetchThreadById, fetchThreadComments } from "@/lib/threads";
import {
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
  deleteThreadAction,
} from "../../actions";

export default async function ThreadPage({ params }) {
  const { slug, threadId } = await params;

  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect(`/auth/login?next=/app/spaces/${slug}/threads/${threadId}`);
  }

  const [frameData, { space, error: spaceError }, { thread, error: threadError }, { comments }] =
    await Promise.all([
      fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
      fetchSpaceBySlug({ supabase, slug, userId: user.id }),
      fetchThreadById(supabase, threadId),
      fetchThreadComments(supabase, threadId),
    ]);

  if (spaceError || !space || threadError || !thread) {
    notFound();
  }

  const sidebarUser  = frameData.sidebarUser || null;
  const isAuthor     = thread.author?.id === user.id;
  const canEdit      = isAuthor || ["moderator", "lead"].includes(space.currentUserRole);

  return (
    <MemberWorkspaceShell
      eyebrow={
        <Link href={`/app/spaces/${slug}`} style={{ color: "inherit", textDecoration: "none" }}>
          ← {space.name}
        </Link>
      }
      headerActions={
        canEdit ? (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link
              className="secondary-button"
              href={`/app/spaces/${slug}/threads/${threadId}/edit`}
            >
              Edit thread
            </Link>
            <form action={deleteThreadAction}>
              <input name="threadId" type="hidden" value={threadId} />
              <input name="spaceSlug" type="hidden" value={slug} />
              <button className="btn-danger-outline" type="submit">
                Delete
              </button>
            </form>
          </div>
        ) : null
      }
      sidebarUser={sidebarUser}
      subtitle={`Started by ${thread.author?.name} · ${formatDate(thread.createdAt)}`}
      title={thread.title}
    >
      <div className="thread-page-stack">
        <ThreadDetail thread={thread} />

        <div className="thread-replies-section" id="replies">
          <h3 className="thread-section-label">
            {comments.length === 0 ? "No replies yet" : `${comments.length} ${comments.length === 1 ? "reply" : "replies"}`}
          </h3>
          <CommentList
            comments={comments}
            currentUserId={user.id}
            deleteAction={deleteCommentAction}
            spaceSlug={slug}
            threadId={threadId}
            updateAction={updateCommentAction}
          />
        </div>

        {space.isMember && (
          <CommentForm
            action={createCommentAction}
            spaceSlug={slug}
            threadId={threadId}
          />
        )}
      </div>
    </MemberWorkspaceShell>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
