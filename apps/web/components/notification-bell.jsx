"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { NotificationPanel } from "@/components/notification-panel";
import {
  getUnreadCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  fetchNotificationsAction,
} from "@/app/app/notifications/actions";

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell({ userId }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);
  const channelRef = useRef(null);
  const pollRef = useRef(null);

  // ── Initial unread count ────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    getUnreadCountAction().then((count) => setUnreadCount(count));
  }, [userId]);

  // ── Supabase Realtime + polling fallback ────────────────────
  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const refresh = async () => {
      if (!mounted) return;
      const count = await getUnreadCountAction();
      if (mounted) setUnreadCount(count);
    };

    // Realtime subscription
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          () => refresh(),
        )
        .subscribe();
      channelRef.current = channel;
    } catch {
      // Realtime unavailable — polling will cover it
    }

    // Polling fallback
    pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(pollRef.current);
      if (channelRef.current) {
        try {
          const supabase = createSupabaseBrowserClient();
          supabase.removeChannel(channelRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [userId]);

  // ── Panel interactions ──────────────────────────────────────
  const openPanel = useCallback(async () => {
    setPanelOpen(true);
    setLoading(true);
    try {
      const data = await fetchNotificationsAction(20);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  const handleMarkRead = useCallback(async (notificationId) => {
    await markNotificationReadAction(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  if (!userId) return null;

  return (
    <div className="notification-bell-wrapper">
      <button
        ref={buttonRef}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        className="notification-bell-button"
        onClick={panelOpen ? closePanel : openPanel}
        type="button"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="notification-bell-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <NotificationPanel
          loading={loading}
          notifications={notifications}
          onClose={closePanel}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
        />
      )}
    </div>
  );
}
