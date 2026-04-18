import { DashboardShell } from "@/components/dashboard-shell";
import { fetchAssistantIndexStats } from "@/lib/assistant-index-health";
import { adminNav } from "@/lib/patna-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import {
  Activity,
  BookOpenText,
  CheckCircle2,
  Database,
  FolderOpen,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AssistantReindexButton } from "./components/assistant-reindex-button";
import { CollapsibleSection } from "./components/collapsible-section";
import { DriveSourceManager } from "./components/drive-source-manager";

const SOURCE_TYPE_LABELS = {
  thread: "Discussions",
  comment: "Replies",
  content_item: "Publications",
  event: "Events",
  profile: "Members",
  community_application: "Applications",
  external_document: "Uploaded docs",
};

const SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABELS);

function formatDate(value) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

async function fetchDriveSources(adminSupabase) {
  const { data: sources } = await adminSupabase
    .from("assistant_external_sources")
    .select("id, title, provider, source_url, external_folder_id, visibility, status, last_synced_at, last_sync_status, last_sync_error, current_sync_total, current_sync_processed, current_sync_stage, current_sync_started_at, created_at")
    .order("created_at", { ascending: false });

  if (!sources?.length) return [];

  const sourceIds = sources.map((s) => s.id);
  const { data: docRows } = await adminSupabase
    .from("assistant_external_documents")
    .select("source_id, status")
    .in("source_id", sourceIds);

  const docCounts = {};
  for (const row of docRows || []) {
    if (!docCounts[row.source_id]) {
      docCounts[row.source_id] = { total: 0, indexed: 0, error: 0, pending: 0, skipped: 0 };
    }
    docCounts[row.source_id].total += 1;
    docCounts[row.source_id][row.status] = (docCounts[row.source_id][row.status] || 0) + 1;
  }

  return sources.map((s) => ({ ...s, docCounts: docCounts[s.id] || { total: 0, indexed: 0, error: 0, pending: 0, skipped: 0 } }));
}

export default async function AdminAssistantPage() {
  await requireAdminContext();
  const adminSupabase = createSupabaseAdminClient();
  const [stats, driveSources] = await Promise.all([
    fetchAssistantIndexStats({ adminSupabase }),
    fetchDriveSources(adminSupabase),
  ]);

  const bySourceType = SOURCE_TYPES.map((sourceType) => {
    const match = stats.bySourceType.find((item) => item.sourceType === sourceType);
    return match || { sourceType, count: null };
  });

  const failingChecks = Object.values(stats.health.checks).filter((check) => !check.ok);
  const activeSourceCount = stats.bySourceType.filter((r) => (r.count ?? 0) > 0).length;
  const emptySourceCount = bySourceType.filter((r) => (r.count ?? 0) === 0).length;

  const healthBadge = stats.health.isReady
    ? <span className="status-chip chip-success"><CheckCircle2 size={11} /> Healthy</span>
    : <span className="status-chip chip-error"><TriangleAlert size={11} /> Issue detected</span>;

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="AI"
      navItems={adminNav}
      title="PATNA Assistant"
      subtitle="Manage the AI knowledge index and connected data sources."
    >
      <div className="assistant-admin-page">

        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <div className="assistant-intro-bar">
          <div className="assistant-intro-label">
            <Sparkles size={13} />
            <span>How this page works</span>
          </div>
          <p className="assistant-intro-text">
            Check index health, review connected data sources, add Google Drive folders, and
            run an incremental sync after publishing new content. Each section can be
            collapsed once you&apos;re familiar.
          </p>
        </div>

        {/* ── Health ────────────────────────────────────────────────────── */}
        <CollapsibleSection
          id="assistant-health"
          icon={<Activity size={15} />}
          title="Index health"
          badge={healthBadge}
          meta={`Last indexed: ${formatDate(stats.lastIndexedAt)}`}
          defaultOpen
        >
          {!stats.health.isReady && (
            <div className="admin-notice admin-notice-error" style={{ marginBottom: "1rem" }}>
              <strong>{stats.health.issueSummary}</strong>
              {failingChecks.map((check) => (
                <p key={check.description} style={{ margin: "0.25rem 0 0" }}>
                  {check.description}: {check.error?.message || "Unavailable"}
                </p>
              ))}
            </div>
          )}

          <div className="admin-stat-grid admin-stat-grid-3">
            <div className="admin-stat-card">
              <strong>{stats.total.toLocaleString()}</strong>
              <h4>Total documents</h4>
              <p>Indexed across all sources</p>
            </div>
            <div className="admin-stat-card tone-success">
              <strong>{activeSourceCount}</strong>
              <h4>Active sources</h4>
              <p>Sources with indexed content</p>
            </div>
            <div className={`admin-stat-card ${emptySourceCount > 0 ? "tone-muted" : "tone-success"}`}>
              <strong>{emptySourceCount}</strong>
              <h4>Empty sources</h4>
              <p>{stats.health.isReady ? "Not yet indexed" : "Infra not ready"}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Data sources ──────────────────────────────────────────────── */}
        <CollapsibleSection
          id="assistant-sources"
          icon={<Database size={15} />}
          title="Data sources"
          meta={`${stats.total.toLocaleString()} documents`}
          defaultOpen
        >
          <p className="assistant-section-hint">
            Documents indexed by source type. Run a full reindex from the CLI with{" "}
            <code>pnpm assistant:reindex</code>.
          </p>
          <div className="assistant-source-grid">
            {bySourceType.map(({ sourceType, count }) => (
              <article className="assistant-source-card" key={sourceType}>
                <div className="assistant-source-card-top">
                  <h3>{SOURCE_TYPE_LABELS[sourceType]}</h3>
                  {!stats.health.isReady ? (
                    <span className="status-chip chip-error">No infra</span>
                  ) : count === null ? (
                    <span className="status-chip chip-error">Error</span>
                  ) : count === 0 ? (
                    <span className="status-chip chip-muted">Empty</span>
                  ) : (
                    <span className="status-chip chip-success">Indexed</span>
                  )}
                </div>
                <strong>{count != null ? count.toLocaleString() : "—"}</strong>
                <p>documents</p>
              </article>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── Drive sources ─────────────────────────────────────────────── */}
        <CollapsibleSection
          id="assistant-drive"
          icon={<FolderOpen size={15} />}
          title="Google Drive folders"
          meta={driveSources.length > 0 ? `${driveSources.length} source${driveSources.length !== 1 ? "s" : ""}` : undefined}
          defaultOpen
        >
          <p className="assistant-section-hint">
            Add publicly shared Google Drive folders to make their PDF files searchable by the
            assistant. Sync is manual — use <strong>Sync now</strong> after adding new files to a folder.
          </p>
          <DriveSourceManager initialSources={driveSources} />
        </CollapsibleSection>

        {/* ── Incremental sync ──────────────────────────────────────────── */}
        <CollapsibleSection
          id="assistant-sync"
          icon={<RefreshCw size={15} />}
          title="Incremental sync"
          defaultOpen={false}
        >
          <p className="assistant-section-hint">
            Re-indexes the 20 most recently updated records for each data source without clearing
            existing embeddings. Use this after publishing new community content.
          </p>
          <AssistantReindexButton health={stats.health} />
        </CollapsibleSection>

      </div>
    </DashboardShell>
  );
}
