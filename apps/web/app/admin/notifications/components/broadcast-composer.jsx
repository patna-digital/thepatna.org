"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * BroadcastComposer — modal form for composing and sending admin broadcasts.
 *
 * Props:
 *   cohorts: Array<{id, name, memberCount}>  — available cohort targets
 *   sendAction: server action
 *   onClose: () => void
 */
export function BroadcastComposer({ cohorts, sendAction, onClose }) {
  const [targetType, setTargetType] = useState("all");
  const [selectedCohorts, setSelectedCohorts] = useState(new Set());
  const [emailChannel, setEmailChannel] = useState(true);
  const backdropRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const recipientPreview = getRecipientPreview({ targetType, selectedCohorts, cohorts });

  const toggleCohort = (id) => {
    setSelectedCohorts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div
      ref={backdropRef}
      aria-modal="true"
      className="broadcast-composer-backdrop"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      role="dialog"
    >
      <div className="broadcast-composer">
        <button
          aria-label="Close"
          className="broadcast-composer-close"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>

        <h2>Send announcement</h2>

        <form action={sendAction}>
          {/* Subject */}
          <div className="broadcast-field">
            <label htmlFor="bc-subject">Subject</label>
            <input
              autoFocus
              id="bc-subject"
              maxLength={200}
              name="subject"
              placeholder="e.g. Upcoming COP30 preparation workshop"
              required
              type="text"
            />
          </div>

          {/* Body */}
          <div className="broadcast-field">
            <label htmlFor="bc-body">Message</label>
            <textarea
              id="bc-body"
              maxLength={5000}
              name="body"
              placeholder="Write your announcement…"
              required
              rows={5}
            />
          </div>

          {/* Target */}
          <div className="broadcast-field">
            <label>Send to</label>
            <div className="broadcast-target-options" role="group" aria-label="Target audience">
              {[
                { value: "all", label: "All members" },
                { value: "cohort", label: "By cohort" },
              ].map((opt) => (
                <label
                  className={`broadcast-target-chip${targetType === opt.value ? " selected" : ""}`}
                  key={opt.value}
                >
                  <input
                    checked={targetType === opt.value}
                    name="target_type"
                    onChange={() => setTargetType(opt.value)}
                    type="radio"
                    value={opt.value}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {targetType === "cohort" && cohorts?.length > 0 && (
              <div className="broadcast-cohort-grid" role="group" aria-label="Select cohorts">
                {cohorts.map((c) => (
                  <label className="broadcast-cohort-check" key={c.id}>
                    <input
                      checked={selectedCohorts.has(c.id)}
                      name="cohort_ids"
                      onChange={() => toggleCohort(c.id)}
                      type="checkbox"
                      value={c.id}
                    />
                    <span>{c.name}</span>
                    {c.memberCount > 0 && (
                      <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
                        {c.memberCount}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}

            <p className="broadcast-recipient-preview">{recipientPreview}</p>
          </div>

          {/* Delivery channels */}
          <div className="broadcast-field">
            <label>Delivery</label>
            <div className="broadcast-channel-options">
              <label className="broadcast-channel-check">
                <input checked disabled readOnly type="checkbox" />
                <span>In-app notification (always on)</span>
              </label>
              <label className="broadcast-channel-check">
                <input
                  checked={emailChannel}
                  name="delivery_channels"
                  onChange={(e) => setEmailChannel(e.target.checked)}
                  type="checkbox"
                  value="email"
                />
                <span>Email</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="broadcast-composer-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Send broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getRecipientPreview({ targetType, selectedCohorts, cohorts }) {
  if (targetType === "all") return "Will be sent to all active members.";
  if (targetType === "cohort") {
    if (!selectedCohorts.size) return "Select one or more cohorts above.";
    const names = [...selectedCohorts]
      .map((id) => cohorts?.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    return `Will be sent to members of: ${names}.`;
  }
  return "";
}
