"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { uploadContentImage } from "@/lib/content-images";

export async function addProjectGalleryImageAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const projectId = String(formData.get("project_id") || "").trim();
  const altText   = String(formData.get("alt_text") || "").trim() || null;
  const caption   = String(formData.get("caption") || "").trim() || null;
  const file      = formData.get("gallery_image_file");

  if (!projectId || !file || Number(file.size) === 0) {
    return { ok: false, error: "A project and image file are required." };
  }

  let imageUrl;
  try {
    const result = await uploadContentImage({
      adminSupabase: adminClient,
      file,
      userId: user.id,
      subfolder: "projects",
    });
    imageUrl = result.imageUrl;
  } catch (err) {
    return { ok: false, error: err?.message || "Upload failed." };
  }

  if (!imageUrl) {
    return { ok: false, error: "Upload did not return a URL." };
  }

  const { error } = await adminClient
    .from("project_gallery")
    .insert({ project_id: projectId, image_url: imageUrl, alt_text: altText, caption });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/projects`);
  return { ok: true };
}

export async function removeProjectGalleryImageAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const imageId   = String(formData.get("image_id") || "").trim();
  const projectId = String(formData.get("project_id") || "").trim();

  if (!imageId) return { ok: false, error: "Image ID required." };

  const { error } = await adminClient
    .from("project_gallery")
    .delete()
    .eq("id", imageId);

  if (error) return { ok: false, error: error.message };

  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/projects`);
  return { ok: true };
}
