import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EventsArchiveClient } from "@/components/public/events-archive-client";
import { fetchPublicEvents } from "@/lib/events";

export const metadata = {
  title: "Events",
  description:
    "Browse PATNA-led convenings and the wider international policy calendar shaping African climate and maritime strategy.",
};

export default async function EventsPage() {
  const [t, events] = await Promise.all([getTranslations(), fetchPublicEvents()]);

  const featuredEvent = events.find((e) => e.schedule_status !== "past") || null;

  const cardLabels = {
    viewEvent: t("events.viewEvent"),
    officialPage: t("events.officialPage"),
    datePending: t("events.datePending"),
    locationPending: t("events.locationPending"),
    upcoming: t("events.scheduleUpcoming"),
    tbc: t("events.scheduleTbc"),
    past: t("events.schedulePast"),
  };

  return (
    <>
      {/* ── HERO ── */}
      <section className="sub-page-hero" aria-label="Events">
        <div className="sub-page-hero-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=1600&h=700&fit=crop&q=80"
            alt=""
          />
        </div>
        <div className="sub-page-hero-overlay" aria-hidden="true" />
        <div className="sub-page-hero-dot" aria-hidden="true" />
        <div className="sub-page-hero-inner">
          <div className="sub-page-hero-eyebrow">{t("events.heroEyebrow")}</div>
          <h1 className="sub-page-hero-title">{t("events.heroH1")}</h1>
          <p className="sub-page-hero-sub">{t("events.heroDesc")}</p>
        </div>
      </section>

      {/* ── FEATURED EVENT ── */}
      {featuredEvent && (
        <section className="events-feat-section" id="events-featured">
          <div className="section-inner">
            <div className="section-label">{t("events.featuredLabel")}</div>

            <div className="events-feat-grid">
              {/* Left: editorial content */}
              <div className="events-feat-content">
                <div className="events-feat-chips">
                  <span className="events-feat-type-chip">
                    {featuredEvent.eventTypeDisplay || featuredEvent.event_type || "Event"}
                  </span>
                  <span className="events-feat-status-chip">
                    {featuredEvent.schedule_status === "tbc"
                      ? t("events.scheduleTbc")
                      : t("events.scheduleUpcoming")}
                  </span>
                </div>

                <h2 className="events-feat-title">{featuredEvent.title}</h2>

                {(featuredEvent.displayDateDisplay || featuredEvent.display_date || featuredEvent.location) && (
                  <p className="events-feat-meta">
                    {featuredEvent.displayDateDisplay || featuredEvent.display_date || ""}
                    {featuredEvent.location && (
                      <span className="events-feat-meta-sep"> · {featuredEvent.location}</span>
                    )}
                  </p>
                )}

                {featuredEvent.summary && (
                  <p className="events-feat-summary">{featuredEvent.summary}</p>
                )}

                <div className="events-feat-actions">
                  <Link className="primary-button" href={`/events/${featuredEvent.slug}`}>
                    View event details
                  </Link>
                  {featuredEvent.official_link && (
                    <a
                      className="secondary-button"
                      href={featuredEvent.official_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Official page ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Right: image */}
              <div className="events-feat-image-wrap">
                <img
                  className="events-feat-img"
                  src={
                    featuredEvent.cover_image_url ||
                    "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=900&h=680&fit=crop&q=80"
                  }
                  alt={featuredEvent.cover_image_alt || featuredEvent.title}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ARCHIVE ── */}
      <section className="section section-tinted events-archive-section" id="events-archive">
        <div className="section-inner">
          <div className="section-label">{t("events.archiveLabel")}</div>
          <h2 className="section-title">{t("events.archiveTitle")}</h2>
          <EventsArchiveClient events={events} cardLabels={cardLabels} />
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="join-band join-band-v4">
        <div>
          <h2>Never miss a critical negotiation.</h2>
          <p>
            PATNA members receive pre-session briefings, delegation access, and post-session
            analysis for every major IMO, UNFCCC, and AU meeting.
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
