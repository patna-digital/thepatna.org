import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchInsightBySlug, fetchInsightTags } from "@/lib/insights";
import { InsightForm } from "../components/insight-form";
import { updateInsightAction } from "./actions";
import { addInsightGalleryImageAction, removeInsightGalleryImageAction } from "./gallery-actions";
import { GalleryManager } from "@/components/admin/gallery-manager";
import {
  addInsightAttachmentAction,
  removeInsightAttachmentAction,
  setPrimaryInsightAttachmentAction,
} from "./attachment-actions";
import { PublicationFilesManager } from "@/components/admin/publication-files-manager";
import { orderPublicationAttachments } from "@/lib/publication-attachments";

export default async function EditInsightPage({ params }) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const { insightId } = await params;

  // Try to fetch by ID first, then by slug
  let insight = null;
  
  // Check if it's a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insightId);
  
  if (isUUID) {
    const { data } = await adminClient
      .from("content_items")
      .select(`
        *,
        content_tag_map(domain_tags(id, name, slug)),
        content_attachments(*)
      `)
      .eq("id", insightId)
      .single();
    
    if (data) {
      insight = {
        ...data,
        tags: data.content_tag_map?.map((t) => t.domain_tags).filter(Boolean) || [],
        attachments: orderPublicationAttachments(data.content_attachments || []),
      };
    }
  } else {
    // Try as slug
    const result = await fetchInsightBySlug({
      supabase: adminClient,
      slug: insightId,
      includeUnpublished: true,
    });
    insight = result.insight;
  }

  if (!insight) {
    notFound();
  }

  const [{ tags, error: tagsError }, galleryResult] = await Promise.all([
    fetchInsightTags({ supabase: adminClient }),
    adminClient
      .from("content_gallery")
      .select("id, image_url, alt_text, caption, sort_order")
      .eq("content_id", insight.id)
      .order("sort_order"),
  ]);

  const galleryImages = galleryResult.data || [];

  if (tagsError) {
    console.error("Failed to fetch tags:", tagsError);
  }

  // Wrapper action that includes the insight ID
  async function handleUpdate(formData) {
    "use server";
    return updateInsightAction(insight.id, formData);
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Edit insight",
        title: insight.title,
        body: `Update content, status, and metadata for this ${insight.content_type}.`,
      }}
      subtitle={`Edit this ${insight.content_type}. Changes are saved immediately.`}
      title="Edit insight"
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <InsightForm
            action={handleUpdate}
            cancelHref="/admin/insights"
            insight={insight}
            submitLabel="Save changes"
            tags={tags}
          />
        </article>

        <aside className="admin-form-sidebar">
          <div className="dashboard-card">
            <h3>Insight details</h3>
            <div className="insight-meta-list">
              <div className="insight-meta-item">
                <span className="insight-meta-label">ID</span>
                <span className="insight-meta-value">{insight.id.slice(0, 8)}...</span>
              </div>
              <div className="insight-meta-item">
                <span className="insight-meta-label">Slug</span>
                <span className="insight-meta-value">{insight.slug}</span>
              </div>
              <div className="insight-meta-item">
                <span className="insight-meta-label">Created</span>
                <span className="insight-meta-value">
                  {formatDate(insight.created_at)}
                </span>
              </div>
              <div className="insight-meta-item">
                <span className="insight-meta-label">Updated</span>
                <span className="insight-meta-value">
                  {formatDate(insight.updated_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <PublicationFilesManager
              addAction={addInsightAttachmentAction}
              attachments={insight.attachments || []}
              contentId={insight.id}
              removeAction={removeInsightAttachmentAction}
              setPrimaryAction={setPrimaryInsightAttachmentAction}
              slug={insight.slug}
            />
          </div>
          <div className="dashboard-card">
            <h3>Quick links</h3>
            <div className="content-meta stack" style={{ gap: "0.5rem" }}>
              <Link className="text-link" href={`/publications/${insight.slug}`} target="_blank">
                View public ↗
              </Link>
              <Link className="text-link" href={`/app/publications/${insight.slug}`} target="_blank">
                View in app ↗
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <GalleryManager
              addAction={addInsightGalleryImageAction}
              contentId={insight.id}
              contentIdFieldName="content_id"
              galleryImages={galleryImages}
              removeAction={removeInsightGalleryImageAction}
            />
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
