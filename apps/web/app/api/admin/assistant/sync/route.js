// POST /api/admin/assistant/sync
// Incremental sync: re-indexes the most recently updated records for each
// source type without clearing existing embeddings. Capped at 20 records per
// source to stay within the API route timeout budget.

import { NextResponse } from "next/server";
import { getAssistantIndexHealth } from "@/lib/assistant-index-health";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  syncCommentAssistantDocument,
  syncCommunityApplicationAssistantDocument,
  syncContentItemAssistantDocument,
  syncEventAssistantDocument,
  syncProfileAssistantDocument,
  syncThreadAssistantDocument,
} from "@/lib/assistant-indexing";

const SYNC_LIMIT = 20;

async function syncSource({ label, rows, syncFn, adminSupabase }) {
  let synced = 0;
  let errors = 0;
  const failureReasons = new Map();

  for (const row of rows) {
    try {
      await syncFn({ adminSupabase, id: row.id });
      synced += 1;
    } catch (err) {
      errors += 1;
      const reason = String(err?.message || "Unknown sync error");
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      console.error(`[assistant:sync] ${label} ${row.id}:`, reason);
    }
  }

  return {
    errors,
    failureReasons: [...failureReasons.entries()].map(([reason, count]) => ({ count, reason })),
    label,
    synced,
  };
}

export async function POST() {
  try {
    await requireAdminContext();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createSupabaseAdminClient();
  const health = await getAssistantIndexHealth({ adminSupabase });

  if (!health.isReady) {
    return NextResponse.json(
      {
        error: health.issueSummary,
        issues: Object.values(health.checks)
          .filter((check) => !check.ok)
          .map((check) => ({
            description: check.description,
            message: check.error?.message || "Unavailable",
            status: check.status,
          })),
        ok: false,
      },
      { status: 503 },
    );
  }

  const [
    threadsResult,
    commentsResult,
    contentItemsResult,
    eventsResult,
    profilesResult,
    applicationsResult,
  ] = await Promise.all([
    adminSupabase.from("threads").select("id").order("updated_at", { ascending: false }).limit(SYNC_LIMIT),
    adminSupabase.from("comments").select("id").order("updated_at", { ascending: false }).limit(SYNC_LIMIT),
    adminSupabase.from("content_items").select("id").order("updated_at", { ascending: false }).limit(SYNC_LIMIT),
    adminSupabase.from("events").select("id").order("updated_at", { ascending: false }).limit(SYNC_LIMIT),
    adminSupabase.from("profiles").select("id").order("updated_at", { ascending: false }).limit(SYNC_LIMIT),
    adminSupabase.from("community_applications").select("id").order("updated_at", { ascending: false }).limit(SYNC_LIMIT),
  ]);

  const results = await Promise.all([
    syncSource({
      label: "threads",
      rows: threadsResult.data || [],
      adminSupabase,
      syncFn: ({ adminSupabase: s, id }) => syncThreadAssistantDocument({ adminSupabase: s, threadId: id }),
    }),
    syncSource({
      label: "comments",
      rows: commentsResult.data || [],
      adminSupabase,
      syncFn: ({ adminSupabase: s, id }) => syncCommentAssistantDocument({ adminSupabase: s, commentId: id }),
    }),
    syncSource({
      label: "content_items",
      rows: contentItemsResult.data || [],
      adminSupabase,
      syncFn: ({ adminSupabase: s, id }) => syncContentItemAssistantDocument({ adminSupabase: s, contentItemId: id }),
    }),
    syncSource({
      label: "events",
      rows: eventsResult.data || [],
      adminSupabase,
      syncFn: ({ adminSupabase: s, id }) => syncEventAssistantDocument({ adminSupabase: s, eventId: id }),
    }),
    syncSource({
      label: "profiles",
      rows: profilesResult.data || [],
      adminSupabase,
      syncFn: ({ adminSupabase: s, id }) => syncProfileAssistantDocument({ adminSupabase: s, profileId: id }),
    }),
    syncSource({
      label: "applications",
      rows: applicationsResult.data || [],
      adminSupabase,
      syncFn: ({ adminSupabase: s, id }) =>
        syncCommunityApplicationAssistantDocument({ adminSupabase: s, applicationId: id }),
    }),
  ]);

  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const failureReasons = results.flatMap((result) =>
    result.failureReasons.map((item) => ({
      count: item.count,
      label: result.label,
      reason: item.reason,
    })),
  );

  return NextResponse.json({
    ok: true,
    synced: totalSynced,
    errors: totalErrors,
    failureReasons,
    sources: results,
  });
}
