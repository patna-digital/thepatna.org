import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { digestEmailHtml } from "@/lib/email/templates/digest";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patna.community";
const SETTINGS_LINK = `${SITE_URL}/app/settings`;
const BATCH_SIZE = 50;
const IDEMPOTENCY_WINDOW_HOURS = 20;

function authError() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function verifyCronSecret(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Dev: skip check if not set
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request) {
  if (!verifyCronSecret(request)) return authError();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "daily" | "weekly"
  if (!["daily", "weekly"].includes(type)) {
    return NextResponse.json({ error: "type must be 'daily' or 'weekly'" }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() - IDEMPOTENCY_WINDOW_HOURS * 3600 * 1000).toISOString();
  const todayDow = now.getUTCDay(); // 0=Sun … 6=Sat

  // Fetch eligible users
  let query = adminClient
    .from("notification_preferences")
    .select("user_id, email_digest_frequency, digest_sent_at")
    .eq("email_digest_enabled", true)
    .eq("email_digest_frequency", type)
    .or(`digest_sent_at.is.null,digest_sent_at.lt.${cutoff}`);

  if (type === "weekly") {
    query = query.eq("digest_day_of_week", todayDow);
  }

  const { data: eligible, error: prefErr } = await query;
  if (prefErr) {
    console.error("[digest] Failed to fetch eligible users:", prefErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!eligible?.length) {
    return NextResponse.json({ sent: 0, skipped: 0, reason: "no eligible users" });
  }

  const sinceMs = type === "daily" ? 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;
  const since = new Date(now.getTime() - sinceMs).toISOString();

  let sent = 0;
  let skipped = 0;

  // Process in batches to avoid timeout
  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((pref) =>
        processSingleDigest({ adminClient, pref, since, type, now })
          .then((didSend) => { if (didSend) sent++; else skipped++; })
          .catch((err) => {
            console.error(`[digest] Failed for user ${pref.user_id}:`, err);
            skipped++;
          })
      )
    );
  }

  return NextResponse.json({ sent, skipped });
}

async function processSingleDigest({ adminClient, pref, since, type, now }) {
  const userId = pref.user_id;

  // Fetch user profile
  const { data: profile } = await adminClient
    .from("profiles")
    .select("email, first_name")
    .eq("id", userId)
    .single();

  if (!profile?.email) return false;

  // Fetch space memberships
  const { data: memberships } = await adminClient
    .from("space_memberships")
    .select("space_id, spaces!inner(name, slug)")
    .eq("user_id", userId);

  if (!memberships?.length) return false;

  const spaceIds = memberships.map((m) => m.space_id);
  const spaceMap = Object.fromEntries(
    memberships.map((m) => [m.space_id, m.spaces])
  );

  // Fetch new threads and comments in those spaces
  const [{ data: threads }, { data: comments }] = await Promise.all([
    adminClient
      .from("threads")
      .select("id, title, space_id, author_id, created_at, profiles!author_id(first_name, surname)")
      .in("space_id", spaceIds)
      .gte("created_at", since)
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    adminClient
      .from("comments")
      .select("id, thread_id, body, author_id, created_at, profiles!author_id(first_name, surname), threads!inner(title, space_id)")
      .in("threads.space_id", spaceIds)
      .gte("created_at", since)
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const activities = [
    ...(threads || []).map((t) => ({
      type: "thread",
      spaceName: spaceMap[t.space_id]?.name ?? "a space",
      spaceSlug: spaceMap[t.space_id]?.slug ?? "",
      title: t.title,
      authorName: [t.profiles?.first_name, t.profiles?.surname].filter(Boolean).join(" ") || "A member",
      createdAt: t.created_at,
      link: `${SITE_URL}/app/spaces/${spaceMap[t.space_id]?.slug}/threads/${t.id}`,
    })),
    ...(comments || []).map((c) => ({
      type: "comment",
      spaceName: spaceMap[c.threads?.space_id]?.name ?? "a space",
      spaceSlug: spaceMap[c.threads?.space_id]?.slug ?? "",
      title: `Reply in: ${c.threads?.title ?? "a thread"}`,
      authorName: [c.profiles?.first_name, c.profiles?.surname].filter(Boolean).join(" ") || "A member",
      createdAt: c.created_at,
      link: `${SITE_URL}/app/spaces/${spaceMap[c.threads?.space_id]?.slug}/threads/${c.thread_id}#replies`,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);

  // Skip if nothing to report
  if (!activities.length) return false;

  await sendEmail({
    to: profile.email,
    subject: `Your PATNA ${type} digest`,
    html: digestEmailHtml({
      recipientName: profile.first_name || "there",
      frequency: type,
      activities,
      settingsLink: SETTINGS_LINK,
    }),
  });

  // Update digest_sent_at
  await adminClient
    .from("notification_preferences")
    .update({ digest_sent_at: now.toISOString() })
    .eq("user_id", userId);

  return true;
}
