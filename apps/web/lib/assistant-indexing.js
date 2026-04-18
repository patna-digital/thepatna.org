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
import {
  computeChangeKey,
  fetchAndExtractPdfText,
  fileHasChanged,
  listDriveFolderPdfs,
} from "./assistant-drive.js";
import { summarizeSyncErrorReason } from "./assistant-error-format.js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env.js";
import { createSupabaseAdminClient } from "./supabase/admin.js";

export const ASSISTANT_DOCUMENT_CHUNK_SIZE = 1500;
export const ASSISTANT_DOCUMENT_CHUNK_OVERLAP = 200;

const EMBED_DOCUMENT_BATCH_SIZE = 4;
const DOCUMENT_EMBEDDING_INSERT_BATCH_SIZE = 50;
const EMBED_DOCUMENT_MAX_RETRIES = 2;
const EMBED_DOCUMENT_RETRY_BASE_DELAY_MS = 250;
const EXTERNAL_DOCUMENT_CODE_PATTERN =
  /\b((?:MEPC|ISWG[-\s]?GHG|MEPC\/ES(?:\.\d+)?)\s*\d+(?:\/[A-Za-z0-9.-]+)+)\b/i;
const EXTERNAL_MEETING_SESSION_PATTERN =
  /\b(MEPC|ISWG[-\s]?GHG|MEPC\/ES(?:\.\d+)?)[\s-]*(\d{1,3})\b/i;
const EXTERNAL_SUBMITTED_BY_PATTERN = /submitted by[:\s]+([^\n]+)/i;
const EXTERNAL_SUBMITTER_SPLIT_PATTERN = /\s*(?:,|;| and |\/)\s*/i;
const EXTERNAL_ENTITY_ORG_KEYWORDS = [
  "association",
  "authority",
  "bimco",
  "council",
  "commission",
  "committee",
  "federation",
  "forum",
  "group",
  "iacs",
  "ics",
  "imo",
  "institute",
  "intercargo",
  "interferry",
  "intermanager",
  "international",
  "intertanko",
  "organisation",
  "organization",
  "programme",
  "program",
  "secretariat",
  "society",
  "union",
  "university",
];
const EXTERNAL_COUNTRY_ENTITIES = new Set([
  "argentina",
  "australia",
  "bahamas",
  "bangladesh",
  "belgium",
  "brazil",
  "canada",
  "chile",
  "china",
  "cook islands",
  "croatia",
  "cyprus",
  "denmark",
  "finland",
  "france",
  "germany",
  "greece",
  "india",
  "indonesia",
  "italy",
  "japan",
  "kenya",
  "liberia",
  "marshall islands",
  "mexico",
  "netherlands",
  "nigeria",
  "norway",
  "panama",
  "peru",
  "philippines",
  "singapore",
  "south africa",
  "spain",
  "sweden",
  "thailand",
  "turkey",
  "united arab emirates",
  "united kingdom",
  "united states",
  "vanuatu",
]);
const EXTERNAL_TOPIC_TAG_RULES = [
  { tag: "energy-efficiency", patterns: [/\benergy efficiency\b/i, /\beexi\b/i, /\bseemp\b/i, /\bcii\b/i] },
  { tag: "carbon-intensity", patterns: [/\bcarbon intensity\b/i, /\bcii\b/i] },
  { tag: "ghg-pricing", patterns: [/\blevy\b/i, /\bpricing\b/i, /\brevenue\b/i, /\bcontribution\b/i] },
  { tag: "fuel-standard", patterns: [/\bfuel standard\b/i, /\bgfs\b/i, /\bfuel intensity\b/i] },
  { tag: "lca", patterns: [/\blife cycle\b/i, /\blifecycle\b/i, /\blca\b/i] },
  { tag: "net-zero", patterns: [/\bnet zero\b/i, /\bnet-zero\b/i, /\bghg strategy\b/i] },
  { tag: "ballast-water", patterns: [/\bballast\b/i] },
  { tag: "maritime-safety", patterns: [/\bsafety\b/i, /\bship strikes\b/i] },
];

