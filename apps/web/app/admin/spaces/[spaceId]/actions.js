"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import {
  createSpace,
  updateSpace,
  deleteSpace,
  generateSpaceSlug,
} from "@/lib/spaces";

export async function createSpaceAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const name        = String(formData.get("name")        || "").trim();
  const space_type  = String(formData.get("space_type")  || "working_group").trim();
  const visibility  = String(formData.get("visibility")  || "invite_only").trim();
  const description = String(formData.get("description") || "").trim();
  const lead_name   = String(formData.get("lead_name")   || "").trim();
  const partner_org = String(formData.get("partner_org") || "").trim();
  const slug        = String(formData.get("slug")        || "").trim() || generateSpaceSlug(name);
  const tag_ids     = formData.getAll("tag_ids").map(String);

  if (!name) {
    return { ok: false, error: "Name is required" };
  }

  const { space, error } = await createSpace({
    adminSupabase: adminClient,
    data: { name, slug, space_type, description, lead_name, partner_org, visibility, tag_ids },
    userId: user.id,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to create space" };
  }

  revalidatePath("/admin/spaces");
  revalidatePath("/app/spaces");
  redirect("/admin/spaces?notice=created");
}

export async function updateSpaceAction(spaceId, formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const name        = String(formData.get("name")        || "").trim();
  const space_type  = String(formData.get("space_type")  || "working_group").trim();
  const visibility  = String(formData.get("visibility")  || "invite_only").trim();
  const description = String(formData.get("description") || "").trim();
  const lead_name   = String(formData.get("lead_name")   || "").trim();
  const partner_org = String(formData.get("partner_org") || "").trim();
  const tag_ids     = formData.getAll("tag_ids").map(String);

  if (!name) {
    return { ok: false, error: "Name is required" };
  }

  const { space, error } = await updateSpace({
    adminSupabase: adminClient,
    id: spaceId,
    data: { name, space_type, description, lead_name, partner_org, visibility, tag_ids },
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to update space" };
  }

  revalidatePath("/admin/spaces");
  revalidatePath(`/admin/spaces/${spaceId}`);
  revalidatePath("/app/spaces");

  return { ok: true, space };
}

export async function deleteSpaceAction(spaceId) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const { error } = await deleteSpace({ adminSupabase: adminClient, id: spaceId });

  if (error) {
    return { ok: false, error: error.message || "Failed to delete space" };
  }

  revalidatePath("/admin/spaces");
  revalidatePath("/app/spaces");

  return { ok: true };
}
