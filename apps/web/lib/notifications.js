import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { mentionEmailHtml } from "@/lib/email/templates/mention";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://patna.community";
const SETTINGS_LINK = `${SITE_URL}/app/settings`;

// ─────────────────────────────────────────────────────────────
// Mention detection (pure — no side effects)
// ─────────────────────────────────────────────────────────────

/**
 * Scans plain-text `body` for `@FirstName LastName` patterns and returns
 * matched member IDs. Only exact full-name matches are returned to avoid
 * false positives.
 *
 * @param {string} body
 * @param {Array<{id: string, first_name: string, surname: string}>} memberList
 * @returns {string[]} unique member IDs
 */
export function detectMentions(body, memberList) {
  if (!body || !memberList?.length) return [];

  const unique = new Set();
  for (const member of memberList) {
    if (!member.first_name || !member.surname) continue;
    const fullName = `${member.first_name} ${member.surname}`;
    // Case-insensitive match of @FirstName LastName (word boundary after surname)
    const pattern = new RegExp(`@${escapeRegex(fullName)}(?=\\s|$|[^a-zA-Z])`, "i");
    if (pattern.test(body)) {
      unique.add(member.id);
    }
  }
  return [...unique];
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────────────────────
// Notification creation (server-only)
// ─────────────────────────────────────────────────────────────

/**
 * Creates an in-app mention notification and optionally sends an email.
 * Must be called from a Server Action or API route (uses service-role client).
 */
export async function createMentionNotification({
  recipientId,
  senderId,
  senderName,
  spaceId,
  spaceSlug,
  spaceTitle,
  threadId,
  threadTitle,
  commentId,
  commentExcerpt,
}) {
  const adminClient = createSupabaseAdminClient();
  const link = `/app/spaces/${spaceSlug}/threads/${threadId}#replies`;

  // Fetch recipient preferences (to check email opt-in)
  const prefs = await getOrCreatePreferences(null, recipientId);

  // Insert in-app notification (only if enabled)
  if (prefs.inapp_mentions_enabled) {
    await adminClient.from("notifications").insert({
      recipient_id: recipientId,
      type: "mention",
      title: `${senderName} mentioned you in "${threadTitle}"`,
      body: commentExcerpt ? commentExcerpt.slice(0, 200) : null,
      link,
      metadata: {
        sender_id: senderId,
        space_id: spaceId,
        thread_id: threadId,
        comment_id: commentId ?? null,
      },
    });
  }

  // Send mention email if enabled
  if (prefs.email_mentions_enabled) {
    try {
      // Fetch recipient email
      const { data: profile } = await adminClient
        .from("profiles")
        .select("email, first_name")
        .eq("id", recipientId)
        .single();

      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          subject: `${senderName} mentioned you in "${threadTitle}"`,
          html: mentionEmailHtml({
            recipientName: profile.first_name || "there",
            senderName,
            spaceTitle,
            threadTitle,
            commentExcerpt: commentExcerpt?.slice(0, 300),
            link: `${SITE_URL}${link}`,
            unsubscribeLink: SETTINGS_LINK,
          }),
        });
      }
    } catch (err) {
      // Email failure is non-fatal — in-app notification was already saved
      console.error("[notifications] Failed to send mention email:", err);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Broadcast (called from admin server action)
// ─────────────────────────────────────────────────────────────

/**
 * Calls the Supabase RPC that bulk-inserts in-app notifications for a broadcast.
 * Returns the number of recipients notified.
 */
export async function createBroadcastNotifications({ broadcastId, title, body, link = "/app" }) {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("create_broadcast_notifications", {
    p_broadcast_id: broadcastId,
    p_title: title,
    p_body: body,
    p_link: link,
  });
  if (error) throw new Error(`Broadcast notification RPC failed: ${error.message}`);
  return data ?? 0;
}

// ─────────────────────────────────────────────────────────────
// Fetching notifications (for the bell)
// ─────────────────────────────────────────────────────────────

/**
 * Fetch recent notifications for the current user.
 * `supabase` = authenticated Supabase client (respects RLS).
 */
export async function fetchNotificationsForUser({ supabase, userId, limit = 20, onlyUnread = false }) {
  let query = supabase
    .from("notifications")
    .select("id, type, title, body, link, metadata, is_read, read_at, created_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (onlyUnread) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) throw new Error(`fetchNotificationsForUser: ${error.message}`);
  return data ?? [];
}

/**
 * Count unread notifications for a user. Lightweight — used for the badge.
 */
export async function countUnreadNotifications({ supabase, userId }) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);
  if (error) return 0;
  return count ?? 0;
}

// ─────────────────────────────────────────────────────────────
// Mark read
// ─────────────────────────────────────────────────────────────

export async function markNotificationRead({ supabase, notificationId, userId }) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", userId);
  if (error) throw new Error(`markNotificationRead: ${error.message}`);
}

export async function markAllNotificationsRead({ supabase, userId }) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("is_read", false);
  if (error) throw new Error(`markAllNotificationsRead: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────
// Preferences
// ─────────────────────────────────────────────────────────────

const DEFAULT_PREFS = {
  email_digest_enabled: true,
  email_digest_frequency: "weekly",
  email_mentions_enabled: true,
  email_broadcasts_enabled: true,
  inapp_mentions_enabled: true,
  digest_day_of_week: 1,
  digest_sent_at: null,
};

/**
 * Fetch or create notification preferences for a user.
 * Pass `supabase = null` to use the admin client (e.g. when checking from
 * createMentionNotification which runs server-side before the user context).
 */
export async function getOrCreatePreferences(supabase, userId) {
  const client = supabase ?? createSupabaseAdminClient();

  const { data: existing } = await client
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  // First visit — create with defaults
  const { data: created } = await client
    .from("notification_preferences")
    .upsert({ user_id: userId, ...DEFAULT_PREFS }, { onConflict: "user_id" })
    .select("*")
    .single();

  return created ?? { user_id: userId, ...DEFAULT_PREFS };
}

export async function updatePreferences({ supabase, userId, prefs }) {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`updatePreferences: ${error.message}`);
}
