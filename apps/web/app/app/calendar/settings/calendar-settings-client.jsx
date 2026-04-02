"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateBookingSettings } from "../actions";

function GoogleCalendarIcon() {
  return (
    <svg viewBox="0 0 48 48" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="36" height="36" rx="4" fill="white" stroke="#E0E0E0" strokeWidth="1"/>
      <rect x="6" y="6" width="36" height="10" rx="4" fill="white"/>
      <rect x="6" y="12" width="36" height="4" fill="white"/>
      <path d="M6 16h36v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z" fill="white"/>
      <text x="24" y="35" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1A73E8" fontFamily="Arial,sans-serif">31</text>
      <rect x="15" y="4" width="4" height="8" rx="2" fill="#1A73E8"/>
      <rect x="29" y="4" width="4" height="8" rx="2" fill="#1A73E8"/>
      <path d="M6 20h36" stroke="#E0E0E0" strokeWidth="1"/>
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg viewBox="0 0 48 48" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="28" height="32" rx="3" fill="#0078D4"/>
      <rect x="18" y="12" width="28" height="28" rx="3" fill="white" stroke="#E0E0E0" strokeWidth="0.5"/>
      <rect x="18" y="12" width="28" height="7" rx="3" fill="#0078D4"/>
      <rect x="18" y="16" width="28" height="3" fill="#0078D4"/>
      <line x1="25" y1="25" x2="39" y2="25" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="29" x2="39" y2="29" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="33" x2="34" y2="33" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="11" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">OL</text>
    </svg>
  );
}

function ZohoCalendarIcon() {
  return (
    <svg viewBox="0 0 48 48" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="36" rx="4" fill="white" stroke="#E0E0E0" strokeWidth="1"/>
      <rect x="4" y="8" width="40" height="12" rx="4" fill="#E42527"/>
      <rect x="4" y="16" width="40" height="4" fill="#E42527"/>
      <rect x="13" y="4" width="4" height="9" rx="2" fill="#E42527"/>
      <rect x="31" y="4" width="4" height="9" rx="2" fill="#E42527"/>
      <path d="M4 20h40" stroke="#E0E0E0" strokeWidth="1"/>
      <text x="24" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#E42527" fontFamily="Arial,sans-serif">Z</text>
    </svg>
  );
}

function ICalIcon() {
  return (
    <svg viewBox="0 0 48 48" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="36" rx="4" fill="white" stroke="#6B7280" strokeWidth="1.5"/>
      <rect x="4" y="8" width="40" height="12" rx="4" fill="#6B7280"/>
      <rect x="4" y="16" width="40" height="4" fill="#6B7280"/>
      <rect x="13" y="4" width="4" height="9" rx="2" fill="#6B7280"/>
      <rect x="31" y="4" width="4" height="9" rx="2" fill="#6B7280"/>
      <path d="M4 20h40" stroke="#D1D5DB" strokeWidth="1"/>
      <text x="24" y="36" textAnchor="middle" fontSize="12" fontWeight="700" fill="#6B7280" fontFamily="Arial,sans-serif">iCal</text>
    </svg>
  );
}

const PROVIDER_ICONS = {
  google: <GoogleCalendarIcon />,
  microsoft: <OutlookIcon />,
  zoho: <ZohoCalendarIcon />,
  apple: "🍎",
  generic_ical: <ICalIcon />,
};

const PROVIDER_NAMES = {
  google: "Google Calendar",
  microsoft: "Outlook Calendar",
  zoho: "Zoho Calendar",
  apple: "Apple Calendar",
  generic_ical: "iCal Feed",
};

const PROVIDER_COLORS = {
  google: "#4285F4",
  microsoft: "#0078D4",
  zoho: "#E42527",
  apple: "#FF9500",
  generic_ical: "#6B7280",
};

// Connect button component for OAuth providers
function ConnectButton({ provider, onClick, disabled, loading }) {
  return (
    <button
      type="button"
      className="connect-button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{ "--provider-color": PROVIDER_COLORS[provider] }}
    >
      <span className="connect-icon">{PROVIDER_ICONS[provider]}</span>
      <span className="connect-text">
        {loading ? "Connecting..." : `Connect ${PROVIDER_NAMES[provider]}`}
      </span>
    </button>
  );
}

