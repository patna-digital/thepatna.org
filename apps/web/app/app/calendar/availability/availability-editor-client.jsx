"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateAvailabilityRules } from "../actions";

const DAYS_OF_WEEK = [
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
  { id: 0, name: "Sunday", short: "Sun" },
];

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "17:00";

function DayRow({ day, slots, isActive, onToggle, onSlotChange, onAddSlot, onRemoveSlot }) {
  return (
    <div className={`day-row ${isActive ? "" : "inactive"}`}>
      <div className="day-name">{day.name}</div>
      
      <div className="day-slots">
        {isActive ? (
          <>
            {slots.map((slot, index) => (
              <div key={index} className="time-slot">
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => onSlotChange(day.id, index, "start_time", e.target.value)}
                />
                <span className="time-separator">to</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => onSlotChange(day.id, index, "end_time", e.target.value)}
                />
                {slots.length > 1 && (
                  <button
                    className="remove-slot-btn"
                    onClick={() => onRemoveSlot(day.id, index)}
                    type="button"
                    aria-label="Remove slot"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              className="add-slot-btn"
              onClick={() => onAddSlot(day.id)}
              type="button"
            >
              + Add time slot
            </button>
          </>
        ) : (
          <span className="unavailable-text">Unavailable</span>
        )}
      </div>

      <div className="day-toggle">
        <input
          type="checkbox"
          id={`day-toggle-${day.id}`}
          checked={isActive}
          onChange={() => onToggle(day.id)}
        />
        <label htmlFor={`day-toggle-${day.id}`}>
          {isActive ? "Available" : "Unavailable"}
        </label>
      </div>
    </div>
  );
}

export function AvailabilityEditorClient({ initialRules, memberId }) {
  const router = useRouter();
  
  // Parse initial rules into a map by day
  const parseInitialSchedule = () => {
    const schedule = {};
    DAYS_OF_WEEK.forEach((day) => {
      const dayRules = initialRules.filter(
        (rule) => rule.day_of_week === day.id && !rule.is_blocked
      );
      schedule[day.id] = {
        isActive: dayRules.length > 0,
        slots: dayRules.length > 0
          ? dayRules.map((rule) => ({
              start_time: rule.start_time,
              end_time: rule.end_time,
            }))
          : [{ start_time: DEFAULT_START_TIME, end_time: DEFAULT_END_TIME }],
      };
    });
    return schedule;
  };

  const [schedule, setSchedule] = useState(parseInitialSchedule());
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleToggleDay = useCallback((dayId) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        isActive: !prev[dayId].isActive,
      },
    }));
  }, []);

  const handleSlotChange = useCallback((dayId, slotIndex, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: prev[dayId].slots.map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  }, []);

  const handleAddSlot = useCallback((dayId) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: [...prev[dayId].slots, { start_time: DEFAULT_START_TIME, end_time: DEFAULT_END_TIME }],
      },
    }));
  }, []);

  const handleRemoveSlot = useCallback((dayId, slotIndex) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: prev[dayId].slots.filter((_, index) => index !== slotIndex),
      },
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    // Convert schedule to rules array
    const rules = [];
    DAYS_OF_WEEK.forEach((day) => {
      if (schedule[day.id].isActive) {
        schedule[day.id].slots.forEach((slot) => {
          rules.push({
            day_of_week: day.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            timezone: "UTC",
            is_blocked: false,
          });
        });
      }
    });

    const result = await updateAvailabilityRules(memberId, rules);

    setIsSaving(false);
    if (result.success) {
      setSaveStatus({ type: "success", message: "Availability saved successfully!" });
      router.refresh();
    } else {
      setSaveStatus({ type: "error", message: `Error: ${result.error}` });
    }
  };

  const handleSetStandardWorkWeek = () => {
    const newSchedule = { ...schedule };
    DAYS_OF_WEEK.forEach((day) => {
      if (day.id >= 1 && day.id <= 5) {
        // Monday to Friday
        newSchedule[day.id] = {
          isActive: true,
          slots: [{ start_time: DEFAULT_START_TIME, end_time: DEFAULT_END_TIME }],
        };
      } else {
        // Saturday and Sunday
        newSchedule[day.id] = {
          isActive: false,
          slots: [{ start_time: DEFAULT_START_TIME, end_time: DEFAULT_END_TIME }],
        };
      }
    });
    setSchedule(newSchedule);
  };

  const handleClearAll = () => {
    const newSchedule = { ...schedule };
    DAYS_OF_WEEK.forEach((day) => {
      newSchedule[day.id] = {
        isActive: false,
        slots: [{ start_time: DEFAULT_START_TIME, end_time: DEFAULT_END_TIME }],
      };
    });
    setSchedule(newSchedule);
  };

  return (
    <div className="availability-editor">
      <div className="availability-header">
        <h2>Weekly Schedule</h2>
        <p>Set your regular availability for each day of the week</p>
      </div>

      <div className="availability-body">
        <div className="info-card">
          <span className="info-icon">💡</span>
          <div className="info-content">
            <h3>Tip</h3>
            <p>
              Your availability will be combined with your connected calendar events
              to show accurate booking slots. You can add multiple time slots per day.
            </p>
          </div>
        </div>

        <div className="quick-actions">
          <button
            className="text-link"
            onClick={handleSetStandardWorkWeek}
            type="button"
          >
            Set standard work week (Mon-Fri, 9-5)
          </button>
          <span className="action-separator">|</span>
          <button
            className="text-link"
            onClick={handleClearAll}
            type="button"
          >
            Clear all
          </button>
        </div>

        <div className="week-schedule">
          {DAYS_OF_WEEK.map((day) => (
            <DayRow
              key={day.id}
              day={day}
              slots={schedule[day.id].slots}
              isActive={schedule[day.id].isActive}
              onToggle={handleToggleDay}
              onSlotChange={handleSlotChange}
              onAddSlot={handleAddSlot}
              onRemoveSlot={handleRemoveSlot}
            />
          ))}
        </div>
      </div>

      <div className="availability-actions">
        {saveStatus && (
          <div className={`save-status ${saveStatus.type}`}>
            {saveStatus.type === "success" ? "✓" : "✗"} {saveStatus.message}
          </div>
        )}
        <button
          className="secondary-button"
          onClick={() => router.push("/app/calendar")}
          type="button"
        >
          Cancel
        </button>
        <button
          className="primary-button"
          onClick={handleSave}
          disabled={isSaving}
          type="button"
        >
          {isSaving ? "Saving..." : "Save Availability"}
        </button>
      </div>

      <style jsx>{`
        .quick-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding: 0.75rem;
          background: var(--surface);
          border-radius: var(--radius-md);
        }

        .action-separator {
          color: var(--border-strong);
        }

        .unavailable-text {
          color: var(--ink-soft);
          font-style: italic;
          font-size: var(--text-sm);
        }

        .remove-slot-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--ink-soft);
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .remove-slot-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>

      <style jsx global>{`
        .availability-page-content {
          max-width: 800px;
        }

        .availability-editor {
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .availability-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }

        .availability-header h2 {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 0.5rem 0;
        }

        .availability-header p {
          margin: 0;
          color: var(--ink-muted);
          font-size: var(--text-sm);
        }

        .availability-body {
          padding: 1.5rem;
        }

        .week-schedule {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .day-row {
          display: grid;
          grid-template-columns: 100px 1fr auto;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--surface);
        }

        .day-row.inactive {
          opacity: 0.6;
        }

        .day-name {
          font-weight: 700;
          color: var(--ink);
        }

        .day-slots {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .time-slot {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .time-slot input {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          width: 100px;
        }

        .time-separator {
          color: var(--ink-soft);
        }

        .add-slot-btn {
          padding: 0.25rem 0.5rem;
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--ink-soft);
          font-size: var(--text-xs);
          cursor: pointer;
          transition: all 160ms ease;
        }

        .add-slot-btn:hover {
          border-color: var(--blue-bright);
          color: var(--blue-dark);
        }

        .day-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .day-toggle input {
          width: 40px;
          height: 20px;
          appearance: none;
          background: var(--border-strong);
          border-radius: 10px;
          cursor: pointer;
          position: relative;
          transition: background 160ms ease;
        }

        .day-toggle input:checked {
          background: var(--blue-bright);
        }

        .day-toggle input::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: var(--white);
          border-radius: 50%;
          transition: transform 160ms ease;
        }

        .day-toggle input:checked::after {
          transform: translateX(20px);
        }

        .day-toggle label {
          font-size: var(--text-sm);
          color: var(--ink-soft);
        }

        .availability-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.5rem;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }

        .save-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--text-sm);
        }

        .save-status.success {
          color: #059669;
        }

        .save-status.error {
          color: #dc2626;
        }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: var(--blue-soft);
          border: 1px solid var(--blue-light);
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }

        .info-icon {
          font-size: 1.25rem;
        }

        .info-content h3 {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--blue-dark);
          margin: 0 0 0.25rem 0;
        }

        .info-content p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--ink-muted);
        }

        @media (max-width: 640px) {
          .day-row {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .day-toggle {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
