"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBookingSettings } from "../actions";

const PROVIDER_ICONS = {
  google: "🔍",
  microsoft: "📧",
  zoho: "📊",
  apple: "🍎",
  generic_ical: "📅",
};

const PROVIDER_NAMES = {
  google: "Google Calendar",
  microsoft: "Outlook Calendar",
  zoho: "Zoho Calendar",
  apple: "Apple Calendar",
  generic_ical: "iCal Feed",
};

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
  const connections = initialConnections || [];

  return (
    <div className="calendar-settings-client">
      <section className="settings-section">
        <div className="settings-section-header">
          <h2>External Calendar Sync</h2>
        </div>
        <div className="settings-section-body">
          <div className="calendar-settings-coming-soon">
            <div className="calendar-settings-coming-soon-head">
              <span className="calendar-settings-coming-soon-badge">Coming soon</span>
              <strong>Google, Outlook, Apple, and iCal sync are not live yet.</strong>
            </div>
            <p>
              For now, members should RSVP directly from the PATNA calendar. Once personal
              calendar sync ships, your connected calendars will appear here.
            </p>
          </div>

          {connections.length > 0 ? (
            <>
              <p className="settings-section-description">
                Existing connected calendars are shown below in read-only mode while sync is being finalised.
              </p>
              <div className="connected-calendars-list">
                {connections.map((connection) => (
                  <div className="connected-calendar-item" key={connection.id}>
                    <div className="calendar-provider-icon">
                      {PROVIDER_ICONS[connection.provider] || "📅"}
                    </div>
                    <div className="calendar-provider-info">
                      <strong>{connection.calendar_name || PROVIDER_NAMES[connection.provider]}</strong>
                      <span>{connection.provider_account_email}</span>
                    </div>
                    <div className="calendar-sync-status">
                      <span className={`sync-indicator ${connection.sync_enabled ? "active" : "pending"}`} />
                      <span>{connection.sync_enabled ? "Connected" : "Paused"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="connected-calendars-list">
              <div className="empty-state">
                <p>No personal calendars connected yet.</p>
              </div>
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

        .calendar-settings-coming-soon {
          display: grid;
          gap: 0.75rem;
          padding: 1.1rem 1.15rem;
          border: 1px solid rgba(245, 158, 11, 0.22);
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.09), rgba(15, 23, 42, 0.03));
          margin-bottom: 1rem;
        }

        .calendar-settings-coming-soon-head {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          flex-wrap: wrap;
        }

        .calendar-settings-coming-soon-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          background: rgba(245, 158, 11, 0.16);
          color: #92400e;
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .calendar-settings-coming-soon p {
          margin: 0;
          color: var(--ink-soft);
        }

        .connected-calendars-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .connected-calendar-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
        }

        .calendar-provider-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          background: var(--white);
          font-size: 1.25rem;
        }

        .calendar-provider-info {
          flex: 1;
        }

        .calendar-provider-info strong {
          display: block;
          font-size: var(--text-md);
          color: var(--ink);
        }

        .calendar-provider-info span {
          font-size: var(--text-sm);
          color: var(--ink-soft);
        }

        .calendar-sync-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--text-sm);
        }

        .sync-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .sync-indicator.active {
          background: #10b981;
        }

        .sync-indicator.pending {
          background: #f59e0b;
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
          margin: 0 0 1rem 0;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .connected-calendar-item,
          .calendar-settings-coming-soon-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