function getAdminClient(adminSupabase) {
  return adminSupabase || createSupabaseAdminClient();
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

function extractDocumentCodeDisplay(value) {
  const match = String(value || "").match(EXTERNAL_DOCUMENT_CODE_PATTERN);
  return match ? normalizeAssistantDocumentCode(match[1]) : "";
}

function extractMeetingReference(value) {
  const match = String(value || "").match(EXTERNAL_MEETING_SESSION_PATTERN);

  if (!match) {
    return {
      meetingBody: "",
      meetingSession: null,
    };
  }

  const meetingSession = Number.parseInt(match[2], 10);

  return {
    meetingBody: normalizeMeetingBody(match[1]),
    meetingSession: Number.isFinite(meetingSession) ? meetingSession : null,
  };
}

function extractAgendaTitle(title, documentCodeDisplay) {
  const cleanTitle = stripHtml(title || "");

  if (!cleanTitle) {
    return null;
  }

  if (!documentCodeDisplay) {
    return null;
  }

  const normalizedTitle = normalizeAssistantDocumentCode(cleanTitle);
  if (!normalizedTitle.startsWith(documentCodeDisplay)) {
    return null;
  }

  const remainder = cleanTitle
    .slice(cleanTitle.toUpperCase().indexOf(documentCodeDisplay))
    .slice(documentCodeDisplay.length)
    .trim()
    .replace(/^[-–—:.,\s]+/, "")
    .trim();

  return remainder || null;
}

function splitSubmittedByEntities(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]+$/, "")
    .split(EXTERNAL_SUBMITTER_SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeTextArray(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function classifySubmitterEntities(entities = []) {
  const countryEntities = [];
  const organizationEntities = [];

  for (const entity of entities) {
    const normalized = entity.toLowerCase();

    if (EXTERNAL_COUNTRY_ENTITIES.has(normalized)) {
      countryEntities.push(entity);
      continue;
    }

    if (
      EXTERNAL_ENTITY_ORG_KEYWORDS.some((keyword) => normalized.includes(keyword))
      || (/^[A-Z0-9-]{2,8}$/.test(entity) && !/\s/.test(entity))
    ) {
      organizationEntities.push(entity);
    }
  }

  return {
    countryEntities: dedupeTextArray(countryEntities),
    organizationEntities: dedupeTextArray(organizationEntities),
  };
}

function buildExternalTopicTags({ contentText, title }) {
  const haystack = `${title || ""}\n${contentText || ""}`;

  return EXTERNAL_TOPIC_TAG_RULES
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(haystack)))
    .map((rule) => rule.tag);
}

