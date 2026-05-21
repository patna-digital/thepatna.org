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
  project: "Project",
  profile: "Member Directory",
  community_application: "Application Queue",
  external_document: "Google Drive Document",
};

const GLOBAL_SCOPE_CONFIG = [
  {
    defaultChecked: true,
    detail: "Published reports, briefs, and insights",
    id: "source:insights",
    label: "Publications",
    sourceTypes: ["content_item"],
  },
  {
    defaultChecked: true,
    detail: "Published PATNA events and calendar records",
    id: "source:events",
    label: "Events",
    sourceTypes: ["event"],
  },
  {
    defaultChecked: true,
    detail: "Published project records and linked activities",
    id: "source:projects",
    label: "Projects",
    sourceTypes: ["project"],
  },
  {
    defaultChecked: false,
    detail: "Opt-in: visible member profiles",
    id: "source:members",
    label: "Members",
    sourceTypes: ["profile"],
  },
  {
    adminOnly: true,
    defaultChecked: false,
    detail: "Opt-in: application queue",
    id: "source:applications",
    label: "Admin / Applications",
    sourceTypes: ["community_application"],
  },
];

const SOURCE_TYPE_UI_LABELS = {
  community_application: "Admin / Applications",
  content_item: "Publications",
  event: "Events",
  external_document: "Uploaded Documents",
  project: "Projects",
  profile: "Members",
  thread: "Discussions",
  comment: "Discussions",
};

const DOCUMENT_CODE_PATTERN =
  /\b((?:MEPC|ISWG[-\s]?GHG|MEPC\/ES(?:\.\d+)?)\s*\d+(?:\/[A-Za-z0-9.-]+)+)\b/i;
const MEETING_SESSION_PATTERN =
  /\b(MEPC|ISWG[-\s]?GHG|MEPC\/ES(?:\.\d+)?)[\s-]*(\d{1,3})\b/i;

const STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "across",
  "an",
  "and",
  "are",
  "as",
  "be",
  "can",
  "de",
  "des",
  "do",
  "for",
  "from",
  "have",
  "high",
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
  "priority",
  "recent",
  "related",
  "seen",
  "show",
  "should",
  "summarise",
  "summarize",
  "the",
  "their",
  "these",
  "theme",
  "themes",
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
 *   origin: "structured" | "semantic" | "lexical",
 *   sourceType: string,
 *   sourceFamily: string,
 *   sourceId: string,
 *   title: string,
 *   path: string,
 *   summary: string,
 *   detailLines: string[],
 *   similarity?: number | null,
 *   lexicalRank?: number | null,
 *   metadata?: Record<string, unknown>,
 * }} AssistantEvidence
 */

/**
 * @typedef {{
 *   id: string,
 *   sourceType: string,
 *   sourceFamily: string,
 *   sourceId: string,
 *   title: string,
 *   path: string,
 *   detailLines: string[],
 *   metadata?: Record<string, unknown>,
 *   origins: string[],
 *   excerpts: Array<{
 *     chunkIndexStart: number | null,
 *     chunkIndexEnd: number | null,
 *     origin: string,
 *     text: string,
 *   }>,
 *   lexicalRank?: number | null,
 *   similarity?: number | null,
 * }} AssistantEvidenceBundle
 */

/**
 * @typedef {{
 *   id: string,
 *   path: string,
 *   title: string,
 *   sourceFamily: string,
 *   summary: string,
 *   detailLines: string[],
 *   metadata?: Record<string, unknown>,
 * }} AssistantEvidenceCard
 */

/**
 * @typedef {{
 *   kind: "query_plan",
 *   query: string,
 *   answerMode: "summary" | "list" | "count" | "status" | "compare",
 *   namedDocumentReference: string | null,
 *   meetingReference: string | null,
 *   preferredSourceTypes: string[],
 *   shouldUseSnapshot: boolean,
 *   shouldUseSearch: boolean,
 *   shouldUseDocumentLookup: boolean,
 *   summary: string,
 *   tasks: Array<{ toolName: string, reason: string }>,
 * }} AssistantQueryPlan
 */

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   path: string,
 *   sourceId?: string,
 *   sourceTitle: string,
 *   sourceUrl?: string,
 *   sourceFamily: string,
 *   documentCodeDisplay?: string | null,
 *   meetingBody?: string | null,
 *   meetingSession?: number | null,
 *   agendaItem?: string | null,
 *   agendaTitle?: string | null,
 *   submitterEntities?: string[],
 *   countryEntities?: string[],
 *   organizationEntities?: string[],
 *   topicTags?: string[],
 *   summaryExcerpt?: string | null,
 *   indexedChunkCount?: number,
 * }} AssistantDocumentCatalogRecord
 */

