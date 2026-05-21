"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { revalidatePath } from "next/cache";

export async function saveFeaturedMembersAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const mode = formData.get("mode");
  const rawIds = formData.get("member_ids");
  const memberIds = rawIds ? JSON.parse(rawIds) : [];

  const { error } = await adminClient
    .from("site_settings")
    .upsert(
      {
        key: "home_featured_members",
        value: { mode, member_ids: mode === "custom" ? memberIds : [] },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (error) throw new Error(error.message);

  revalidatePath("/");
  return { ok: true };
}
