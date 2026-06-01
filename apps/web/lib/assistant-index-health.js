import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env.js";
import { createSupabaseAdminClient } from "./supabase/admin.js";

const ZERO_VECTOR_384 = Array.from({ length: 384 }, () => 0);
const EMBED_DOCUMENT_HEALTH_PAYLOAD = { healthcheck: true };

function serialiseError(error) {
  if (!error) {
    return null;
  }

  return {
    code: String(error.code || ""),
    details: String(error.details || ""),
    hint: String(error.hint || ""),
    message: String(error.message || error.error_description || error.error || "Unknown error"),
  };
}

export function isMissingDocumentEmbeddingsError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "PGRST205" || message.includes("document_embeddings");
}

export function isMissingAssistantRpcError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "PGRST202" || message.includes("match_assistant_documents");
}

export function classifyEmbedDocumentResponse(response, responseText = "") {
  if (response.status === 404) {
    return buildCheckResult({
      description: "embed-document function",
      error: { message: "Requested function was not found" },
      ok: false,
      status: "missing",
    });
  }

  if (response.status === 405) {
    return buildCheckResult({
      description: "embed-document function",
      error: { message: "Function endpoint is reachable but rejected the POST smoke test method contract." },
      ok: false,
      status: "error",
    });
  }

  if (response.status >= 500) {
    return buildCheckResult({
      description: "embed-document function",
      error: { message: `Unexpected status ${response.status}` },
      ok: false,
      status: "error",
    });
  }

  if (response.status >= 400) {
    let parsedMessage = responseText;
    try {
      const parsed = JSON.parse(responseText);
      parsedMessage = parsed?.error || parsed?.message || responseText;
    } catch {
      // Fall back to raw response text.
    }

    return buildCheckResult({
      description: "embed-document function",
      error: { message: parsedMessage || `Unexpected status ${response.status}` },
      ok: false,
      status: "error",
    });
  }

  return buildCheckResult({
    description: "embed-document function",
    ok: true,
    status: "ready",
  });
}

function buildCheckResult({ description, error = null, ok, status }) {
  return {
    description,
    error: serialiseError(error),
    ok,
    status,
  };
}

export async function checkDocumentEmbeddingsTable({ adminSupabase }) {
  const { count, error } = await adminSupabase
    .from("document_embeddings")
    .select("*", { count: "exact", head: true });

  if (error) {
    return buildCheckResult({
      description: "document_embeddings table",
      error,
      ok: false,
      status: isMissingDocumentEmbeddingsError(error) ? "missing" : "error",
    });
  }

  return {
    ...buildCheckResult({
      description: "document_embeddings table",
      ok: true,
      status: "ready",
    }),
    count: count ?? 0,
  };
}

export async function checkAssistantMatchRpc({ adminSupabase }) {
  const { error } = await adminSupabase.rpc("match_assistant_documents", {
    allow_admin_content: false,
    allow_member_content: false,
    filter_external_source_ids: [],
    filter_source_types: [],
    filter_space_ids: [],
    match_count: 1,
    query_embedding: ZERO_VECTOR_384,
  });

  if (error) {
    return buildCheckResult({
      description: "match_assistant_documents RPC",
      error,
      ok: false,
      status: isMissingAssistantRpcError(error) ? "missing" : "error",
    });
  }

  return buildCheckResult({
    description: "match_assistant_documents RPC",
    ok: true,
    status: "ready",
  });
}

export async function checkEmbedDocumentFunction({ fetchImpl = fetch }) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return buildCheckResult({
      description: "embed-document function",
      error: { message: "Supabase URL or service role key is not configured." },
      ok: false,
      status: "error",
    });
  }

  let response;
  try {
    response = await fetchImpl(`${supabaseUrl}/functions/v1/embed-document`, {
      body: JSON.stringify(EMBED_DOCUMENT_HEALTH_PAYLOAD),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      method: "POST",
    });
  } catch (error) {
    return buildCheckResult({
      description: "embed-document function",
      error,
      ok: false,
      status: "error",
    });
  }

  const responseText = await response.text().catch(() => "");
  return classifyEmbedDocumentResponse(response, responseText);
}

export async function getAssistantIndexHealth({
  adminSupabase = null,
  fetchImpl = fetch,
} = {}) {
  const supabase = adminSupabase || createSupabaseAdminClient();

  const table = await checkDocumentEmbeddingsTable({ adminSupabase: supabase });
  const rpc = table.ok
    ? await checkAssistantMatchRpc({ adminSupabase: supabase })
    : buildCheckResult({
        description: "match_assistant_documents RPC",
        error: { message: "Skipped because document_embeddings is unavailable." },
        ok: false,
        status: "skipped",
      });
  const embedFunction = await checkEmbedDocumentFunction({ fetchImpl });

  const issues = [table, rpc, embedFunction].filter((check) => !check.ok);
  const missing = issues.filter((check) => check.status === "missing");

  return {
    checks: {
      embedFunction,
      rpc,
      table,
    },
    isReady: issues.length === 0,
    issueSummary:
      missing.length > 0
        ? "Assistant indexing infrastructure is not deployed to this Supabase project yet."
        : issues.length > 0
          ? "Assistant indexing infrastructure is partially unavailable."
          : "",
  };
}

export async function fetchAssistantIndexStats({ adminSupabase = null, fetchImpl = fetch } = {}) {
  const supabase = adminSupabase || createSupabaseAdminClient();
  const health = await getAssistantIndexHealth({ adminSupabase: supabase, fetchImpl });

  if (!health.checks.table.ok) {
    return {
      bySourceType: [],
      health,
      lastIndexedAt: null,
      total: 0,
    };
  }

  const sourceTypes = [
    "thread",
    "comment",
    "content_item",
    "event",
    "profile",
    "community_application",
    "external_document",
  ];

  const results = await Promise.all(
    sourceTypes.map(async (sourceType) => {
      const { count, error } = await supabase
        .from("document_embeddings")
        .select("*", { count: "exact", head: true })
        .eq("source_type", sourceType);

      return { sourceType, count: error ? null : (count ?? 0) };
    }),
  );

  const { data: latestRow } = await supabase
    .from("document_embeddings")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    bySourceType: results,
    health,
    lastIndexedAt: latestRow?.updated_at ?? null,
    total: results.reduce((sum, result) => sum + (result.count ?? 0), 0),
  };
}