/**
 * @typedef {{
 *   kind: "query_plan" | "snapshot" | "search_results" | "document_lookup",
 *   summary: string,
 *   searchedSourceTypes?: string[],
 *   sourceSummaries?: Array<{ key: string, label: string, hitCount: number, resultKind: string }>,
 *   hitCount?: number,
 *   totalCount?: number,
 *   empty?: boolean,
 *   plan?: AssistantQueryPlan,
 *   cards?: AssistantEvidenceCard[],
 *   bundles?: AssistantEvidenceBundle[],
 *   document?: AssistantDocumentCatalogRecord | null,
 *   documents?: AssistantDocumentCatalogRecord[],
 *   resolution?: { mode: string, value: string | null },
 * }} AssistantToolResult
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

function normalizeMeetingBody(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("ISWG GHG") || normalized.startsWith("ISWG-GHG")) {
    return "ISWG-GHG";
  }

  return normalized;
}

export function normalizeAssistantDocumentCode(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  return normalized.replace(/^ISWG GHG\b/i, "ISWG-GHG");
}

export function extractDocumentReference(message) {
  const match = String(message || "").match(DOCUMENT_CODE_PATTERN);
  return match ? normalizeAssistantDocumentCode(match[1]) : "";
}

export function extractMeetingReference(message) {
  const match = String(message || "").match(MEETING_SESSION_PATTERN);

  if (!match) {
    return null;
  }

  const session = Number.parseInt(match[2], 10);

  if (!Number.isFinite(session)) {
    return null;
  }

  return {
    display: `${normalizeMeetingBody(match[1])} ${session}`,
    meetingBody: normalizeMeetingBody(match[1]),
    meetingSession: session,
  };
}

function tokenizeSearchTerms(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u017f]+/gi, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}

function sanitizeLexicalPhrase(candidate) {
  const value = String(candidate || "")
    .replace(/\b(that|which|who|should|could|would|can|may)\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return value.length >= 4 ? value : "";
}

export function extractLexicalSearchInput(message) {
  const rawMessage = String(message || "").trim();
  const quotedMatch = rawMessage.match(/["']([^"']{4,})["']/);
  const documentReference = extractDocumentReference(rawMessage);
  const patternMatches = [
    /\brelated to ([^?.!,;]+)/i,
    /\babout ([^?.!,;]+)/i,
    /\bon ([^?.!,;]+)/i,
    /\bfor ([^?.!,;]+)/i,
  ];

  let phrase = documentReference || (quotedMatch ? sanitizeLexicalPhrase(quotedMatch[1]) : "");

  if (!phrase) {
    for (const pattern of patternMatches) {
      const match = rawMessage.match(pattern);
      phrase = sanitizeLexicalPhrase(match?.[1] || "");
      if (phrase) {
        break;
      }
    }
  }

  const terms = tokenizeSearchTerms(rawMessage);

  return {
    phrase,
    terms: [...new Set(phrase ? [phrase.toLowerCase(), ...terms] : terms)],
  };
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

function buildProjectPath(project) {
  return project?.slug ? `/projects/${project.slug}` : "/projects";
}

function formatAssistantList(values = [], limit = 4) {
  const items = Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  if (!items.length) {
    return "";
  }

  const visible = items.slice(0, limit);
  const extraCount = items.length - visible.length;
  return extraCount > 0 ? `${visible.join(", ")} +${extraCount} more` : visible.join(", ");
}

function buildCurrentDateLine() {
  return formatDateTime(new Date().toISOString()) || new Date().toISOString();
}

export async function resolveAssistantAccessScope({ supabase, userId, isAdmin = false }) {
  if (!supabase || !userId) {
    return {
      externalSources: [],
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
    externalSources: [],
    userId,
    isAdmin: Boolean(isAdmin),
    canReadMemberContent: true,
    canReadAdminContent: Boolean(isAdmin),
    spaceIds: spaces.map((space) => space.id).filter(Boolean),
    spaces,
  };
}

export async function resolveAccessibleExternalSources(accessScope, supabase = null) {
  try {
    const client = supabase || createSupabaseAdminClient();
    const { data: sources, error: sourceError } = await client
      .from("assistant_external_sources")
      .select("id, title, visibility")
      .order("created_at", { ascending: false });

    if (sourceError || !sources?.length) {
      if (sourceError) {
        console.error("Failed to load assistant external sources:", sourceError);
      }
      return [];
    }

    const sourceIds = sources.map((source) => source.id);
    const { data: docs, error: docError } = await client
      .from("assistant_external_documents")
      .select("source_id, status")
      .in("source_id", sourceIds);

    if (docError) {
      console.error("Failed to load assistant external document counts:", docError);
      return [];
    }

    const indexedCounts = {};
    for (const doc of docs || []) {
      if (doc.status !== "indexed") {
        continue;
      }

      indexedCounts[doc.source_id] = (indexedCounts[doc.source_id] || 0) + 1;
    }

    return (sources || [])
      .filter((source) => {
        if ((indexedCounts[source.id] || 0) <= 0) {
          return false;
        }

        if (source.visibility === "admin_only") {
          return accessScope.canReadAdminContent;
        }

        return accessScope.canReadMemberContent;
      })
      .map((source) => ({
        id: source.id,
        indexedCount: indexedCounts[source.id] || 0,
        title: source.title,
        visibility: source.visibility,
      }));
  } catch (error) {
    console.error("Failed to resolve assistant external source access:", error);
    return [];
  }
}

export function buildAccessContext(accessScope) {
  const spaces = accessScope?.spaces || [];
  const externalSources = accessScope?.externalSources || [];
  const scopes = [
    ...GLOBAL_SCOPE_CONFIG
      .filter((item) => !item.adminOnly || accessScope?.canReadAdminContent)
      .map((item) => ({
        defaultChecked: item.defaultChecked !== false,
        detail: item.detail,
        enabled: true,
        id: item.id,
        kind: "source",
        label: item.label,
        sourceTypes: item.sourceTypes,
      })),
    ...spaces.map((space) => ({
      defaultChecked: false,
      detail: "Opt-in: space discussions and replies",
      enabled: true,
      id: `space:${space.id}`,
      kind: "space",
      label: space.name,
      sourceTypes: ["thread", "comment"],
      spaceId: space.id,
    })),
    ...[...externalSources]
      .filter((source) => source?.title)
      .sort((left, right) => String(left.title).localeCompare(String(right.title)))
      .map((source) => ({
        defaultChecked: false,
        detail: source.indexedCount > 0
          ? `Opt-in: Google Drive PDFs · ${source.indexedCount} indexed`
          : "Opt-in: Google Drive PDFs",
        enabled: true,
        externalSourceId: source.id,
        id: `external_source:${source.id}`,
        kind: "external_source",
        label: source.title,
        sourceTypes: ["external_document"],
      })),
  ];

  const blocked = [
    spaces.length
      ? { name: "Other Cohort Spaces", detail: "Not a member" }
      : null,
    !accessScope?.canReadAdminContent
      ? { name: "Admin / Applications", detail: "Admin access only" }
      : null,
    { name: "Financial / HR records", detail: "Restricted — Admin only" },
  ].filter(Boolean);

  return { blocked, scopes };
}

function getDefaultScopeIds(scopes = []) {
  return scopes
    .filter((item) => item?.enabled !== false && item?.defaultChecked !== false && item?.id)
    .map((item) => item.id);
}

function getScopeSourceTypes(scopeItem) {
  return Array.isArray(scopeItem?.sourceTypes) ? scopeItem.sourceTypes : [];
}

function isAssistantSourceTypeEnabled(activeScope, sourceType) {
  if (!sourceType) {
    return false;
  }

  if (sourceType === "thread" || sourceType === "comment") {
    return activeScope?.selectedSpaceIds?.length > 0;
  }

  if (sourceType === "external_document") {
    return activeScope?.selectedExternalSourceIds?.length > 0;
  }

  return activeScope?.enabledSourceTypes?.has(sourceType) || false;
}

export function resolveSelectedAssistantScopes({
  accessScope,
  selectedScopeIds = null,
}) {
  const accessContext = buildAccessContext(accessScope);
  const scopeMap = new Map(
    (accessContext.scopes || [])
      .filter((item) => item?.enabled !== false && item?.id)
      .map((item) => [item.id, item]),
  );

  const requestedScopeIds = Array.isArray(selectedScopeIds)
    ? [...new Set(selectedScopeIds.filter((item) => typeof item === "string"))]
    : null;
  const defaultScopeIds = getDefaultScopeIds(accessContext.scopes);
  const effectiveScopeIds = requestedScopeIds === null
    ? defaultScopeIds
    : requestedScopeIds.filter((scopeId) => scopeMap.has(scopeId));
  const selectedScopes = effectiveScopeIds
    .map((scopeId) => scopeMap.get(scopeId))
    .filter(Boolean);
  const selectedSpaceIds = selectedScopes
    .filter((item) => item.kind === "space" && item.spaceId)
    .map((item) => item.spaceId);
  const selectedExternalSourceIds = selectedScopes
    .filter((item) => item.kind === "external_source" && item.externalSourceId)
    .map((item) => item.externalSourceId);
  const enabledSourceTypes = new Set();

  for (const scopeItem of selectedScopes) {
    for (const sourceType of getScopeSourceTypes(scopeItem)) {
      if (sourceType !== "thread" && sourceType !== "comment" && sourceType !== "external_document") {
        enabledSourceTypes.add(sourceType);
      }
    }
  }

  const selectedLabels = selectedScopes.map((item) => item.label).filter(Boolean);
  const activeScopeLines = [
    selectedSpaceIds.length
      ? `- Selected PATNA spaces: ${
          selectedScopes
            .filter((item) => item.kind === "space")
            .map((item) => item.label)
            .join(", ")
        }.`
      : "- Selected PATNA spaces: none.",
    selectedExternalSourceIds.length
      ? `- Selected uploaded document sources: ${
          selectedScopes
            .filter((item) => item.kind === "external_source")
            .map((item) => item.label)
            .join(", ")
        }.`
      : "- Selected uploaded document sources: none.",
    selectedScopes.some((item) => item.kind === "source")
      ? `- Enabled member-wide sources: ${
          selectedScopes
            .filter((item) => item.kind === "source")
            .map((item) => item.label)
            .join(", ")
        }.`
      : "- Enabled member-wide sources: none.",
  ];

  return {
    activeScopeLines,
    enabledSourceTypes,
    hasAnyScope: effectiveScopeIds.length > 0,
    requestedScopeIds,
    selectedExternalSourceIds,
    selectedLabels,
    selectedScopeIds: effectiveScopeIds,
    selectedScopes,
    selectedSpaceIds,
  };
}

export function buildSuggestedPrompts(accessScope) {
  return [
    "Help me find the right PATNA page for publications, events, and projects",
    "Show the latest PATNA publications with links",
    "What events are coming up?",
    "Summarise current PATNA projects by theme",
    "Find connections between projects, events, and publications",
    accessScope?.canReadAdminContent ? "Where do I manage PATNA assistant data sources?" : null,
  ]
    .filter(Boolean)
    .slice(0, 6);
}

export function buildWelcomeMessage(accessScope, profile = null) {
  const firstName = profile?.first_name?.trim() || null;
  const greeting = firstName ? `Hello, ${firstName}.` : "Hello.";

  return `${greeting} I'm PATNA Assistant. I start with PATNA publications, events, and projects, and you can opt into more sources from Access when a question needs them.`;
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
  const rawMessage = String(message || "");
  const text = rawMessage.toLowerCase();
  const lexicalTerms = tokenizeSearchTerms(text);
  const documentReference = extractDocumentReference(text);

  const wantsEvents = /\bevent|events|calendar|meeting|meetings|atelier|ateliers|événement|événements\b/.test(text);
  const wantsApplications = /\bapplication|applications|invite|invites|interview|waitlist|declined|approved|candidature|candidatures\b/.test(text);
  const wantsMembers = /\bmember|members|directory|profile|profiles|who\b/.test(text);
  const wantsPublications = /\binsight|insights|publication|publications|report|reports|brief|briefs|article|articles|news\b/.test(text);
  const wantsProjects = /\bproject|projects|programme|programmes|program|programs|workstream|workstreams|initiative|initiatives\b/.test(text);
  const wantsDiscussions = /\bdiscussion|discussions|thread|threads|space|spaces|reply|replies\b/.test(text);
  const wantsDocuments = /\bdocument|documents|submission|submissions|pdf|pdfs|agenda item\b/.test(text) || Boolean(documentReference);
  const wantsIndexedCatalog = /\bindexed|index|inventory|library|what do you have|which submissions|which documents|have indexed\b/.test(text);
  const wantsUpcoming = /\bcoming up|upcoming|next|soon|à venir|a venir|prochain|prochaine\b/.test(text);
  const wantsPast = /\bpast|previous|last|dernier|passé\b/.test(text);
  const wantsLatest = /\blatest|recent|newest|recently|dernier|récents|récentes\b/.test(text);
  const wantsCounts = /\bhow many|count|total|number of|combien\b/.test(text);
  const wantsStatus = /\bstatus|pending|awaiting|approved|waitlist|declined|submitted|interviewing|en attente\b/.test(text);
  const wantsSummary = /\bsummarise|summarize|summary|recap|overview|position|what does|what is patna's position\b/.test(text);
  const wantsSearch = /\bfind|search|look up|who works on|works on|expertise|topic|theme\b/.test(text);
  const wantsConnections = /\bconnect|connects|connected|connection|connections|relate|relates|related|relationship|relationships|link|links|linked\b/.test(text);

  const shouldUseStructured =
    wantsEvents ||
    wantsApplications ||
    wantsProjects ||
    wantsConnections ||
    wantsDocuments ||
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
    (!shouldUseStructured && lexicalTerms.length >= 2) ||
    (!shouldUseStructured && (wantsPublications || wantsEvents));

  return {
    rawMessage,
    wantsApplications,
    wantsCounts,
    wantsDiscussions,
    wantsDocuments,
    wantsEvents,
    wantsIndexedCatalog,
    wantsLatest,
    wantsMembers,
    wantsPast,
    wantsProjects,
    wantsConnections,
    wantsPublications,
    wantsSearch,
    wantsSpecificDocument: Boolean(documentReference),
    wantsStatus,
    wantsSummary,
    wantsUpcoming,
    shouldUseSemantic,
    shouldUseStructured,
  };
}

function getAnswerModeFromIntent(intent) {
  if (intent.wantsCounts) {
    return "count";
  }

  if (intent.wantsStatus) {
    return "status";
  }

  if (intent.wantsSummary || intent.wantsSpecificDocument) {
    return "summary";
  }

  if (intent.wantsSearch || intent.wantsMembers) {
    return "compare";
  }

  return "list";
}

function createSourceSummary({ label, sourceType, hitCount = 0, resultKind = "search" }) {
  return {
    hitCount,
    key: `${sourceType}:${label}:${resultKind}`,
    label: label || SOURCE_TYPE_UI_LABELS[sourceType] || buildSourceFamilyLabel(sourceType),
    resultKind,
  };
}

function buildEvidenceCard(item) {
  return {
    detailLines: item.detailLines || [],
    id: item.id,
    metadata: item.metadata || {},
    path: item.path || "",
    sourceFamily: item.sourceFamily,
    summary: item.summary || "",
    title: item.title,
  };
}

function truncateExcerptText(value, maxLength = 420) {
  const text = stripHtml(value || "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getEvidenceChunkIndex(item) {
  const value = Number(item?.metadata?.chunk_index);
  return Number.isFinite(value) ? value : null;
}

function getEvidenceSortScore(item) {
  const lexicalRank = Number(item?.lexicalRank || 0);
  const similarity = Number(item?.similarity || 0);
  return lexicalRank * 100 + similarity;
}

export function buildEvidenceBundles(evidence = []) {
  const grouped = new Map();

  for (const item of evidence) {
    const groupKey = `${item.sourceType}:${item.sourceId}`;
    const existing = grouped.get(groupKey) || [];
    existing.push(item);
    grouped.set(groupKey, existing);
  }

  return [...grouped.values()]
    .map((items) => {
      const sorted = [...items].sort((left, right) => {
        const leftChunkIndex = getEvidenceChunkIndex(left) ?? Number.MAX_SAFE_INTEGER;
        const rightChunkIndex = getEvidenceChunkIndex(right) ?? Number.MAX_SAFE_INTEGER;
        if (leftChunkIndex !== rightChunkIndex) {
          return leftChunkIndex - rightChunkIndex;
        }
        return getEvidenceSortScore(right) - getEvidenceSortScore(left);
      });
      const seed = sorted[0];
      const excerpts = [];
      let currentExcerpt = null;

      for (const item of sorted) {
        const chunkIndex = getEvidenceChunkIndex(item);
        const excerptText = truncateExcerptText(item.summary || "");

        if (!excerptText) {
          continue;
        }

        if (
          currentExcerpt
          && chunkIndex != null
          && currentExcerpt.chunkIndexEnd != null
          && chunkIndex <= currentExcerpt.chunkIndexEnd + 1
        ) {
          currentExcerpt.chunkIndexEnd = chunkIndex;
          currentExcerpt.origin = currentExcerpt.origin === item.origin
            ? currentExcerpt.origin
            : "mixed";
          currentExcerpt.text = truncateExcerptText(
            `${currentExcerpt.text}\n\n${excerptText}`,
            700,
          );
          continue;
        }

        currentExcerpt = {
          chunkIndexEnd: chunkIndex,
          chunkIndexStart: chunkIndex,
          origin: item.origin,
          text: excerptText,
        };
        excerpts.push(currentExcerpt);
      }

      return {
        detailLines: seed.detailLines || [],
        excerpts: excerpts.slice(0, 3),
        id: `${seed.sourceType}:${seed.sourceId}`,
        lexicalRank: sorted.reduce(
          (maxValue, item) => Math.max(maxValue, Number(item.lexicalRank || 0)),
          0,
        ) || null,
        metadata: seed.metadata || {},
        origins: [...new Set(sorted.map((item) => item.origin))],
        path: seed.path || "",
        similarity: sorted.reduce(
          (maxValue, item) => Math.max(maxValue, Number(item.similarity || 0)),
          0,
        ) || null,
        sourceFamily: seed.sourceFamily,
        sourceId: seed.sourceId,
        sourceType: seed.sourceType,
        title: seed.title,
      };
    })
    .sort((left, right) => {
      const leftScore = Number(left.lexicalRank || 0) * 100 + Number(left.similarity || 0);
      const rightScore = Number(right.lexicalRank || 0) * 100 + Number(right.similarity || 0);
      return rightScore - leftScore;
    });
}

function buildScopedActiveScope(activeScope, sourceTypesOverride = null) {
  if (!Array.isArray(sourceTypesOverride) || !sourceTypesOverride.length) {
    return activeScope;
  }

  return {
    ...activeScope,
    enabledSourceTypes: new Set(
      [...(activeScope?.enabledSourceTypes || [])].filter((sourceType) =>
        sourceTypesOverride.includes(sourceType)
      ),
    ),
    selectedExternalSourceIds: sourceTypesOverride.includes("external_document")
      ? activeScope.selectedExternalSourceIds
      : [],
    selectedSpaceIds:
      sourceTypesOverride.includes("thread") || sourceTypesOverride.includes("comment")
        ? activeScope.selectedSpaceIds
        : [],
  };
}

function buildPreferredSourceTypesForPlan(intent, activeScope) {
  if (intent.wantsSpecificDocument || intent.wantsIndexedCatalog) {
    return activeScope.selectedExternalSourceIds.length ? ["external_document"] : [];
  }

  const preferred = [];

  if (intent.wantsEvents && isAssistantSourceTypeEnabled(activeScope, "event")) {
    preferred.push("event");
  }
  if (intent.wantsApplications && isAssistantSourceTypeEnabled(activeScope, "community_application")) {
    preferred.push("community_application");
  }
  if (intent.wantsMembers && isAssistantSourceTypeEnabled(activeScope, "profile")) {
    preferred.push("profile");
  }
  if (intent.wantsProjects && isAssistantSourceTypeEnabled(activeScope, "project")) {
    preferred.push("project");
  }
  if (intent.wantsPublications && isAssistantSourceTypeEnabled(activeScope, "content_item")) {
    preferred.push("content_item");
  }
  if (intent.wantsConnections) {
    if (isAssistantSourceTypeEnabled(activeScope, "project")) {
      preferred.push("project");
    }
    if (isAssistantSourceTypeEnabled(activeScope, "content_item")) {
      preferred.push("content_item");
    }
    if (isAssistantSourceTypeEnabled(activeScope, "event")) {
      preferred.push("event");
    }
  }
  if (intent.wantsDiscussions) {
    if (activeScope.selectedSpaceIds.length) {
      preferred.push("thread", "comment");
    }
  }

  if (!preferred.length) {
    return buildSemanticSourceTypes(intent, {
      canReadAdminContent: true,
      canReadMemberContent: true,
    }, activeScope);
  }

  return [...new Set(preferred)];
}

export function buildAssistantQueryPlan({
  accessScope,
  activeScope,
  message,
}) {
  const query = String(message || "").trim();
  const intent = detectAssistantIntent(query);
  const namedDocumentReference = extractDocumentReference(query) || null;
  const meetingReference = extractMeetingReference(query)?.display || null;
  const preferredSourceTypes = buildPreferredSourceTypesForPlan(intent, activeScope);
  const shouldUseDocumentLookup = Boolean(namedDocumentReference);
  const shouldUseSnapshot =
    intent.shouldUseStructured
    || intent.wantsIndexedCatalog
    || (intent.wantsDocuments && activeScope.selectedExternalSourceIds.length > 0);
  const searchablePreferredSourceTypes = preferredSourceTypes.filter((sourceType) => sourceType !== "project");
  const hasSearchableScope = preferredSourceTypes.length
    ? searchablePreferredSourceTypes.length > 0
    : buildSemanticSourceTypes(intent, accessScope, activeScope).length > 0;
  const shouldUseSearch = hasSearchableScope && (
    intent.shouldUseSemantic
    || (intent.wantsDocuments && !intent.wantsIndexedCatalog)
    || shouldUseDocumentLookup
  );
  const tasks = [];

  if (shouldUseDocumentLookup) {
    tasks.push({
      reason: `Resolve the named document ${namedDocumentReference}.`,
      toolName: "get_patna_document",
    });
  }

  if (shouldUseSnapshot) {
    tasks.push({
      reason: "Use deterministic PATNA tables or the document catalog for counts, dates, statuses, and indexed-document inventory.",
      toolName: "get_patna_snapshot",
    });
  }

  if (shouldUseSearch) {
    tasks.push({
      reason: "Inspect semantic and lexical evidence bundles for themes, comparisons, and supporting excerpts.",
      toolName: "search_patna_documents",
    });
  }

  const scopeDescriptor = activeScope.selectedLabels.length
    ? activeScope.selectedLabels.join(", ")
    : "the selected PATNA scope";

  return {
    answerMode: getAnswerModeFromIntent(intent),
    id: `plan:${Date.now()}`,
    kind: "query_plan",
    meetingReference,
    namedDocumentReference,
    preferredSourceTypes,
    query,
    shouldUseDocumentLookup,
    shouldUseSearch,
    shouldUseSnapshot,
    summary: namedDocumentReference
      ? `Resolve ${namedDocumentReference} first, then verify the answer using evidence from ${scopeDescriptor}.`
      : shouldUseSnapshot && shouldUseSearch
        ? `Use deterministic PATNA snapshots and targeted evidence search across ${scopeDescriptor}.`
        : shouldUseSnapshot
          ? `Use deterministic PATNA records across ${scopeDescriptor}.`
          : `Search targeted PATNA evidence across ${scopeDescriptor}.`,
    tasks,
  };
}

function buildSemanticSourceTypes(intent, accessScope, activeScope) {
  if (intent.wantsApplications) {
    return accessScope.canReadAdminContent && isAssistantSourceTypeEnabled(activeScope, "community_application")
      ? ["community_application"]
      : [];
  }

  if (intent.wantsEvents && !intent.wantsDiscussions && !intent.wantsMembers && !intent.wantsPublications) {
    return isAssistantSourceTypeEnabled(activeScope, "event") ? ["event"] : [];
  }

  if (intent.wantsPublications && !intent.wantsMembers && !intent.wantsDiscussions) {
    return isAssistantSourceTypeEnabled(activeScope, "content_item") ? ["content_item"] : [];
  }

  if (intent.wantsMembers && !intent.wantsDiscussions && !intent.wantsPublications) {
    return isAssistantSourceTypeEnabled(activeScope, "profile") ? ["profile"] : [];
  }

  if (intent.wantsProjects && !intent.wantsPublications && !intent.wantsEvents && !intent.wantsDiscussions && !intent.wantsMembers) {
    return [];
  }

  if (intent.wantsDiscussions && !intent.wantsPublications && !intent.wantsMembers) {
    return ["thread", "comment"].filter((sourceType) => isAssistantSourceTypeEnabled(activeScope, sourceType));
  }

  const sourceTypes = ["thread", "comment", "content_item", "event", "profile", "external_document"];

  if (accessScope.canReadAdminContent) {
    sourceTypes.push("community_application");
  }

  return sourceTypes.filter((sourceType) => isAssistantSourceTypeEnabled(activeScope, sourceType));
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

function buildLexicalEvidence(chunk) {
  const semanticEvidence = buildSemanticEvidence(chunk);

  return {
    ...semanticEvidence,
    id: buildEvidenceKey(chunk.source_type, chunk.source_id, "lexical"),
    lexicalRank: chunk.lexical_rank ?? null,
    origin: "lexical",
  };
}

async function retrieveStructuredEventEvidence({ supabase, accessScope, activeScope, intent }) {
  if (!intent.wantsEvents || !isAssistantSourceTypeEnabled(activeScope, "event")) {
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

async function retrieveStructuredPublicationEvidence({ supabase, accessScope, activeScope, intent }) {
  if (
    (!intent.wantsPublications &&
    !(
      intent.wantsLatest &&
      !intent.wantsEvents &&
      !intent.wantsApplications &&
      !intent.wantsProjects &&
      !intent.wantsDiscussions &&
      !intent.wantsMembers
    )) ||
    !isAssistantSourceTypeEnabled(activeScope, "content_item")
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

async function retrieveStructuredProjectEvidence({ supabase, activeScope, intent }) {
  if (
    (!intent.wantsProjects && !intent.wantsConnections && !(
      intent.wantsLatest &&
      !intent.wantsPublications &&
      !intent.wantsEvents &&
      !intent.wantsApplications &&
      !intent.wantsDiscussions &&
      !intent.wantsMembers
    )) ||
    !isAssistantSourceTypeEnabled(activeScope, "project")
  ) {
    return [];
  }

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      title,
      slug,
      short_title,
      summary,
      body,
      status,
      status_label,
      section,
      project_type,
      period_label,
      partner_line,
      tags,
      updated_at,
      project_countries(country, country_code),
      project_workstreams(title, status, summary),
      project_content_links(content_items(id, title, slug, content_type, publish_status, visibility, published_at)),
      project_event_links(events(id, title, slug, event_type, display_date, starts_at, status, visibility))
    `)
    .eq("status", "published")
    .order("section")
    .order("sort_order");

  if (error) {
    console.error("retrieveStructuredProjectEvidence error:", error);
    return [];
  }

  const terms = tokenizeSearchTerms(intent.rawMessage || "")
    .filter((term) => !["project", "projects", "programme", "programmes", "program", "programs"].includes(term));
  let projects = data || [];

  if (terms.length) {
    projects = projects.filter((project) =>
      matchesAllTerms(
        [
          project.title,
          project.short_title,
          project.summary,
          stripHtml(project.body || ""),
          project.status_label,
          project.section,
          project.project_type,
          project.period_label,
          project.partner_line,
          ...(Array.isArray(project.tags) ? project.tags : []),
          ...(project.project_countries || []).map((country) => country.country),
          ...(project.project_workstreams || []).map((workstream) => workstream.title),
          ...(project.project_content_links || []).map((link) => link.content_items?.title),
          ...(project.project_event_links || []).map((link) => link.events?.title),
        ]
          .filter(Boolean)
          .join(" "),
        terms,
      ),
    );
  }

  const visibleProjects = projects.slice(0, 6);

  if (!visibleProjects.length) {
    return [];
  }

  const snapshot = buildStructuredEvidence({
    sourceType: "project",
    sourceId: "snapshot",
    title: "PATNA projects",
    path: "/projects",
    summary: `${visibleProjects.length} published project${visibleProjects.length === 1 ? "" : "s"} matched this request.`,
    detailLines: visibleProjects.map((project) =>
      [
        project.title,
        project.status_label ? `Status: ${project.status_label}` : "",
        project.period_label ? `Period: ${project.period_label}` : "",
        project.project_content_links?.length ? `${project.project_content_links.length} linked publication${project.project_content_links.length === 1 ? "" : "s"}` : "",
        project.project_event_links?.length ? `${project.project_event_links.length} linked event${project.project_event_links.length === 1 ? "" : "s"}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    ),
  });

  return [
    snapshot,
    ...visibleProjects.map((project) => {
      const linkedPublications = (project.project_content_links || [])
        .map((link) => link.content_items?.title)
        .filter(Boolean);
      const linkedEvents = (project.project_event_links || [])
        .map((link) => link.events?.title)
        .filter(Boolean);
      const countries = (project.project_countries || [])
        .map((country) => country.country)
        .filter(Boolean);
      const workstreams = (project.project_workstreams || [])
        .map((workstream) => workstream.title)
        .filter(Boolean);

      return buildStructuredEvidence({
        sourceType: "project",
        sourceId: project.id,
        title: project.title,
        path: buildProjectPath(project),
        summary: truncateExcerptText(project.summary || project.body || "", 520),
        detailLines: [
          project.status_label ? `Status: ${project.status_label}` : "",
          project.period_label ? `Period: ${project.period_label}` : "",
          project.section ? `Section: ${project.section}` : "",
          countries.length ? `Countries: ${formatAssistantList(countries)}` : "",
          workstreams.length ? `Workstreams: ${formatAssistantList(workstreams)}` : "",
          linkedPublications.length ? `Linked publications: ${formatAssistantList(linkedPublications, 3)}` : "",
          linkedEvents.length ? `Linked events: ${formatAssistantList(linkedEvents, 3)}` : "",
        ].filter(Boolean),
        metadata: {
          linked_events: linkedEvents,
          linked_publications: linkedPublications,
        },
      });
    }),
  ];
}

async function retrieveStructuredDiscussionEvidence({ supabase, activeScope, intent }) {
  if (
    !intent.wantsDiscussions &&
    !(
      intent.wantsLatest &&
      !intent.wantsPublications &&
      !intent.wantsEvents &&
      !intent.wantsApplications &&
      !intent.wantsProjects &&
      !intent.wantsMembers &&
      activeScope.selectedSpaceIds.length > 0
    )
  ) {
    return [];
  }

  if (!activeScope.selectedSpaceIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("threads")
    .select("id, title, body, updated_at, space_id, spaces(name, slug)")
    .in("space_id", activeScope.selectedSpaceIds)
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

async function retrieveStructuredMemberEvidence({ supabase, activeScope, intent }) {
  if (!intent.wantsMembers || !isAssistantSourceTypeEnabled(activeScope, "profile")) {
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

async function retrieveStructuredApplicationEvidence({ supabase, accessScope, activeScope, intent }) {
  if (
    !intent.wantsApplications ||
    !accessScope.canReadAdminContent ||
    !isAssistantSourceTypeEnabled(activeScope, "community_application")
  ) {
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

async function retrieveStructuredEvidence({ supabase, accessScope, activeScope, intent }) {
  const [events, publications, projects, discussions, members, applications] = await Promise.all([
    retrieveStructuredEventEvidence({ supabase, accessScope, activeScope, intent }),
    retrieveStructuredPublicationEvidence({ supabase, accessScope, activeScope, intent }),
    retrieveStructuredProjectEvidence({ supabase, activeScope, intent }),
    retrieveStructuredDiscussionEvidence({ supabase, activeScope, intent }),
    retrieveStructuredMemberEvidence({ supabase, activeScope, intent }),
    retrieveStructuredApplicationEvidence({ supabase, accessScope, activeScope, intent }),
  ]);

  return [...events, ...publications, ...projects, ...discussions, ...members, ...applications];
}

function resolveJoinedExternalSource(row) {
  if (!row?.assistant_external_sources) {
    return null;
  }

  return Array.isArray(row.assistant_external_sources)
    ? row.assistant_external_sources[0] || null
    : row.assistant_external_sources;
}

function mapExternalDocumentCatalogRecord(row) {
  if (!row?.id) {
    return null;
  }

  const source = resolveJoinedExternalSource(row);

  return {
    id: row.id,
    title: row.title || "Uploaded document",
    path: `/app/documents/${row.id}`,
    sourceId: row.source_id || source?.id || "",
    sourceTitle: source?.title || "",
    sourceUrl: source?.source_url || "",
    sourceFamily: SOURCE_TYPE_UI_LABELS.external_document,
    documentCodeDisplay: row.document_code_display || null,
    meetingBody: row.meeting_body || null,
    meetingSession: Number.isFinite(Number(row.meeting_session))
      ? Number(row.meeting_session)
      : null,
    agendaItem: row.agenda_item || null,
    agendaTitle: row.agenda_title || null,
    submitterEntities: Array.isArray(row.submitter_entities) ? row.submitter_entities : [],
    countryEntities: Array.isArray(row.country_entities) ? row.country_entities : [],
    organizationEntities: Array.isArray(row.organization_entities)
      ? row.organization_entities
      : [],
    topicTags: Array.isArray(row.topic_tags) ? row.topic_tags : [],
    summaryExcerpt: row.summary_excerpt || null,
    indexedChunkCount: Number.isFinite(Number(row.indexed_chunk_count))
      ? Number(row.indexed_chunk_count)
      : 0,
  };
}

function buildDocumentCatalogCard(record) {
  const meetingLabel =
    record.meetingBody && record.meetingSession != null
      ? `${record.meetingBody} ${record.meetingSession}`
      : "";

  return {
    detailLines: [
      record.documentCodeDisplay ? `Document: ${record.documentCodeDisplay}` : "",
      meetingLabel ? `Meeting: ${meetingLabel}` : "",
      record.agendaTitle ? `Topic: ${record.agendaTitle}` : "",
      record.submitterEntities?.length
        ? `Submitted by: ${record.submitterEntities.join(", ")}`
        : "",
      record.sourceTitle ? `Source: ${record.sourceTitle}` : "",
    ].filter(Boolean),
    id: record.id,
    metadata: {
      agenda_item: record.agendaItem || "",
      document_code_display: record.documentCodeDisplay || "",
      indexed_chunk_count: record.indexedChunkCount || 0,
      meeting_body: record.meetingBody || "",
      meeting_session: record.meetingSession ?? "",
      source_title: record.sourceTitle || "",
      submitter_entities: record.submitterEntities || [],
      topic_tags: record.topicTags || [],
    },
    path: record.path,
    sourceFamily: record.sourceFamily,
    summary: record.summaryExcerpt || record.agendaTitle || "",
    title: record.title,
  };
}

function buildSearchableDocumentCatalogText(record) {
  return [
    record.title,
    record.documentCodeDisplay,
    record.meetingBody,
    record.meetingSession != null ? String(record.meetingSession) : "",
    record.agendaItem,
    record.agendaTitle,
    record.summaryExcerpt,
    ...(record.submitterEntities || []),
    ...(record.countryEntities || []),
    ...(record.organizationEntities || []),
    ...(record.topicTags || []),
    record.sourceTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreExternalDocumentCatalogRecord(record, {
  documentReference = "",
  meetingReference = null,
  phrase = "",
  query = "",
  terms = [],
}) {
  const normalizedReference = normalizeAssistantDocumentCode(documentReference);
  const normalizedRecordCode = normalizeAssistantDocumentCode(record.documentCodeDisplay || "");
  const searchable = buildSearchableDocumentCatalogText(record);
  const normalizedPhrase = String(phrase || "").trim().toLowerCase();
  const normalizedQuery = String(query || "").trim().toLowerCase();
  let score = 0;

  if (normalizedReference && normalizedRecordCode === normalizedReference) {
    score += 120;
  }

  if (
    meetingReference?.meetingBody &&
    normalizeMeetingBody(record.meetingBody || "") === meetingReference.meetingBody &&
    Number(record.meetingSession) === Number(meetingReference.meetingSession)
  ) {
    score += 45;
  }

  if (normalizedPhrase && searchable.includes(normalizedPhrase)) {
    score += 12;
  }

  if (normalizedQuery && searchable.includes(normalizedQuery)) {
    score += 8;
  }

  for (const term of terms) {
    const normalizedTerm = String(term || "").trim().toLowerCase();
    if (normalizedTerm && searchable.includes(normalizedTerm)) {
      score += normalizedTerm.length >= 5 ? 3 : 1;
    }
  }

  return score;
}

function buildDocumentCatalogSourceSummaries({
  accessScope,
  activeScope,
  hitCount = 0,
  resultKind = "catalog",
  matchedSourceIds = null,
  preferIndexedCount = false,
}) {
  const selectedSourceIds = new Set(activeScope?.selectedExternalSourceIds || []);
  const matchedSourceIdSet = Array.isArray(matchedSourceIds) && matchedSourceIds.length
    ? new Set(matchedSourceIds)
    : null;
  const selectedSources = (accessScope?.externalSources || []).filter((source) => {
    if (!selectedSourceIds.has(source.id)) {
      return false;
    }

    if (matchedSourceIdSet && !matchedSourceIdSet.has(source.id)) {
      return false;
    }

    return true;
  });

  if (!selectedSources.length) {
    return [
      createSourceSummary({
        hitCount,
        label: SOURCE_TYPE_UI_LABELS.external_document,
        resultKind,
        sourceType: "external_document",
      }),
    ];
  }

  return selectedSources.map((source) => ({
    hitCount: preferIndexedCount
      ? Number(source.indexedCount || hitCount || 0)
      : hitCount,
    key: `external_source:${source.id}:${resultKind}`,
    label: source.title || SOURCE_TYPE_UI_LABELS.external_document,
    resultKind,
  }));
}

async function fetchExternalDocumentCatalog({
  supabase,
  accessScope,
  activeScope,
  query,
  limit = 8,
  exactDocumentCode = "",
  meetingReference = null,
}) {
  if (!supabase || !activeScope?.selectedExternalSourceIds?.length) {
    return {
      records: [],
      totalCount: 0,
    };
  }

  const selectedSourceIds = activeScope.selectedExternalSourceIds;
  const normalizedDocumentCode = normalizeAssistantDocumentCode(exactDocumentCode);
  const lexicalInput = extractLexicalSearchInput(query);
  const wantsInventory = detectAssistantIntent(query).wantsIndexedCatalog;
  const countBase = supabase
    .from("assistant_external_documents")
    .select("id", { count: "exact", head: true })
    .eq("status", "indexed")
    .in("source_id", selectedSourceIds);

  let countQuery = countBase;
  if (normalizedDocumentCode) {
    countQuery = countQuery.eq("document_code_normalized", normalizedDocumentCode);
  }
  if (meetingReference?.meetingBody && meetingReference?.meetingSession != null) {
    countQuery = countQuery
      .eq("meeting_body", meetingReference.meetingBody)
      .eq("meeting_session", meetingReference.meetingSession);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("fetchExternalDocumentCatalog count error:", countError);
  }

  let dataQuery = supabase
    .from("assistant_external_documents")
    .select(`
      id,
      source_id,
      title,
      source_url,
      modified_at,
      document_code_display,
      document_code_normalized,
      meeting_body,
      meeting_session,
      agenda_item,
      agenda_title,
      submitter_entities,
      country_entities,
      organization_entities,
      topic_tags,
      language,
      summary_excerpt,
      indexed_chunk_count,
      assistant_external_sources!inner(id, title, source_url, visibility)
    `)
    .eq("status", "indexed")
    .in("source_id", selectedSourceIds)
    .order("modified_at", { ascending: false })
    .limit(Math.max(limit * 4, 24));

  if (normalizedDocumentCode) {
    dataQuery = dataQuery.eq("document_code_normalized", normalizedDocumentCode);
  }

  if (meetingReference?.meetingBody && meetingReference?.meetingSession != null) {
    dataQuery = dataQuery
      .eq("meeting_body", meetingReference.meetingBody)
      .eq("meeting_session", meetingReference.meetingSession);
  }

  const { data, error } = await dataQuery;

  if (error) {
    console.error("fetchExternalDocumentCatalog query error:", error);
    return {
      records: [],
      totalCount: count || 0,
    };
  }

  const records = (data || [])
    .map(mapExternalDocumentCatalogRecord)
    .filter(Boolean)
    .map((record) => ({
      record,
      score: scoreExternalDocumentCatalogRecord(record, {
        documentReference: normalizedDocumentCode,
        meetingReference,
        phrase: lexicalInput.phrase,
        query,
        terms: lexicalInput.terms,
      }),
    }));

  const filtered = wantsInventory && !normalizedDocumentCode && !meetingReference && !lexicalInput.terms.length
    ? records
    : records.filter((item) => item.score > 0 || normalizedDocumentCode);

  return {
    records: filtered
      .sort((left, right) => {
        if (left.score !== right.score) {
          return right.score - left.score;
        }

        return String(right.record.title || "").localeCompare(String(left.record.title || ""));
      })
      .map((item) => item.record)
      .slice(0, limit),
    totalCount: count || 0,
  };
}

function buildSourceSummariesFromEvidenceBundles(bundles = [], resultKind = "search") {
  const counts = bundles.reduce((acc, bundle) => {
    acc[bundle.sourceType] = (acc[bundle.sourceType] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([sourceType, hitCount]) =>
    createSourceSummary({
      hitCount,
      resultKind,
      sourceType,
    })
  );
}

function buildCardsFromEvidenceBundles(bundles = []) {
  return bundles.map((bundle) =>
    buildEvidenceCard({
      detailLines: bundle.detailLines || [],
      id: bundle.id,
      metadata: bundle.metadata || {},
      path: bundle.path || "",
      sourceFamily: bundle.sourceFamily,
      summary:
        bundle.excerpts?.[0]?.text
        || bundle.metadata?.summary_excerpt
        || "",
      title: bundle.title,
    })
  );
}

function buildToolSummaryPrefix(sourceTypes = []) {
  if (!sourceTypes.length) {
    return "PATNA";
  }

  return sourceTypes
    .map((sourceType) => SOURCE_TYPE_UI_LABELS[sourceType] || buildSourceFamilyLabel(sourceType))
    .join(", ");
}

function buildAssistantDocumentFilterParams(activeScope, sourceTypes = []) {
  return {
    filter_external_source_ids: sourceTypes.includes("external_document")
      ? activeScope.selectedExternalSourceIds
      : null,
    filter_space_ids:
      sourceTypes.includes("thread") || sourceTypes.includes("comment")
        ? activeScope.selectedSpaceIds
        : null,
  };
}

async function retrieveSemanticEvidence({ supabase, accessScope, activeScope, intent, message, limit = 8, sourceTypesOverride = null }) {
  const sourceTypes = sourceTypesOverride ?? buildSemanticSourceTypes(intent, accessScope, activeScope);

  if (!sourceTypes.length) {
    return [];
  }

  const filterParams = buildAssistantDocumentFilterParams(activeScope, sourceTypes);
  const queryEmbedding = await embedQuery(message);
  const { data, error } = await supabase.rpc("match_assistant_documents", {
    query_embedding: queryEmbedding,
    match_count: limit,
    ...filterParams,
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

async function retrieveLexicalEvidence({ supabase, accessScope, activeScope, intent, message, limit = 8, sourceTypesOverride = null }) {
  const sourceTypes = sourceTypesOverride ?? buildSemanticSourceTypes(intent, accessScope, activeScope);

  if (!sourceTypes.length) {
    return [];
  }

  const { phrase, terms } = extractLexicalSearchInput(message);

  if (!phrase && !terms.length) {
    return [];
  }

  const filterParams = buildAssistantDocumentFilterParams(activeScope, sourceTypes);
  const { data, error } = await supabase.rpc("search_assistant_documents_lexical", {
    query_phrase: phrase || null,
    query_terms: terms.length ? terms : null,
    match_count: limit,
    ...filterParams,
    filter_source_types: sourceTypes,
    allow_member_content: accessScope.canReadMemberContent,
    allow_admin_content: accessScope.canReadAdminContent,
  });

  if (error) {
    console.error("search_assistant_documents_lexical RPC error:", error);
    return [];
  }

  return (data || []).map(buildLexicalEvidence);
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
  activeScope = null,
}) {
  const intent = detectAssistantIntent(message);
  intent.rawMessage = String(message || "");
  const effectiveActiveScope = activeScope || resolveSelectedAssistantScopes({ accessScope });

  const structuredEvidence = intent.shouldUseStructured
    ? await retrieveStructuredEvidence({
        supabase,
        accessScope,
        activeScope: effectiveActiveScope,
        intent,
      })
    : [];
  const lexicalEvidence =
    semanticSupabase && intent.shouldUseSemantic
      ? await retrieveLexicalEvidence({
          supabase: semanticSupabase,
          accessScope,
          activeScope: effectiveActiveScope,
          intent,
          limit: 8,
          message,
        })
      : [];

  const semanticEvidence =
    semanticSupabase && intent.shouldUseSemantic
      ? await retrieveSemanticEvidence({
          supabase: semanticSupabase,
          accessScope,
          activeScope: effectiveActiveScope,
          intent,
          limit: lexicalEvidence.length || structuredEvidence.length ? 6 : 8,
          message,
        })
      : [];

  return dedupeEvidence([...lexicalEvidence, ...structuredEvidence, ...semanticEvidence]).slice(0, 12);
}

function buildFocusedChunkSelections(rows = [], query = "") {
  const sortedRows = [...rows].sort((left, right) => {
    const leftIndex = Number(left?.metadata?.chunk_index ?? left?.chunk_index ?? 0);
    const rightIndex = Number(right?.metadata?.chunk_index ?? right?.chunk_index ?? 0);
    return leftIndex - rightIndex;
  });

  if (sortedRows.length <= 3) {
    return sortedRows;
  }

  const documentReference = extractDocumentReference(query);
  const { terms } = extractLexicalSearchInput(query);
  const meaningfulTerms = terms.filter((term) =>
    term &&
    (!documentReference || !documentReference.toLowerCase().includes(term.toLowerCase()))
  );

  if (!meaningfulTerms.length) {
    const selections = [
      sortedRows[0],
      sortedRows[Math.floor(sortedRows.length / 2)],
      sortedRows[sortedRows.length - 1],
    ];

    return [...new Set(selections)];
  }

  const ranked = sortedRows
    .map((row) => {
      const haystack = String(row?.content_text || "").toLowerCase();
      const score = meaningfulTerms.reduce(
        (total, term) => total + (haystack.includes(term.toLowerCase()) ? 1 : 0),
        0,
      );
      return { row, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      const leftIndex = Number(left.row?.metadata?.chunk_index ?? left.row?.chunk_index ?? 0);
      const rightIndex = Number(right.row?.metadata?.chunk_index ?? right.row?.chunk_index ?? 0);
      return leftIndex - rightIndex;
    })
    .slice(0, 6)
    .map((item) => item.row)
    .sort((left, right) => {
      const leftIndex = Number(left?.metadata?.chunk_index ?? left?.chunk_index ?? 0);
      const rightIndex = Number(right?.metadata?.chunk_index ?? right?.chunk_index ?? 0);
      return leftIndex - rightIndex;
    });

  return ranked.length ? ranked : buildFocusedChunkSelections(sortedRows, "");
}

async function loadDocumentEvidenceBundles({
  semanticSupabase,
  documentId,
  query,
}) {
  if (!semanticSupabase || !documentId) {
    return [];
  }

  const { data, error } = await semanticSupabase
    .from("document_embeddings")
    .select("id, source_type, source_id, content_text, metadata, chunk_index")
    .eq("source_type", "external_document")
    .eq("source_id", documentId)
    .order("chunk_index", { ascending: true });

  if (error) {
    console.error("loadDocumentEvidenceBundles error:", error);
    return [];
  }

  const focusedRows = buildFocusedChunkSelections(data || [], query);
  const evidence = focusedRows.map((row) =>
    buildSemanticEvidence({
      ...row,
      metadata: {
        ...(row.metadata || {}),
        chunk_index: row.chunk_index ?? row.metadata?.chunk_index ?? 0,
      },
      source_type: row.source_type,
      source_id: row.source_id,
    })
  );

  return buildEvidenceBundles(evidence);
}

async function buildSnapshotToolResult({
  accessScope,
  activeScope,
  query,
  queryPlan = null,
  supabase,
}) {
  const plan = queryPlan || buildAssistantQueryPlan({ accessScope, activeScope, message: query });
  const sourceTypesOverride = plan.preferredSourceTypes.length ? plan.preferredSourceTypes : null;
  const scopedActiveScope = buildScopedActiveScope(activeScope, sourceTypesOverride);
  const intent = detectAssistantIntent(query);
  const structuredEvidence = supabase
    ? await retrieveStructuredEvidence({
        supabase,
        accessScope,
        activeScope: scopedActiveScope,
        intent,
      })
    : [];

  const documentReference = extractDocumentReference(query);
  const meetingReference = extractMeetingReference(query);
  const documentCatalog = supabase
    ? await fetchExternalDocumentCatalog({
        supabase,
        accessScope,
        activeScope: scopedActiveScope,
        exactDocumentCode: documentReference,
        meetingReference,
        query,
      })
    : { records: [], totalCount: 0 };

  const cards = [
    ...documentCatalog.records.map(buildDocumentCatalogCard),
    ...structuredEvidence.map(buildEvidenceCard),
  ].slice(0, 8);

  const sourceSummaries = [
    ...(
      scopedActiveScope.selectedExternalSourceIds.length &&
      (intent.wantsDocuments || intent.wantsIndexedCatalog || documentCatalog.totalCount > 0)
        ? buildDocumentCatalogSourceSummaries({
            accessScope,
            activeScope: scopedActiveScope,
            hitCount: documentCatalog.totalCount || documentCatalog.records.length,
            resultKind: "catalog",
            matchedSourceIds: documentCatalog.records.map((record) => record.sourceId).filter(Boolean),
            preferIndexedCount:
              intent.wantsIndexedCatalog &&
              !documentReference &&
              !meetingReference,
          })
        : []
    ),
    ...buildSourceSummariesFromEvidenceBundles(
      buildEvidenceBundles(structuredEvidence),
      "snapshot",
    ),
  ];

  const totalHits = cards.length;
  const summaryParts = [];

  if (documentCatalog.totalCount) {
    summaryParts.push(
      `${documentCatalog.totalCount} indexed uploaded document${documentCatalog.totalCount === 1 ? "" : "s"} in scope`,
    );
  }

  if (structuredEvidence.length) {
    summaryParts.push(
      `${structuredEvidence.length} deterministic PATNA record${structuredEvidence.length === 1 ? "" : "s"} matched`,
    );
  }

  return {
    kind: "snapshot",
    summary: summaryParts.length
      ? `Checked ${buildToolSummaryPrefix(sourceTypesOverride || [])}: ${summaryParts.join("; ")}.`
      : `Checked ${buildToolSummaryPrefix(sourceTypesOverride || [])}, but no deterministic PATNA records matched this request.`,
    searchedSourceTypes: sourceTypesOverride || [],
    sourceSummaries,
    hitCount: totalHits,
    totalCount: documentCatalog.totalCount || totalHits,
    empty: totalHits === 0,
    cards,
    documents: documentCatalog.records,
  };
}

async function buildSearchToolResult({
  accessScope,
  activeScope,
  query,
  queryPlan = null,
  semanticSupabase,
}) {
  const plan = queryPlan || buildAssistantQueryPlan({ accessScope, activeScope, message: query });
  const sourceTypesOverride = plan.preferredSourceTypes.length ? plan.preferredSourceTypes : null;
  const searchableSourceTypesOverride = sourceTypesOverride
    ? sourceTypesOverride.filter((sourceType) => sourceType !== "project")
    : null;
  const scopedActiveScope = buildScopedActiveScope(activeScope, sourceTypesOverride);
  const intent = {
    ...detectAssistantIntent(query),
    shouldUseSemantic: true,
  };
  const [lexical, semantic] = semanticSupabase
    ? await Promise.all([
        retrieveLexicalEvidence({
          supabase: semanticSupabase,
          accessScope,
          activeScope: scopedActiveScope,
          intent,
          limit: 8,
          message: query,
          sourceTypesOverride: searchableSourceTypesOverride,
        }),
        retrieveSemanticEvidence({
          supabase: semanticSupabase,
          accessScope,
          activeScope: scopedActiveScope,
          intent,
          limit: 8,
          message: query,
          sourceTypesOverride: searchableSourceTypesOverride,
        }),
      ])
    : [[], []];

  const bundles = buildEvidenceBundles([...lexical, ...semantic]).slice(0, 8);
  const cards = buildCardsFromEvidenceBundles(bundles).slice(0, 6);
  const sourceSummaries = buildSourceSummariesFromEvidenceBundles(bundles, "search");

  return {
    kind: "search_results",
    summary: bundles.length
      ? `Searched ${buildToolSummaryPrefix(searchableSourceTypesOverride || [])} and found ${bundles.length} evidence bundle${bundles.length === 1 ? "" : "s"}.`
      : `Searched ${buildToolSummaryPrefix(searchableSourceTypesOverride || [])}, but no relevant evidence bundles were retrieved.`,
    searchedSourceTypes: searchableSourceTypesOverride || [],
    sourceSummaries,
    hitCount: bundles.length,
    empty: bundles.length === 0,
    cards,
    bundles,
  };
}

async function buildDocumentLookupToolResult({
  accessScope,
  activeScope,
  query,
  semanticSupabase,
  supabase,
}) {
  const exactDocumentCode = extractDocumentReference(query);
  const meetingReference = extractMeetingReference(query);
  const catalog = supabase
    ? await fetchExternalDocumentCatalog({
        supabase,
        accessScope,
        activeScope,
        exactDocumentCode,
        meetingReference,
        query,
        limit: 5,
      })
    : { records: [], totalCount: 0 };

  const exactMatch = exactDocumentCode
    ? catalog.records.find((record) =>
        normalizeAssistantDocumentCode(record.documentCodeDisplay || "") === exactDocumentCode
      ) || null
    : null;
  const bestMatch = exactMatch || catalog.records[0] || null;

  if (bestMatch) {
    const bundles = await loadDocumentEvidenceBundles({
      semanticSupabase,
      documentId: bestMatch.id,
      query,
    });
    const cards = [buildDocumentCatalogCard(bestMatch)];

    return {
      kind: "document_lookup",
      summary: `Resolved ${bestMatch.documentCodeDisplay || bestMatch.title} from ${bestMatch.sourceTitle || "uploaded documents"}.`,
      searchedSourceTypes: ["external_document"],
      sourceSummaries: buildDocumentCatalogSourceSummaries({
        accessScope,
        activeScope,
        hitCount: 1,
        matchedSourceIds: bestMatch.sourceId ? [bestMatch.sourceId] : null,
        resultKind: "document",
      }),
      hitCount: 1,
      empty: false,
      cards,
      bundles,
      document: bestMatch,
      documents: catalog.records,
      resolution: {
        mode: exactMatch
          ? "exact_document_code"
          : meetingReference
            ? "meeting_reference"
            : "catalog_best_match",
        value: bestMatch.documentCodeDisplay || bestMatch.title || null,
      },
    };
  }

  const fallbackSearch = await buildSearchToolResult({
    accessScope,
    activeScope,
    query,
    semanticSupabase,
    queryPlan: {
      ...buildAssistantQueryPlan({ accessScope, activeScope, message: query }),
      preferredSourceTypes: ["external_document"],
    },
  });

  return {
    ...fallbackSearch,
    kind: "document_lookup",
    summary: fallbackSearch.hitCount
      ? `No exact catalog match was found, so I searched uploaded documents by title and content instead. ${fallbackSearch.summary}`
      : "No exact document match was found in the uploaded document catalog.",
    resolution: {
      mode: "fuzzy_search",
      value: exactDocumentCode || query,
    },
  };
}

export function buildSystemPrompt({ profile, accessScope, activeScope = null }) {
  const name = buildFullName(profile);
  const roleTitle = profile?.role_title || profile?.title || "PATNA member";
  const effectiveActiveScope = activeScope || resolveSelectedAssistantScopes({ accessScope });

  const spaceLines = (accessScope?.spaces || [])
    .map((space) => `- ${buildSpaceSummaryLine(space)}`)
    .join("\n");

  const availableLines = [
    spaceLines || "- No private PATNA spaces were resolved for this session.",
    accessScope?.canReadMemberContent
      ? "- Member-wide PATNA data: published events, publications, projects, and active visible member profiles."
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

ACTIVE SCOPE FOR THIS ANSWER:
${effectiveActiveScope.activeScopeLines.join("\n")}

INSTRUCTIONS:
1. Start with plan_patna_query for any substantive question so you understand the request and the best PATNA sources to inspect.
2. Use get_patna_snapshot for deterministic counts, dates, statuses, recent items, project links, and uploaded-document inventory.
3. Use get_patna_document when the user names a specific document or asks to summarise one (e.g., "MEPC 84/6", "GHG Strategy brief"). It resolves exact document codes before fuzzy fallback.
4. Use search_patna_documents for themes, comparisons, positions, and supporting evidence bundles.
5. Tool results are structured JSON. Read the fields carefully:
   - summary = the high-level result
   - sourceSummaries = which PATNA sources were checked
   - cards = concise matching records
   - bundles = grouped evidence excerpts
   - document / documents = uploaded-document catalog matches
6. Never invent dates, names, counts, statuses, or PATNA positions. Only use what the tools return.
7. Never surface data outside the listed access scope.
8. Never surface financial, HR, resume, compliance-document, or hidden-profile content.
9. If the first retrieval is thin or not specific enough, call another relevant tool with a more targeted query.
10. If you cannot find relevant evidence after two retrieval attempts, say so clearly and suggest the most relevant PATNA page or space to check.
11. Prioritise platform navigation, data retrieval, summaries, and connections between PATNA records. Offer synthesis and guidance as human-review support, not as a final organisational decision.
12. Keep answers concise and easy to scan. When you cite evidence include:
   - Source: <source family>
   - Link: [Open in PATNA](<PATNA path>) — always use markdown links, not raw paths.
13. PATNA is your only domain. Decline general knowledge questions unrelated to PATNA platform data.`;
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

  if (path.startsWith("/projects")) {
    return "Open project";
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
    evidence.lexicalRank != null ? `Lexical rank: ${Number(evidence.lexicalRank).toFixed(2)}` : "",
    evidence.similarity != null ? `Similarity: ${Number(evidence.similarity).toFixed(3)}` : "",
  ].filter(Boolean);

  return sections.join("\n");
}

export function buildContextBlock(evidence) {
  if (!evidence.length) {
    return "\n\nPATNA EVIDENCE:\nNo relevant PATNA platform evidence was found for this request.";
  }

  const lexical = evidence.filter((item) => item.origin === "lexical");
  const structured = evidence.filter((item) => item.origin === "structured");
  const semantic = evidence.filter((item) => item.origin === "semantic");
  const sections = [];

  if (lexical.length) {
    sections.push(
      `LEXICAL EVIDENCE:\n${lexical.map((item, index) => formatEvidenceItem(item, index)).join("\n\n")}`,
    );
  }

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

// ── Agentic tool definitions ──────────────────────────────────────────────────

export const ASSISTANT_TOOLS = [
  {
    name: "plan_patna_query",
    description:
      "Create a retrieval plan for the user's PATNA question. Use this first to decide whether the answer needs deterministic snapshots, exact document lookup, semantic search, or a combination.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The user's PATNA question.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_patna_snapshot",
    description:
      "Retrieve deterministic PATNA records: counts, dates, statuses, recent items, and indexed uploaded-document catalog results.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The user's PATNA question or a more targeted deterministic query.",
        },
        source_types: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional filter: one or more of thread, comment, content_item, event, project, profile, community_application, external_document.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_patna_documents",
    description:
      "Search indexed PATNA documents and content using lexical and semantic retrieval. Use this for themes, comparisons, and supporting evidence bundles.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural-language search query. Be specific — use key terms from the topic (e.g. 'EEXI CII ship energy efficiency' rather than 'energy efficiency').",
        },
        source_types: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional filter: one or more of thread, comment, content_item, event, profile, external_document. Projects are checked through get_patna_snapshot. Omit to search all accessible indexed sources.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_patna_document",
    description:
      "Retrieve a specific document by title or document ID keyword (e.g. 'MEPC 84/6'). Use when the user asks to summarise or open a named document.",
    input_schema: {
      type: "object",
      properties: {
        title_query: {
          type: "string",
          description: "Document title or identifier to look up (e.g. 'MEPC 84/6', 'GHG Strategy brief').",
        },
      },
      required: ["title_query"],
    },
  },
];

export async function executeAssistantTool({
  toolName,
  toolInput,
  accessScope,
  activeScope,
  supabase,
  semanticSupabase = null,
  queryPlan = null,
}) {
  if (toolName === "plan_patna_query") {
    const plan = buildAssistantQueryPlan({
      accessScope,
      activeScope,
      message: toolInput?.query || "",
    });

    return {
      kind: "query_plan",
      summary: plan.summary,
      searchedSourceTypes: plan.preferredSourceTypes,
      sourceSummaries: plan.preferredSourceTypes.map((sourceType) =>
        createSourceSummary({
          hitCount: 0,
          resultKind: "plan",
          sourceType,
        })
      ),
      hitCount: 0,
      empty: false,
      plan,
    };
  }

  if (toolName === "get_patna_snapshot") {
    const { query, source_types } = toolInput || {};
    const scopedPlan = queryPlan || buildAssistantQueryPlan({
      accessScope,
      activeScope: buildScopedActiveScope(
        activeScope,
        Array.isArray(source_types) && source_types.length ? source_types : null,
      ),
      message: query || "",
    });

    return buildSnapshotToolResult({
      accessScope,
      activeScope: buildScopedActiveScope(
        activeScope,
        Array.isArray(source_types) && source_types.length ? source_types : null,
      ),
      query: query || "",
      queryPlan: scopedPlan,
      supabase,
    });
  }

  if (toolName === "search_patna_documents") {
    const { query, source_types } = toolInput || {};
    const scopedActiveScope = buildScopedActiveScope(
      activeScope,
      Array.isArray(source_types) && source_types.length ? source_types : null,
    );
    const scopedPlan = queryPlan || buildAssistantQueryPlan({
      accessScope,
      activeScope: scopedActiveScope,
      message: query || "",
    });

    return buildSearchToolResult({
      accessScope,
      activeScope: scopedActiveScope,
      query: query || "",
      queryPlan: {
        ...scopedPlan,
        preferredSourceTypes:
          Array.isArray(source_types) && source_types.length
            ? source_types
            : scopedPlan.preferredSourceTypes,
      },
      semanticSupabase: semanticSupabase || supabase,
    });
  }

  if (toolName === "get_patna_document") {
    const { title_query } = toolInput || {};
    return buildDocumentLookupToolResult({
      accessScope,
      activeScope,
      query: title_query || "",
      semanticSupabase: semanticSupabase || supabase,
      supabase,
    });
  }

  return {
    kind: "snapshot",
    summary: `Unknown tool "${toolName}".`,
    searchedSourceTypes: [],
    sourceSummaries: [],
    hitCount: 0,
    empty: true,
    cards: [],
  };
}
