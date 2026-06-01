"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { uploadContentImage } from "@/lib/content-images";

export async function addEventGalleryImageAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const eventId = String(formData.get("event_id") || "").trim();
  const altText  = String(formData.get("alt_text") || "").trim() || null;
  const caption  = String(formData.get("caption") || "").trim() || null;
  const file     = formData.get("gallery_image_file");

  if (!eventId || !file || Number(file.size) === 0) {
    return { ok: false, error: "An event and image file are required." };
  }

  let imageUrl;
  try {
    const result = await uploadContentImage({
      adminSupabase: adminClient,
      file,
      userId: user.id,
      subfolder: "events",
    });
    imageUrl = result.imageUrl;
  } catch (err) {
    return { ok: false, error: err?.message || "Upload failed." };
  }

  if (!imageUrl) {
    return { ok: false, error: "Upload did not return a URL." };
  }

  const { error } = await adminClient
    .from("event_gallery")
    .insert({ event_id: eventId, image_url: imageUrl, alt_text: altText, caption });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/events`);
  return { ok: true };
}

export async function removeEventGalleryImageAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const imageId = String(formData.get("image_id") || "").trim();
  const eventId = String(formData.get("event_id") || "").trim();

  if (!imageId) return { ok: false, error: "Image ID required." };

  const { error } = await adminClient
    .from("event_gallery")
    .delete()
    .eq("id", imageId);

  if (error) return { ok: false, error: error.message };

  if (eventId) revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/events`);
  return { ok: true };
}
