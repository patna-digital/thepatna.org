// lib/assistant.js
// RAG helpers for the PATNA Assistant.
// Handles query embedding (via Supabase Edge Function), context retrieval,
// system prompt construction, and suggested prompt generation.

import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/env";

// ─────────────────────────────────────────────────────────────────────────────
// Embedding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Embeds a query string by calling the embed-query Supabase Edge Function.
 * Returns a 384-dim float array (gte-small, cosine-normalised).
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Retrieval
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls the match_documents Supabase RPC to find the most relevant chunks
 * for the query embedding, filtered to the user's permitted spaces.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ embedding: number[], spaceIds: string[], isAdmin: boolean, limit?: number }} opts
 * @returns {Promise<Array<{ id: string, source_type: string, source_id: string, content_text: string, metadata: object, similarity: number }>>}
 */
export async function retrieveRelevantChunks(supabase, { embedding, spaceIds, isAdmin, limit = 8 }) {
  // Admins get all space content; regular members get their spaces only
  const filterSpaceIds = isAdmin ? null : spaceIds.length > 0 ? spaceIds : null;

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: limit,
    filter_space_ids: filterSpaceIds,
  });

  if (error) {
    console.error("match_documents RPC error:", error);
    return [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt building
// ─────────────────────────────────────────────────────────────────────────────

const SPACE_TYPE_LABELS = {
  cohort: "Policy Cohort",
  constituency: "Constituency",
  working_group: "Working Group",
  geography: "Geography",
};

/**
 * Builds the Claude system prompt incorporating the user's identity, space
 * access context, and retrieved document chunks.
 *
 * @param {{ profile: object, spaces: object[], isAdmin: boolean }} opts
 * @returns {string}
 */
export function buildSystemPrompt({ profile, spaces, isAdmin }) {
  const name = profile?.first_name ?? "Member";
  const roleTitle = profile?.role_title ?? profile?.title ?? "Community Member";

  const spaceLines = spaces
    .map((s) => `  • ${s.name} (${SPACE_TYPE_LABELS[s.space_type] ?? s.space_type}): discussions, members`)
    .join("\n");

  const adminLine = isAdmin
    ? "\n  • Admin access: applications, all member data"
    : "";

  const blockedLines = [
    "  ⊘ Financial / HR records — Restricted, Admin only",
    isAdmin ? null : "  ⊘ Other spaces — Not a member",
  ]
    .filter(Boolean)
    .join("\n");

  return `You are PATNA Assistant — a context-aware, access-restricted AI for the PATNA community platform focused on maritime decarbonisation and climate policy.

You are helping ${name} (${roleTitle}).

YOUR DATA ACCESS FOR THIS SESSION:
${spaceLines}${adminLine}
  • Member Directory: Profiles (visibility-gated)
${blockedLines}

RULES:
1. Only answer using information from the RETRIEVED CONTEXT section below.
2. Never invent facts, statistics, dates, or names not present in the context.
3. Never surface financial, HR, or admin-restricted data unless the user is an admin.
4. If the context does not contain enough information to answer, say so clearly and suggest the user check the relevant space directly.
5. Be concise. Use bullet points for lists. Use plain language.
6. Always cite the source type when referencing retrieved content (e.g. "From the Policy Cohort discussion:", "From the event listing:").
7. You are scoped to PATNA community data only — do not answer general knowledge questions unrelated to the community.`;
}

/**
 * Formats retrieved chunks into a context block for injection into the prompt.
 *
 * @param {Array<{ source_type: string, content_text: string, metadata: object, similarity: number }>} chunks
 * @returns {string}
 */
export function buildContextBlock(chunks) {
  if (!chunks.length) {
    return "\n\nRETRIEVED CONTEXT:\nNo relevant content found in the community for this query.";
  }

  const formatted = chunks
    .map((c, i) => {
      const label = c.metadata?.title
        ? `[${c.source_type}] ${c.metadata.title}`
        : `[${c.source_type}]`;
      return `${i + 1}. ${label}\n${c.content_text}`;
    })
    .join("\n\n---\n\n");

  return `\n\nRETRIEVED CONTEXT:\n${formatted}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggested prompts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a list of suggested prompts personalised to the user's spaces.
 * Always returns 4–6 prompts.
 *
 * @param {Array<{ name: string, space_type: string }>} spaces
 * @param {boolean} isAdmin
 * @returns {string[]}
 */
export function buildSuggestedPrompts(spaces, isAdmin = false) {
  const cohort = spaces.find((s) => s.space_type === "cohort");
  const workingGroup = spaces.find((s) => s.space_type === "working_group");
  const constituency = spaces.find((s) => s.space_type === "constituency");

  const prompts = [
    cohort
      ? `Summarise recent ${cohort.name} discussions`
      : spaces[0]
      ? `Summarise recent ${spaces[0].name} discussions`
      : null,
    "What events do I have coming up?",
    workingGroup
      ? `Find insights on ${workingGroup.name}`
      : "Find Insights on IMO GHG strategy",
    constituency
      ? `Who in ${constituency.name} works on SIDS issues?`
      : "Who in my cohort works on SIDS issues?",
    isAdmin ? "Show me applications awaiting my review" : null,
    "What is PATNA's position on the GHG levy?",
  ]
    .filter(Boolean)
    .slice(0, 6);

  return prompts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Access context for the Access panel UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the structured access context shown in the Access panel.
 * Returns permitted and blocked items for display.
 *
 * @param {{ spaces: object[], isAdmin: boolean }} opts
 * @returns {{ permitted: Array<{ name: string, detail: string }>, blocked: Array<{ name: string, detail: string }> }}
 */
export function buildAccessContext({ spaces, isAdmin }) {
  const permitted = [
    ...spaces.map((s) => ({
      name: s.name,
      detail: "Discussions, members" + (s.space_type === "cohort" ? ", documents" : ""),
    })),
    { name: "Member Directory", detail: "Profiles (visibility-gated)" },
    isAdmin
      ? { name: "Admin / Applications", detail: "All cohort spaces — read & write" }
      : null,
  ].filter(Boolean);

  const blocked = [
    isAdmin ? null : { name: "Other Cohort Spaces", detail: "Not a member" },
    { name: "Financial / HR records", detail: "Restricted — Admin only" },
  ].filter(Boolean);

  return { permitted, blocked };
}
