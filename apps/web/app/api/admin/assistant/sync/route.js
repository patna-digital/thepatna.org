// POST /api/admin/assistant/sync
// Incremental sync: re-indexes the most recently updated records for each
// source type without clearing existing embeddings. Capped at 20 records per
// source to stay within the API route timeout budget.

import { NextResponse } from "next/server";
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

  for (const row of rows) {
    try {
      await syncFn({ adminSupabase, id: row.id });
      synced += 1;
    } catch (err) {
      errors += 1;
      console.error(`[assistant:sync] ${label} ${row.id}:`, err.message);
    }
  }

  return { label, synced, errors };
}

export async function POST() {
  try {
    await requireAdminContext();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createSupabaseAdminClient();

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

  return NextResponse.json({ ok: true, synced: totalSynced, errors: totalErrors, sources: results });
}