export function buildExternalDocumentCatalogMetadata({
  title,
  contentText,
}) {
  const plainTitle = stripHtml(title || "");
  const plainText = stripHtml(contentText || "");
  const headText = plainText.slice(0, 4000);
  const titleOrHead = [plainTitle, headText].filter(Boolean).join("\n");
  const documentCodeDisplay = extractDocumentCodeDisplay(titleOrHead);
  const { meetingBody, meetingSession } = extractMeetingReference(
    documentCodeDisplay || titleOrHead,
  );
  const submittedByLine = String(contentText || "").match(EXTERNAL_SUBMITTED_BY_PATTERN)?.[1] || "";
  const submitterEntities = dedupeTextArray(splitSubmittedByEntities(submittedByLine));
  const { countryEntities, organizationEntities } = classifySubmitterEntities(submitterEntities);
  const codeParts = documentCodeDisplay ? documentCodeDisplay.split("/") : [];
  const agendaItem = codeParts.length >= 2 ? codeParts[1] : null;
  const summaryExcerpt = plainText.slice(0, 320).trim() || plainTitle || "";
  const indexedChunkCount = buildAssistantDocumentChunks({
    contentText,
    metadata: {
      title: plainTitle,
    },
  }).length;

  return {
    agenda_item: agendaItem || null,
    agenda_title: extractAgendaTitle(plainTitle, documentCodeDisplay),
    content_character_count: plainText.length,
    country_entities: countryEntities,
    document_code_display: documentCodeDisplay || null,
    document_code_normalized: documentCodeDisplay
      ? normalizeAssistantDocumentCode(documentCodeDisplay)
      : null,
    indexed_chunk_count: indexedChunkCount,
    language: "en",
    meeting_body: meetingBody || null,
    meeting_session: meetingSession,
    organization_entities: organizationEntities,
    submitter_entities: submitterEntities,
    summary_excerpt: summaryExcerpt || null,
    topic_tags: buildExternalTopicTags({ contentText: plainText, title: plainTitle }),
  };
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function chunkItems(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildChunkPrefix(metadata = {}) {
  const prefixLines = [
    typeof metadata.title === "string" && metadata.title.trim()
      ? `Title: ${metadata.title.trim()}`
      : "",
    typeof metadata.source_title === "string" && metadata.source_title.trim()
      ? `Source: ${metadata.source_title.trim()}`
      : "",
    typeof metadata.source_family === "string" && metadata.source_family.trim()
      ? `Type: ${metadata.source_family.trim()}`
      : "",
  ].filter(Boolean);

  return prefixLines.length ? `${prefixLines.join("\n")}\n\n` : "";
}

export function buildAssistantDocumentChunks({ contentText, metadata = {} }) {
  const trimmed = String(contentText || "").trim();

  if (!trimmed) {
    return [];
  }

  const prefix = buildChunkPrefix(metadata);
  const chunks = [];
  let start = 0;

  while (start < trimmed.length) {
    const end = Math.min(start + ASSISTANT_DOCUMENT_CHUNK_SIZE, trimmed.length);
    const slice = trimmed.slice(start, end).trim();

    if (slice) {
      chunks.push(`${prefix}${slice}`.trim());
    }

    if (end >= trimmed.length) {
      break;
    }

    start = Math.max(end - ASSISTANT_DOCUMENT_CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

function parseEmbedDocumentError(responseText = "") {
  if (!responseText) {
    return "";
  }

  try {
    const parsed = JSON.parse(responseText);
    return [parsed?.code, parsed?.error, parsed?.message, parsed?.detail]
      .filter(Boolean)
      .join(": ");
  } catch {
    return responseText;
  }
}

export function isTransientEmbedFailure(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("worker_resource_limit")
    || message.includes("not having enough compute resources")
    || message.includes("fetch failed")
    || message.includes("bad gateway")
    || message.includes("gateway timeout")
    || message.includes("service unavailable")
    || message.includes("status 502")
    || message.includes("status 503")
    || message.includes("status 504")
    || message.includes("(502)")
    || message.includes("(503)")
    || message.includes("(504)")
  );
}

function isWorkerResourceLimitFailure(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("worker_resource_limit")
    || message.includes("not having enough compute resources")
  );
}

async function requestChunkEmbeddings({
  chunks,
  fetchImpl = fetch,
}) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL or service role key is not configured.");
  }

  const response = await fetchImpl(`${supabaseUrl}/functions/v1/embed-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ chunks }),
  });

  const responseText = await response.text().catch(() => "");

  if (!response.ok) {
    const detail = parseEmbedDocumentError(responseText) || response.statusText || "Unknown error";
    throw new Error(`embed-document failed (${response.status}): ${detail}`);
  }

  let parsed;
  try {
    parsed = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error("embed-document failed: invalid JSON response");
  }

  if (!parsed?.ok || !Array.isArray(parsed.embeddings)) {
    throw new Error("embed-document failed: invalid response payload");
  }

  if (parsed.embeddings.length !== chunks.length) {
    throw new Error(
      `embed-document failed: expected ${chunks.length} embeddings, received ${parsed.embeddings.length}`,
    );
  }

  return parsed.embeddings;
}

async function requestChunkEmbeddingsWithRetry({
  chunks,
  fetchImpl = fetch,
  sleepImpl = sleep,
}) {
  let attempt = 0;

  while (true) {
    try {
      return await requestChunkEmbeddings({ chunks, fetchImpl });
    } catch (error) {
      if (attempt >= EMBED_DOCUMENT_MAX_RETRIES || !isTransientEmbedFailure(error)) {
        throw error;
      }

      const delayMs = EMBED_DOCUMENT_RETRY_BASE_DELAY_MS * (2 ** attempt);
      attempt += 1;
      await sleepImpl(delayMs);
    }
  }
}

async function requestChunkEmbeddingsResilient({
  chunks,
  fetchImpl = fetch,
  sleepImpl = sleep,
}) {
  try {
    return await requestChunkEmbeddingsWithRetry({
      chunks,
      fetchImpl,
      sleepImpl,
    });
  } catch (error) {
    if (!isWorkerResourceLimitFailure(error) || chunks.length <= 1) {
      throw error;
    }

    const midpoint = Math.ceil(chunks.length / 2);
    const leftEmbeddings = await requestChunkEmbeddingsResilient({
      chunks: chunks.slice(0, midpoint),
      fetchImpl,
      sleepImpl,
    });
    const rightEmbeddings = await requestChunkEmbeddingsResilient({
      chunks: chunks.slice(midpoint),
      fetchImpl,
      sleepImpl,
    });

    return [...leftEmbeddings, ...rightEmbeddings];
  }
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

async function updateExternalSourceProgress(supabase, sourceId, updates = {}) {
  await supabase.from("assistant_external_sources").update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq("id", sourceId);
}

export function shouldSyncExternalFile(driveFile, existingDoc, { force = false } = {}) {
  if (force) {
    return true;
  }

  if (!existingDoc) {
    return true;
  }

  if (existingDoc.status !== "indexed") {
    return true;
  }

  return fileHasChanged(driveFile, existingDoc.checksum_or_version);
}

export async function upsertAssistantDocument({
  adminSupabase,
  fetchImpl = fetch,
  payload,
  sleepImpl = sleep,
}) {
  const supabase = getAdminClient(adminSupabase);
  const metadata = payload?.metadata && typeof payload.metadata === "object"
    ? payload.metadata
    : {};
  const chunks = buildAssistantDocumentChunks({
    contentText: payload?.content_text,
    metadata,
  });

  if (!chunks.length) {
    throw new Error("content_text produced no indexable chunks");
  }

  const embeddings = [];

  for (const chunkBatch of chunkItems(chunks, EMBED_DOCUMENT_BATCH_SIZE)) {
    const batchEmbeddings = await requestChunkEmbeddingsResilient({
      chunks: chunkBatch,
      fetchImpl,
      sleepImpl,
    });
    embeddings.push(...batchEmbeddings);
  }

  const now = new Date().toISOString();
  const rows = chunks.map((chunkText, chunkIndex) => ({
    chunk_index: chunkIndex,
    content_text: chunkText,
    created_at: now,
    embedding: JSON.stringify(embeddings[chunkIndex]),
    metadata: {
      ...metadata,
      chunk_index: chunkIndex,
      chunk_total: chunks.length,
    },
    source_id: payload.source_id,
    source_type: payload.source_type,
    space_id: payload.space_id ?? null,
    updated_at: now,
    visibility: payload.visibility ?? "space_members",
  }));

  const { error: deleteError } = await supabase
    .from("document_embeddings")
    .delete()
    .eq("source_type", payload.source_type)
    .eq("source_id", payload.source_id);

  if (deleteError) {
    throw deleteError;
  }

  for (const rowBatch of chunkItems(rows, DOCUMENT_EMBEDDING_INSERT_BATCH_SIZE)) {
    const { error: insertError } = await supabase
      .from("document_embeddings")
      .insert(rowBatch);

    if (insertError) {
      throw insertError;
    }
  }
}

export function summarizeExternalSyncErrors(errors = []) {
  const byKind = new Map();

  for (const error of errors) {
    const reason = String(error?.reason || "Unknown sync error");
    const detail = summarizeSyncErrorReason(reason);
    const normalized = detail.toLowerCase();
    let kind = "sync_failed";
    let label = "Sync failed";

    if (normalized.includes("google_drive_api_key is not configured")) {
      kind = "drive_env_missing";
      label = "Drive API key missing";
    } else if (normalized.startsWith("drive api list error")) {
      kind = "drive_listing_failed";
      label = "Drive listing failed";
    } else if (normalized.includes("google drive blocked the request")) {
      kind = "drive_access_blocked";
      label = "Drive access blocked";
    } else if (normalized.startsWith("drive api download error")) {
      kind = "pdf_download_failed";
      label = "PDF download failed";
    } else if (normalized.includes("pdf produced no extractable text")) {
      kind = "text_extraction_failed";
      label = "Text extraction failed";
    } else if (
      normalized.includes("worker_resource_limit")
      || normalized.includes("not having enough compute resources")
    ) {
      kind = "embedding_resource_limited";
      label = "Embedding worker exhausted";
    } else if (
      normalized.includes("bad gateway")
      || normalized.includes("gateway timeout")
      || normalized.includes("service unavailable")
      || normalized.includes("fetch failed")
      || normalized.includes("status 502")
      || normalized.includes("status 503")
      || normalized.includes("status 504")
    ) {
      kind = "embedding_transient_failure";
      label = "Embedding transient failure";
    } else if (normalized.includes("requested function was not found")) {
      kind = "embedding_function_missing";
      label = "Embedding function missing";
    } else if (normalized.includes("unsupported source_type")) {
      kind = "embedding_payload_rejected";
      label = "Embedding payload rejected";
    } else if (normalized.startsWith("embed-document failed")) {
      kind = "embedding_failed";
      label = "Embedding failed";
    }

    if (!byKind.has(kind)) {
      byKind.set(kind, { count: 0, detail, kind, label });
    }

    byKind.get(kind).count += 1;
  }

  return [...byKind.values()];
}

function buildExternalSyncErrorSummary(errors = []) {
  const summaries = summarizeExternalSyncErrors(errors);
  if (!summaries.length) {
    return null;
  }

  return summaries
    .map(({ count, detail, label }) => `${label} (${count}): ${detail}`)
    .join("; ");
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

  await upsertAssistantDocument({ adminSupabase: supabase, payload });
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

  await upsertAssistantDocument({ adminSupabase: supabase, payload });
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

  await upsertAssistantDocument({ adminSupabase: supabase, payload });
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

  await upsertAssistantDocument({ adminSupabase: supabase, payload });
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

  await upsertAssistantDocument({ adminSupabase: supabase, payload });
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

  await upsertAssistantDocument({ adminSupabase: supabase, payload });
}

// ─────────────────────────────────────────────────────────────────────────────
// External document helpers (Google Drive sources)
// ─────────────────────────────────────────────────────────────────────────────

export function buildExternalDocumentAssistantPayload({
  externalDoc,
  source,
  contentText,
  catalogMetadata = null,
}) {
  const patnaPath = `/app/documents/${externalDoc.id}`;
  const metadata = {
    agenda_item: externalDoc.agenda_item || "",
    agenda_title: externalDoc.agenda_title || "",
    country_entities: externalDoc.country_entities || [],
    document_code_display: externalDoc.document_code_display || "",
    document_code_normalized: externalDoc.document_code_normalized || "",
    indexed_chunk_count: externalDoc.indexed_chunk_count || 0,
    language: externalDoc.language || "",
    meeting_body: externalDoc.meeting_body || "",
    meeting_session: externalDoc.meeting_session || "",
    organization_entities: externalDoc.organization_entities || [],
    submitter_entities: externalDoc.submitter_entities || [],
    summary_excerpt: externalDoc.summary_excerpt || "",
    topic_tags: externalDoc.topic_tags || [],
    ...catalogMetadata,
  };

  return {
    source_type: "external_document",
    source_id: externalDoc.id,
    space_id: null,
    visibility: source.visibility,
    content_text: contentText,
    metadata: {
      external_source_id: source.id,
      path: patnaPath,
      title: externalDoc.title,
      source_family: "Google Drive Document",
      source_title: source.title,
      provider: source.provider,
      mime_type: externalDoc.mime_type,
      drive_url: externalDoc.source_url,
      modified_at: externalDoc.modified_at || "",
      document_code_display: metadata.document_code_display,
      document_code_normalized: metadata.document_code_normalized,
      meeting_body: metadata.meeting_body,
      meeting_session: metadata.meeting_session,
      agenda_item: metadata.agenda_item,
      agenda_title: metadata.agenda_title,
      submitter_entities: metadata.submitter_entities,
      country_entities: metadata.country_entities,
      organization_entities: metadata.organization_entities,
      topic_tags: metadata.topic_tags,
      summary_excerpt: metadata.summary_excerpt,
      indexed_chunk_count: metadata.indexed_chunk_count,
      visibility: source.visibility,
    },
  };
}

export async function syncExternalDocumentAssistantDocument({ adminSupabase, externalDoc, source }) {
  const supabase = getAdminClient(adminSupabase);
  try {
    const contentText = await fetchAndExtractPdfText(externalDoc.external_file_id);
    const catalogMetadata = buildExternalDocumentCatalogMetadata({
      contentText,
      title: externalDoc.title,
    });
    const payload = buildExternalDocumentAssistantPayload({
      externalDoc,
      source,
      contentText,
      catalogMetadata,
    });
    await upsertAssistantDocument({ adminSupabase: supabase, payload });
    await supabase.from("assistant_external_documents").update({
      ...catalogMetadata,
      status: "indexed",
      last_indexed_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", externalDoc.id);
    return { ok: true };
  } catch (err) {
    const errorMessage = String(err?.message || "Unknown error");
    await supabase.from("assistant_external_documents").update({
      status: "error",
      last_error: errorMessage,
      updated_at: new Date().toISOString(),
    }).eq("id", externalDoc.id);
    return { ok: false, error: errorMessage };
  }
}

export async function syncExternalSource({ adminSupabase, sourceId, force = false }) {
  const supabase = getAdminClient(adminSupabase);
  const { data: source, error: sourceError } = await supabase
    .from("assistant_external_sources")
    .select("id, title, provider, visibility, external_folder_id, status")
    .eq("id", sourceId)
    .maybeSingle();
  if (sourceError) throw sourceError;
  if (!source) throw new Error(`External source ${sourceId} not found.`);

  let driveFiles;
  try {
    driveFiles = await listDriveFolderPdfs(source.external_folder_id);
  } catch (err) {
    const errorMsg = String(err?.message || "Drive listing failed");
    await updateExternalSourceProgress(supabase, sourceId, {
      status: "error",
      current_sync_processed: 0,
      current_sync_stage: "Drive listing failed",
      current_sync_started_at: new Date().toISOString(),
      current_sync_total: 0,
      last_synced_at: new Date().toISOString(),
      last_sync_status: "error",
      last_sync_error: errorMsg,
    });
    throw err;
  }

  await updateExternalSourceProgress(supabase, sourceId, {
    current_sync_processed: 0,
    current_sync_stage: driveFiles.length ? "Syncing files" : "No files to sync",
    current_sync_started_at: new Date().toISOString(),
    current_sync_total: driveFiles.length,
    last_sync_error: null,
    status: "active",
  });

  const driveFileIds = new Set(driveFiles.map((f) => f.id));
  const { data: existingDocs } = await supabase
    .from("assistant_external_documents")
    .select("id, external_file_id, checksum_or_version, status")
    .eq("source_id", sourceId);
  const existingByFileId = new Map((existingDocs || []).map((doc) => [doc.external_file_id, doc]));

  let synced = 0;
  let skipped = 0;
  let processed = 0;
  const errors = [];

  for (const driveFile of driveFiles) {
    const existing = existingByFileId.get(driveFile.id);
    const changeKey = computeChangeKey(driveFile);
    const now = new Date().toISOString();

    const upsertPayload = {
      source_id: sourceId,
      external_file_id: driveFile.id,
      title: driveFile.name || driveFile.id,
      mime_type: driveFile.mimeType || "application/pdf",
      source_url: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
      download_url: `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`,
      modified_at: driveFile.modifiedTime || null,
      checksum_or_version: changeKey,
      updated_at: now,
    };

    let docId = existing?.id;
    if (!existing) {
      // Use upsert so that a row created by a previous sync (or a duplicate
      // Drive file ID in the listing) is updated rather than rejected with a
      // unique-constraint violation.
      const { data: inserted, error: insertError } = await supabase
        .from("assistant_external_documents")
        .upsert(
          { ...upsertPayload, status: "pending" },
          { onConflict: "source_id,external_file_id" },
        )
        .select("id")
        .maybeSingle();
      if (insertError) {
        errors.push({ title: driveFile.name || driveFile.id, reason: insertError.message });
        processed += 1;
        await updateExternalSourceProgress(supabase, sourceId, {
          current_sync_processed: processed,
          current_sync_stage: "Syncing files",
        });
        continue;
      }
      docId = inserted?.id;
    } else if (!shouldSyncExternalFile(driveFile, existing, { force })) {
      skipped += 1;
      processed += 1;
      await updateExternalSourceProgress(supabase, sourceId, {
        current_sync_processed: processed,
        current_sync_stage: "Checking files",
      });
      continue;
    } else {
      await supabase.from("assistant_external_documents")
        .update({ ...upsertPayload, status: "pending" }).eq("id", existing.id);
    }

    if (!docId) {
      errors.push({ title: driveFile.name || driveFile.id, reason: "Could not resolve document row ID." });
      processed += 1;
      await updateExternalSourceProgress(supabase, sourceId, {
        current_sync_processed: processed,
        current_sync_stage: "Syncing files",
      });
      continue;
    }

    const { data: docRow } = await supabase
      .from("assistant_external_documents")
      .select("id, external_file_id, title, mime_type, source_url, modified_at, document_code_display, document_code_normalized, meeting_body, meeting_session, agenda_item, agenda_title, submitter_entities, country_entities, organization_entities, topic_tags, language, summary_excerpt, indexed_chunk_count")
      .eq("id", docId)
      .maybeSingle();

    if (!docRow) {
      errors.push({ title: driveFile.name || driveFile.id, reason: "Document row not found after upsert." });
      processed += 1;
      await updateExternalSourceProgress(supabase, sourceId, {
        current_sync_processed: processed,
        current_sync_stage: "Syncing files",
      });
      continue;
    }

    const result = await syncExternalDocumentAssistantDocument({ adminSupabase: supabase, externalDoc: docRow, source });
    if (result.ok) {
      synced += 1;
    } else {
      errors.push({ title: docRow.title, reason: result.error || "Indexing failed." });
    }
    processed += 1;
    await updateExternalSourceProgress(supabase, sourceId, {
      current_sync_processed: processed,
      current_sync_stage: "Embedding files",
    });
  }

  for (const [fileId, existingDoc] of existingByFileId.entries()) {
    if (!driveFileIds.has(fileId)) {
      await deleteAssistantDocument({ adminSupabase: supabase, sourceType: "external_document", sourceId: existingDoc.id });
      await supabase.from("assistant_external_documents")
        .update({ status: "skipped", updated_at: new Date().toISOString() }).eq("id", existingDoc.id);
    }
  }

  const syncStatus = errors.length === 0 ? "ok" : synced > 0 ? "partial" : "error";
  await updateExternalSourceProgress(supabase, sourceId, {
    status: "active",
    current_sync_processed: 0,
    current_sync_stage: null,
    current_sync_started_at: null,
    current_sync_total: 0,
    last_synced_at: new Date().toISOString(),
    last_sync_status: syncStatus,
    last_sync_error: buildExternalSyncErrorSummary(errors),
  });

  return { synced, skipped, errors };
}

export async function deleteExternalSource({ adminSupabase, sourceId }) {
  const supabase = getAdminClient(adminSupabase);
  const { data: docs } = await supabase
    .from("assistant_external_documents").select("id").eq("source_id", sourceId);
  const docIds = (docs || []).map((d) => d.id);
  if (docIds.length) {
    await deleteAssistantDocuments({ adminSupabase: supabase, sourceType: "external_document", sourceIds: docIds });
  }
  const { error } = await supabase.from("assistant_external_sources").delete().eq("id", sourceId);
  if (error) throw error;
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
