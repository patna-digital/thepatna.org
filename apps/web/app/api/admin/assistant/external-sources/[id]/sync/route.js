// POST /api/admin/assistant/external-sources/[id]/sync
// Re-syncs a single Drive folder source: lists current PDFs, upserts changed
// files, removes files no longer present, refreshes embeddings.

import { NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncExternalSource } from "@/lib/assistant-indexing";

export async function POST(request, { params }) {
  try {
    await requireAdminContext();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Source ID is required." }, { status: 400 });
  }

  const adminSupabase = createSupabaseAdminClient();
  const force = new URL(request.url).searchParams.get("force") === "1";

  try {
    const result = await syncExternalSource({ adminSupabase, force, sourceId: id });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Sync failed." }, { status: 500 });
  }
}
