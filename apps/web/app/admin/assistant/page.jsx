import { DashboardShell } from "@/components/dashboard-shell";
import { fetchAssistantIndexStats } from "@/lib/assistant-index-health";
import { adminNav } from "@/lib/patna-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import {
  Activity,
  BookOpenText,
  Database,
  FolderOpen,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AssistantReindexButton } from "./components/assistant-reindex-button";
import { DriveSourceManager } from "./components/drive-source-manager";

const SOURCE_TYPE_LABELS = {
  thread: "Discussions (threads)",
  comment: "Discussion replies",
  content_item: "Publications (Insights Hub)",
  event: "Events & Calendar",
  profile: "Member Directory",
  community_application: "Applications",
  external_document: "Uploaded documents",
};

const SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABELS);

function formatDate(value) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
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

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="AI"
      navItems={adminNav}
      title="PATNA Assistant"
      subtitle="Manage the AI assistant index and data sources."
    >
      <div className="assistant-admin-page">
        <section className="assistant-page-intro-card">
          <div className="assistant-page-intro-copy">
            <div className="assistant-page-intro-label">
              <Sparkles size={14} />
              <span>System overview</span>
            </div>
            <h2>Keep the assistant easy to understand, current, and healthy.</h2>
            <p>
              This page is organised around three jobs: checking index health,
              reviewing connected knowledge sources, and syncing new material
              without reprocessing everything.
            </p>
          </div>

          <div className="assistant-page-nav" aria-label="Assistant page sections">
            <a className="assistant-page-nav-link" href="#assistant-health">
              <Activity size={14} />
              <span>Health</span>
            </a>
            <a className="assistant-page-nav-link" href="#assistant-sources">
              <BookOpenText size={14} />
              <span>Source types</span>
            </a>
            <a className="assistant-page-nav-link" href="#assistant-drive">
              <FolderOpen size={14} />
              <span>Drive folders</span>
            </a>
            <a className="assistant-page-nav-link" href="#assistant-sync">
              <RefreshCw size={14} />
              <span>Sync</span>
            </a>
          </div>
        </section>

        {!stats.health.isReady && (
          <div className="admin-section">
            <div className="admin-notice admin-notice-error">
              <strong>{stats.health.issueSummary}</strong>
              <div style={{ marginTop: "0.5rem" }}>
                {failingChecks.map((check) => (
                  <p key={check.description} style={{ margin: "0.25rem 0" }}>
                    {check.description}: {check.error?.message || "Unavailable"}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <section className="admin-section" id="assistant-health">
          <div className="admin-section-header">
            <div className="admin-section-heading">
              <span className="admin-section-icon">
                <ShieldCheck size={16} />
              </span>
              <h2 className="admin-section-title">Index health</h2>
            </div>
            <p className="admin-section-description">
              Last indexed: {formatDate(stats.lastIndexedAt)}
            </p>
          </div>

          <div className="admin-stat-grid admin-stat-grid-3">
            <div className="admin-stat-card">
              <strong>{stats.total}</strong>
              <h4>Total documents</h4>
              <p>Across all sources</p>
            </div>
            <div className="admin-stat-card tone-success">
              <strong>{stats.bySourceType.filter((r) => (r.count ?? 0) > 0).length}</strong>
              <h4>Active sources</h4>
              <p>Sources with indexed content</p>
            </div>
            <div className="admin-stat-card tone-muted">
              <strong>{bySourceType.filter((r) => (r.count ?? 0) === 0).length}</strong>
              <h4>Empty sources</h4>
              <p>{stats.health.isReady ? "Not yet indexed" : "Infra not ready"}</p>
            </div>
          </div>
        </section>

        <section className="admin-section" id="assistant-sources">
          <div className="admin-section-header">
            <div className="admin-section-heading">
              <span className="admin-section-icon">
                <Database size={16} />
              </span>
              <h2 className="admin-section-title">Data sources</h2>
            </div>
            <p className="admin-section-description">
              Documents indexed by source type. Run a full reindex from the CLI
              with <code>pnpm assistant:reindex</code>.
            </p>
          </div>

          <div className="assistant-source-grid">
            {bySourceType.map(({ sourceType, count }) => (
              <article className="assistant-source-card" key={sourceType}>
                <div className="assistant-source-card-top">
                  <h3>{SOURCE_TYPE_LABELS[sourceType]}</h3>
                  {!stats.health.isReady ? (
                    <span className="status-chip chip-error">Not deployed</span>
                  ) : count === null ? (
                    <span className="status-chip chip-error">Error</span>
                  ) : count === 0 ? (
                    <span className="status-chip chip-muted">Empty</span>
                  ) : (
                    <span className="status-chip chip-success">Indexed</span>
                  )}
                </div>
                <strong>{count ?? "—"}</strong>
                <p>Indexed documents available to the assistant.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section" id="assistant-drive">
          <div className="admin-section-header">
            <div className="admin-section-heading">
              <span className="admin-section-icon">
                <FolderOpen size={16} />
              </span>
              <h2 className="admin-section-title">Google Drive sources</h2>
            </div>
            <p className="admin-section-description">
              Add publicly shared Google Drive folders to make their PDF files searchable
              by the assistant. Sync is manual — use "Sync now" after adding new files.
            </p>
          </div>
          <DriveSourceManager initialSources={driveSources} />
        </section>

        <section className="admin-section" id="assistant-sync">
          <div className="admin-section-header">
            <div className="admin-section-heading">
              <span className="admin-section-icon">
                <RefreshCw size={16} />
              </span>
              <h2 className="admin-section-title">Incremental sync</h2>
            </div>
            <p className="admin-section-description">
              Sync the most recently updated records for each source type without
              clearing existing embeddings. Use this after publishing new content.
            </p>
          </div>
          <AssistantReindexButton health={stats.health} />
        </section>
      </div>
    </DashboardShell>
  );
}
