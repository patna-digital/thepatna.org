import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { PUBLICATION_ATTACHMENTS_BUCKET } from "@/lib/publication-attachments";

function resolveDisposition(value) {
  return value === "inline" ? "inline" : "attachment";
}

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path") || "";
  const disposition = resolveDisposition(searchParams.get("disposition"));

  if (!path) {
    return NextResponse.json({ error: "Path is required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Forbidden." }, { status: 401 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data: file, error: downloadError } = await adminClient.storage
    .from(PUBLICATION_ATTACHMENTS_BUCKET)
    .download(path);

  if (downloadError || !file) {
    console.error("[publications/files/serve] Failed to download storage object", {
      message: downloadError?.message || null,
      path,
    });
    return NextResponse.json({ error: "Unable to download publication file." }, { status: 404 });
  }

  const filename = path.split("/").filter(Boolean).at(-1) || "publication-file";
  const contentType = file.type || "application/octet-stream";
  const body = await file.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Content-Type": contentType,
    },
  });
}
