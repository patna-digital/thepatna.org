"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, AtSign, Megaphone, MessageSquare } from "lucide-react";

const TYPE_ICONS = {
  mention: AtSign,
  admin_broadcast: Megaphone,
  space_activity: MessageSquare,
};

export function NotificationPanel({
  notifications,
  loading,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) {
  const panelRef = useRef(null);
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay so the opening click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Focus first item on open
  useEffect(() => {
    if (!loading && panelRef.current) {
      const first = panelRef.current.querySelector("button, a");
      first?.focus();
    }
  }, [loading]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleItemClick = async (notification) => {
    if (!notification.is_read) {
      await onMarkRead(notification.id);
    }
    onClose();
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div
      ref={panelRef}
      aria-label="Notifications"
      className="notification-panel"
      role="dialog"
    >
      {/* Header */}
      <div className="notification-panel-header">
        <h2 className="notification-panel-title">Notifications</h2>
        {unreadCount > 0 && (
          <button
            className="notification-panel-mark-all"
            onClick={onMarkAllRead}
            type="button"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="notification-panel-body" role="list">
        {loading ? (
          <NotificationSkeletons />
        ) : notifications.length === 0 ? (
          <NotificationEmpty />
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={() => handleItemClick(n)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {!loading && notifications.length > 0 && (
        <div className="notification-panel-footer">
          <button className="notification-panel-close-btn" onClick={onClose} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onClick }) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const isUnread = !notification.is_read;

  return (
    <div
      className={`notification-item${isUnread ? " notification-item--unread" : ""}`}
      role="listitem"
    >
      <button
        aria-label={notification.title}
        className="notification-item-button"
        onClick={onClick}
        type="button"
      >
        <span className={`notification-item-icon notification-item-icon--${notification.type}`}>
          <Icon aria-hidden="true" size={14} />
        </span>
        <span className="notification-item-content">
          <span className="notification-item-title">{notification.title}</span>
          {notification.body && (
            <span className="notification-item-body">{notification.body}</span>
          )}
          <span className="notification-item-time">
            {formatRelativeTime(notification.created_at)}
          </span>
        </span>
        {isUnread && <span aria-hidden="true" className="notification-item-dot" />}
      </button>
    </div>
  );
}

function NotificationEmpty() {
  return (
    <div className="notification-empty">
      <Bell aria-hidden="true" size={28} />
      <p>You&apos;re all caught up</p>
    </div>
  );
}

function NotificationSkeletons() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div className="notification-item-skeleton" key={i}>
          <span className="skeleton-block" style={{ height: 28, width: 28, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <span className="skeleton-block" style={{ height: 12, width: "70%", marginBottom: 6 }} />
            <span className="skeleton-block" style={{ height: 10, width: "40%" }} />
          </span>
        </div>
      ))}
    </>
  );
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMs = new Date(iso) - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return "just now";
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  return rtf.format(diffDays, "day");
}
