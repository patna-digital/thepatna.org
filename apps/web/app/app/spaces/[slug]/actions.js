"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildSpaceJoinRequestContext,
  buildSpaceJoinRequestDetails,
} from "@/lib/space-join-requests";

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
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
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

  const { error } = await supabase
    .from("threads")
    .delete()
    .eq("id", threadId)
    .eq("author_id", user.id);

  if (error) {
    console.error("deleteThreadAction error:", error);
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=delete-error`);
  }

  revalidatePath(`/app/spaces/${spaceSlug}`);
  redirect(`/app/spaces/${spaceSlug}?notice=thread-deleted`);
}

// ── Comment actions ───────────────────────────────────────────────────────────

export async function createCommentAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login");
  }

  const threadId  = formData.get("threadId");
  const spaceSlug = formData.get("spaceSlug");
  const body      = String(formData.get("body") || "").trim();

  if (!body || !threadId) {
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=missing-body`);
  }

  const { error } = await supabase
    .from("comments")
    .insert({ thread_id: threadId, author_id: user.id, body });

  if (error) {
    console.error("createCommentAction error:", error);
    redirect(`/app/spaces/${spaceSlug}/threads/${threadId}?notice=reply-error`);
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

  revalidatePath(`/app/spaces/${spaceSlug}/threads/${threadId}`);
  redirect(`/app/spaces/${spaceSlug}/threads/${threadId}#replies`);
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

  revalidatePath(`/app/spaces/${spaceSlug}/threads/${threadId}`);
  redirect(`/app/spaces/${spaceSlug}/threads/${threadId}#replies`);
}
