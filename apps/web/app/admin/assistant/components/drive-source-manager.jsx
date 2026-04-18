"use client";

import { useEffect, useState } from "react";
import { formatStoredSyncSummary, summarizeSyncErrorReason } from "@/lib/assistant-error-format";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderPlus,
  Loader2,
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

const VISIBILITY_CHIP_CLASS = {
  public: "chip-info",
  members: "chip-muted",
  admin_only: "chip-warning",
};

function formatDate(value) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
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
// Staged progress panel shown while a new source is being added + synced
// ─────────────────────────────────────────────────────────────────────────────
const ADD_STAGES = [
  "Creating folder",
  "Scanning for PDF files",
  "Indexing documents",
];

function AddProgressPanel({ stage, folderTitle }) {
  return (
    <div className="assistant-add-progress">
      <p className="assistant-add-progress-title">
        Adding <strong>{folderTitle || "folder"}</strong>…
      </p>

      <ol className="assistant-add-stages" aria-label="Progress steps">
        {ADD_STAGES.map((label, i) => {
          const isDone = stage > i;
          const isActive = stage === i;
          return (
            <li
              key={label}
              className={`assistant-add-stage${isDone ? " is-done" : isActive ? " is-active" : ""}`}
            >
              <span className="assistant-add-stage-dot" aria-hidden>
                {isDone ? <CheckCircle2 size={13} /> : isActive ? <Loader2 size={13} className="spin" /> : null}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="assistant-sync-progress-track" aria-hidden>
        <span className="assistant-sync-progress-fill assistant-sync-progress-indeterminate" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add source form
// ─────────────────────────────────────────────────────────────────────────────
function AddDriveSourceForm({ onCreated, onCancel }) {
  const [state, setState] = useState("idle"); // idle | saving | error
  const [saveStage, setSaveStage] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [form, setForm] = useState({ title: "", source_url: "", visibility: "members" });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState("saving");
    setSaveStage(0);
    setErrorMsg(null);

    // Advance through fake stages while the API call runs
    const t1 = setTimeout(() => setSaveStage(1), 1400);
    const t2 = setTimeout(() => setSaveStage(2), 4000);

    try {
      const res = await fetch("/api/admin/assistant/external-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      clearTimeout(t1);
      clearTimeout(t2);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setForm({ title: "", source_url: "", visibility: "members" });
      setState("idle");
      onCreated(data);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setErrorMsg(err.message);
      setState("error");
      setSaveStage(0);
    }
  }

  if (state === "saving") {
    return <AddProgressPanel stage={saveStage} folderTitle={form.title} />;
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

      <div className="assistant-drive-form-actions">
        <button className="primary-button button-compact" type="submit">
          <FolderPlus size={14} />
          Add and sync folder
        </button>
        <button className="ghost-button button-compact" type="button" onClick={onCancel}>
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-source card with sync and delete actions
// ─────────────────────────────────────────────────────────────────────────────
function DriveSourceRow({ source: initialSource, onDeleted }) {
  const [source, setSource] = useState(initialSource);
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | done | error
  const [syncResult, setSyncResult] = useState(null);
  const [deleteState, setDeleteState] = useState("idle"); // idle | confirming | deleting

  useEffect(() => {
    setSource(initialSource);
  }, [initialSource]);

  // Poll for progress while syncing
  useEffect(() => {
    if (syncState !== "syncing") return undefined;

    let cancelled = false;
    const intervalId = window.setInterval(async () => {
      try {
        const listRes = await fetch("/api/admin/assistant/external-sources");
        if (!listRes.ok) return;
        const listData = await listRes.json();
        const updated = (listData.sources || []).find((s) => s.id === initialSource.id);
        if (!cancelled && updated) setSource(updated);
      } catch {
        // Best-effort polling only
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
    if (deleteState === "idle") { setDeleteState("confirming"); return; }
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
  const sourceErrorSummary = formatStoredSyncSummary(source.last_sync_error);

  const syncStatusChip = source.last_sync_status === "ok"
    ? <span className="status-chip chip-success">Synced</span>
    : source.last_sync_status === "partial"
    ? <span className="status-chip chip-warning">Partial</span>
    : source.last_sync_status === "error"
    ? <span className="status-chip chip-error">Error</span>
    : <span className="status-chip chip-muted">Never synced</span>;

  return (
    <div className="assistant-drive-card admin-action-card">
      {/* Header row */}
      <div className="assistant-drive-card-top">
        <div className="assistant-drive-card-copy">
          <div className="assistant-drive-card-title-row">
            <strong className="assistant-drive-card-name">{source.title}</strong>
            <span className={`status-chip ${VISIBILITY_CHIP_CLASS[source.visibility] || "chip-muted"}`}>
              {VISIBILITY_LABELS[source.visibility] || source.visibility}
            </span>
            {syncStatusChip}
          </div>

          <a
            className="text-link assistant-drive-card-link"
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={12} />
            <span>View folder</span>
          </a>
        </div>

        <div className="assistant-drive-card-actions">
          <button
            className="secondary-button button-compact"
            onClick={handleSync}
            disabled={syncState === "syncing"}
            type="button"
          >
            <RefreshCw size={13} className={syncState === "syncing" ? "spin" : undefined} />
            {syncState === "syncing" ? "Syncing…" : "Sync now"}
          </button>
          <button
            className={`${deleteState === "confirming" ? "danger-button" : "ghost-button"} button-compact`}
            onClick={handleDelete}
            disabled={deleteState === "deleting"}
            type="button"
          >
            <Trash2 size={13} />
            {deleteState === "confirming" ? "Confirm remove" : deleteState === "deleting" ? "Removing…" : "Remove"}
          </button>
          {deleteState === "confirming" && (
            <button className="ghost-button button-compact" onClick={() => setDeleteState("idle")} type="button">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="assistant-drive-stats-row">
        <span className="assistant-drive-stat">
          <FileText size={12} />
          <strong>{counts.total ?? 0}</strong> files total
        </span>
        {counts.indexed > 0 && (
          <span className="assistant-drive-stat tone-success">
            <strong>{counts.indexed}</strong> indexed
          </span>
        )}
        {counts.error > 0 && (
          <span className="assistant-drive-stat tone-error">
            <strong>{counts.error}</strong> error{counts.error !== 1 ? "s" : ""}
          </span>
        )}
        {counts.skipped > 0 && (
          <span className="assistant-drive-stat tone-muted">
            <strong>{counts.skipped}</strong> unchanged
          </span>
        )}
        <span className="assistant-drive-stat tone-muted">
          Last sync: {formatDate(source.last_synced_at)}
        </span>
      </div>

      {sourceErrorSummary && (
        <p className="assistant-drive-card-error">{sourceErrorSummary}</p>
      )}

      {/* Live sync progress */}
      {syncState === "syncing" && (
        <div className="assistant-sync-progress" aria-live="polite">
          <div className="assistant-sync-progress-copy">
            <span>{source.current_sync_stage || "Syncing files"}</span>
            <strong>
              {progress.total > 0 ? `${progress.processed} / ${progress.total} files` : "Starting…"}
            </strong>
          </div>
          <div className="assistant-sync-progress-track" aria-hidden>
            <span
              className="assistant-sync-progress-fill"
              style={{ width: `${Math.max(progress.percent, 6)}%` }}
            />
          </div>
        </div>
      )}

      {/* Sync result */}
      {syncState === "done" && syncResult && (
        <div className={syncResult.errors?.length > 0 ? "admin-notice admin-notice-error" : "admin-notice admin-notice-success"}>
          <p style={{ margin: 0 }}>
            Sync complete — <strong>{syncResult.synced ?? 0}</strong> indexed, <strong>{syncResult.skipped ?? 0}</strong> unchanged
            {syncResult.errors?.length > 0 ? `, ${syncResult.errors.length} error${syncResult.errors.length !== 1 ? "s" : ""}` : "."}
          </p>
          {syncResult.errors?.length > 0 && (
            <ul className="assistant-sync-error-list">
              {syncResult.errors.map((e, i) => (
                <li key={i}>{e.title}: {summarizeSyncErrorReason(e.reason)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {syncState === "error" && syncResult?.error && (
        <div className="admin-notice admin-notice-error">
          <p style={{ margin: 0 }}>Sync failed: {summarizeSyncErrorReason(syncResult.error)}</p>
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
    const errorCount = syncResult?.errors?.length || 0;
    const newSource = {
      ...source,
      current_sync_processed: 0,
      current_sync_stage: null,
      current_sync_started_at: null,
      current_sync_total: 0,
      last_synced_at: new Date().toISOString(),
      last_sync_status: errorCount > 0 ? (syncResult.synced > 0 ? "partial" : "error") : "ok",
      last_sync_error: errorCount > 0
        ? syncResult.errors.map((e) => `${e.title}: ${summarizeSyncErrorReason(e.reason)}`).join("; ")
        : null,
      docCounts: {
        total: (syncResult?.synced || 0) + (syncResult?.skipped || 0) + errorCount,
        indexed: syncResult?.synced || 0,
        error: errorCount,
        pending: 0,
        skipped: syncResult?.skipped || 0,
      },
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
          No Drive sources configured yet. Add a publicly shared Google Drive folder to make its PDF files searchable via the assistant.
        </p>
      )}

      <div className="assistant-drive-list">
        {sources.map((source) => (
          <DriveSourceRow key={source.id} source={source} onDeleted={handleDeleted} />
        ))}
      </div>

      {showForm ? (
        <div className="assistant-drive-form-wrap">
          <AddDriveSourceForm
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <button
          className="secondary-button button-compact assistant-drive-add-btn"
          onClick={() => setShowForm(true)}
          type="button"
        >
          <Plus size={14} />
          Add Google Drive folder
        </button>
      )}
    </div>
  );
}
