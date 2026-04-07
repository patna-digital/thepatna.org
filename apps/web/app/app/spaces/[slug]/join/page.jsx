import { redirect } from "next/navigation";
import Link from "next/link";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchSpaceBySlug } from "@/lib/spaces";
import { formatSpaceType } from "@/lib/space-types";
import { requestJoinAction } from "../actions";

export default async function JoinSpacePage({ params, searchParams }) {
  const { slug } = await params;
  const { notice } = await searchParams || {};

  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect(`/auth/login?next=/app/spaces/${slug}/join`);
  }

  const [frameData, { space, error }] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchSpaceBySlug({ supabase, slug, userId: user.id }),
  ]);

  // If user is already a member, send them to the space
  if (space?.isMember) {
    redirect(`/app/spaces/${slug}`);
  }

  const sidebarUser = frameData.sidebarUser || null;
  const spaceName   = space?.name || slug;
  const spaceType   = space ? formatSpaceType(space.space_type) : "";
  const alreadySent = notice === "sent";

  return (
    <MemberWorkspaceShell
      eyebrow="My Spaces"
      sidebarUser={sidebarUser}
      subtitle={spaceType}
      title={spaceName}
    >
      <div className="join-gate-wrap">
        {alreadySent ? (
          <div className="join-gate-sent">
            <div className="join-gate-icon" aria-hidden="true">✓</div>
            <h2>Request sent</h2>
            <p>
              Your request to join <strong>{spaceName}</strong> has been sent to the
              PATNA team. You will be notified once access is approved.
            </p>
            <Link className="primary-button" href="/app/spaces">
              Back to spaces
            </Link>
          </div>
        ) : (
          <div className="join-gate-card">
            <div className="join-gate-lock" aria-hidden="true">🔒</div>
            <h2>Request access</h2>
            <p className="join-gate-desc">
              <strong>{spaceName}</strong> is a members-only space.
              {space?.description && ` ${space.description}`}
            </p>

            {notice === "error" && (
              <p className="form-error" style={{ marginBottom: "1rem" }}>
                Something went wrong. Please try again.
              </p>
            )}

            <form action={requestJoinAction} className="join-gate-form">
              <input name="spaceSlug" type="hidden" value={slug} />
              <input name="spaceName" type="hidden" value={spaceName} />

              <label className="form-label" htmlFor="join-message">
                Why do you want to join this space? <span style={{ fontWeight: 400, color: "var(--ink-soft)" }}>(optional)</span>
              </label>
              <textarea
                className="form-input join-gate-textarea"
                id="join-message"
                name="message"
                placeholder="Briefly describe your interest or how you'd contribute…"
                rows={3}
              />

              <button className="primary-button" type="submit">
                Request access
              </button>
            </form>

            <Link className="join-gate-back" href="/app/spaces">
              ← Back to spaces
            </Link>
          </div>
        )}
      </div>
    </MemberWorkspaceShell>
  );
}
