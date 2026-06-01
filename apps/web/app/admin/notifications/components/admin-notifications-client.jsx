"use client";

import { useState } from "react";
import { BroadcastComposer } from "./broadcast-composer";
import { BroadcastHistory } from "./broadcast-history";

export function AdminNotificationsClient({ broadcasts, cohorts, notice, sendAction }) {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="member-dashboard-stack">
      {/* Notice */}
      {notice === "sent" && (
        <div className="form-success-panel">
          Broadcast sent successfully. Recipients have been notified.
        </div>
      )}
      {(notice === "error" || notice === "missing-fields" || notice === "invalid-target") && (
        <div className="form-error-banner">
          {notice === "missing-fields"
            ? "Subject and message are required."
            : "Failed to send broadcast. Please try again."}
        </div>
      )}

      {/* Header */}
      <div className="broadcasts-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>Broadcast history</h2>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--ink-muted)" }}>
            {broadcasts.length} broadcast{broadcasts.length !== 1 ? "s" : ""} sent
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setComposerOpen(true)}
          type="button"
        >
          + New broadcast
        </button>
      </div>

      {/* Stats row */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{broadcasts.length}</span>
          <span className="admin-stat-label">Total broadcasts</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">
            {broadcasts.reduce((sum, b) => sum + (b.recipient_count ?? 0), 0).toLocaleString()}
          </span>
          <span className="admin-stat-label">Total deliveries</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">
            {broadcasts.filter((b) => b.delivery_channels?.includes("email")).length}
          </span>
          <span className="admin-stat-label">Included email</span>
        </div>
      </div>

      {/* Broadcast list */}
      <BroadcastHistory broadcasts={broadcasts} />

      {/* Composer modal */}
      {composerOpen && (
        <BroadcastComposer
          cohorts={cohorts}
          onClose={() => setComposerOpen(false)}
          sendAction={sendAction}
        />
      )}
    </div>
  );
}
