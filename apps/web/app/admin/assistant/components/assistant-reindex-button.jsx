"use client";

import { useState } from "react";
import { RefreshCw, Zap } from "lucide-react";

function buildIssueLines(health) {
  return Object.values(health?.checks || {})
    .filter((check) => !check.ok)
    .map((check) => `${check.description}: ${check.error?.message || "Unavailable"}`);
}

export function AssistantReindexButton({ health = null }) {
  const [state, setState] = useState("idle"); // idle | running | done | error
  const [result, setResult] = useState(null);
  const infraReady = health?.isReady ?? true;
  const issueLines = buildIssueLines(health);

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
    <div className="admin-action-card assistant-compact-card">
      <div className="admin-action-card-label">
        <Zap size={12} />
        <span>Recent records</span>
      </div>
      <h3>Sync latest content</h3>
      <p>
        Re-indexes the 20 most recently updated records for each data source.
        Does not clear existing embeddings.
      </p>

      {state === "done" && result && (
        <div className={result.errors > 0 ? "admin-notice admin-notice-error" : "admin-notice admin-notice-success"}>
          <p style={{ margin: 0 }}>
            Synced {result.synced} document{result.synced === 1 ? "" : "s"}
            {result.errors > 0 ? ` (${result.errors} error${result.errors === 1 ? "" : "s"})` : "."}
          </p>
          {Array.isArray(result.failureReasons) && result.failureReasons.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              {result.failureReasons.map((item) => (
                <p key={`${item.label}-${item.reason}`} style={{ margin: "0.25rem 0" }}>
                  {item.label}: {item.reason} ({item.count})
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {state === "error" && result?.error && (
        <div className="admin-notice admin-notice-error">
          <p style={{ margin: 0 }}>Sync failed: {result.error}</p>
          {Array.isArray(result.issues) && result.issues.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              {result.issues.map((issue) => (
                <p key={`${issue.description}-${issue.message}`} style={{ margin: "0.25rem 0" }}>
                  {issue.description}: {issue.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {!infraReady && state === "idle" && issueLines.length > 0 && (
        <div className="admin-notice admin-notice-error">
          {issueLines.map((line) => (
            <p key={line} style={{ margin: "0.25rem 0" }}>
              {line}
            </p>
          ))}
        </div>
      )}

      <div className="admin-action-card-footer">
        <button
          className="primary-button button-compact"
          onClick={handleSync}
          disabled={state === "running" || !infraReady}
          type="button"
        >
          <RefreshCw size={14} />
          {state === "running" ? "Syncing…" : "Sync now"}
        </button>
      </div>
    </div>
  );
}
