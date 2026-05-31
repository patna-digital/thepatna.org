"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function text(formData, key) {
  return String(formData.get(key) || "").trim();
}

const VALID_SECTIONS = ["board", "secretariat", "research"];

async function uploadPhoto({ adminClient, file, personId }) {
  if (!file || file.size === 0) return null;

  const ext = file.type === "image/png" ? "png"
    : file.type === "image/webp" ? "webp"
    : "jpg";

  const storagePath = `${personId}/${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error } = await adminClient.storage
    .from("people-photos")
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (error) {
    console.error("people-photos upload error:", error);
    return null;
  }

  const { data } = adminClient.storage.from("people-photos").getPublicUrl(storagePath);
  return { photoUrl: data?.publicUrl || null, photoStoragePath: storagePath };
}

// ─────────────────────────────────────────────────────────────────────────────
// Save (create or update)
// ─────────────────────────────────────────────────────────────────────────────

export async function savePersonAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const personId    = text(formData, "person_id");
  const section     = text(formData, "section");
  const fullName    = text(formData, "full_name");
  const title       = text(formData, "title")        || null;
  const organisation = text(formData, "organisation") || null;
  const bio         = text(formData, "bio")           || null;
  const email       = text(formData, "email")         || null;
  const linkedinUrl = text(formData, "linkedin_url")  || null;
  const displayOrder = parseInt(text(formData, "display_order") || "0", 10);
  const isActive    = formData.get("is_active") !== "false"; // default true

  if (!fullName || !VALID_SECTIONS.includes(section)) {
    const base = personId ? `/admin/people/${personId}` : "/admin/people/new";
    redirect(`${base}?notice=missing-fields`);
  }

  const payload = {
    section,
    full_name:     fullName,
    title,
    organisation,
    bio,
    email,
    linkedin_url:  linkedinUrl,
    display_order: displayOrder,
    is_active:     isActive,
    updated_by_user_id: user.id,
  };

  let resolvedId = personId;

  if (personId) {
    const { error } = await adminClient
      .from("people_profiles")
      .update(payload)
      .eq("id", personId);
    if (error) redirect(`/admin/people/${personId}?notice=error`);
  } else {
    payload.created_by_user_id = user.id;
    const { data, error } = await adminClient
      .from("people_profiles")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data?.id) redirect("/admin/people/new?notice=error");
    resolvedId = data.id;
  }

  // Photo upload (after record exists so we have the ID for the storage path)
  const photoFile = formData.get("photo_file");
  if (photoFile && photoFile.size > 0) {
    const result = await uploadPhoto({ adminClient, file: photoFile, personId: resolvedId });
    if (result) {
      await adminClient
        .from("people_profiles")
        .update({ photo_url: result.photoUrl, photo_storage_path: result.photoStoragePath })
        .eq("id", resolvedId);
    }
  }

  redirect(`/admin/people/${resolvedId}?notice=saved`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────────────────────

export async function deletePersonAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const personId = text(formData, "person_id");
  if (!personId) redirect("/admin/people?notice=error");

  // Remove photo from storage
  const { data: person } = await adminClient
    .from("people_profiles")
    .select("photo_storage_path")
    .eq("id", personId)
    .maybeSingle();

  if (person?.photo_storage_path) {
    await adminClient.storage.from("people-photos").remove([person.photo_storage_path]);
  }

  const { error } = await adminClient.from("people_profiles").delete().eq("id", personId);
  if (error) redirect("/admin/people?notice=error");

  redirect("/admin/people?notice=deleted");
}

// ─────────────────────────────────────────────────────────────────────────────
// Reorder (move up/down within section)
// ─────────────────────────────────────────────────────────────────────────────

export async function reorderPersonAction(formData) {
  const { } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const personId    = text(formData, "person_id");
  const direction   = text(formData, "direction"); // "up" | "down"
  const section     = text(formData, "section");

  if (!personId || !["up", "down"].includes(direction)) {
    redirect("/admin/people?notice=error");
  }

  // Fetch all people in this section ordered by display_order
  const { data: peers } = await adminClient
    .from("people_profiles")
    .select("id, display_order")
    .eq("section", section)
    .order("display_order", { ascending: true });

  if (!peers?.length) redirect("/admin/people?notice=error");

  const idx = peers.findIndex((p) => p.id === personId);
  if (idx < 0) redirect("/admin/people?notice=error");

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= peers.length) redirect(`/admin/people?section=${section}`);

  const current = peers[idx];
  const swap    = peers[swapIdx];

  // Swap display_order values
  await Promise.all([
    adminClient.from("people_profiles").update({ display_order: swap.display_order }).eq("id", current.id),
    adminClient.from("people_profiles").update({ display_order: current.display_order }).eq("id", swap.id),
  ]);

  redirect(`/admin/people?section=${section}&notice=reordered`);
}
