// DELETE /api/admin/assistant/external-sources/[id]
// Removes a Drive source, its external document rows, and their embeddings.

import { NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteExternalSource } from "@/lib/assistant-indexing";

export async function DELETE(_request, { params }) {
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

  try {
    await deleteExternalSource({ adminSupabase, sourceId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Delete failed." }, { status: 500 });
  }
}