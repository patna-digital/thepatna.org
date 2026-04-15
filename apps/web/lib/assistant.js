// lib/assistant.js
// PATNA Assistant helpers: access resolution, prompt building, intent routing,
// hybrid retrieval, and UI-facing access metadata.

import { createSupabaseAdminClient } from "./supabase/admin.js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env.js";

const SPACE_TYPE_LABELS = {
  cohort: "Policy Cohort",
  constituency: "Constituency",
  working_group: "Working Group",
  geography: "Geography",
};

const SOURCE_FAMILY_LABELS = {
  thread: "Discussion",
  comment: "Discussion Reply",
  content_item: "Publication",
  event: "Event",
  profile: "Member Directory",
  community_application: "Application Queue",
  external_document: "Google Drive Document",
};

const STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "an",
  "and",
  "are",
  "can",
  "de",
  "des",
  "do",
  "for",
  "from",
  "have",
  "how",
  "i",
  "in",
  "is",
  "latest",
  "les",
  "list",
  "me",
  "my",
  "of",
  "on",
  "our",
  "pending",
  "please",
  "recent",
  "show",
  "summarise",
  "summarize",
  "the",
  "their",
  "these",
  "those",
  "to",
  "up",
  "what",
  "when",
  "where",
  "which",
  "who",
  "with",
  "your",
]);


/**
 * @typedef {{
 *   userId: string,
 *   isAdmin: boolean,
 *   canReadMemberContent: boolean,
 *   canReadAdminContent: boolean,
 *   spaceIds: string[],
 *   spaces: Array<{ id: string, name: string, space_type: string }>,
 * }} AssistantAccessScope
 */

/**
 * @typedef {{
 *   id: string,
 *   origin: "structured" | "semantic",
 *   sourceType: string,
 *   sourceFamily: string,
 *   sourceId: string,
 *   title: string,
 *   path: string,
 *   summary: string,
 *   detailLines: string[],
 *   similarity?: number | null,
 *   metadata?: Record<string, unknown>,
 * }} AssistantEvidence
 */

export function stripHtml(value) {
  const raw = String(value || "");

  return raw
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSourceFamilyLabel(sourceType) {
  return SOURCE_FAMILY_LABELS[sourceType] || sourceType;
}

function formatDate(value, opts = {}) {
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
    ...opts,
  }).format(parsed);
}

