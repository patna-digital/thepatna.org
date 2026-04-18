// GET  /api/admin/assistant/external-sources  — list all sources with document counts
// POST /api/admin/assistant/external-sources  — create a new Drive folder source

// Allow up to 5 minutes — initial sync of a new Drive folder involves per-file
// PDF downloads, text extraction, and embedding calls.
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseDriveFolderUrl } from "@/lib/assistant-drive";
import { syncExternalSource } from "@/lib/assistant-indexing";

export async function GET() {
  try {
    await requireAdminContext();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createSupabaseAdminClient();

  const { data: sources, error } = await adminSupabase
    .from("assistant_external_sources")
    .select("id, title, provider, source_url, external_folder_id, visibility, status, last_synced_at, last_sync_status, last_sync_error, current_sync_total, current_sync_processed, current_sync_stage, current_sync_started_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach per-source document counts
  const sourceIds = (sources || []).map((s) => s.id);
  let docCounts = {};

  if (sourceIds.length) {
    const { data: countRows } = await adminSupabase
      .from("assistant_external_documents")
      .select("source_id, status")
      .in("source_id", sourceIds);

    for (const row of countRows || []) {
      if (!docCounts[row.source_id]) {
        docCounts[row.source_id] = { total: 0, indexed: 0, error: 0, pending: 0, skipped: 0 };
      }
      docCounts[row.source_id].total += 1;
      docCounts[row.source_id][row.status] = (docCounts[row.source_id][row.status] || 0) + 1;
    }
  }

  const result = (sources || []).map((source) => ({
    ...source,
    docCounts: docCounts[source.id] || { total: 0, indexed: 0, error: 0, pending: 0, skipped: 0 },
  }));

  return NextResponse.json({ sources: result });
}

export async function POST(request) {
  let adminUser;
  try {
    adminUser = await requireAdminContext();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, source_url, visibility = "members" } = body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  if (!source_url || typeof source_url !== "string") {
    return NextResponse.json({ error: "source_url is required." }, { status: 400 });
  }

  if (!["public", "members", "admin_only"].includes(visibility)) {
    return NextResponse.json({ error: "visibility must be public, members, or admin_only." }, { status: 400 });
  }

  const parsed = parseDriveFolderUrl(source_url);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  const adminSupabase = createSupabaseAdminClient();

  const { data: source, error: insertError } = await adminSupabase
    .from("assistant_external_sources")
    .insert({
      title: title.trim(),
      source_url: source_url.trim(),
      external_folder_id: parsed.folderId,
      visibility,
      status: "pending",
      created_by: adminUser?.id || null,
    })
    .select("id, title, source_url, external_folder_id, visibility, status")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Run initial sync immediately
  let syncResult = null;
  try {
    syncResult = await syncExternalSource({ adminSupabase, sourceId: source.id });
  } catch (syncErr) {
    // Sync errors are recorded on the source row; don't fail the creation
    syncResult = { synced: 0, skipped: 0, errors: [{ title: "Sync", reason: syncErr.message }] };
  }

  return NextResponse.json({ source, syncResult }, { status: 201 });
}
