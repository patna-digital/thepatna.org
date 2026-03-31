import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pub = await fetchPublication(slug);
  if (!pub) return {};
  return {
    title: `${pub.title} | PATNA Publications`,
    description: pub.meta_description || pub.summary || "",
  };
}

async function fetchPublication(slug) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(`*, content_attachments(*), content_tag_map(domain_tags(id, name, slug))`)
    .eq("slug", slug)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .single();

  if (error || !data) return null;

  return {
    ...data,
    attachments: data.content_attachments || [],
    tags: data.content_tag_map?.map((t) => t.domain_tags).filter(Boolean) || [],
  };
}

export default async function PublicationDetailPage({ params }) {
  const { slug } = await params;
  const pub = await fetchPublication(slug);

  if (!pub) notFound();

  const pdfAttachment = pub.attachments.find(
    (a) => a.file_type === "pdf" || a.file_url?.endsWith(".pdf")
  );
  const typeLabel = CONTENT_TYPE_LABELS[pub.content_type] || pub.content_type;

  return (
    <>
      <MarketingPageHero
        label={typeLabel}
        title={pub.title}
        subtitle={pub.summary}
      />

      <div className="publication-detail-shell">
        <div className="publication-detail-inner">

          {/* Cover image */}
          {pub.cover_image_url && (
            <div className="publication-detail-cover">
              <img
                alt={pub.cover_image_alt || pub.title}
                className="publication-detail-cover-img"
                src={pub.cover_image_url}
              />
            </div>
          )}

          {/* Meta bar */}
          <div className="publication-detail-meta-bar">
            <div className="publication-detail-meta-left">
              <span className="status-chip chip-neutral">{typeLabel}</span>
              {pub.published_at && (
                <time dateTime={pub.published_at}>
                  {formatDate(pub.published_at)}
                </time>
              )}
              {pub.tags?.length > 0 &&
                pub.tags.map((tag) => (
                  <span className="status-chip chip-neutral" key={tag.slug}>
                    {tag.name}
                  </span>
                ))}
            </div>
            {pdfAttachment && (
              <a
                className="publication-download-btn publication-download-btn-lg"
                download
                href={pdfAttachment.file_url}
                rel="noreferrer"
                target="_blank"
              >
                ↓ Download PDF
              </a>
            )}
          </div>

          {/* Body */}
          {pub.body ? (
            <div
              className="publication-body prose"
              dangerouslySetInnerHTML={{ __html: pub.body }}
            />
          ) : (
            pub.summary && (
              <div className="publication-body prose">
                <p>{pub.summary}</p>
              </div>
            )
          )}

          {/* Footer nav */}
          <div className="publication-detail-footer">
            <Link className="secondary-button" href="/publications">
              ← Back to Publications
            </Link>
            {pdfAttachment && (
              <a
                className="primary-button"
                download
                href={pdfAttachment.file_url}
                rel="noreferrer"
                target="_blank"
              >
                ↓ Download PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const CONTENT_TYPE_LABELS = {
  report: "Report",
  brief: "Brief",
  case_study: "Case Study",
  article: "Article",
  blog: "Article",
  news: "News",
  event_output: "Event Output",
  learning_note: "Learning Note",
  workshop_proceedings: "Workshop Proceedings",
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(value));
}
