import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionIntro } from "@/components/section-intro";
import {
  homeStats,
  homePillars,
  leapPhases,
  cohortSnapshots,
  homePublications,
  partnerNames,
} from "@/lib/patna-data";
import { fetchPublicEvents } from "@/lib/events";

export const metadata = {
  title: "Home",
  description:
    "Data-driven climate action and energy transition for Africa through PATNA's convenings, evidence, and institutional collaboration.",
};

export default async function HomePage() {
  const t = await getTranslations();
  const events = await fetchPublicEvents({ limit: 3 });

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero hero-video-home" aria-label="PATNA hero">
        <div className="hero-video-wrap" aria-hidden="true">
          <iframe
            src="https://www.canva.com/design/DAGpKRRoMc0/pmmffpju8mqva4y/view?embed"
            className="hero-video-iframe"
            allow="autoplay"
            loading="lazy"
            title=""
          />
        </div>
        <div className="hero-video-overlay" aria-hidden="true" />

        <div className="hero-video-content">
          <div className="hero-video-inner">
            <p className="eyebrow hero-eyebrow">
              The Professional African Technical Network Advisory Initiative
            </p>
            <h1 className="hero-video-h1">
              Where African expertise meets the world's most consequential climate &amp; energy transition decisions.
            </h1>
            <p className="hero-video-sub">
              The PATNA Initiative is a non-profit network of 100+ experts across academia, policymaking,
              legal specialities, and technical professions working at the intersection of maritime governance,
              energy transition, and African development.
            </p>
            <div className="hero-actions">
              <Link className="primary-button hero-video-primary" href="/community/join">
                Join the Community →
              </Link>
              <Link className="secondary-button hero-video-secondary" href="/projects">
                Explore Our Work
              </Link>
            </div>
          </div>
        </div>

        {/* Stat bar */}
        <div className="hero-stat-bar" aria-label="Key figures">
          {homeStats.map((stat) => (
            <div className="hero-stat-bar-cell" key={stat.label}>
              <strong className="hero-stat-bar-num">{stat.value}</strong>
              <span className="hero-stat-bar-lbl">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── MOMENT BAND ── */}
      <div className="moment-band" role="note">
        <span className="moment-band-pill">Historic Milestone</span>
        <p className="moment-band-text">
          Africa's Continental Maritime Decarbonisation Strategy formally adopted at the AU STC-T&E 5th Ordinary Session — April 2026. PATNA served as lead technical consultant.
        </p>
        <Link className="moment-band-link" href="/insights">
          Read the Report →
        </Link>
      </div>

      {/* ── PARTNERS ── */}
      <section className="section partners-marquee-section" aria-label="Partners and institutional affiliations">
        <div className="partners-marquee-inner">
          <p className="partners-marquee-label">Trusted by leading institutions across Africa and globally</p>
          <div className="partners-marquee-track-wrap" aria-hidden="true">
            <ul className="partners-marquee-track">
              {[...partnerNames, ...partnerNames].map((name, i) => (
                <li className="partners-marquee-badge" key={i}>{name}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── ABOUT INTRO ── */}
      <section className="section about-intro-section">
        <div className="section-inner">
          <div className="about-intro-grid">
            <div className="about-intro-copy">
              <div className="section-label">About PATNA</div>
              <h2 className="section-title about-intro-title">
                Africa must shape the energy transition it is uniquely positioned to supply.
              </h2>
              <p className="about-intro-lead">
                The global push for net-zero emissions is more than a compliance mandate; it is a historic market opportunity for Africa's abundant renewable resources. While Africa handles over 90% of its trade by sea and faces significant economic risks from rising shipping costs, it also holds 60% of the world's best solar potential.
              </p>
              <p className="about-intro-body">
                PATNA is a non-profit network of over 100 technical experts, policymakers, and researchers dedicated to ensuring Africa is a lead architect of the global energy transition. We exist to solve a critical gap: while Africa represents 44 IMO member states, without a convening of data-driven evidence, these nations often remain individually present but collectively absent from high-stakes decision-making.
              </p>
              <Link className="text-link" href="/about">
                Read our full story →
              </Link>
            </div>

            <div className="about-intro-pillars">
              {homePillars.map((pillar) => (
                <article className="about-pillar-card" key={pillar.number}>
                  <div className="about-pillar-num">{pillar.number} · {pillar.title}</div>
                  <h3 className="about-pillar-subtitle">{pillar.subtitle}</h3>
                  <p className="about-pillar-body">{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY SNAPSHOT ── */}
      <section className="section community-snapshot-section" aria-label="Community snapshot">
        <div className="community-snapshot-inner">
          <div className="community-snapshot-header">
            <div>
              <div className="section-label section-label-light">Our Community</div>
              <h2 className="section-title community-snapshot-title">
                Experts shaping Africa's energy future.
              </h2>
              <p className="community-snapshot-sub">
                The PATNA community is structured around four professional cohorts, each bringing distinct expertise to the organisation's core mission.
              </p>
            </div>
            <Link className="text-link community-snapshot-link" href="/community">
              View all members →
            </Link>
          </div>

          <div className="community-snapshot-grid">
            {cohortSnapshots.map((member) => (
              <article className="snapshot-card" key={member.name}>
                <div className="snapshot-card-av" aria-hidden="true">
                  {member.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div className="snapshot-card-body">
                  <strong className="snapshot-card-name">{member.name}</strong>
                  <span className="snapshot-card-role">{member.role}</span>
                  <span className="snapshot-card-org">{member.org}</span>
                  <div className="snapshot-card-meta">
                    <span className="snapshot-card-country">{member.flag} {member.country}</span>
                    <span className="snapshot-card-cohort">{member.cohort}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEAP PROJECTS ── */}
      <section className="section leap-section">
        <div className="section-inner">
          <SectionIntro
            label="Flagship Programme"
            title="The LEAP Project Series"
            subtitle="Leading Effective Afrocentric Participation. Three phases. Over two years. One goal: ensuring Africa shapes the IMO's Net-Zero Framework rather than inheriting it."
          />

          <div className="leap-grid">
            {leapPhases.map((phase) => (
              <article className="leap-card" key={phase.slug} data-status={phase.status}>
                <div className="leap-card-head">
                  <span className={`leap-status-pill leap-status-${phase.status}`}>
                    {phase.status === "active" ? "Active 2026" : "Complete"}
                  </span>
                </div>
                <div className="leap-card-body">
                  <div className="leap-card-phase">{phase.phase}</div>
                  <h3 className="leap-card-title">{phase.title}</h3>
                  <div className="leap-card-meta">
                    <span>{phase.period}</span>
                    {phase.countryCount && <span>{phase.countryCount} countries</span>}
                  </div>
                  <p className="leap-card-desc">{phase.body}</p>
                  <Link className="text-link" href={phase.sourceUrl}>
                    Read the full project →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PUBLICATIONS ── */}
      <section className="section home-publications-section">
        <div className="section-inner">
          <SectionIntro
            label="Latest Insights"
            title="Africa-grounded evidence for global decisions."
          />

          <div className="home-pub-grid">
            {/* Featured */}
            <article className="home-pub-featured">
              <div className="home-pub-featured-bar" aria-hidden="true" />
              <div className="home-pub-featured-meta">
                <span className="home-pub-type">{homePublications.featured.type}</span>
                <span className="home-pub-date">{homePublications.featured.date}</span>
              </div>
              <h3 className="home-pub-featured-title">{homePublications.featured.title}</h3>
              <p className="home-pub-featured-sub">{homePublications.featured.subtitle}</p>
              <p className="home-pub-featured-body">{homePublications.featured.body}</p>
              <Link className="text-link home-pub-link" href={homePublications.featured.href}>
                Download Report →
              </Link>
            </article>

            {/* Side stack */}
            <div className="home-pub-side">
              {homePublications.side.map((pub) => (
                <Link className="home-pub-side-card" href={pub.href} key={pub.title}>
                  <div className="home-pub-side-meta">
                    <span className="home-pub-type">{pub.type}</span>
                    <span className="home-pub-date">{pub.date}</span>
                  </div>
                  <h4 className="home-pub-side-title">{pub.title}</h4>
                </Link>
              ))}
            </div>
          </div>

          <div className="section-cta-row">
            <Link className="secondary-button" href="/insights">
              Browse all publications
            </Link>
          </div>
        </div>
      </section>

      {/* ── EVENTS ── */}
      {events.length > 0 && (
        <section className="section home-events-section">
          <div className="section-inner">
            <SectionIntro
              label="Calendar"
              title="Upcoming events &amp; convenings."
            />

            <div className="home-events-grid">
              {events.map((event) => (
                <article className="home-event-card" key={event.slug}>
                  <div className="home-event-date-block" aria-hidden="true">
                    <span className="home-event-month">
                      {event.displayDateDisplay?.split(" ")[1] || event.display_date?.split(" ")[1] || ""}
                    </span>
                    <span className="home-event-year">
                      {event.displayDateDisplay?.split(" ")[2] || event.display_date?.split(" ")[2] || "2026"}
                    </span>
                  </div>
                  <div className="home-event-body">
                    <span className="home-event-type">
                      {event.eventTypeDisplay || event.event_type || "Event"}
                    </span>
                    <h3 className="home-event-title">{event.title}</h3>
                    {event.location && (
                      <span className="home-event-location">{event.location}</span>
                    )}
                    <span className="home-event-status-pill">Upcoming</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="section-cta-row">
              <Link className="secondary-button" href="/events">
                View all events
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── JOIN CTA BAND ── */}
      <section className="join-band home-cta-band">
        <div className="section-inner">
          <h2>Ready to shape Africa's energy future?</h2>
          <p>
            Join a growing community of specialists, policymakers, researchers, and industry practitioners — collaborating across PATNA's four expert cohorts.
          </p>
          <div className="join-band-btns">
            <Link className="primary-button" href="/community/join">
              Join Our Community →
            </Link>
            <Link className="secondary-button" href="/work-with-us">
              Work With Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
