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
    },
    userId: user.id,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to create insight" };
  }

  revalidatePath("/admin/insights");
  revalidatePath("/app/insights");
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
    },
    userId: user.id,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to update insight" };
  }

  revalidatePath("/admin/insights");
  revalidatePath("/app/insights");
  revalidatePath(`/app/insights/${insight.slug}`);
  
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
  revalidatePath("/app/insights");
  
  return { ok: true };
}
