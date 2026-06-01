"use client";

import { useRef, useTransition } from "react";
import { SettingsCard } from "./settings-card";

const DIGEST_FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
  { value: "never", label: "Off" },
];

export function NotificationPreferencesCard({
  preferences,
  updatePreferenceAction,
  updateDigestFrequencyAction,
}) {
  return (
    <SettingsCard
      description="Choose how and when PATNA notifies you."
      title="Notification preferences"
    >
      <div className="notif-pref-list">
        <ToggleRow
          defaultChecked={preferences.email_mentions_enabled}
          description="Receive an email when someone @mentions you in a thread."
          label="Email me when mentioned"
          prefKey="email_mentions_enabled"
          updateAction={updatePreferenceAction}
        />
        <ToggleRow
          defaultChecked={preferences.email_broadcasts_enabled}
          description="Important platform-wide announcements from the PATNA team."
          label="Platform announcements"
          prefKey="email_broadcasts_enabled"
          updateAction={updatePreferenceAction}
        />
        <ToggleRow
          defaultChecked={preferences.inapp_mentions_enabled}
          description="Show a badge in the notification bell when you are mentioned."
          label="In-app mention alerts"
          prefKey="inapp_mentions_enabled"
          updateAction={updatePreferenceAction}
        />
        <DigestRow
          defaultEnabled={preferences.email_digest_enabled}
          defaultFrequency={preferences.email_digest_frequency}
          updateFrequencyAction={updateDigestFrequencyAction}
          updatePreferenceAction={updatePreferenceAction}
        />
      </div>
    </SettingsCard>
  );
}

function ToggleRow({ prefKey, label, description, defaultChecked, updateAction }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef(null);

  const handleChange = () => {
    startTransition(async () => {
      if (!formRef.current) return;
      const fd = new FormData(formRef.current);
      // Checkbox: if unchecked it won't be in FormData, so add explicit false
      if (!fd.get("value")) fd.set("value", "false");
      await updateAction(fd);
    });
  };

  return (
    <div className="notif-pref-row">
      <div>
        <p className="notif-pref-label">{label}</p>
        <p className="notif-pref-hint">{description}</p>
      </div>
      <form ref={formRef} aria-label={`Toggle ${label}`}>
        <input name="key" type="hidden" value={prefKey} />
        <label className="notif-toggle">
          <input
            defaultChecked={defaultChecked}
            disabled={pending}
            name="value"
            onChange={handleChange}
            type="checkbox"
            value="on"
          />
          <span className="notif-toggle-track" />
          <span className="sr-only">{label}</span>
        </label>
      </form>
    </div>
  );
}

function DigestRow({ defaultEnabled, defaultFrequency, updatePreferenceAction, updateFrequencyAction }) {
  const [pendingToggle, startToggle] = useTransition();
  const [pendingFreq, startFreq] = useTransition();
  const toggleRef = useRef(null);

  const handleToggle = () => {
    startToggle(async () => {
      if (!toggleRef.current) return;
      const fd = new FormData(toggleRef.current);
      if (!fd.get("value")) fd.set("value", "false");
      await updatePreferenceAction(fd);
    });
  };

  const handleFrequencyChange = (e) => {
    const value = e.target.value;
    startFreq(async () => {
      const fd = new FormData();
      fd.set("email_digest_frequency", value);
      await updateFrequencyAction(fd);
    });
  };

  return (
    <div className="notif-pref-row" style={{ flexWrap: "wrap", gap: "12px" }}>
      <div>
        <p className="notif-pref-label">Activity digest</p>
        <p className="notif-pref-hint">Email summary of activity in your spaces.</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <form ref={toggleRef} aria-label="Toggle activity digest">
          <input name="key" type="hidden" value="email_digest_enabled" />
          <label className="notif-toggle">
            <input
              defaultChecked={defaultEnabled}
              disabled={pendingToggle}
              name="value"
              onChange={handleToggle}
              type="checkbox"
              value="on"
            />
            <span className="notif-toggle-track" />
            <span className="sr-only">Activity digest</span>
          </label>
        </form>
        <select
          aria-label="Digest frequency"
          defaultValue={defaultFrequency}
          disabled={pendingFreq || !defaultEnabled}
          onChange={handleFrequencyChange}
          style={{
            fontSize: "var(--text-sm, 0.875rem)",
            padding: "5px 10px",
            border: "1px solid var(--border, #e2e6ef)",
            borderRadius: "var(--radius-control, 8px)",
            background: "var(--white, #fff)",
            color: "var(--ink, #1a1a2e)",
            cursor: "pointer",
          }}
        >
          {DIGEST_FREQUENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
