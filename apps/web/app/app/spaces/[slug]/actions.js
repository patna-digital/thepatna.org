"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  deleteAssistantDocuments,
  deleteThreadAssistantDocuments,
  syncCommentAssistantDocument,
  syncThreadAssistantDocument,
  syncThreadCommentAssistantDocumentsByThreadId,
} from "@/lib/assistant-indexing";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildSpaceJoinRequestContext,
  buildSpaceJoinRequestDetails,
} from "@/lib/space-join-requests";
import { detectMentions, createMentionNotification } from "@/lib/notifications";
import { fetchSpaceMemberNames } from "@/lib/spaces";

// ── Join request ──────────────────────────────────────────────────────────────

export async function requestJoinAction(formData) {
  const { supabase, user, profile } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const spaceSlug = formData.get("spaceSlug");
  const message   = String(formData.get("message") || "").trim();
  const resolvedSpaceSlug = String(spaceSlug || "").trim();

  if (!resolvedSpaceSlug) {
    redirect("/app/spaces?notice=error");
  }

  const client = canUseSupabaseAdmin() ? createSupabaseAdminClient() : supabase;
  const { data: space } = await client
    .from("spaces")
    .select("id, name, slug, visibility")
    .eq("slug", resolvedSpaceSlug)
    .maybeSingle();

  if (!space) {
    redirect(`/app/spaces/${resolvedSpaceSlug}/join?notice=error`);
  }

  if (space.visibility === "public_members") {
    redirect(`/app/spaces/${resolvedSpaceSlug}`);
  }

  const { data: existingMembership } = await client
    .from("space_memberships")
    .select("space_id")
    .eq("space_id", space.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership) {
    redirect(`/app/spaces/${resolvedSpaceSlug}`);
  }

  const existingRequestContext = buildSpaceJoinRequestContext(space.id);
  const { data: openRequests } = await client
    .from("service_requests")
    .select("id, status")
    .eq("request_type", "coordination")
    .eq("decision_context", existingRequestContext)
    .eq("requester_email", user.email)
    .neq("status", "closed");

  if ((openRequests || []).length > 0) {
    redirect(`/app/spaces/${resolvedSpaceSlug}/join?notice=sent`);
  }

  const firstName = profile?.first_name || "";
  const surname = profile?.surname || "";
  const fullName = [firstName, surname].filter(Boolean).join(" ") || user.email;
  const details = buildSpaceJoinRequestDetails({
    message,
    requesterUserId: user.id,
    spaceId: space.id,
    spaceName: space.name,
    spaceSlug: space.slug,
  });

  const { error } = await client.from("service_requests").insert({
    country: profile?.country_of_residence || null,
    decision_context: existingRequestContext,
    details,
    organisation: profile?.organisation_name || null,
    requester_email: user.email,
    requester_name: fullName,
    request_type: "coordination",
    status: "new",
    timeline: null,
  });

  if (error) {
    console.error("requestJoinAction error:", error);
    redirect(`/app/spaces/${resolvedSpaceSlug}/join?notice=error`);
  }

  revalidatePath("/app");
  revalidatePath("/app/spaces");
  redirect(`/app/spaces/${resolvedSpaceSlug}/join?notice=sent`);
}

// ── Thread actions ────────────────────────────────────────────────────────────

export async function createThreadAction(formData) {
  const { supabase, user, profile } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const spaceId = formData.get("spaceId");
  const slug    = formData.get("spaceSlug");
  const title   = String(formData.get("title") || "").trim();
  const body    = String(formData.get("body")  || "").trim();

  if (!title || !body || !spaceId) {
    redirect(`/app/spaces/${slug}/threads/new?notice=missing-fields`);
  }

  const { data, error } = await supabase
    .from("threads")
    .insert({ space_id: spaceId, author_id: user.id, title, body })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createThreadAction error:", error);
    redirect(`/app/spaces/${slug}/threads/new?notice=save-error`);
  }

  try {
    await syncThreadAssistantDocument({ threadId: data.id });
  } catch (assistantError) {
    console.error("createThreadAction assistant sync error:", assistantError);
  }

  // Dispatch @mention notifications (fire-and-forget, non-fatal)
  dispatchMentionNotifications({
    supabase,
    authorId: user.id,
    authorName: [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || user.email,
    body,
    spaceId,
    spaceSlug: slug,
    threadId: data.id,
    threadTitle: title,
  }).catch((err) => console.error("Thread mention notifications failed:", err));

  revalidatePath(`/app/spaces/${slug}`);
  redirect(`/app/spaces/${slug}/threads/${data.id}`);
}

