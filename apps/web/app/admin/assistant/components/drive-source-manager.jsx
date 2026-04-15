"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  FolderPlus,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

const VISIBILITY_LABELS = {
  public: "Public",
  members: "Members",
  admin_only: "Admin only",
};

function formatDate(value) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(parsed);
}

function getSyncProgress(source) {
  const total = Number(source?.current_sync_total || 0);
  const processed = Math.min(Number(source?.current_sync_processed || 0), total || 0);
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  return { percent, processed, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Add source form
// ─────────────────────────────────────────────────────────────────────────────
function AddDriveSourceForm({ onCreated }) {
  const [state, setState] = useState("idle"); // idle | saving | error
  const [errorMsg, setErrorMsg] = useState(null);
  const [form, setForm] = useState({ title: "", source_url: "", visibility: "members" });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState("saving");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/assistant/external-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setForm({ title: "", source_url: "", visibility: "members" });
      setState("idle");
      onCreated(data);
    } catch (err) {
      setErrorMsg(err.message);
      setState("error");
    }
  }

  return (
    <form className="assistant-drive-form" onSubmit={handleSubmit}>
      <div className="admin-form-field">
        <label className="admin-form-label" htmlFor="ds-title">Label</label>
        <input
          id="ds-title"
          className="admin-form-input"
          type="text"
          placeholder="e.g. IMO Position Papers"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          disabled={state === "saving"}
        />
      </div>

      <div className="admin-form-field">
        <label className="admin-form-label" htmlFor="ds-url">Google Drive folder URL</label>
        <input
          id="ds-url"
          className="admin-form-input"
          type="url"
          placeholder="https://drive.google.com/drive/folders/…"
          value={form.source_url}
          onChange={(e) => update("source_url", e.target.value)}
          required
          disabled={state === "saving"}
        />
        <p className="admin-form-hint">Must be a publicly shared folder. PDF files only.</p>
      </div>

      <div className="admin-form-field">
        <label className="admin-form-label" htmlFor="ds-vis">Visibility</label>
        <select
          id="ds-vis"
          className="admin-form-select"
          value={form.visibility}
          onChange={(e) => update("visibility", e.target.value)}
          disabled={state === "saving"}
        >
          <option value="public">Public — anyone</option>
          <option value="members">Members — authenticated members</option>
          <option value="admin_only">Admin only</option>
        </select>
      </div>

      {state === "error" && errorMsg && (
        <div className="admin-notice admin-notice-error">
          <p style={{ margin: 0 }}>{errorMsg}</p>
        </div>
      )}

      <div>
        <button className="primary-button button-compact" type="submit" disabled={state === "saving"}>
          <FolderPlus size={14} />
          {state === "saving" ? "Adding and syncing…" : "Add source"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-source row with sync and delete actions
// ─────────────────────────────────────────────────────────────────────────────
function DriveSourceRow({ source: initialSource, onDeleted }) {
  const [source, setSource] = useState(initialSource);
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | done | error
  const [syncResult, setSyncResult] = useState(null);
  const [deleteState, setDeleteState] = useState("idle"); // idle | confirming | deleting

  useEffect(() => {
    setSource(initialSource);
  }, [initialSource]);

  useEffect(() => {
    if (syncState !== "syncing") {
      return undefined;
    }

    let cancelled = false;
    const intervalId = window.setInterval(async () => {
      try {
        const listRes = await fetch("/api/admin/assistant/external-sources");
        if (!listRes.ok) return;
        const listData = await listRes.json();
        const updated = (listData.sources || []).find((s) => s.id === initialSource.id);
        if (!cancelled && updated) {
          setSource(updated);
        }
      } catch {
        // Best-effort polling only.
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [initialSource.id, syncState]);

  async function handleSync() {
    setSyncState("syncing");
    setSyncResult(null);
    setSource((prev) => ({
      ...prev,
      current_sync_processed: 0,
      current_sync_stage: "Preparing sync",
      current_sync_started_at: new Date().toISOString(),
      current_sync_total: Math.max(prev?.docCounts?.total || 0, 1),
    }));
    try {
      const res = await fetch(`/api/admin/assistant/external-sources/${source.id}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSyncResult(data);
      setSyncState("done");
      // Refresh doc counts — re-fetch from list endpoint
      const listRes = await fetch("/api/admin/assistant/external-sources");
      if (listRes.ok) {
        const listData = await listRes.json();
        const updated = (listData.sources || []).find((s) => s.id === source.id);
        if (updated) setSource(updated);
      }
    } catch (err) {
      setSyncResult({ error: err.message });
      setSyncState("error");
    }
  }

  async function handleDelete() {
    if (deleteState === "idle") {
      setDeleteState("confirming");
      return;
    }
    setDeleteState("deleting");
    try {
      const res = await fetch(`/api/admin/assistant/external-sources/${source.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      onDeleted(source.id);
    } catch (err) {
      setSyncResult({ error: err.message });
      setDeleteState("idle");
    }
  }

  const counts = source.docCounts || {};
  const progress = getSyncProgress(source);
  const syncStatusChip = source.last_sync_status === "ok"
    ? <span className="status-chip chip-success">Synced</span>
    : source.last_sync_status === "partial"
    ? <span className="status-chip chip-warning">Partial</span>
    : source.last_sync_status === "error"
    ? <span className="status-chip chip-error">Error</span>
    : <span className="status-chip chip-muted">Never synced</span>;

  return (
    <div className="admin-action-card assistant-drive-card">
      <div className="assistant-drive-card-top">
        <div className="assistant-drive-card-copy">
          <div className="assistant-drive-card-title-row">
            <strong>{source.title}</strong>
            <span className="status-chip chip-muted">{VISIBILITY_LABELS[source.visibility] || source.visibility}</span>
            {syncStatusChip}
          </div>
          <p className="assistant-drive-card-meta">
            <a className="text-link" href={source.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={13} />
              <span>View folder</span>
            </a>
          </p>
          <div className="assistant-drive-card-stats">
            <span>
              <FileText size={13} />
              {counts.total ?? 0} file{counts.total !== 1 ? "s" : ""} total
            </span>
            {counts.indexed > 0 ? (
              <span>{counts.indexed} indexed</span>
            ) : null}
            {counts.error > 0 ? (
              <span>{counts.error} error{counts.error !== 1 ? "s" : ""}</span>
            ) : null}
            <span>Last sync: {formatDate(source.last_synced_at)}</span>
          </div>
          {source.last_sync_error && (
            <p className="assistant-drive-card-error">
              {source.last_sync_error}
            </p>
          )}

          {syncState === "syncing" && (
            <div className="assistant-sync-progress" aria-live="polite">
              <div className="assistant-sync-progress-copy">
                <span>{source.current_sync_stage || "Syncing files"}</span>
                <strong>
                  {progress.total > 0
                    ? `${progress.processed}/${progress.total}`
                    : "Starting"}
                </strong>
              </div>
              <div className="assistant-sync-progress-track" aria-hidden="true">
                <span
                  className="assistant-sync-progress-fill"
                  style={{ width: `${Math.max(progress.percent, 6)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="assistant-drive-card-actions">
          <button
            className="secondary-button button-compact"
            onClick={handleSync}
            disabled={syncState === "syncing"}
            type="button"
          >
            <RefreshCw size={14} />
            {syncState === "syncing" ? "Syncing…" : "Sync now"}
          </button>
          <button
            className={`${deleteState === "confirming" ? "danger-button" : "ghost-button"} button-compact`}
            onClick={handleDelete}
            disabled={deleteState === "deleting"}
            type="button"
          >
            <Trash2 size={14} />
            {deleteState === "confirming" ? "Confirm remove" : deleteState === "deleting" ? "Removing…" : "Remove"}
          </button>
          {deleteState === "confirming" && (
            <button className="ghost-button button-compact" onClick={() => setDeleteState("idle")} type="button">
              <X size={14} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {syncState === "done" && syncResult && (
        <div className={syncResult.errors?.length > 0 ? "admin-notice admin-notice-error" : "admin-notice admin-notice-success"}>
          <p style={{ margin: 0 }}>
            Sync complete — {syncResult.synced ?? 0} indexed, {syncResult.skipped ?? 0} unchanged
            {syncResult.errors?.length > 0 ? `, ${syncResult.errors.length} error${syncResult.errors.length !== 1 ? "s" : ""}` : "."}
          </p>
          {syncResult.errors?.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              {syncResult.errors.map((e, i) => (
                <p key={i} style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>
                  {e.title}: {e.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {syncState === "error" && syncResult?.error && (
        <div className="admin-notice admin-notice-error">
          <p style={{ margin: 0 }}>Sync failed: {syncResult.error}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────────────────────────
export function DriveSourceManager({ initialSources = [] }) {
  const [sources, setSources] = useState(initialSources);
  const [showForm, setShowForm] = useState(false);

  function handleCreated({ source, syncResult }) {
    const newSource = {
      ...source,
      current_sync_processed: 0,
      current_sync_stage: null,
      current_sync_started_at: null,
      current_sync_total: 0,
      last_synced_at: new Date().toISOString(),
      last_sync_status: syncResult?.errors?.length > 0 ? (syncResult.synced > 0 ? "partial" : "error") : "ok",
      last_sync_error: syncResult?.errors?.length > 0 ? syncResult.errors.map((e) => `${e.title}: ${e.reason}`).join("; ") : null,
      docCounts: { total: (syncResult?.synced || 0) + (syncResult?.skipped || 0), indexed: syncResult?.synced || 0, error: syncResult?.errors?.length || 0, pending: 0, skipped: syncResult?.skipped || 0 },
    };
    setSources((prev) => [newSource, ...prev]);
    setShowForm(false);
  }

  function handleDeleted(id) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="assistant-drive-manager">
      {sources.length === 0 && !showForm && (
        <p className="assistant-empty-state">
          No Drive sources configured. Add one to make Google Drive PDFs searchable via the assistant.
        </p>
      )}

      {sources.map((source) => (
        <DriveSourceRow key={source.id} source={source} onDeleted={handleDeleted} />
      ))}

      {showForm ? (
        <div className="assistant-drive-form-wrap">
          <AddDriveSourceForm onCreated={handleCreated} />
          <button
            className="ghost-button button-compact"
            onClick={() => setShowForm(false)}
            type="button"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      ) : (
        <button className="secondary-button button-compact" onClick={() => setShowForm(true)} type="button">
          <Plus size={14} />
          Add Google Drive folder
        </button>
      )}
    </div>
  );
}
