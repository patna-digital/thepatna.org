import { NextResponse } from "next/server";
import {
  extractPublicationStoragePath,
  normalisePublicationAttachment,
} from "@/lib/publication-attachments";
import { canAccessPublicationFile } from "@/lib/publication-file-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

function safeFilename(value, fallback = "publication-file") {
  return String(value || fallback)
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 180) || fallback;
}

function resolveDisposition(value) {
  return value === "inline" ? "inline" : "attachment";
}

async function getUserAccessContext() {
  if (!isSupabaseConfigured()) {
    return { profile: null, roles: [], user: null };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, roles: [], user: null };
  }

  const adminClient = createSupabaseAdminClient();
  const [{ data: roles }, { data: profile }] = await Promise.all([
    adminClient.from("user_roles").select("role").eq("user_id", user.id),
    adminClient.from("profiles").select("is_super_admin").eq("id", user.id).maybeSingle(),
  ]);

  return {
    profile: profile || null,
    roles: (roles || []).map((row) => row.role),
    user,
  };
}

export async function GET(request, { params }) {
  const { attachmentId } = await params;
  const disposition = resolveDisposition(request.nextUrl.searchParams.get("disposition"));

  if (!attachmentId) {
    return NextResponse.json({ error: "Attachment is required." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("content_attachments")
    .select("*, content_items(id, title, slug, publish_status, visibility)")
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) {
    console.error("[publications/files] Failed to load attachment", {
      attachmentId,
      message: error.message,
    });
    return NextResponse.json({ error: "Unable to load publication file." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const { user, roles, profile } = await getUserAccessContext();
  const contentItem = data.content_items || null;

  if (!canAccessPublicationFile({ contentItem, profile, roles, user })) {
    return NextResponse.json({ error: "Forbidden." }, { status: user ? 403 : 401 });
  }

  const attachment = normalisePublicationAttachment(data);

  if (attachment.source_kind !== "storage") {
    const targetUrl = attachment.original_url || attachment.file_url;
    if (!targetUrl) {
      return NextResponse.json({ error: "External file URL is missing." }, { status: 404 });
    }
    return NextResponse.redirect(targetUrl);
  }

  const storagePath = attachment.storage_path || extractPublicationStoragePath(attachment.file_url);
  if (!storagePath) {
    return NextResponse.json({ error: "Storage path is missing." }, { status: 404 });
  }

  const { data: file, error: downloadError } = await adminClient.storage
    .from("publications")
    .download(storagePath);

  if (downloadError || !file) {
    console.error("[publications/files] Failed to download storage object", {
      attachmentId,
      message: downloadError?.message || null,
      storagePath,
    });
    return NextResponse.json({ error: "Unable to download publication file." }, { status: 404 });
  }

  const filename = safeFilename(
    attachment.title ||
      contentItem?.title ||
      storagePath.split("/").filter(Boolean).at(-1),
  );
  const contentType = attachment.file_type || file.type || "application/octet-stream";
  const body = await file.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Content-Type": contentType,
    },
  });
}
