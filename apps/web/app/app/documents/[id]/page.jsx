import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { memberNav } from "@/lib/patna-data";

const VISIBILITY_LABELS = {
  public: "Public",
  members: "Members",
  admin_only: "Admin only",
};

function formatDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(parsed);
}

export default async function ExternalDocumentPage({ params }) {
  const { id } = await params;
  const { user, isAdmin } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: true,
  });

  if (!user) {
    redirect(`/auth/login?next=/app/documents/${id}`);
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: doc } = await adminSupabase
    .from("assistant_external_documents")
    .select("id, title, mime_type, source_url, modified_at, last_indexed_at, status, source_id, assistant_external_sources(id, title, visibility, source_url)")
    .eq("id", id)
    .maybeSingle();

  if (!doc) {
    notFound();
  }

  const source = doc.assistant_external_sources;

  if (source?.visibility === "admin_only" && !isAdmin) {
    notFound();
  }

  const modifiedLabel = formatDate(doc.modified_at);
  const indexedLabel = formatDate(doc.last_indexed_at);
  const visibilityLabel = VISIBILITY_LABELS[source?.visibility] || source?.visibility || "—";

  return (
    <DashboardShell
      brandHref="/app"
      brandLabel="PATNA"
      navItems={memberNav}
      title={doc.title}
      eyebrow="Document"
      subtitle={source?.title ? `From: ${source.title}` : undefined}
    >
      <div className="admin-section">
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1.5rem", maxWidth: 540 }}>
          <dt style={{ fontWeight: 600 }}>Source folder</dt>
          <dd style={{ margin: 0 }}>
            {source?.source_url ? (
              <a href={source.source_url} target="_blank" rel="noopener noreferrer">
                {source.title || "Google Drive folder"} ↗
              </a>
            ) : (
              source?.title || "—"
            )}
          </dd>

          <dt style={{ fontWeight: 600 }}>Visibility</dt>
          <dd style={{ margin: 0 }}>{visibilityLabel}</dd>

          <dt style={{ fontWeight: 600 }}>File type</dt>
          <dd style={{ margin: 0 }}>{doc.mime_type}</dd>

          {modifiedLabel && (
            <>
              <dt style={{ fontWeight: 600 }}>Last modified</dt>
              <dd style={{ margin: 0 }}>{modifiedLabel}</dd>
            </>
          )}

          {indexedLabel && (
            <>
              <dt style={{ fontWeight: 600 }}>Last indexed</dt>
              <dd style={{ margin: 0 }}>{indexedLabel}</dd>
            </>
          )}
        </dl>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a
            href={doc.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button"
          >
            Open original file ↗
          </a>
          <Link href="/app" className="secondary-button">
            Back to PATNA
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