// iCal feed connection form
function ICalConnectForm({ onConnect, disabled }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onConnect("generic_ical", { icalUrl: url, calendarName: name || "iCal Feed" });
      setUrl("");
      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="ical-form" onSubmit={handleSubmit}>
      <div className="ical-form-row">
        <input
          type="url"
          placeholder="https://example.com/calendar.ics"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={disabled || isLoading}
        />
        <input
          type="text"
          placeholder="Calendar name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled || isLoading}
        />
        <button type="submit" disabled={disabled || isLoading || !url}>
          {isLoading ? "Adding..." : "Add"}
        </button>
      </div>
      {error && <span className="ical-error">{error}</span>}
    </form>
  );
}

// Connected calendar item with sync controls
function ConnectedCalendarItem({ connection, onSync, onDisconnect, onToggleSync }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync(connection.id);
    setIsSyncing(false);
  };

  const lastSynced = connection.last_synced_at
    ? new Date(connection.last_synced_at).toLocaleString()
    : "Never";

  const hasError = connection.last_sync_error;

  return (
    <div className={`connected-calendar-item ${hasError ? "has-error" : ""}`}>
      <div className="calendar-item-main">
        <div className="calendar-provider-icon" style={{ background: PROVIDER_COLORS[connection.provider] + "15" }}>
          {PROVIDER_ICONS[connection.provider] || "📅"}
        </div>
        <div className="calendar-provider-info">
          <strong>{connection.calendar_name || PROVIDER_NAMES[connection.provider]}</strong>
          <span>{connection.provider_account_email || "iCal Feed"}</span>
          <span className="sync-meta">
            Last synced: {lastSynced}
            {connection.event_count > 0 && ` • ${connection.event_count} events`}
          </span>
          {hasError && (
            <span className="sync-error">Sync error: {connection.last_sync_error}</span>
          )}
        </div>
        <div className="calendar-sync-status">
          <span className={`sync-indicator ${connection.sync_enabled && !hasError ? "active" : hasError ? "error" : "paused"}`} />
          <span>{hasError ? "Error" : connection.sync_enabled ? "Active" : "Paused"}</span>
        </div>
      </div>
      
      <div className="calendar-item-actions">
        <button
          type="button"
          className="action-btn sync-btn"
          onClick={handleSync}
          disabled={isSyncing || !connection.sync_enabled}
          title="Sync now"
        >
          {isSyncing ? "⟳" : "↻"}
        </button>
        <button
          type="button"
          className={`action-btn toggle-btn ${connection.sync_enabled ? "active" : ""}`}
          onClick={() => onToggleSync(connection.id, !connection.sync_enabled)}
          title={connection.sync_enabled ? "Pause sync" : "Resume sync"}
        >
          {connection.sync_enabled ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          className="action-btn disconnect-btn"
          onClick={() => onDisconnect(connection.id)}
          title="Disconnect"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function BookingSettingsForm({ initialSettings, memberId }) {
  const router = useRouter();
  const [settings, setSettings] = useState({
    public_booking_enabled: initialSettings?.public_booking_enabled || false,
    default_meeting_duration: initialSettings?.default_meeting_duration || 30,
    minimum_notice_hours: initialSettings?.minimum_notice_hours || 24,
    maximum_booking_days_ahead: initialSettings?.maximum_booking_days_ahead || 30,
    buffer_minutes_between_meetings: initialSettings?.buffer_minutes_between_meetings || 10,
    timezone: initialSettings?.timezone || "UTC",
    confirmation_message: initialSettings?.confirmation_message || "",
    cancellation_policy: initialSettings?.cancellation_policy || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    const result = await updateBookingSettings(memberId, settings);

    setIsSaving(false);
    if (result.success) {
      setSaveMessage("Settings saved successfully!");
      router.refresh();
    } else {
      setSaveMessage(`Error: ${result.error}`);
    }
  };

  const publicBookingUrl = initialSettings?.public_booking_url_slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${initialSettings.public_booking_url_slug}`
    : null;

  const handleCopyUrl = () => {
    if (publicBookingUrl) {
      navigator.clipboard.writeText(publicBookingUrl);
    }
  };

  return (
    <form className="booking-settings-form" onSubmit={handleSubmit}>
      <div className="form-group full-width">
        <div className="toggle-switch">
          <input
            type="checkbox"
            id="public_booking_enabled"
            className="toggle-input"
            checked={settings.public_booking_enabled}
            onChange={(e) => handleChange("public_booking_enabled", e.target.checked)}
          />
          <label htmlFor="public_booking_enabled" className="toggle-label">
            Enable public booking page
          </label>
        </div>
        <span className="form-hint">
          Allow anyone to book time with you through a public URL
        </span>
      </div>

      {settings.public_booking_enabled && publicBookingUrl && (
        <div className="form-group full-width">
          <label>Your public booking URL</label>
          <div className="public-url-display">
            <code>{publicBookingUrl}</code>
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopyUrl}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="default_meeting_duration">Default meeting duration</label>
          <select
            id="default_meeting_duration"
            value={settings.default_meeting_duration}
            onChange={(e) => handleChange("default_meeting_duration", parseInt(e.target.value))}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="minimum_notice_hours">Minimum notice required</label>
          <select
            id="minimum_notice_hours"
            value={settings.minimum_notice_hours}
            onChange={(e) => handleChange("minimum_notice_hours", parseInt(e.target.value))}
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={4}>4 hours</option>
            <option value={12}>12 hours</option>
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="maximum_booking_days_ahead">Maximum days ahead</label>
          <select
            id="maximum_booking_days_ahead"
            value={settings.maximum_booking_days_ahead}
            onChange={(e) => handleChange("maximum_booking_days_ahead", parseInt(e.target.value))}
          >
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
            <option value={60}>2 months</option>
            <option value={90}>3 months</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="buffer_minutes_between_meetings">Buffer between meetings</label>
          <select
            id="buffer_minutes_between_meetings"
            value={settings.buffer_minutes_between_meetings}
            onChange={(e) => handleChange("buffer_minutes_between_meetings", parseInt(e.target.value))}
          >
            <option value={0}>No buffer</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="timezone">Timezone</label>
        <select
          id="timezone"
          value={settings.timezone}
          onChange={(e) => handleChange("timezone", e.target.value)}
        >
          <option value="UTC">UTC</option>
          <option value="Africa/Lagos">West Africa (WAT)</option>
          <option value="Africa/Johannesburg">South Africa (SAST)</option>
          <option value="Africa/Nairobi">East Africa (EAT)</option>
          <option value="Europe/London">London (GMT/BST)</option>
          <option value="Europe/Paris">Paris (CET/CEST)</option>
          <option value="America/New_York">New York (ET)</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label htmlFor="confirmation_message">Confirmation message</label>
        <textarea
          id="confirmation_message"
          value={settings.confirmation_message}
          onChange={(e) => handleChange("confirmation_message", e.target.value)}
          placeholder="Thank you for booking! Looking forward to our meeting."
          rows={3}
        />
        <span className="form-hint">
          This message will be shown to people after they book a meeting
        </span>
      </div>

      <div className="form-group full-width">
        <label htmlFor="cancellation_policy">Cancellation policy</label>
        <textarea
          id="cancellation_policy"
          value={settings.cancellation_policy}
          onChange={(e) => handleChange("cancellation_policy", e.target.value)}
          placeholder="Please cancel or reschedule at least 24 hours in advance."
          rows={2}
        />
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes("Error") ? "error" : "success"}`}>
          {saveMessage}
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

export function CalendarSettingsClient({ connections: initialConnections, settings, memberId }) {
  const [connections, setConnections] = useState(initialConnections || []);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);
  const [message, setMessage] = useState("");

  // Initiate OAuth connection
  const handleConnect = async (provider, options = {}) => {
    setIsConnecting(true);
    setActiveProvider(provider);
    setMessage("");

    try {
      const response = await fetch("/api/calendar/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          memberId,
          ...options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate connection");
      }

      // For OAuth providers, redirect to auth URL
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }

      // For iCal feeds, update connections list
      if (data.success && data.connection) {
        setConnections((prev) => [...prev, data.connection]);
        setMessage(`Successfully imported ${data.eventsImported} events`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsConnecting(false);
      setActiveProvider(null);
    }
  };

  // Sync a connection
  const handleSync = async (connectionId) => {
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      // Refresh connections to show updated sync status
      const statusResponse = await fetch(`/api/calendar/sync?memberId=${memberId}`);
      const statusData = await statusResponse.json();
      
      if (statusData.connections) {
        setConnections(statusData.connections);
      }

      if (data.success) {
        setMessage(`Sync completed: ${data.stats.eventsCreated} new, ${data.stats.eventsUpdated} updated`);
      } else {
        setMessage(`Sync completed with errors: ${data.error?.message || "Unknown error"}`);
      }
    } catch (error) {
      setMessage(`Sync error: ${error.message}`);
    }
  };

  // Toggle sync for a connection
  const handleToggleSync = async (connectionId, enabled) => {
    try {
      // Update local state optimistically
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, sync_enabled: enabled } : c))
      );

      // Call the server action
      const { toggleCalendarSync } = await import("../actions");
      await toggleCalendarSync(connectionId, enabled);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      // Revert on error
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, sync_enabled: !enabled } : c))
      );
    }
  };

  // Disconnect a calendar
  const handleDisconnect = async (connectionId) => {
    if (!confirm("Are you sure you want to disconnect this calendar? All synced events will be removed.")) {
      return;
    }

    try {
      const response = await fetch(`/api/calendar/auth?connectionId=${connectionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      setMessage("Calendar disconnected successfully");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="calendar-settings-client">
      <section className="settings-section">
        <div className="settings-section-header">
          <h2>External Calendar Sync</h2>
        </div>
        <div className="settings-section-body">
          <p className="settings-section-description">
            Connect your personal calendars to see all your events in one place. 
            PATNA supports Google Calendar, Outlook, and iCal feeds.
          </p>

          {/* Connect buttons */}
          <div className="connect-buttons-grid">
            <ConnectButton
              provider="google"
              onClick={() => handleConnect("google")}
              disabled={isConnecting}
              loading={activeProvider === "google"}
            />
            <ConnectButton
              provider="microsoft"
              onClick={() => handleConnect("microsoft")}
              disabled={isConnecting}
              loading={activeProvider === "microsoft"}
            />
            <ConnectButton
              provider="zoho"
              onClick={() => handleConnect("zoho")}
              disabled={isConnecting}
              loading={activeProvider === "zoho"}
            />
          </div>

          {/* iCal feed input */}
          <div className="ical-section">
            <h4>Add iCal Feed</h4>
            <ICalConnectForm
              onConnect={handleConnect}
              disabled={isConnecting}
            />
          </div>

          {message && (
            <div className={`sync-message ${message.includes("Error") ? "error" : "success"}`}>
              {message}
            </div>
          )}

          {/* Connected calendars list */}
          {connections.length > 0 ? (
            <div className="connected-calendars-section">
              <h4>Connected Calendars</h4>
              <div className="connected-calendars-list">
                {connections.map((connection) => (
                  <ConnectedCalendarItem
                    key={connection.id}
                    connection={connection}
                    onSync={handleSync}
                    onDisconnect={handleDisconnect}
                    onToggleSync={handleToggleSync}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No personal calendars connected yet.</p>
              <p className="empty-hint">
                Connect a calendar above to import your events
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-header">
          <h2>Booking Preferences</h2>
        </div>
        <div className="settings-section-body">
          <p className="settings-section-description">
            Configure how others can book time with you
          </p>
          <BookingSettingsForm initialSettings={settings} memberId={memberId} />
        </div>
      </section>

      <style jsx global>{`
        .calendar-settings-content {
          max-width: 900px;
        }

        .settings-section {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .settings-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }

        .settings-section-header h2 {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--ink);
          margin: 0;
        }

        .settings-section-body {
          padding: 1.5rem;
        }

        .settings-section-description {
          color: var(--ink-muted);
          font-size: var(--text-sm);
          margin-bottom: 1.5rem;
        }

        .connect-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .connect-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--white);
          color: var(--ink);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .connect-button:hover:not(:disabled) {
          border-color: var(--provider-color, var(--border-strong));
          background: linear-gradient(135deg, var(--provider-color, var(--surface)) 0%, transparent 100%);
          background-opacity: 0.05;
          transform: translateY(-1px);
        }

        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .connect-icon {
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .ical-section {
          padding: 1rem;
          background: var(--surface);
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }

        .ical-section h4 {
          margin: 0 0 0.75rem 0;
          font-size: var(--text-sm);
          color: var(--ink);
        }

        .ical-form-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .ical-form-row input {
          flex: 1;
          min-width: 200px;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--white);
          color: var(--ink);
          font-size: var(--text-sm);
        }

        .ical-form-row input:focus {
          outline: none;
          border-color: var(--blue-bright);
        }

        .ical-form-row button {
          padding: 0.625rem 1rem;
          border: none;
          border-radius: var(--radius-md);
          background: var(--ink);
          color: var(--white);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: opacity 160ms ease;
        }

        .ical-form-row button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .ical-form-row button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ical-error {
          display: block;
          margin-top: 0.5rem;
          font-size: var(--text-xs);
          color: #dc2626;
        }

        .sync-message {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          margin-bottom: 1rem;
        }

        .sync-message.success {
          background: #d1fae5;
          color: #065f46;
        }

        .sync-message.error {
          background: #fee2e2;
          color: #991b1b;
        }

        .connected-calendars-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .connected-calendars-section h4 {
          margin: 0 0 1rem 0;
          font-size: var(--text-sm);
          color: var(--ink);
        }

        .connected-calendars-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .connected-calendar-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
        }

        .connected-calendar-item.has-error {
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .calendar-item-main {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .calendar-provider-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          background: var(--white);
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .calendar-provider-info {
          flex: 1;
          min-width: 0;
        }

        .calendar-provider-info strong {
          display: block;
          font-size: var(--text-sm);
          color: var(--ink);
          margin-bottom: 0.25rem;
        }

        .calendar-provider-info span {
          display: block;
          font-size: var(--text-xs);
          color: var(--ink-soft);
        }

        .calendar-provider-info .sync-meta {
          margin-top: 0.25rem;
          color: var(--ink-muted);
        }

        .calendar-provider-info .sync-error {
          margin-top: 0.25rem;
          color: #dc2626;
        }

        .calendar-sync-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--text-xs);
          flex-shrink: 0;
        }

        .sync-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .sync-indicator.active {
          background: #10b981;
        }

        .sync-indicator.paused {
          background: #f59e0b;
        }

        .sync-indicator.error {
          background: #dc2626;
        }

        .calendar-item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--white);
          color: var(--ink-muted);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .action-btn:hover:not(:disabled) {
          background: var(--surface-strong);
          color: var(--ink);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.toggle-btn.active {
          background: #d1fae5;
          border-color: #10b981;
          color: #065f46;
        }

        .action-btn.disconnect-btn:hover {
          background: #fee2e2;
          border-color: #dc2626;
          color: #991b1b;
        }

        .booking-settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--ink);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--white);
          color: var(--ink);
          font-size: var(--text-body);
          transition: border-color 160ms ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--blue-bright);
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .form-hint {
          font-size: var(--text-xs);
          color: var(--ink-soft);
        }

        .toggle-switch {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .toggle-input {
          position: relative;
          width: 48px;
          height: 24px;
          appearance: none;
          background: var(--border-strong);
          border-radius: 12px;
          cursor: pointer;
          transition: background 160ms ease;
        }

        .toggle-input:checked {
          background: var(--blue-bright);
        }

        .toggle-input::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: var(--white);
          border-radius: 50%;
          transition: transform 160ms ease;
        }

        .toggle-input:checked::after {
          transform: translateX(24px);
        }

        .toggle-label {
          font-size: var(--text-sm);
          color: var(--ink);
        }

        .public-url-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .public-url-display code {
          flex: 1;
          font-family: monospace;
          font-size: var(--text-sm);
          color: var(--blue-dark);
        }

        .copy-btn {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--white);
          color: var(--ink-muted);
          font-size: var(--text-xs);
          cursor: pointer;
          transition: all 160ms ease;
        }

        .copy-btn:hover {
          background: var(--surface-strong);
          color: var(--ink);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .primary-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-md);
          background: var(--ink);
          color: var(--white);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: opacity 160ms ease;
        }

        .primary-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-message {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
        }

        .save-message.success {
          background: #d1fae5;
          color: #065f46;
        }

        .save-message.error {
          background: #fee2e2;
          color: #991b1b;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--ink-soft);
        }

        .empty-state p {
          margin: 0 0 0.5rem 0;
        }

        .empty-state .empty-hint {
          font-size: var(--text-sm);
          color: var(--ink-muted);
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .connect-buttons-grid {
            grid-template-columns: 1fr;
          }

          .ical-form-row {
            flex-direction: column;
          }

          .ical-form-row input,
          .ical-form-row button {
            width: 100%;
          }

          .connected-calendar-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .calendar-item-main {
            width: 100%;
          }

          .calendar-item-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
