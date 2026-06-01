import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendBatch } from "@/lib/email/resend";
import { broadcastEmailHtml } from "@/lib/email/templates/broadcast";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patna.community";
const SETTINGS_LINK = `${SITE_URL}/app/settings`;
const BATCH_SIZE = 100;

function verifyCronSecret(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let broadcastId;
  try {
    const body = await request.json();
    broadcastId = body.broadcastId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!broadcastId) {
    return NextResponse.json({ error: "broadcastId required" }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();

  // Fetch broadcast details
  const { data: broadcast, error: bErr } = await adminClient
    .from("admin_broadcasts")
    .select("*, sender:sender_id(first_name, surname)")
    .eq("id", broadcastId)
    .single();

  if (bErr || !broadcast) {
    return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
  }

  // Verify email channel is requested
  if (!broadcast.delivery_channels?.includes("email")) {
    return NextResponse.json({ sent: 0, reason: "email not in delivery_channels" });
  }

  // Resolve recipients
  const { data: recipients } = await adminClient
    .from("admin_broadcast_recipients")
    .select("user_id, email")
    .eq("broadcast_id", broadcastId);

  if (!recipients?.length) {
    return NextResponse.json({ sent: 0, reason: "no recipients" });
  }

  // Filter to those with email_broadcasts_enabled (or no preference row = default true)
  const { data: optedOut } = await adminClient
    .from("notification_preferences")
    .select("user_id")
    .in("user_id", recipients.map((r) => r.user_id))
    .eq("email_broadcasts_enabled", false);

  const optedOutIds = new Set((optedOut || []).map((r) => r.user_id));
  const emailRecipients = recipients.filter(
    (r) => r.email && !optedOutIds.has(r.user_id)
  );

  if (!emailRecipients.length) {
    return NextResponse.json({ sent: 0, reason: "all opted out" });
  }

  const senderName = [broadcast.sender?.first_name, broadcast.sender?.surname]
    .filter(Boolean)
    .join(" ") || "PATNA Team";

  const html = broadcastEmailHtml({
    subject: broadcast.subject,
    body: broadcast.body,
    senderName,
    settingsLink: SETTINGS_LINK,
  });

  let totalSent = 0;

  // Chunk into batches of 100 (Resend batch limit)
  for (let i = 0; i < emailRecipients.length; i += BATCH_SIZE) {
    const chunk = emailRecipients.slice(i, i + BATCH_SIZE);
    try {
      await sendBatch(
        chunk.map((r) => ({
          to: r.email,
          subject: broadcast.subject,
          html,
        }))
      );
      totalSent += chunk.length;
    } catch (err) {
      console.error(`[broadcast] Batch ${i}–${i + BATCH_SIZE} failed:`, err);
      // Continue with next batch — partial delivery is better than none
    }
  }

  return NextResponse.json({ sent: totalSent });
}
