"use client";

import { useState } from "react";

export function AssistantReindexButton() {
  const [state, setState] = useState("idle"); // idle | running | done | error
  const [result, setResult] = useState(null);

  async function handleSync() {
    setState("running");
    setResult(null);

    try {
      const res = await fetch("/api/admin/assistant/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setResult(data);
      setState("done");
    } catch (err) {
      setResult({ error: err.message });
      setState("error");
    }
  }

  return (
    <div className="admin-action-card" style={{ maxWidth: 480 }}>
      <div className="admin-action-card-label">Recent records</div>
      <h3>Sync latest content</h3>
      <p>
        Re-indexes the 20 most recently updated records for each data source.
        Does not clear existing embeddings.
      </p>

      {state === "done" && result && (
        <p className="admin-notice admin-notice-success">
          Synced {result.synced} document{result.synced === 1 ? "" : "s"}
          {result.errors > 0 ? ` (${result.errors} error${result.errors === 1 ? "" : "s"})` : "."}
        </p>
      )}

      {state === "error" && result?.error && (
        <p className="admin-notice admin-notice-error">
          Sync failed: {result.error}
        </p>
      )}

      <div className="admin-action-card-footer">
        <button
          className="primary-button"
          onClick={handleSync}
          disabled={state === "running"}
          type="button"
        >
          {state === "running" ? "Syncing…" : "Sync now"}
        </button>
      </div>
    </div>
  );
}
