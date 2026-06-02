"use client";

import { useState, useTransition } from "react";
import { saveWipPagesAction } from "../actions";

const NAV_PAGES = [
  { path: "/", label: "Home", note: "Affects all visitors — use with caution" },
  { path: "/about", label: "About" },
  { path: "/projects", label: "Projects" },
  { path: "/insights", label: "Insights" },
  { path: "/events", label: "Events" },
  { path: "/community", label: "Community" },
  { path: "/work-with-us", label: "Work With Us" },
];

export function WipPagesPicker({ initialWipPages = [] }) {
  const [selected, setSelected] = useState(new Set(initialWipPages));
  const [status, setStatus] = useState(null);
  const [isPending, startTransition] = useTransition();

  function toggle(path) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    setStatus(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveWipPagesAction([...selected]);
      setStatus(result?.error ? "error" : "saved");
      if (!result?.error) setTimeout(() => setStatus(null), 3000);
    });
  }

  return (
    <div className="wip-picker">
      <div className="wip-picker-grid">
        {NAV_PAGES.map(({ path, label, note }) => {
          const isChecked = selected.has(path);
          return (
            <label
              key={path}
              className={`wip-picker-item${isChecked ? " is-active" : ""}`}
            >
              <input
                type="checkbox"
                className="wip-picker-checkbox"
                checked={isChecked}
                onChange={() => toggle(path)}
              />
              <div className="wip-picker-info">
                <span className="wip-picker-label">{label}</span>
                <span className="wip-picker-path">{path}</span>
                {note && <span className="wip-picker-note">{note}</span>}
              </div>
              {isChecked && (
                <span className="status-chip chip-warning">WIP</span>
              )}
            </label>
          );
        })}
      </div>

      <div className="wip-picker-footer">
        <p className="wip-picker-hint">
          {selected.size === 0
            ? "All pages are currently live."
            : `${selected.size} page${selected.size === 1 ? "" : "s"} will show a work-in-progress message to visitors.`}
        </p>
        <div className="wip-picker-actions">
          {status === "saved" && (
            <span className="form-success-note">Saved. Changes are live.</span>
          )}
          {status === "error" && (
            <span className="form-error-note">Could not save. Please try again.</span>
          )}
          <button
            className="primary-button"
            disabled={isPending}
            onClick={handleSave}
            type="button"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
