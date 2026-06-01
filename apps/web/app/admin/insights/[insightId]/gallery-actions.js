"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePublicationManagerContext } from "@/lib/supabase/access";
import { uploadContentImage } from "@/lib/content-images";

export async function addInsightGalleryImageAction(formData) {
  const { user } = await requirePublicationManagerContext();
  const adminClient = createSupabaseAdminClient();

  const contentId = String(formData.get("content_id") || "").trim();
  const altText   = String(formData.get("alt_text") || "").trim() || null;
  const caption   = String(formData.get("caption") || "").trim() || null;
  const file      = formData.get("gallery_image_file");

  if (!contentId || !file || Number(file.size) === 0) {
    return { ok: false, error: "An insight and image file are required." };
  }

  let imageUrl;
  try {
    const result = await uploadContentImage({
      adminSupabase: adminClient,
      file,
      userId: user.id,
      subfolder: "insights",
    });
    imageUrl = result.imageUrl;
  } catch (err) {
    return { ok: false, error: err?.message || "Upload failed." };
  }

  if (!imageUrl) {
    return { ok: false, error: "Upload did not return a URL." };
  }

  const { error } = await adminClient
    .from("content_gallery")
    .insert({ content_id: contentId, image_url: imageUrl, alt_text: altText, caption });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/insights/${contentId}`);
  revalidatePath(`/publications`);
  return { ok: true };
}

export async function removeInsightGalleryImageAction(formData) {
  await requirePublicationManagerContext();
  const adminClient = createSupabaseAdminClient();

  const imageId   = String(formData.get("image_id") || "").trim();
  const contentId = String(formData.get("content_id") || "").trim();

  if (!imageId) return { ok: false, error: "Image ID required." };

  const { error } = await adminClient
    .from("content_gallery")
    .delete()
    .eq("id", imageId);

  if (error) return { ok: false, error: error.message };

  if (contentId) revalidatePath(`/admin/insights/${contentId}`);
  revalidatePath(`/publications`);
  return { ok: true };
}
