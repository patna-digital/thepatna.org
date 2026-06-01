import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { PublicationBreadcrumb } from "@/components/publication-breadcrumb";
import {
  findPrimaryPublicationAttachment,
  getPublicationAttachmentFileUrl,
} from "@/lib/publication-attachments";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { fetchInsightBySlug, fetchAdjacentInsights } from "@/lib/insights";

export default async function MemberPublicationDetailPage({ params }) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    const { slug } = await params;
    redirect(`/auth/login?next=/app/publications/${slug}`);
  }

  const { slug } = await params;

  const [frameData, pubResult] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchInsightBySlug({ supabase, slug, includeUnpublished: false }),
  ]);

  const { insight: pub } = pubResult;
  if (!pub) notFound();

  const adjacent = pub.published_at
    ? await fetchAdjacentInsights({ supabase, publishedAt: pub.published_at, slug: pub.slug })
    : { prev: null, next: null };

  const sidebarUser = frameData.sidebarUser || null;
  const pdfAttachment = findPrimaryPublicationAttachment(pub.attachments);
  const readHref = getPublicationAttachmentFileUrl(pdfAttachment, { disposition: "inline" });
  const typeLabel = pub.contentTypeLabel || CONTENT_TYPE_LABELS[pub.content_type] || pub.content_type;

  return (
    <MemberWorkspaceShell
      eyebrow={t("publicationUi.eyebrow")}
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      title={pub.title}
      subtitle={typeLabel}
    >
      <div className="member-dashboard-stack">
        <div className="member-publication-breadcrumb">
          <PublicationBreadcrumb
            crumbs={[
              { label: t("publicationUi.eyebrow") || "Publications", href: "/app/publications" },
              { label: pub.title },
            ]}
          />
        </div>

        {pub.cover_image_url && (
          <div className="publication-detail-cover-member">
            <img alt={pub.cover_image_alt || pub.title} src={pub.cover_image_url} />
          </div>
        )}

        <article className="dashboard-card publication-detail-meta-card">
          <div className="publication-detail-meta-bar">
            <div className="publication-detail-meta-left">
              <span className="status-chip chip-neutral">{typeLabel}</span>
              {pub.published_at && (
                <time dateTime={pub.published_at}>{formatDate(pub.published_at, locale)}</time>
              )}
              {pub.tags?.map((tag) => (
                <span className="status-chip chip-neutral" key={tag.slug}>{tag.name}</span>
              ))}
            </div>
            {pdfAttachment && (
              <a
                className="publication-download-btn publication-download-btn-lg"
                href={readHref}
                rel="noreferrer"
                target="_blank"
              >
                {t("publicationUi.openPdf")}
              </a>
            )}
          </div>
        </article>

        <article className="dashboard-card">
          {pub.body ? (
            <div className="publication-body prose" dangerouslySetInnerHTML={{ __html: pub.body }} />
          ) : (
            pub.summary && (
              <div className="publication-body prose"><p>{pub.summary}</p></div>
            )
          )}
        </article>

        <div className="publication-detail-footer">
          <Link className="publication-back-link" href="/app/publications">
            {t("publicationUi.backToPublications")}
          </Link>
          {pdfAttachment && (
            <a className="primary-button" href={readHref} rel="noreferrer" target="_blank">
              {t("publicationUi.openPdf")}
            </a>
          )}
          {(adjacent.prev || adjacent.next) && (
            <div className="publication-prev-next">
              {adjacent.prev && (
                <Link className="publication-prev-link" href={`/app/publications/${adjacent.prev.slug}`}>
                  <span className="publication-prev-next-label">← Previous</span>
                  <span className="publication-prev-next-title">{adjacent.prev.title}</span>
                </Link>
              )}
              {adjacent.next && (
                <Link className="publication-next-link" href={`/app/publications/${adjacent.next.slug}`}>
                  <span className="publication-prev-next-label">Next →</span>
                  <span className="publication-prev-next-title">{adjacent.next.title}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </MemberWorkspaceShell>
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

function formatDate(value, locale = "en") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(value));
}
