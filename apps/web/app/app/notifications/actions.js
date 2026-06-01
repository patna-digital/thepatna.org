"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  markNotificationRead,
  markAllNotificationsRead,
  fetchNotificationsForUser,
  countUnreadNotifications,
} from "@/lib/notifications";

export async function markNotificationReadAction(notificationId) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await markNotificationRead({ supabase, notificationId, userId: user.id });
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function markAllNotificationsReadAction() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await markAllNotificationsRead({ supabase, userId: user.id });
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchNotificationsAction(limit = 20) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    return await fetchNotificationsForUser({ supabase, userId: user.id, limit });
  } catch {
    return [];
  }
}

export async function getUnreadCountAction() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  try {
    return await countUnreadNotifications({ supabase, userId: user.id });
  } catch {
    return 0;
  }
}
