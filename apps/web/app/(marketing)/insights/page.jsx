import Link from "next/link";
import { PublicationCard } from "@/components/publication-card";
import { fetchPublicPublications } from "@/lib/publications";

export const metadata = {
  title: "Insights",
  description:
    "Browse PATNA's latest reports, commentary, and public knowledge products drawn from the live publications archive.",
};

export default async function InsightsPage() {
  const publications = await fetchPublicPublications({ limit: 9 });
  const featuredPub = publications[0] || null;
  const sidePubs = publications.slice(1, 4);
  const gridPubs = publications.slice(4);

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
            Meeting reports, policy briefs, and technical analyses timed to every major IMO and UNFCCC session — ensuring African delegations are never without the evidence they need.
          </p>
        </div>
      </section>

      {/* ── FEATURED SPLIT ── */}
      {featuredPub && (
        <div className="feat-split-section" id="insights-featured">
          <div className="feat-split-inner">
            <div className="feat-split-bar">
              <span className="feat-split-label">Latest Publication</span>
              <Link className="feat-split-view-all" href="#insights-all">
                View all publications →
              </Link>
            </div>

            <div className="feat-split-grid">
              {/* Large featured card */}
              <Link
                className="feat-main-card"
                href={`/publications/${featuredPub.slug}`}
              >
                <div className="feat-main-img">
                  <img
                    src={featuredPub.cover_image_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&h=680&fit=crop&q=80"}
                    alt={featuredPub.cover_image_alt || featuredPub.title}
                  />
                  <div className="feat-main-img-overlay" />
                  {featuredPub.contentTypeLabel && (
                    <span className="feat-main-status feat-status-upcoming">
                      {featuredPub.contentTypeLabel}
                    </span>
                  )}
                  <span style={{
                    fontFamily: "var(--serif)",
                    fontSize: "6rem",
                    fontWeight: 500,
                    color: "rgba(225,240,247,0.08)",
                    position: "absolute",
                    right: "1.25rem",
                    bottom: "-0.5rem",
                    lineHeight: 1,
                    pointerEvents: "none",
                    userSelect: "none",
                  }} aria-hidden="true">
                    {new Date(featuredPub.published_at).getFullYear() || ""}
                  </span>
                </div>
                <div className="feat-main-body">
                  <div className="feat-main-tag">
                    {featuredPub.contentTypeLabel || "Publication"}
                    {featuredPub.published_at
                      ? ` · ${new Date(featuredPub.published_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
                      : ""}
                  </div>
                  <h2 className="feat-main-title">{featuredPub.title}</h2>
                  {featuredPub.summary && (
                    <p className="feat-main-desc">{featuredPub.summary}</p>
                  )}
                  <div className="feat-main-footer">
                    <div className="feat-main-meta">
                      {featuredPub.tags?.slice(0, 2).map((t) => t.name).join(" · ")}
                    </div>
                    <span className="feat-main-cta">Read more →</span>
                  </div>
                </div>
              </Link>

              {/* Side list */}
              <div className="feat-side-list">
                {sidePubs.map((pub) => (
                  <Link
                    className="feat-side-item"
                    href={`/publications/${pub.slug}`}
                    key={pub.id}
                  >
                    <div className="feat-side-content">
                      <div className="feat-side-tag">
                        {pub.contentTypeLabel || pub.content_type || "Publication"}
                        {pub.published_at
                          ? ` · ${new Date(pub.published_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
                          : ""}
                      </div>
                      <div className="feat-side-title">{pub.title}</div>
                      <div className="feat-side-meta">{pub.summary?.slice(0, 100)}…</div>
                    </div>
                    <span className="feat-side-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLICATIONS GRID ── */}
      <section className="section section-tinted" id="insights-all">
        <div className="section-inner">
          <div className="section-label">All Publications</div>
          <h2 className="section-title">Reports, briefs &amp; analyses</h2>
          <p style={{ fontSize: "15px", color: "var(--ink-soft)", maxWidth: "600px", marginTop: "0.5rem", lineHeight: "1.7" }}>
            Evidence produced by PATNA's expert network and partners — freely available to researchers, policymakers, and practitioners.
          </p>

          {publications.length ? (
            <div className="publications-grid" style={{ marginTop: "2.5rem" }}>
              {(gridPubs.length ? gridPubs : publications).map((pub) => (
                <PublicationCard key={pub.id} publication={pub} />
              ))}
            </div>
          ) : (
            <article className="content-card" style={{ marginTop: "2.5rem" }}>
              <h3>No publications yet</h3>
              <p>Check back soon — PATNA's latest research is being prepared for release.</p>
            </article>
          )}
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="join-band join-band-v4">
        <div>
          <h2>Get PATNA intelligence in your inbox.</h2>
          <p>
            Member briefings, rapid-response analyses, and session reports — delivered before every major IMO and UNFCCC meeting.
          </p>
          <div className="join-band-ctas">
            <Link className="cta-primary" href="/community/join">Join the Community →</Link>
            <Link className="cta-secondary" href="/work-with-us">Work With Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
