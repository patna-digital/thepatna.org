import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EventArchiveCard } from "@/components/public/event-archive-card";
import { EventsArchiveClient } from "@/components/public/events-archive-client";
import { fetchPublicEvents, isPatnaLedEvent } from "@/lib/events";

export const metadata = {
  title: "Events",
  description:
    "Browse PATNA-led convenings and the wider international policy calendar shaping African climate and maritime strategy.",
};

export default async function EventsPage() {
  const [t, events] = await Promise.all([getTranslations(), fetchPublicEvents()]);
  const upcomingEvents = events.filter((e) => e.schedule_status !== "past");
  const featuredEvent = upcomingEvents[0] || null;
  const remainingUpcoming = upcomingEvents.slice(1);

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
        <div className="feat-split-section" id="events-featured">
          <div className="feat-split-inner">
            <div className="feat-split-bar">
              <span className="feat-split-label">{t("events.featuredLabel")}</span>
              <Link className="feat-split-view-all" href="#events-archive">
                {t("events.viewAllEvents")}
              </Link>
            </div>

            <div className="feat-split-grid">
              {/* Large featured card */}
              <div className="feat-main-card feat-main-card--event">
                <div className="feat-main-img">
                  <img
                    src={featuredEvent.cover_image_url || "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=900&h=680&fit=crop&q=80"}
                    alt={featuredEvent.cover_image_alt || featuredEvent.title}
                  />
                  <div className="feat-main-img-overlay" />
                  {featuredEvent.schedule_status && (
                    <span className="feat-main-status feat-status-active">
                      {featuredEvent.schedule_status === "tbc" ? t("events.dateTbc") : t("events.scheduleUpcoming")}
                    </span>
                  )}
                  <span style={{
                    fontFamily: "var(--serif)",
                    fontSize: "5rem",
                    fontWeight: 500,
                    color: "rgba(225,240,247,0.08)",
                    position: "absolute",
                    right: "1.25rem",
                    bottom: "-0.5rem",
                    lineHeight: 1,
                    pointerEvents: "none",
                    userSelect: "none",
                  }} aria-hidden="true">
                    {featuredEvent.displayDateDisplay?.split(" ")[1] || featuredEvent.display_date?.split(" ")[1] || ""}
                  </span>
                </div>
                <div className="feat-main-body">
                  <div className="feat-main-tag">
                    {featuredEvent.displayDateDisplay || featuredEvent.display_date || "Date TBC"}
                    {featuredEvent.location ? ` · ${featuredEvent.location}` : ""}
                  </div>
                  <h2 className="feat-main-title">{featuredEvent.title}</h2>
                  {featuredEvent.description && (
                    <p className="feat-main-desc">{featuredEvent.description}</p>
                  )}
                  <div className="feat-main-footer">
                    <div className="feat-main-meta">
                      {featuredEvent.eventTypeDisplay || featuredEvent.event_type || "Event"}
                      {isPatnaLedEvent(featuredEvent) ? " · PATNA-led" : ""}
                    </div>
                    {featuredEvent.external_url && (
                      <a
                        className="feat-main-cta"
                        href={featuredEvent.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Official page →
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Side list of next upcoming events */}
              <div className="feat-side-list">
                {remainingUpcoming.slice(0, 3).map((event) => (
                  <div className="feat-side-item" key={event.id || event.slug}>
                    <div className="feat-side-content">
                      <div className="feat-side-tag">
                        {event.eventTypeDisplay || event.event_type || "Event"} · {event.schedule_status === "tbc" ? "Date TBC" : "Upcoming"}
                      </div>
                      <div className="feat-side-title">{event.title}</div>
                      <div className="feat-side-meta">
                        {event.displayDateDisplay || event.display_date || ""}
                        {event.location ? ` · ${event.location}` : ""}
                      </div>
                    </div>
                    {event.external_url ? (
                      <a
                        href={event.external_url}
                        className="feat-side-arrow"
                        target="_blank"
                        rel="noopener noreferrer"
                      >→</a>
                    ) : (
                      <span className="feat-side-arrow" style={{ color: "var(--ink-muted)" }}>→</span>
                    )}
                  </div>
                ))}

                {upcomingEvents.length === 0 && (
                  <div className="feat-side-item" style={{ cursor: "default" }}>
                    <div className="feat-side-content">
                      <div className="feat-side-tag">IMO · 2026</div>
                      <div className="feat-side-title">MEPC 83 / ES.2 Resumed Session</div>
                      <div className="feat-side-meta">London, United Kingdom · IMO Headquarters</div>
                    </div>
                    <span className="feat-side-arrow" style={{ color: "var(--ink-muted)" }}>→</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UPCOMING EVENTS GRID ── */}
      {upcomingEvents.length > 0 && (
        <section className="section" id="events-upcoming">
          <div className="section-inner">
            <div className="section-label">On the Calendar</div>
            <h2 className="section-title">Upcoming events</h2>
            <p style={{ fontSize: "15px", color: "var(--ink-soft)", maxWidth: "600px", marginTop: "0.5rem", lineHeight: "1.7" }}>
              IMO negotiating sessions, continental summits, capacity-building workshops, and regional convenings.
            </p>
            <div className="publications-grid" style={{ marginTop: "2.5rem" }}>
              {upcomingEvents.map((event) => (
                <EventArchiveCard event={event} key={event.id || event.slug} labels={cardLabels} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ARCHIVE (search + filter) ── */}
      <section className="section section-tinted" id="events-archive">
        <div className="section-inner">
          <div className="section-label">Archive</div>
          <h2 className="section-title">All events &amp; past sessions</h2>
          <p style={{ fontSize: "15px", color: "var(--ink-soft)", maxWidth: "600px", marginTop: "0.5rem", lineHeight: "1.7" }}>
            A full record of PATNA's participation across international forums, regional workshops, and policy convenings.
          </p>
          <div style={{ marginTop: "2.5rem" }}>
            <EventsArchiveClient
              cardLabels={cardLabels}
              clearLabel="Clear"
              defaultResultsLabel="{count} events"
              emptyBody="No events match your search. Try a different term."
              emptyTitle="No events found"
              events={events}
              placeholder="Search events…"
              searchLabel="Search"
              searchResultsLabel="{count} results"
            />
          </div>
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="join-band join-band-v4">
        <div>
          <h2>Never miss a critical negotiation.</h2>
          <p>
            PATNA members receive pre-session briefings, delegation access, and post-session analysis for every major IMO, UNFCCC, and AU meeting.
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
