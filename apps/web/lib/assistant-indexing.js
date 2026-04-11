// lib/assistant-indexing.js
// Server-only helpers for PATNA Assistant document sync and reindexing.

import {
  buildCommunityApplicationAssistantText,
  buildProfileAssistantText,
  mapContentVisibilityToAssistantVisibility,
  mapEventVisibilityToAssistantVisibility,
  mapProfileVisibilityToAssistantVisibility,
  stripHtml,
} from "./assistant.js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env.js";
import { createSupabaseAdminClient } from "./supabase/admin.js";

function getAdminClient(adminSupabase) {
  return adminSupabase || createSupabaseAdminClient();
}

function buildThreadPath(spaceSlug, threadId) {
  return spaceSlug && threadId ? `/app/spaces/${spaceSlug}/threads/${threadId}` : "/app/spaces";
}

function buildPublicationPath(item) {
  if (!item?.slug) {
    return item?.visibility === "restricted" ? "/admin/insights" : "/app/publications";
  }

  return item.visibility === "restricted"
    ? `/admin/insights/${item.id}`
    : `/app/publications/${item.slug}`;
}

function buildEventPath(event) {
  return event?.visibility === "restricted" ? `/admin/events/${event.id}` : "/app/events";
}

function buildFullName(record) {
  return [record?.first_name, record?.surname].filter(Boolean).join(" ").trim() || "Member";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function buildEventDateLabel(event) {
  if (event.display_date) {
    return event.display_date;
  }

  if (event.starts_at && event.ends_at) {
    const startLabel = formatDate(event.starts_at);
    const endLabel = formatDate(event.ends_at);
    if (startLabel && endLabel && startLabel !== endLabel) {
      return `${startLabel} to ${endLabel}`;
    }
  }

  if (event.starts_at) {
    return formatDate(event.starts_at);
  }

  return "";
}

async function upsertAssistantDocument({ payload }) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  const response = await fetch(`${supabaseUrl}/functions/v1/embed-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`embed-document failed: ${errorText}`);
  }
}

export async function deleteAssistantDocument({
  adminSupabase,
  sourceType,
  sourceId,
}) {
  if (!sourceType || !sourceId) {
    return;
  }

  const supabase = getAdminClient(adminSupabase);
  const { error } = await supabase
    .from("document_embeddings")
    .delete()
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);

  if (error) {
    throw error;
  }
}

export async function deleteAssistantDocuments({
  adminSupabase,
  sourceType,
  sourceIds = [],
}) {
  const ids = [...new Set(sourceIds.filter(Boolean))];
  if (!ids.length) {
    return;
  }

  const supabase = getAdminClient(adminSupabase);
  const { error } = await supabase
    .from("document_embeddings")
    .delete()
    .eq("source_type", sourceType)
    .in("source_id", ids);

  if (error) {
    throw error;
  }
}

export function buildEventAssistantPayload(event) {
  if (!event?.id || event.status !== "published") {
    return null;
  }

  const visibility = mapEventVisibilityToAssistantVisibility(event.visibility);
  const dateLabel = buildEventDateLabel(event);

  return {
    source_type: "event",
    source_id: event.id,
    space_id: null,
    visibility,
    content_text: [
      event.title,
      dateLabel ? `Date: ${dateLabel}` : "",
      event.location ? `Location: ${event.location}` : "",
      event.event_type ? `Type: ${event.event_type}` : "",
      event.schedule_status ? `Schedule: ${event.schedule_status}` : "",
      stripHtml(event.summary || ""),
      stripHtml(event.body || ""),
      Array.isArray(event.themes) && event.themes.length ? `Themes: ${event.themes.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    metadata: {
      path: buildEventPath(event),
      title: event.title,
      source_family: "Event",
      date_label: dateLabel,
      event_type: event.event_type || "",
      location: event.location || "",
      status: event.schedule_status || "",
      visibility,
    },
  };
}

export function buildContentItemAssistantPayload(item) {
  if (!item?.id || item.publish_status !== "published") {
    return null;
  }

  const visibility = mapContentVisibilityToAssistantVisibility(item.visibility);

  return {
    source_type: "content_item",
    source_id: item.id,
    space_id: null,
    visibility,
    content_text: [
      item.title,
      item.content_type ? `Type: ${item.content_type}` : "",
      item.published_at ? `Published: ${formatDate(item.published_at)}` : "",
      stripHtml(item.summary || ""),
      stripHtml(item.body || ""),
    ]
      .filter(Boolean)
      .join("\n"),
    metadata: {
      path: buildPublicationPath(item),
      title: item.title,
      source_family: "Publication",
      content_type: item.content_type || "",
      date_label: item.published_at ? formatDate(item.published_at) : "",
      visibility,
    },
  };
}

export function buildThreadAssistantPayload(thread) {
  if (!thread?.id || !thread?.space_id) {
    return null;
  }

  return {
    source_type: "thread",
    source_id: thread.id,
    space_id: thread.space_id,
    visibility: "space_members",
    content_text: [thread.title, stripHtml(thread.body || "")].filter(Boolean).join("\n"),
    metadata: {
      path: buildThreadPath(thread.spaces?.slug, thread.id),
      title: thread.title,
      source_family: "Discussion",
      space_name: thread.spaces?.name || "",
      date_label: thread.updated_at ? formatDateTime(thread.updated_at) : "",
      visibility: "space_members",
    },
  };
}

export function buildCommentAssistantPayload(comment) {
  if (!comment?.id || !comment?.thread?.id || !comment?.thread?.space_id) {
    return null;
  }

  const threadTitle = comment.thread.title || "PATNA discussion";
  const spaceSlug = comment.thread.space_slug || comment.thread.space?.slug;
  const spaceName = comment.thread.space_name || comment.thread.space?.name;

  return {
    source_type: "comment",
    source_id: comment.id,
    space_id: comment.thread.space_id,
    visibility: "space_members",
    content_text: [`Reply in ${threadTitle}`, stripHtml(comment.body || "")].filter(Boolean).join("\n"),
    metadata: {
      path: `${buildThreadPath(spaceSlug, comment.thread.id)}#replies`,
      title: `Reply in ${threadTitle}`,
      source_family: "Discussion Reply",
      space_name: spaceName || "",
      date_label: comment.updated_at ? formatDateTime(comment.updated_at) : "",
      visibility: "space_members",
    },
  };
}

export function buildProfileAssistantPayload({
  profile,
  cohortProfile = null,
  primaryCohort = null,
  tags = [],
}) {
  const visibility = mapProfileVisibilityToAssistantVisibility(profile);

  if (!visibility || !profile?.id) {
    return null;
  }

  const title = buildFullName(profile);
  const contentText = buildProfileAssistantText({
    cohortProfile,
    primaryCohort,
    profile,
    tags,
  });

  if (!contentText) {
    return null;
  }

  return {
    source_type: "profile",
    source_id: profile.id,
    space_id: null,
    visibility,
    content_text: contentText,
    metadata: {
      path: "/app/members",
      title,
      source_family: "Member Directory",
      primary_cohort: primaryCohort?.name || "",
      visibility,
    },
  };
}

export function buildCommunityApplicationAssistantPayload({
  application,
  assignedCohortName = "",
}) {
  if (!application?.id) {
    return null;
  }

  const contentText = buildCommunityApplicationAssistantText({
    application,
    assignedCohortName,
  });

  if (!contentText) {
    return null;
  }

  return {
    source_type: "community_application",
    source_id: application.id,
    space_id: null,
    visibility: "admin_only",
    content_text: contentText,
    metadata: {
      path: "/admin/applications",
      title: `${application.first_name || ""} ${application.surname || ""}`.trim() || "Application",
      source_family: "Application Queue",
      status: application.status || "",
      assigned_cohort: assignedCohortName,
      date_label: application.submitted_at
        ? formatDateTime(application.submitted_at)
        : application.created_at
          ? formatDateTime(application.created_at)
          : "",
      visibility: "admin_only",
    },
  };
}

export async function syncEventAssistantDocument({
  adminSupabase,
  eventId,
}) {
  const supabase = getAdminClient(adminSupabase);
  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, summary, body, event_type, location, starts_at, ends_at, display_date, visibility, status, schedule_status, themes")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const payload = buildEventAssistantPayload(event);

  if (!payload) {
    await deleteAssistantDocument({ adminSupabase: supabase, sourceId: eventId, sourceType: "event" });
    return;
  }

  await upsertAssistantDocument({ payload });
}

export async function syncContentItemAssistantDocument({
  adminSupabase,
  contentItemId,
}) {
  const supabase = getAdminClient(adminSupabase);
  const { data: item, error } = await supabase
    .from("content_items")
    .select("id, title, slug, summary, body, content_type, visibility, publish_status, published_at")
    .eq("id", contentItemId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const payload = buildContentItemAssistantPayload(item);

  if (!payload) {
    await deleteAssistantDocument({
      adminSupabase: supabase,
      sourceId: contentItemId,
      sourceType: "content_item",
    });
    return;
  }

  await upsertAssistantDocument({ payload });
}

export async function syncThreadAssistantDocument({
  adminSupabase,
  threadId,
}) {
  const supabase = getAdminClient(adminSupabase);
  const { data: thread, error } = await supabase
    .from("threads")
    .select("id, space_id, title, body, updated_at, spaces(name, slug)")
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const payload = buildThreadAssistantPayload(thread);

  if (!payload) {
    await deleteAssistantDocument({ adminSupabase: supabase, sourceId: threadId, sourceType: "thread" });
    return;
  }

  await upsertAssistantDocument({ payload });
}

export async function syncCommentAssistantDocument({
  adminSupabase,
  commentId,
}) {
  const supabase = getAdminClient(adminSupabase);
  const { data: comment, error } = await supabase
    .from("comments")
    .select("id, body, updated_at, thread:threads(id, title, space_id)")
    .eq("id", commentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (comment?.thread?.space_id) {
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("name, slug")
      .eq("id", comment.thread.space_id)
      .maybeSingle();

    if (spaceError) {
      throw spaceError;
    }

    comment.thread.space_name = space?.name || "";
    comment.thread.space_slug = space?.slug || "";
  }

  const payload = buildCommentAssistantPayload(comment);

  if (!payload) {
    await deleteAssistantDocument({ adminSupabase: supabase, sourceId: commentId, sourceType: "comment" });
    return;
  }

  await upsertAssistantDocument({ payload });
}

export async function syncProfileAssistantDocument({
  adminSupabase,
  profileId,
}) {
  const supabase = getAdminClient(adminSupabase);
  const [
    profileResult,
    cohortProfileResult,
    cohortRowsResult,
    tagRowsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, surname, role_title, organisation_name, country_of_residence, professional_bio, visibility_setting, onboarding_status, profile_status, availability_status")
      .eq("id", profileId)
      .maybeSingle(),
    supabase
      .from("cohort_member_profiles")
      .select("focus_area, domain_knowledge, notable_work, relevant_projects")
      .eq("user_id", profileId)
      .maybeSingle(),
    supabase
      .from("user_cohorts")
      .select("is_primary, cohorts(name, slug)")
      .eq("user_id", profileId),
    supabase
      .from("user_tags")
      .select("domain_tags(name, slug)")
      .eq("user_id", profileId),
  ]);

  const error =
    profileResult.error ||
    cohortProfileResult.error ||
    cohortRowsResult.error ||
    tagRowsResult.error;

  if (error) {
    throw error;
  }

  const primaryCohort =
    (cohortRowsResult.data || []).find((row) => row.is_primary)?.cohorts || null;
  const tags = (tagRowsResult.data || []).map((row) => row.domain_tags).filter(Boolean);
  const payload = buildProfileAssistantPayload({
    profile: profileResult.data,
    cohortProfile: cohortProfileResult.data,
    primaryCohort,
    tags,
  });

  if (!payload) {
    await deleteAssistantDocument({ adminSupabase: supabase, sourceId: profileId, sourceType: "profile" });
    return;
  }

  await upsertAssistantDocument({ payload });
}

export async function syncCommunityApplicationAssistantDocument({
  adminSupabase,
  applicationId,
}) {
  const supabase = getAdminClient(adminSupabase);
  const { data: application, error } = await supabase
    .from("community_applications")
    .select("id, first_name, surname, organisation, role_title, country, status, motivation_text, expertise_slugs, engagement_slugs, review_notes, assigned_cohort_id, submitted_at, created_at")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!application) {
    await deleteAssistantDocument({
      adminSupabase: supabase,
      sourceId: applicationId,
      sourceType: "community_application",
    });
    return;
  }

  let assignedCohortName = "";
  if (application.assigned_cohort_id) {
    const { data: cohort } = await supabase
      .from("cohorts")
      .select("name")
      .eq("id", application.assigned_cohort_id)
      .maybeSingle();
    assignedCohortName = cohort?.name || "";
  }

  const payload = buildCommunityApplicationAssistantPayload({
    application,
    assignedCohortName,
  });

  if (!payload) {
    await deleteAssistantDocument({
      adminSupabase: supabase,
      sourceId: applicationId,
      sourceType: "community_application",
    });
    return;
  }

  await upsertAssistantDocument({ payload });
}

export async function syncThreadCommentAssistantDocumentsByThreadId({
  adminSupabase,
  threadId,
}) {
  const supabase = getAdminClient(adminSupabase);
  const { data: comments, error } = await supabase
    .from("comments")
    .select("id")
    .eq("thread_id", threadId);

  if (error) {
    throw error;
  }

  for (const comment of comments || []) {
    await syncCommentAssistantDocument({ adminSupabase: supabase, commentId: comment.id });
  }
}

export async function deleteThreadAssistantDocuments({
  adminSupabase,
  commentIds = [],
  threadId,
}) {
  const supabase = getAdminClient(adminSupabase);
  await deleteAssistantDocument({ adminSupabase: supabase, sourceId: threadId, sourceType: "thread" });

  if (commentIds.length) {
    await deleteAssistantDocuments({
      adminSupabase: supabase,
      sourceIds: commentIds,
      sourceType: "comment",
    });
  }
}
