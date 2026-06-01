import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PublicationBreadcrumb } from "@/components/publication-breadcrumb";
import { PublicationsArchiveClient } from "@/components/public/publications-archive-client";
import { fetchPublicPublications } from "@/lib/publications";

export const metadata = {
  title: "Insights",
  description:
    "Browse PATNA's latest reports, commentary, and public knowledge products drawn from the live publications archive.",
};

export default async function InsightsPage() {
  const [t, publications] = await Promise.all([
    getTranslations(),
    fetchPublicPublications(),
  ]);

  const featuredPub = publications[0] || null;
  const cardLabels = { readMore: t("publicationUi.readMore") };

  return (
    <>
      {/* ── HERO ── */}
      <section className="sub-page-hero" aria-label="Insights">
        <div className="sub-page-hero-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&h=700&fit=crop&q=80"
            alt=""
          />
        </div>
        <div className="sub-page-hero-overlay" aria-hidden="true" />
        <div className="sub-page-hero-dot" aria-hidden="true" />
        <div className="sub-page-hero-inner">
          <div className="sub-page-hero-eyebrow">Knowledge &amp; Research</div>
          <h1 className="sub-page-hero-title">
            Africa-grounded <em>intelligence</em>
          </h1>
          <p className="sub-page-hero-sub">
            Meeting reports, policy briefs, and technical analyses timed to every major IMO and
            UNFCCC session — ensuring African delegations are never without the evidence they need.
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="page-breadcrumb-strip">
        <div className="section-inner">
          <PublicationBreadcrumb
            crumbs={[
              { label: "Home", href: "/" },
              { label: "Insights" },
            ]}
          />
        </div>
      </div>

      {/* ── FEATURED PUBLICATION ── */}
      {featuredPub && (
        <section className="events-feat-section" id="insights-featured">
          <div className="section-inner">
            <div className="section-label">Latest Publication</div>

            <div className="events-feat-grid">
              {/* Left: editorial content */}
              <div className="events-feat-content">
                <div className="events-feat-chips">
                  <span className="events-feat-type-chip">
                    {featuredPub.contentTypeLabel || featuredPub.content_type || "Publication"}
                  </span>
                  {featuredPub.published_at && (
                    <span className="events-feat-date-chip">
                      {new Date(featuredPub.published_at).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <h2 className="events-feat-title">{featuredPub.title}</h2>

                {featuredPub.summary && (
                  <p className="events-feat-summary">{featuredPub.summary}</p>
                )}

                {featuredPub.tags?.length > 0 && (
                  <div className="insights-feat-tags">
                    {featuredPub.tags.slice(0, 3).map((tag) => (
                      <span className="status-chip chip-neutral" key={tag.slug}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="events-feat-actions">
                  <Link
                    className="primary-button"
                    href={`/publications/${featuredPub.slug}`}
                  >
                    Read publication
                  </Link>
                  <Link
                    className="secondary-button"
                    href="#insights-all"
                  >
                    Browse all →
                  </Link>
                </div>
              </div>

              {/* Right: cover image */}
              <div className="events-feat-image-wrap">
                <img
                  alt={featuredPub.cover_image_alt || featuredPub.title}
                  className="events-feat-img"
                  src={
                    featuredPub.cover_image_url ||
                    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&h=680&fit=crop&q=80"
                  }
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ARCHIVE ── */}
      <section
        className="section section-tinted events-archive-section"
        id="insights-all"
      >
        <div className="section-inner">
          <div className="section-label">All Publications</div>
          <h2 className="section-title">Reports, briefs &amp; analyses</h2>
          <PublicationsArchiveClient
            labels={cardLabels}
            publications={publications}
          />
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="join-band join-band-v4">
        <div>
          <h2>Get PATNA intelligence in your inbox.</h2>
          <p>
            Member briefings, rapid-response analyses, and session reports — delivered before
            every major IMO and UNFCCC meeting.
          </p>
          <div className="join-band-ctas">
            <Link className="cta-primary" href="/community/join">
              Join the Community →
            </Link>
            <Link className="cta-secondary" href="/work-with-us">
              Work With Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