export async function updateThreadAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const threadId  = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");
  const title     = String(formData.get("title") || "").trim();
  const body      = String(formData.get("body")  || "").trim();

  if (!title || !body || !threadId) {
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=missing-fields`);
  }

  const { error } = await supabase
    .from("threads")
    .update({ title, body })
    .eq("id", threadId)
    .eq("author_id", user.id); // RLS also enforces this

  if (error) {
    console.error("updateThreadAction error:", error);
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=save-error`);
  }

  try {
    await syncThreadAssistantDocument({ threadId });
    await syncThreadCommentAssistantDocumentsByThreadId({ threadId });
  } catch (assistantError) {
    console.error("updateThreadAction assistant sync error:", assistantError);
  }

  revalidatePath(`/app/spaces/${spaceSlug}/threads/${threadId}`);
  redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=updated`);
}

export async function deleteThreadAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const threadId  = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");
  const resolvedThreadId = String(threadId || "").trim();

  let commentIds = [];
  if (resolvedThreadId) {
    const { data: comments } = await supabase
      .from("comments")
      .select("id")
      .eq("thread_id", resolvedThreadId);

    commentIds = (comments || []).map((comment) => comment.id).filter(Boolean);
  }

  const { error } = await supabase
    .from("threads")
    .delete()
    .eq("id", threadId)
    .eq("author_id", user.id);

  if (error) {
    console.error("deleteThreadAction error:", error);
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=delete-error`);
  }

  try {
    await deleteThreadAssistantDocuments({ commentIds, threadId: resolvedThreadId });
  } catch (assistantError) {
    console.error("deleteThreadAction assistant sync error:", assistantError);
  }

  revalidatePath(`/app/spaces/${spaceSlug}`);
  redirect(`/app/spaces/${spaceSlug}?notice=thread-deleted`);
}

// ── Comment actions ───────────────────────────────────────────────────────────

export async function createCommentAction(formData) {
  const { supabase, user, profile } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const threadId  = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");
  const spaceId   = formData.get("spaceId");
  const body      = String(formData.get("body") || "").trim();

  if (!body || !threadId) {
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=missing-body`);
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ thread_id: threadId, author_id: user.id, body })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("createCommentAction error:", error);
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=reply-error`);
  }

  try {
    await syncCommentAssistantDocument({ commentId: data.id });
  } catch (assistantError) {
    console.error("createCommentAction assistant sync error:", assistantError);
  }

  // Dispatch @mention notifications if we have spaceId context
  if (spaceId) {
    // Fetch thread title for notification copy
    supabase
      .from("threads")
      .select("title")
      .eq("id", threadId)
      .single()
      .then(({ data: thread }) => {
        return dispatchMentionNotifications({
          supabase,
          authorId: user.id,
          authorName: [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || user.email,
          body,
          commentId: data.id,
          commentExcerpt: body.slice(0, 200),
          spaceId,
          spaceSlug,
          threadId,
          threadTitle: thread?.title ?? "a thread",
        });
      })
      .catch((err) => console.error("Comment mention notifications failed:", err));
  }

  revalidatePath(`/app/spaces/${spaceSlug}/threads/${threadId}`);
  redirect(`/app/spaces/${spaceSlug}/threads/${threadId}#replies`);
}

export async function updateCommentAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const commentId = formData.get("commentId");
  const threadId  = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");
  const body      = String(formData.get("body") || "").trim();

  if (!body || !commentId) {
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=missing-body`);
  }

  const { error } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) {
    console.error("updateCommentAction error:", error);
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=edit-error`);
  }

  try {
    await syncCommentAssistantDocument({ commentId });
  } catch (assistantError) {
    console.error("updateCommentAction assistant sync error:", assistantError);
  }

  revalidatePath(`/app/spaces/${spaceSlug}/threads/${threadId}`);
  redirect(`/app/spaces/${spaceSlug}/threads/${threadId}#replies`);
}

// ── Shared mention helper ─────────────────────────────────────────────────────

async function dispatchMentionNotifications({
  supabase,
  authorId,
  authorName,
  body,
  commentId = null,
  commentExcerpt = null,
  spaceId,
  spaceSlug,
  threadId,
  threadTitle,
}) {
  // Quick bail if no @ in body — avoids unnecessary DB queries
  if (!body.includes("@")) return;

  const [members, { data: spaceRow }] = await Promise.all([
    fetchSpaceMemberNames({ supabase, spaceId }),
    supabase.from("spaces").select("name").eq("id", spaceId).single(),
  ]);

  const mentionedIds = detectMentions(body, members);
  if (!mentionedIds.length) return;

  await Promise.allSettled(
    mentionedIds
      .filter((id) => id !== authorId) // never self-notify
      .map((recipientId) =>
        createMentionNotification({
          recipientId,
          senderId: authorId,
          senderName: authorName,
          spaceId,
          spaceSlug,
          spaceTitle: spaceRow?.name ?? spaceSlug,
          threadId,
          threadTitle,
          commentId,
          commentExcerpt,
        })
      )
  );
}

export async function deleteCommentAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const commentId = formData.get("commentId");
  const threadId  = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) {
    console.error("deleteCommentAction error:", error);
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=delete-error`);
  }

  try {
    await deleteAssistantDocuments({
      sourceIds: [String(commentId || "").trim()],
      sourceType: "comment",
    });
  } catch (assistantError) {
    console.error("deleteCommentAction assistant sync error:", assistantError);
  }

  revalidatePath(`/app/spaces/${spaceSlug}/threads/${threadId}`);
  redirect(`/app/spaces/${spaceSlug}/threads/${threadId}#replies`);
}
