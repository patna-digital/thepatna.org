"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { addSpaceMember, updateSpaceMemberRole, removeSpaceMember } from "@/lib/spaces";

export async function addSpaceMemberAction(spaceId, formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const userId = String(formData.get("user_id") || "").trim();
  const role   = String(formData.get("role")    || "member").trim();

  if (!userId) {
    return { ok: false, error: "Please select a member to add" };
  }

  const { error } = await addSpaceMember({
    adminSupabase: adminClient,
    spaceId,
    userId,
    role,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This member is already in the space" };
    }
    return { ok: false, error: error.message || "Failed to add member" };
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { ok: true };
}

export async function updateMemberRoleAction(spaceId, formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const userId = String(formData.get("user_id") || "").trim();
  const role   = String(formData.get("role")    || "member").trim();

  if (!userId) {
    return { ok: false, error: "User ID is required" };
  }

  const { error } = await updateSpaceMemberRole({
    adminSupabase: adminClient,
    spaceId,
    userId,
    role,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to update role" };
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { ok: true };
}

export async function removeSpaceMemberAction(spaceId, userId) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const { error } = await removeSpaceMember({
    adminSupabase: adminClient,
    spaceId,
    userId,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to remove member" };
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { ok: true };
}
