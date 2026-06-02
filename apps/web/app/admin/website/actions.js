"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

export async function saveFeaturedPartnersAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  // Collect all checked partner IDs from the multi-value form field
  const checkedIds = formData.getAll("featured_partner_ids");

  // Fetch all active partner IDs so we can clear featured on unchecked ones
  const { data: allPartners, error: fetchError } = await adminClient
    .from("partners")
    .select("id")
    .eq("is_active", true);

  if (fetchError) {
    console.error("[saveFeaturedPartnersAction] fetch error:", fetchError);
    return { error: "Failed to load partners." };
  }

  const allIds = (allPartners || []).map((p) => p.id);
  const checkedSet = new Set(checkedIds);

  // Bulk update in two passes to keep queries simple
  const toFeature   = allIds.filter((id) =>  checkedSet.has(id));
  const toUnfeature = allIds.filter((id) => !checkedSet.has(id));

  const updates = [];
  if (toFeature.length > 0) {
    updates.push(
      adminClient.from("partners").update({ is_featured: true }).in("id", toFeature)
    );
  }
  if (toUnfeature.length > 0) {
    updates.push(
      adminClient.from("partners").update({ is_featured: false }).in("id", toUnfeature)
    );
  }

  const results = await Promise.all(updates);
  const saveError = results.find((r) => r.error);
  if (saveError) {
    console.error("[saveFeaturedPartnersAction] update error:", saveError.error);
    return { error: "Failed to save featured partners." };
  }

  revalidatePath("/admin/website");
  revalidatePath("/admin/partners");
  revalidatePath("/");
}

export async function saveWipPagesAction(pages) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient
    .from("site_settings")
    .upsert({ key: "wip_pages", value: { pages } }, { onConflict: "key" });

  if (error) {
    console.error("[saveWipPagesAction] error:", error);
    return { error: "Failed to save WIP pages." };
  }

  revalidatePath("/admin/website");
  revalidatePath("/", "layout");
}
