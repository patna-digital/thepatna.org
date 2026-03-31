"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import {
  createInsight,
  updateInsight,
  deleteInsight,
  generateInsightSlug,
} from "@/lib/insights";

export async function createInsightAction(formData) {
  const { user, supabase } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const content_type = String(formData.get("content_type") || "").trim();
  const publish_status = String(formData.get("publish_status") || "draft").trim();
  const visibility = String(formData.get("visibility") || "members").trim();
  const slug = String(formData.get("slug") || "").trim() || generateInsightSlug(title);
  const tag_ids = formData.getAll("tag_ids").map(String);
  const featured = formData.get("featured") === "true";
  const cover_image_url = String(formData.get("cover_image_url") || "").trim() || null;
  const cover_image_alt = String(formData.get("cover_image_alt") || "").trim() || null;
  const meta_description = String(formData.get("meta_description") || "").trim() || null;

  // Validation
  if (!title) {
    return { ok: false, error: "Title is required" };
  }
  if (!content_type) {
    return { ok: false, error: "Content type is required" };
  }

  const { insight, error } = await createInsight({
    adminSupabase: adminClient,
    data: {
      title,
      summary,
      body,
      content_type,
      publish_status,
      visibility,
      slug,
      tag_ids,
      featured,
      cover_image_url,
      cover_image_alt,
      meta_description,
    },
    userId: user.id,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to create insight" };
  }

  revalidatePath("/admin/insights");
  revalidatePath("/app/publications");
  revalidatePath("/publications");
  redirect("/admin/insights?notice=created");
}

export async function updateInsightAction(insightId, formData) {
  const { user, supabase } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const content_type = String(formData.get("content_type") || "").trim();
  const publish_status = String(formData.get("publish_status") || "draft").trim();
  const visibility = String(formData.get("visibility") || "members").trim();
  const tag_ids = formData.getAll("tag_ids").map(String);
  const featured = formData.get("featured") === "true";
  const cover_image_url = String(formData.get("cover_image_url") || "").trim() || null;
  const cover_image_alt = String(formData.get("cover_image_alt") || "").trim() || null;
  const meta_description = String(formData.get("meta_description") || "").trim() || null;

  // Validation
  if (!title) {
    return { ok: false, error: "Title is required" };
  }
  if (!content_type) {
    return { ok: false, error: "Content type is required" };
  }

  const { insight, error } = await updateInsight({
    adminSupabase: adminClient,
    id: insightId,
    data: {
      title,
      summary,
      body,
      content_type,
      publish_status,
      visibility,
      tag_ids,
      featured,
      cover_image_url,
      cover_image_alt,
      meta_description,
    },
    userId: user.id,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to update insight" };
  }

  revalidatePath("/admin/insights");
  revalidatePath("/app/publications");
  revalidatePath(`/app/publications/${insight.slug}`);
  revalidatePath("/publications");
  revalidatePath(`/publications/${insight.slug}`);
  
  return { ok: true, insight };
}

export async function deleteInsightAction(insightId) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const { error } = await deleteInsight({
    adminSupabase: adminClient,
    id: insightId,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to delete insight" };
  }

  revalidatePath("/admin/insights");
  revalidatePath("/app/publications");
  revalidatePath("/publications");

  return { ok: true };
}
