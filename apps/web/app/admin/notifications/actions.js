"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createBroadcastNotifications } from "@/lib/notifications";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patna.community";

export async function sendBroadcastAction(formData) {
  const { user } = await requireAdminContext();

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const targetType = String(formData.get("target_type") || "all");
  const deliveryChannels = formData.getAll("delivery_channels");

  if (!subject || !body) {
    redirect("/admin/notifications?notice=missing-fields");
  }

  if (!["all", "cohort", "selected"].includes(targetType)) {
    redirect("/admin/notifications?notice=invalid-target");
  }

  const targetCohortIds = formData
    .getAll("cohort_ids")
    .filter((id) => id && id.length > 10);

  const targetUserIds = formData
    .getAll("user_ids")
    .filter((id) => id && id.length > 10);

  const channels = ["inapp", ...deliveryChannels.filter((c) => c === "email")];

  const adminClient = createSupabaseAdminClient();

  // 1. Insert broadcast record
  const { data: broadcast, error: insertErr } = await adminClient
    .from("admin_broadcasts")
    .insert({
      sender_id: user.id,
      subject,
      body,
      target_type: targetType,
      target_cohort_ids: targetCohortIds,
      target_user_ids: targetUserIds,
      delivery_channels: channels,
    })
    .select("id")
    .single();

  if (insertErr || !broadcast?.id) {
    console.error("sendBroadcastAction insert error:", insertErr);
    redirect("/admin/notifications?notice=error");
  }

  // 2. Create in-app notifications via RPC (bulk insert)
  try {
    await createBroadcastNotifications({
      broadcastId: broadcast.id,
      title: subject,
      body: body.slice(0, 300),
      link: `${SITE_URL}/app`,
    });
  } catch (err) {
    console.error("sendBroadcastAction RPC error:", err);
  }

  // 3. Trigger email delivery asynchronously (fire-and-forget)
  if (channels.includes("email")) {
    const cronSecret = process.env.CRON_SECRET || "";
    const emailUrl = `${SITE_URL}/api/notifications/broadcast`;
    fetch(emailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ broadcastId: broadcast.id }),
    }).catch((err) => console.error("Email dispatch fetch failed:", err));
  }

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?notice=sent");
}
