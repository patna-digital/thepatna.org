"use client";

import { useState, useTransition } from "react";
import { saveFeaturedMembersAction } from "../actions";

export function FeaturedMembersPicker({ allMembers, initialMode, initialIds }) {
  const [mode, setMode] = useState(initialMode || "default");
  const [selectedIds, setSelectedIds] = useState(initialIds || []);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(null);
  const [isPending, startTransition] = useTransition();

  const selected = allMembers.filter((m) => selectedIds.includes(m.id));
  const filtered = allMembers.filter(
    (m) =>
      !selectedIds.includes(m.id) &&
      (query === "" ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.org.toLowerCase().includes(query.toLowerCase()))
  );

  function addMember(id) {
    if (selectedIds.length >= 12) return;
    setSelectedIds((prev) => [...prev, id]);
    setQuery("");
  }

  function removeMember(id) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("mode", mode);
    fd.set("member_ids", JSON.stringify(selectedIds));
    startTransition(async () => {
      try {
        const result = await saveFeaturedMembersAction(fd);
        if (result?.ok) {
          setNotice({ type: "success", text: "Settings saved." });
        } else {
          const msg = result?.error ?? "Save failed. Please try again.";
          console.error("[FeaturedMembersPicker] save error:", result);
          setNotice({ type: "error", text: msg });
        }
      } catch (err) {
        console.error("[FeaturedMembersPicker] unexpected error:", err);
        setNotice({ type: "error", text: "Save failed. Please try again." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="featured-members-picker">

      {/* ── Mode selector ── */}
      <div className="fmp-field-group">
        <label className="fmp-field-label">Display mode</label>
        <div className="fmp-radio-group">
          <label className={`fmp-radio-option${mode === "default" ? " is-selected" : ""}`}>
            <input
              type="radio"
              name="mode"
              value="default"
              checked={mode === "default"}
              onChange={() => setMode("default")}
            />
            <div>
              <strong>Default</strong>
              <span>Automatically shows the 8 most recently active members. No curation needed.</span>
            </div>
          </label>
          <label className={`fmp-radio-option${mode === "custom" ? " is-selected" : ""}`}>
            <input
              type="radio"
              name="mode"
              value="custom"
              checked={mode === "custom"}
              onChange={() => setMode("custom")}
            />
            <div>
              <strong>Custom selection</strong>
              <span>Hand-pick which members appear on the home page. Up to 8 members.</span>
            </div>
          </label>
        </div>
      </div>

      {/* ── Custom picker (only shown in custom mode) ── */}
      {mode === "custom" && (
        <>
          {/* Selected members */}
          <div className="fmp-field-group">
            <label className="fmp-field-label">
              Selected members
              <span className="fmp-count">{selected.length} / 8</span>
            </label>

            {selected.length === 0 ? (
              <p className="fmp-empty">No members selected yet. Search below to add members.</p>
            ) : (
              <ul className="fmp-selected-list">
                {selected.map((m) => (
                  <li key={m.id} className="fmp-selected-item">
                    <span className="fmp-selected-name">{m.name}</span>
                    {m.org && <span className="fmp-selected-meta">{m.org}</span>}
                    <button
                      type="button"
                      className="fmp-remove-btn"
                      onClick={() => removeMember(m.id)}
                      aria-label={`Remove ${m.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Search to add */}
          {selected.length < 8 && (
            <div className="fmp-field-group">
              <label className="fmp-field-label" htmlFor="fmp-search">
                Add a member
              </label>
              <input
                id="fmp-search"
                type="search"
                className="fmp-search-input"
                placeholder="Search by name or organisation…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query.length > 0 && (
                <ul className="fmp-search-results">
                  {filtered.length === 0 ? (
                    <li className="fmp-search-empty">No matching members found.</li>
                  ) : (
                    filtered.slice(0, 8).map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className="fmp-search-result-btn"
                          onClick={() => addMember(m.id)}
                        >
                          <span className="fmp-result-name">{m.name}</span>
                          {m.org && <span className="fmp-result-meta">{m.org}</span>}
                          {m.cohort && <span className="fmp-result-cohort">{m.cohort}</span>}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Footer ── */}
      <div className="fmp-footer">
        {notice && (
          <span className={`fmp-notice fmp-notice-${notice.type}`}>{notice.text}</span>
        )}
        <button
          type="submit"
          className="primary-button"
          disabled={isPending}
        >
          {isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
