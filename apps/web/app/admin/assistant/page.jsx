import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { AssistantReindexButton } from "./components/assistant-reindex-button";

const SOURCE_TYPE_LABELS = {
  thread: "Discussions (threads)",
  comment: "Discussion replies",
  content_item: "Publications (Insights Hub)",
  event: "Events & Calendar",
  profile: "Member Directory",
  community_application: "Applications",
};

const SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABELS);

async function fetchIndexStats(adminSupabase) {
  const results = await Promise.all(
    SOURCE_TYPES.map(async (sourceType) => {
      const { count, error } = await adminSupabase
        .from("document_embeddings")
        .select("*", { count: "exact", head: true })
        .eq("source_type", sourceType);

      return { sourceType, count: error ? null : (count ?? 0) };
    }),
  );

  const { data: latestRow } = await adminSupabase
    .from("document_embeddings")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    bySourceType: results,
    lastIndexedAt: latestRow?.updated_at ?? null,
    total: results.reduce((sum, r) => sum + (r.count ?? 0), 0),
  };
}

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

export default async function AdminAssistantPage() {
  await requireAdminContext();
  const adminSupabase = createSupabaseAdminClient();
  const stats = await fetchIndexStats(adminSupabase);

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="AI"
      navItems={adminNav}
      title="PATNA Assistant"
      subtitle="Manage the AI assistant index and data sources."
    >
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Index health</h2>
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
            <strong>{stats.bySourceType.filter((r) => (r.count ?? 0) === 0).length}</strong>
            <h4>Empty sources</h4>
            <p>Not yet indexed</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Data sources</h2>
          <p className="admin-section-description">
            Documents indexed by source type. Run a full reindex from the CLI
            with <code>pnpm assistant:reindex</code>.
          </p>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Indexed documents</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.bySourceType.map(({ sourceType, count }) => (
              <tr key={sourceType}>
                <td>{SOURCE_TYPE_LABELS[sourceType]}</td>
                <td>{count ?? "—"}</td>
                <td>
                  {count === null ? (
                    <span className="status-chip chip-error">Error</span>
                  ) : count === 0 ? (
                    <span className="status-chip chip-muted">Empty</span>
                  ) : (
                    <span className="status-chip chip-success">Indexed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Incremental sync</h2>
          <p className="admin-section-description">
            Sync the most recently updated records for each source type without
            clearing existing embeddings. Use this after publishing new content.
          </p>
        </div>
        <AssistantReindexButton />
      </div>
    </DashboardShell>
  );
}