function formatDateTime(value) {
  return formatDate(value, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildFullName(profile) {
  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ").trim();
  return fullName || profile?.email || "Member";
}

function tokenizeSearchTerms(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u017f]+/gi, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}

function matchesAllTerms(text, terms) {
  const haystack = String(text || "").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function buildSpaceSummaryLine(space) {
  return `${space.name} (${SPACE_TYPE_LABELS[space.space_type] || space.space_type})`;
}

export function mapEventVisibilityToAssistantVisibility(value) {
  if (value === "public") return "public";
  if (value === "members") return "members";
  return "admin_only";
}

export function mapContentVisibilityToAssistantVisibility(value) {
  if (value === "public") return "public";
  if (value === "members") return "members";
  return "admin_only";
}

export function mapProfileVisibilityToAssistantVisibility(profile) {
  if (!profile) {
    return null;
  }

  if (profile.onboarding_status !== "active" || profile.profile_status === "inactive") {
    return null;
  }

  if (profile.visibility_setting === "hidden") {
    return null;
  }

  return "members";
}

export function buildProfileAssistantText({
  profile,
  cohortProfile = null,
  primaryCohort = null,
  tags = [],
}) {
  const visibility = mapProfileVisibilityToAssistantVisibility(profile);

  if (!visibility) {
    return "";
  }

  const lines = [
    buildFullName(profile),
    profile?.role_title ? `Role: ${profile.role_title}` : "",
    profile?.organisation_name ? `Organisation: ${profile.organisation_name}` : "",
    profile?.country_of_residence ? `Country: ${profile.country_of_residence}` : "",
    primaryCohort?.name ? `Primary cohort: ${primaryCohort.name}` : "",
    tags.length ? `Expertise tags: ${tags.map((tag) => tag.name || tag.slug).join(", ")}` : "",
    profile?.availability_status ? `Availability: ${profile.availability_status}` : "",
    stripHtml(profile?.professional_bio || ""),
    stripHtml(cohortProfile?.focus_area || ""),
    stripHtml(cohortProfile?.domain_knowledge || ""),
    stripHtml(cohortProfile?.notable_work || ""),
    Array.isArray(cohortProfile?.relevant_projects) && cohortProfile.relevant_projects.length
      ? `Relevant projects: ${cohortProfile.relevant_projects
          .map((item) => item?.title || item?.name || "")
          .filter(Boolean)
          .join(", ")}`
      : "",
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildCommunityApplicationAssistantText({
  application,
  assignedCohortName = "",
}) {
  if (!application?.id) {
    return "";
  }

  const lines = [
    `${application.first_name || ""} ${application.surname || ""}`.trim(),
    application.status ? `Status: ${application.status}` : "",
    assignedCohortName ? `Assigned cohort: ${assignedCohortName}` : "",
    application.role_title ? `Role: ${application.role_title}` : "",
    application.organisation ? `Organisation: ${application.organisation}` : "",
    application.country ? `Country: ${application.country}` : "",
    Array.isArray(application.expertise_slugs) && application.expertise_slugs.length
      ? `Expertise: ${application.expertise_slugs.join(", ")}`
      : "",
    Array.isArray(application.engagement_slugs) && application.engagement_slugs.length
      ? `Engagement: ${application.engagement_slugs.join(", ")}`
      : "",
    stripHtml(application.motivation_text || ""),
    stripHtml(application.review_notes || ""),
  ].filter(Boolean);

  return lines.join("\n");
}

function formatAssistantEventDate(event) {
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

function sortEvents(left, right) {
  const rank = {
    upcoming: 0,
    tbc: 1,
    past: 2,
  };

  const leftRank = rank[left.schedule_status] ?? 3;
  const rightRank = rank[right.schedule_status] ?? 3;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftTime = left.starts_at ? new Date(left.starts_at).getTime() : Number.MAX_SAFE_INTEGER;
  const rightTime = right.starts_at ? new Date(right.starts_at).getTime() : Number.MAX_SAFE_INTEGER;

  if (left.schedule_status === "past" && right.schedule_status === "past") {
    return rightTime - leftTime;
  }

  return leftTime - rightTime;
}

function buildThreadPath(spaceSlug, threadId) {
  if (!spaceSlug || !threadId) {
    return "/app/spaces";
  }

  return `/app/spaces/${spaceSlug}/threads/${threadId}`;
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

function buildCurrentDateLine() {
  return formatDateTime(new Date().toISOString()) || new Date().toISOString();
}

export async function resolveAssistantAccessScope({ supabase, userId, isAdmin = false }) {
  if (!supabase || !userId) {
    return {
      userId: "",
      isAdmin: false,
      canReadMemberContent: false,
      canReadAdminContent: false,
      spaceIds: [],
      spaces: [],
    };
  }

  const { data: memberships, error } = await supabase
    .from("space_memberships")
    .select("space_id, spaces(id, name, space_type)")
    .eq("user_id", userId);

  if (error) {
    console.error("resolveAssistantAccessScope memberships error:", error);
  }

  const spaces = (memberships || []).map((row) => row.spaces).filter(Boolean);

  return {
    userId,
    isAdmin: Boolean(isAdmin),
    canReadMemberContent: true,
    canReadAdminContent: Boolean(isAdmin),
    spaceIds: spaces.map((space) => space.id).filter(Boolean),
    spaces,
  };
}

export function buildAccessContext(accessScope) {
  const spaces = accessScope?.spaces || [];
  const permitted = [
    ...spaces.map((space) => ({
      name: space.name,
      detail: space.space_type === "cohort"
        ? "Discussions, members, documents"
        : "Discussions, members",
    })),
    {
      name: "Insights Hub",
      detail: "All published content",
    },
    {
      name: "Events & Calendar",
      detail: "All community events",
    },
    {
      name: "Member Directory",
      detail: "Profiles (visibility-gated)",
    },
    accessScope?.canReadAdminContent
      ? {
          name: "Admin / Applications",
          detail: "Policy Cohort only — read",
        }
      : null,
  ].filter(Boolean);

  const blocked = [
    spaces.length
      ? { name: "Other Cohort Spaces", detail: "Not a member" }
      : null,
    !accessScope?.canReadAdminContent
      ? { name: "Admin / Applications", detail: "Admin access only" }
      : null,
    { name: "Financial / HR records", detail: "Restricted — Admin only" },
  ].filter(Boolean);

  return { permitted, blocked };
}

export function buildSuggestedPrompts(accessScope) {
  const spaces = accessScope?.spaces || [];
  const primarySpace = spaces[0] || null;
  const cohortSpace = spaces.find((s) => s.space_type === "cohort") || primarySpace;
  const workingGroup = spaces.find((s) => s.space_type === "working_group") || null;

  return [
    cohortSpace
      ? `Summarise recent ${cohortSpace.name} discussions`
      : "Summarise recent PATNA discussions",
    "What events do I have coming up?",
    workingGroup
      ? `Find Insights relevant to ${workingGroup.name}`
      : "Find the latest PATNA Insights",
    cohortSpace
      ? `Who in my cohort works on SIDS issues?`
      : "Who in the member directory works on SIDS issues?",
    accessScope?.canReadAdminContent ? "Show me applications awaiting my review" : null,
    "What is PATNA's position on the GHG levy?",
  ]
    .filter(Boolean)
    .slice(0, 6);
}

export function buildWelcomeMessage(accessScope, profile = null) {
  const firstName = profile?.first_name?.trim() || null;
  const greeting = firstName ? `Hello, ${firstName}.` : "Hello.";

  const spaces = accessScope?.spaces || [];
  const hasWorkingGroups = spaces.some((s) => s.space_type === "working_group");
  const activityPhrase = hasWorkingGroups
    ? "community discussions, member profiles, events, insights, and working group activity"
    : "community discussions, member profiles, events, and insights";

  return `${greeting} I'm PATNA Assistant — I have access to ${activityPhrase} that you're permitted to view.`;
}

export async function embedQuery(text) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  const res = await fetch(`${supabaseUrl}/functions/v1/embed-query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`embed-query Edge Function failed: ${err}`);
  }

  const { embedding } = await res.json();
  return embedding;
}

export function detectAssistantIntent(message) {
  const text = String(message || "").toLowerCase();

  const wantsEvents = /\bevent|events|calendar|meeting|meetings|atelier|ateliers|événement|événements\b/.test(text);
  const wantsApplications = /\bapplication|applications|invite|invites|interview|waitlist|declined|approved|candidature|candidatures\b/.test(text);
  const wantsMembers = /\bmember|members|directory|profile|profiles|who\b/.test(text);
  const wantsPublications = /\binsight|insights|publication|publications|report|reports|brief|briefs|article|articles|news\b/.test(text);
  const wantsDiscussions = /\bdiscussion|discussions|thread|threads|space|spaces|reply|replies\b/.test(text);
  const wantsUpcoming = /\bcoming up|upcoming|next|soon|à venir|a venir|prochain|prochaine\b/.test(text);
  const wantsPast = /\bpast|previous|last|dernier|passé\b/.test(text);
  const wantsLatest = /\blatest|recent|newest|recently|dernier|récents|récentes\b/.test(text);
  const wantsCounts = /\bhow many|count|total|number of|combien\b/.test(text);
  const wantsStatus = /\bstatus|pending|awaiting|approved|waitlist|declined|submitted|interviewing|en attente\b/.test(text);
  const wantsSummary = /\bsummarise|summarize|summary|recap|overview|position|what does|what is patna's position\b/.test(text);
  const wantsSearch = /\bfind|search|look up|who works on|works on|expertise|topic|theme\b/.test(text);

  const shouldUseStructured =
    wantsEvents ||
    wantsApplications ||
    wantsCounts ||
    wantsStatus ||
    wantsLatest ||
    wantsUpcoming ||
    wantsPast;

  const shouldUseSemantic =
    wantsSummary ||
    wantsSearch ||
    wantsMembers ||
    wantsDiscussions ||
    (!shouldUseStructured && (wantsPublications || wantsEvents));

  return {
    wantsApplications,
    wantsCounts,
    wantsDiscussions,
    wantsEvents,
    wantsLatest,
    wantsMembers,
    wantsPast,
    wantsPublications,
    wantsSearch,
    wantsStatus,
    wantsSummary,
    wantsUpcoming,
    shouldUseSemantic,
    shouldUseStructured,
  };
}

function buildSemanticSourceTypes(intent, accessScope) {
  if (intent.wantsApplications) {
    return accessScope.canReadAdminContent ? ["community_application"] : [];
  }

  if (intent.wantsEvents && !intent.wantsDiscussions && !intent.wantsMembers && !intent.wantsPublications) {
    return ["event"];
  }

  if (intent.wantsPublications && !intent.wantsMembers && !intent.wantsDiscussions) {
    return ["content_item"];
  }

  if (intent.wantsMembers && !intent.wantsDiscussions && !intent.wantsPublications) {
    return ["profile"];
  }

  if (intent.wantsDiscussions && !intent.wantsPublications && !intent.wantsMembers) {
    return ["thread", "comment"];
  }

  const sourceTypes = ["thread", "comment", "content_item", "event", "profile", "external_document"];

  if (accessScope.canReadAdminContent) {
    sourceTypes.push("community_application");
  }

  return sourceTypes;
}

function buildEvidenceKey(sourceType, sourceId, origin) {
  return `${sourceType}:${sourceId}:${origin}`;
}

function buildStructuredEvidence({
  sourceType,
  sourceId,
  title,
  path,
  summary = "",
  detailLines = [],
  metadata = {},
}) {
  return {
    id: buildEvidenceKey(sourceType, sourceId, "structured"),
    origin: "structured",
    sourceType,
    sourceFamily: buildSourceFamilyLabel(sourceType),
    sourceId: String(sourceId || ""),
    title: title || buildSourceFamilyLabel(sourceType),
    path: path || "",
    summary: summary || "",
    detailLines: detailLines.filter(Boolean),
    metadata,
  };
}

function buildSemanticEvidence(chunk) {
  const sourceType = chunk.source_type;
  const metadata = chunk.metadata || {};

  const detailLines =
    sourceType === "external_document"
      ? [
          metadata.source_title ? `Source: ${metadata.source_title}` : "",
          metadata.modified_at ? `Updated: ${formatDate(metadata.modified_at)}` : "",
          metadata.drive_url ? `Drive: ${metadata.drive_url}` : "",
        ].filter(Boolean)
      : [
          metadata.space_name ? `Space: ${metadata.space_name}` : "",
          metadata.date_label ? `Date: ${metadata.date_label}` : "",
          metadata.status ? `Status: ${metadata.status}` : "",
        ].filter(Boolean);

  return {
    id: buildEvidenceKey(sourceType, chunk.source_id, "semantic"),
    origin: "semantic",
    sourceType,
    sourceFamily: buildSourceFamilyLabel(sourceType),
    sourceId: String(chunk.source_id || ""),
    title: metadata.title || buildSourceFamilyLabel(sourceType),
    path: metadata.path || "",
    summary: stripHtml(chunk.content_text || ""),
    detailLines,
    similarity: chunk.similarity ?? null,
    metadata,
  };
}

async function retrieveStructuredEventEvidence({ supabase, accessScope, intent }) {
  if (!intent.wantsEvents) {
    return [];
  }

  let query = supabase
    .from("events")
    .select("id, title, summary, location, starts_at, ends_at, display_date, visibility, status, schedule_status")
    .eq("status", "published");

  if (!accessScope.canReadAdminContent) {
    query = query.in("visibility", ["public", "members"]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("retrieveStructuredEventEvidence error:", error);
    return [];
  }

  let events = (data || []).sort(sortEvents);

  if (intent.wantsUpcoming) {
    events = events.filter((event) => event.schedule_status !== "past");
  } else if (intent.wantsPast) {
    events = events.filter((event) => event.schedule_status === "past");
  }

  const visibleEvents = events.slice(0, 5);

  if (!visibleEvents.length) {
    return [];
  }

  const snapshot = buildStructuredEvidence({
    sourceType: "event",
    sourceId: "snapshot",
    title: intent.wantsPast ? "Recent past events" : "Upcoming PATNA events",
    path: "/app/events",
    summary: `${visibleEvents.length} event${visibleEvents.length === 1 ? "" : "s"} matched this request.`,
    detailLines: visibleEvents.map((event) =>
      [
        event.title,
        formatAssistantEventDate(event),
        event.location ? `Location: ${event.location}` : "",
        event.schedule_status ? `Status: ${event.schedule_status}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    ),
  });

  return [snapshot, ...visibleEvents.map((event) =>
    buildStructuredEvidence({
      sourceType: "event",
      sourceId: event.id,
      title: event.title,
      path: buildEventPath(event),
      summary: stripHtml(event.summary || ""),
      detailLines: [
        formatAssistantEventDate(event),
        event.location ? `Location: ${event.location}` : "",
        event.schedule_status ? `Status: ${event.schedule_status}` : "",
      ].filter(Boolean),
      metadata: {
        status: event.schedule_status,
      },
    }),
  )];
}

async function retrieveStructuredPublicationEvidence({ supabase, accessScope, intent }) {
  if (
    !intent.wantsPublications &&
    !(
      intent.wantsLatest &&
      !intent.wantsEvents &&
      !intent.wantsApplications &&
      !intent.wantsDiscussions &&
      !intent.wantsMembers
    )
  ) {
    return [];
  }

  let query = supabase
    .from("content_items")
    .select("id, title, slug, summary, content_type, visibility, publish_status, published_at")
    .eq("publish_status", "published")
    .order("published_at", { ascending: false });

  if (!accessScope.canReadAdminContent) {
    query = query.in("visibility", ["public", "members"]);
  }

  const { data, error } = await query.limit(5);

  if (error) {
    console.error("retrieveStructuredPublicationEvidence error:", error);
    return [];
  }

  const items = data || [];
  if (!items.length) {
    return [];
  }

  const snapshot = buildStructuredEvidence({
    sourceType: "content_item",
    sourceId: "snapshot",
    title: "Latest PATNA publications",
    path: "/app/publications",
    summary: `${items.length} publication${items.length === 1 ? "" : "s"} matched this request.`,
    detailLines: items.map((item) =>
      [item.title, item.content_type ? `Type: ${item.content_type}` : "", item.published_at ? `Published: ${formatDate(item.published_at)}` : ""]
        .filter(Boolean)
        .join(" | "),
    ),
  });

  return [snapshot, ...items.map((item) =>
    buildStructuredEvidence({
      sourceType: "content_item",
      sourceId: item.id,
      title: item.title,
      path: buildPublicationPath(item),
      summary: stripHtml(item.summary || ""),
      detailLines: [
        item.content_type ? `Type: ${item.content_type}` : "",
        item.published_at ? `Published: ${formatDate(item.published_at)}` : "",
      ].filter(Boolean),
    }),
  )];
}

async function retrieveStructuredDiscussionEvidence({ supabase, accessScope, intent }) {
  if (
    !intent.wantsDiscussions &&
    !(
      intent.wantsLatest &&
      !intent.wantsPublications &&
      !intent.wantsEvents &&
      !intent.wantsApplications &&
      accessScope.spaceIds.length > 0
    )
  ) {
    return [];
  }

  if (!accessScope.spaceIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("threads")
    .select("id, title, body, updated_at, space_id, spaces(name, slug)")
    .in("space_id", accessScope.spaceIds)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("retrieveStructuredDiscussionEvidence error:", error);
    return [];
  }

  const threads = data || [];
  if (!threads.length) {
    return [];
  }

  const snapshot = buildStructuredEvidence({
    sourceType: "thread",
    sourceId: "snapshot",
    title: "Recent PATNA discussions",
    path: "/app/spaces",
    summary: `${threads.length} discussion${threads.length === 1 ? "" : "s"} matched this request.`,
    detailLines: threads.map((thread) =>
      [
        thread.title,
        thread.spaces?.name ? `Space: ${thread.spaces.name}` : "",
        thread.updated_at ? `Updated: ${formatDateTime(thread.updated_at)}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    ),
  });

  return [snapshot, ...threads.map((thread) =>
    buildStructuredEvidence({
      sourceType: "thread",
      sourceId: thread.id,
      title: thread.title,
      path: buildThreadPath(thread.spaces?.slug, thread.id),
      summary: stripHtml(thread.body || ""),
      detailLines: [
        thread.spaces?.name ? `Space: ${thread.spaces.name}` : "",
        thread.updated_at ? `Updated: ${formatDateTime(thread.updated_at)}` : "",
      ].filter(Boolean),
    }),
  )];
}

async function retrieveStructuredMemberEvidence({ supabase, intent }) {
  if (!intent.wantsMembers) {
    return [];
  }

  const terms = tokenizeSearchTerms(intent.rawMessage || "");
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, surname, role_title, organisation_name, country_of_residence, professional_bio, visibility_setting, onboarding_status, profile_status")
    .eq("onboarding_status", "active")
    .neq("visibility_setting", "hidden")
    .neq("profile_status", "inactive")
    .order("first_name", { ascending: true })
    .limit(60);

  if (error) {
    console.error("retrieveStructuredMemberEvidence error:", error);
    return [];
  }

  let members = data || [];
  if (terms.length) {
    members = members.filter((member) =>
      matchesAllTerms(
        [
          buildFullName(member),
          member.role_title,
          member.organisation_name,
          member.country_of_residence,
          stripHtml(member.professional_bio || ""),
        ]
          .filter(Boolean)
          .join(" "),
        terms,
      ),
    );
  }

  const visibleMembers = members.slice(0, 5);
  if (!visibleMembers.length) {
    return [];
  }

  return [
    buildStructuredEvidence({
      sourceType: "profile",
      sourceId: "snapshot",
      title: "Matching PATNA members",
      path: "/app/members",
      summary: `${visibleMembers.length} member${visibleMembers.length === 1 ? "" : "s"} matched this request.`,
      detailLines: visibleMembers.map((member) =>
        [
          buildFullName(member),
          member.role_title || "",
          member.organisation_name || "",
          member.country_of_residence || "",
        ]
          .filter(Boolean)
          .join(" | "),
      ),
    }),
    ...visibleMembers.map((member) =>
      buildStructuredEvidence({
        sourceType: "profile",
        sourceId: member.id,
        title: buildFullName(member),
        path: "/app/members",
        summary: stripHtml(member.professional_bio || ""),
        detailLines: [
          member.role_title || "",
          member.organisation_name || "",
          member.country_of_residence || "",
        ].filter(Boolean),
      }),
    ),
  ];
}

async function retrieveStructuredApplicationEvidence({ supabase, accessScope, intent }) {
  if (!intent.wantsApplications || !accessScope.canReadAdminContent) {
    return [];
  }

  const { data, error } = await supabase
    .from("community_applications")
    .select("id, first_name, surname, organisation, role_title, country, status, review_notes, submitted_at, created_at, assigned_cohort_id")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("retrieveStructuredApplicationEvidence error:", error);
    return [];
  }

  let applications = data || [];

  if (intent.wantsStatus || intent.wantsCounts) {
    if (/\bpending|awaiting|review\b/.test(intent.rawMessage || "")) {
      applications = applications.filter((item) => ["submitted", "interviewing"].includes(item.status));
    } else if (/\bapproved\b/.test(intent.rawMessage || "")) {
      applications = applications.filter((item) => item.status === "approved");
    } else if (/\bwaitlist\b/.test(intent.rawMessage || "")) {
      applications = applications.filter((item) => item.status === "waitlist");
    } else if (/\bdeclined\b/.test(intent.rawMessage || "")) {
      applications = applications.filter((item) => item.status === "declined");
    }
  }

  applications = applications.slice(0, 6);

  if (!applications.length) {
    return [];
  }

  const counts = applications.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return [
    buildStructuredEvidence({
      sourceType: "community_application",
      sourceId: "snapshot",
      title: "PATNA application queue",
      path: "/admin/applications",
      summary: `${applications.length} application${applications.length === 1 ? "" : "s"} matched this request.`,
      detailLines: Object.keys(counts)
        .sort()
        .map((status) => `${status}: ${counts[status]}`),
      metadata: { counts },
    }),
    ...applications.map((application) =>
      buildStructuredEvidence({
        sourceType: "community_application",
        sourceId: application.id,
        title: `${application.first_name || ""} ${application.surname || ""}`.trim() || "Application",
        path: "/admin/applications",
        summary: stripHtml(application.review_notes || ""),
        detailLines: [
          application.status ? `Status: ${application.status}` : "",
          application.role_title || "",
          application.organisation || "",
          application.country || "",
          application.submitted_at ? `Submitted: ${formatDateTime(application.submitted_at)}` : "",
        ].filter(Boolean),
      }),
    ),
  ];
}

async function retrieveStructuredEvidence({ supabase, accessScope, intent }) {
  const [events, publications, discussions, members, applications] = await Promise.all([
    retrieveStructuredEventEvidence({ supabase, accessScope, intent }),
    retrieveStructuredPublicationEvidence({ supabase, accessScope, intent }),
    retrieveStructuredDiscussionEvidence({ supabase, accessScope, intent }),
    retrieveStructuredMemberEvidence({ supabase, intent }),
    retrieveStructuredApplicationEvidence({ supabase, accessScope, intent }),
  ]);

  return [...events, ...publications, ...discussions, ...members, ...applications];
}

async function retrieveSemanticEvidence({ supabase, accessScope, intent, message, limit = 8 }) {
  const sourceTypes = buildSemanticSourceTypes(intent, accessScope);

  if (!sourceTypes.length) {
    return [];
  }

  const queryEmbedding = await embedQuery(message);
  const { data, error } = await supabase.rpc("match_assistant_documents", {
    query_embedding: queryEmbedding,
    match_count: limit,
    filter_space_ids: accessScope.spaceIds.length ? accessScope.spaceIds : null,
    filter_source_types: sourceTypes,
    allow_member_content: accessScope.canReadMemberContent,
    allow_admin_content: accessScope.canReadAdminContent,
  });

  if (error) {
    console.error("match_assistant_documents RPC error:", error);
    return [];
  }

  return (data || []).map(buildSemanticEvidence);
}

function dedupeEvidence(evidence) {
  const seen = new Set();
  const results = [];

  for (const item of evidence) {
    const dedupeKey = `${item.sourceType}:${item.sourceId}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    results.push(item);
  }

  return results;
}

export async function retrieveAssistantEvidence({
  supabase,
  semanticSupabase = null,
  accessScope,
  message,
}) {
  const intent = detectAssistantIntent(message);
  intent.rawMessage = String(message || "");

  const structuredEvidence = intent.shouldUseStructured
    ? await retrieveStructuredEvidence({ supabase, accessScope, intent })
    : [];

  const semanticEvidence =
    semanticSupabase && intent.shouldUseSemantic
      ? await retrieveSemanticEvidence({
          supabase: semanticSupabase,
          accessScope,
          intent,
          limit: structuredEvidence.length ? 6 : 8,
          message,
        })
      : [];

  return dedupeEvidence([...structuredEvidence, ...semanticEvidence]).slice(0, 12);
}

export function buildSystemPrompt({ profile, accessScope }) {
  const name = buildFullName(profile);
  const roleTitle = profile?.role_title || profile?.title || "PATNA member";

  const spaceLines = (accessScope?.spaces || [])
    .map((space) => `- ${buildSpaceSummaryLine(space)}`)
    .join("\n");

  const availableLines = [
    spaceLines || "- No private PATNA spaces were resolved for this session.",
    accessScope?.canReadMemberContent
      ? "- Member-wide PATNA data: published events, publications, and active visible member profiles."
      : "- Member-wide PATNA data is unavailable in this session.",
    accessScope?.canReadAdminContent
      ? "- Admin PATNA data: application queues and restricted PATNA records."
      : "- Admin PATNA data is not available in this session.",
  ].join("\n");

  return `You are PATNA Assistant, a context-aware PATNA platform assistant for maritime decarbonisation collaboration.

You are helping ${name} (${roleTitle}).
Current date: ${buildCurrentDateLine()}.

YOUR ACCESS SCOPE:
${availableLines}

STRICT RULES:
1. Use only the PATNA EVIDENCE block below. Never invent dates, names, counts, statuses, or PATNA positions.
2. Prefer structured evidence for counts, lists, dates, statuses, and queue summaries.
3. Use semantic evidence for summaries, expertise matches, and discussion synthesis.
4. Never surface data outside the listed access scope.
5. Never surface financial, HR, resume, compliance-document, or hidden-profile content.
6. If evidence is insufficient, say so clearly and suggest the most relevant PATNA page or space to check.
7. Keep answers concise and easy to scan.
8. When you cite evidence, include both:
   - Source: <source family>
   - Link: [Open in PATNA](<PATNA path>)
   Always use markdown links for PATNA destinations instead of raw paths.
9. PATNA is your only domain. If asked a general knowledge question unrelated to PATNA platform data, say you are limited to PATNA platform context.`;
}

function buildEvidenceLinkLabel(evidence) {
  const path = String(evidence?.path || "");

  if (path.startsWith("/book/")) {
    return "Open booking page";
  }

  if (path.startsWith("/app/publications/") || path.startsWith("/publications/")) {
    return "Open publication";
  }

  if (path.startsWith("/app/events") || path.startsWith("/events")) {
    return "Open event";
  }

  if (path.startsWith("/app/members")) {
    return "Open member directory";
  }

  if (path.startsWith("/admin/applications")) {
    return "Open application queue";
  }

  if (path.startsWith("/app/spaces/")) {
    return "Open discussion";
  }

  if (path.startsWith("/app/documents/")) {
    return "Open document";
  }

  return "Open in PATNA";
}

function formatEvidenceItem(evidence, index) {
  const sections = [
    `${index + 1}. [${evidence.origin.toUpperCase()}] [${evidence.sourceFamily}] ${evidence.title}`,
    evidence.path ? `Link: [${buildEvidenceLinkLabel(evidence)}](${evidence.path})` : "",
    evidence.summary ? `Summary: ${evidence.summary}` : "",
    evidence.detailLines.length ? `Details:\n- ${evidence.detailLines.join("\n- ")}` : "",
    evidence.similarity != null ? `Similarity: ${Number(evidence.similarity).toFixed(3)}` : "",
  ].filter(Boolean);

  return sections.join("\n");
}

export function buildContextBlock(evidence) {
  if (!evidence.length) {
    return "\n\nPATNA EVIDENCE:\nNo relevant PATNA platform evidence was found for this request.";
  }

  const structured = evidence.filter((item) => item.origin === "structured");
  const semantic = evidence.filter((item) => item.origin === "semantic");
  const sections = [];

  if (structured.length) {
    sections.push(
      `STRUCTURED EVIDENCE:\n${structured.map((item, index) => formatEvidenceItem(item, index)).join("\n\n")}`,
    );
  }

  if (semantic.length) {
    sections.push(
      `SEMANTIC EVIDENCE:\n${semantic.map((item, index) => formatEvidenceItem(item, index)).join("\n\n")}`,
    );
  }

  return `\n\nPATNA EVIDENCE:\n${sections.join("\n\n")}`;
}

export function createAssistantEvidenceSummary(evidence) {
  return evidence.map((item) => ({
    origin: item.origin,
    sourceFamily: item.sourceFamily,
    title: item.title,
    path: item.path,
  }));
}

export function createAssistantServiceClient() {
  return createSupabaseAdminClient();
}
