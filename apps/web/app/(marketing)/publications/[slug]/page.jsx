import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { fetchPublicPublicationBySlug } from "@/lib/publications";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pub = await fetchPublicPublicationBySlug(slug);
  if (!pub) return {};
  return {
    title: `${pub.title} | PATNA Publications`,
    description: pub.meta_description || pub.summary || "",
  };
}

export default async function PublicationDetailPage({ params }) {
  const { slug } = await params;
  const [pub, t, locale] = await Promise.all([
    fetchPublicPublicationBySlug(slug),
    getTranslations(),
    getLocale(),
  ]);

  if (!pub) notFound();

  const pdfAttachment = pub.attachments.find(
    (a) => a.file_type === "pdf" || a.file_url?.endsWith(".pdf")
  );
  const typeLabel = pub.contentTypeLabel || CONTENT_TYPE_LABELS[pub.content_type] || pub.content_type;

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
                  {formatDate(pub.published_at, locale)}
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
                {t("publicationUi.downloadPdf")}
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

          {/* Gallery */}
          {pub.gallery?.length > 0 && (
            <div className="publication-gallery">
              <h2 className="publication-gallery-title">Gallery</h2>
              <div className="publication-gallery-grid">
                {pub.gallery.map((image) => (
                  <figure className="publication-gallery-figure" key={image.id}>
                    <img
                      alt={image.alt_text || ""}
                      className="publication-gallery-img"
                      src={image.image_url}
                    />
                    {image.caption ? (
                      <figcaption className="publication-gallery-caption">
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="publication-detail-footer">
            <Link className="secondary-button" href="/publications">
              {t("publicationUi.backToPublications")}
            </Link>
            {pdfAttachment && (
              <a
                className="primary-button"
                download
                href={pdfAttachment.file_url}
                rel="noreferrer"
                target="_blank"
              >
                {t("publicationUi.downloadPdf")}
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

function formatDate(value, locale = "en") {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(value));
}
