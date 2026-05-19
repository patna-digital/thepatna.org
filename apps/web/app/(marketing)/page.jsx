import Link from "next/link";
import { Fragment } from "react";
import { SectionIntro } from "@/components/section-intro";
import {
  homeStats,
  homePillars,
  leapPhases,
  homePublications,
  partnerNames,
} from "@/lib/patna-data";
import { fetchPublicEvents } from "@/lib/events";
import { createSupabaseAdminClient, canUseSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata = {
  title: "Home",
  description:
    "Data-driven climate action and energy transition for Africa through PATNA's convenings, evidence, and institutional collaboration.",
};

async function fetchCommunitySnapshot() {
  if (!canUseSupabaseAdmin()) return [];

  try {
    const adminClient = createSupabaseAdminClient();

    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("id, first_name, surname, title, role_title, organisation_name, country_of_residence, country_code")
      .eq("onboarding_status", "active")
      .eq("profile_status", "active")
      .limit(12);

    if (error || !profiles?.length) return [];

    const userIds = profiles.map((p) => p.id);

    const [cohortResult, headshotResult] = await Promise.all([
      adminClient
        .from("user_cohorts")
        .select("user_id, cohorts(name, slug), is_primary")
        .in("user_id", userIds)
        .eq("is_primary", true),
      adminClient
        .from("cohort_member_profiles")
        .select("user_id, headshot_url")
        .in("user_id", userIds),
    ]);

    const cohortByUser = new Map(
      (cohortResult.data || []).map((row) => [row.user_id, row.cohorts?.name || ""])
    );
    const headshotByUser = new Map(
      (headshotResult.data || []).map((row) => [row.user_id, row.headshot_url || ""])
    );

    return profiles.slice(0, 8).map((p) => ({
      id: p.id,
      name: [p.title, p.first_name, p.surname].filter(Boolean).join(" ") || "PATNA Member",
      role: p.role_title || "",
      org: p.organisation_name || "",
      country: p.country_of_residence || "",
      cohort: cohortByUser.get(p.id) || "",
      headshotUrl: headshotByUser.get(p.id) || "",
    }));
  } catch {
    return [];
  }
}

function getInitials(name) {
  const skip = new Set(["Dr", "Dr.", "Prof", "Prof.", "Mr", "Mrs", "Ms", "Ambassador", "Amb", "Maj", "Gen", "(Rt)"]);
  return name.split(" ").filter((w) => !skip.has(w)).slice(0, 2).map((w) => w[0]).join("");
}

export default async function HomePage() {
  const [events, communityMembers] = await Promise.all([
    fetchPublicEvents({ limit: 3 }),
    fetchCommunitySnapshot(),
  ]);

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
              The PATNA Initiative is a non-profit network of 100+ experts across academia, policymaking, legal specialities, and technical professions working at the intersection of maritime governance, energy transition, and African development.
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
          <strong>April 2026 — Johannesburg:</strong> Africa's first-ever Continental Strategy for the Decarbonisation of Maritime Transport adopted at AU STC-T&amp;E 5th Session. PATNA served as lead technical consultant.
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
              {partnerNames.map((n, i) => (
                <li className="partners-marquee-badge" key={`a-${i}`}>{n}</li>
              ))}
              {partnerNames.map((n, i) => (
                <li className="partners-marquee-badge" key={`b-${i}`}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPOSITION (v3 divider grid) ── */}
      <section className="value-prop-section" aria-labelledby="value-prop-heading">
        <div className="value-prop-inner">
          <div className="value-prop-header">
            <div>
              <div className="value-prop-label">Why PATNA Exists</div>
              <h2 className="value-prop-title" id="value-prop-heading">
                Three pillars.<br /><em>One purpose.</em>
              </h2>
            </div>
            <p className="value-prop-subtitle">
              Africa's maritime climate future is decided in rooms where the continent has long been absent. PATNA was built to change that — permanently — through evidence, coordination, and expert advisory presence at every critical juncture.
            </p>
          </div>

          <div className="value-prop-pillars">
            {homePillars.map((pillar, i) => (
              <Fragment key={pillar.number}>
                {i > 0 && <div className="value-prop-divider" aria-hidden="true" />}
                <article className="value-prop-pillar">
                  <div className="value-prop-pillar-num">{pillar.number}</div>
                  <h3 className="value-prop-pillar-title">{pillar.title}</h3>
                  <p className="value-prop-pillar-body">{pillar.body}</p>
                  <div className="value-prop-proof">{pillar.proof}</div>
                </article>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT INTRO ── */}
      <section className="about-intro-section-v3">
        <div className="section-inner">
          <div className="section-label">About PATNA</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Africa must shape the energy transition it is uniquely <em style={{ fontStyle: "italic", color: "var(--ochre)" }}>positioned to supply.</em>
          </h2>

          <div className="about-intro-grid-v3">
            <div className="about-intro-text-v3">
              <p>
                The global push for net-zero emissions is more than a compliance mandate; it is a historic market opportunity for Africa's abundant renewable resources. While Africa handles over 90% of its trade by sea and faces significant economic risks from rising shipping costs, it also holds 60% of the world's best solar potential.
              </p>
              <p>
                This positioning allows the continent to supply the green hydrogen and ammonia the global fleet needs to meet International Maritime Organization (IMO) targets. Without strategic engagement, a net-zero framework could increase African shipping costs by 20% by 2035; with it, Africa can unlock a green export market worth hundreds of billions of dollars.
              </p>
              <Link className="about-intro-link-v3" href="/about">
                Read our full story →
              </Link>
            </div>

            <div className="about-intro-stats" aria-label="PATNA by the numbers">
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">100<sup>+</sup></span>
                <span className="about-intro-stat-lbl">African experts in the network</span>
              </div>
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">54</span>
                <span className="about-intro-stat-lbl">AU member states engaged</span>
              </div>
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">4</span>
                <span className="about-intro-stat-lbl">Expert cohorts deployed</span>
              </div>
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">3</span>
                <span className="about-intro-stat-lbl">LEAP project phases since 2024</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY SNAPSHOT (v3 member cards) ── */}
      <section className="v3-members-section" aria-label="Community snapshot">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-members-header">
            <div>
              <div className="v3-members-label">Our Community</div>
              <h2 className="v3-members-title">
                Experts shaping Africa's <em>energy future.</em>
              </h2>
            </div>
            <Link className="v3-members-link" href="/community">
              View all members →
            </Link>
          </div>

          <p className="v3-members-subtext">
            The PATNA community is structured around four professional cohorts, each bringing distinct expertise to the organisation's core mission. Members may hold dual cohort affiliations but identify one as primary.
          </p>

          <div className="v3-cohort-pillars">
            <div className="v3-cohort-pill">
              <strong>Academics &amp; Researchers</strong>
              <span>Generating the evidence base that grounds African positions in rigorous, Africa-specific data and analysis.</span>
            </div>
            <div className="v3-cohort-pill">
              <strong>Policy &amp; Government</strong>
              <span>Negotiators and advisers engaging IMO, AU, and national processes on behalf of African states.</span>
            </div>
            <div className="v3-cohort-pill">
              <strong>Legal &amp; Regulatory</strong>
              <span>Maritime law specialists navigating MARPOL, LCA frameworks, UNCLOS, and international trade law.</span>
            </div>
            <div className="v3-cohort-pill">
              <strong>Industry &amp; Private Sector</strong>
              <span>Shipowners, port operators, financiers, and energy companies implementing the maritime transition.</span>
            </div>
          </div>

          <div className="v3-members-grid">
            {communityMembers.map((member) => (
              <article className="v3-member-card" key={member.id}>
                <div className="v3-member-avatar">
                  {member.headshotUrl ? (
                    <img src={member.headshotUrl} alt="" />
                  ) : (
                    <span className="v3-member-avatar-fallback">{getInitials(member.name)}</span>
                  )}
                </div>
                <div className="v3-member-name">{member.name}</div>
                <div className="v3-member-role">{member.role}</div>
                {member.cohort && <span className="v3-member-cohort">{member.cohort}</span>}
                {member.country && <div className="v3-member-country">{member.country}</div>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEAP PROJECTS ── */}
      <section className="section projects-section-bg">
        <div className="section-inner">
          <div className="section-label">Flagship Programme</div>
          <h2 className="section-title">
            The LEAP Project <em style={{ fontStyle: "italic", color: "var(--ochre)" }}>Series</em>
          </h2>
          <p style={{ fontSize: "16px", color: "var(--ink-soft)", maxWidth: "640px", marginTop: "0.875rem", lineHeight: "1.7" }}>
            Leading Effective Afrocentric Participation. Three phases. Over two years. One goal: ensuring Africa shapes the IMO's Net-Zero Framework rather than inheriting it.
          </p>

          <div className="leap-grid" style={{ marginTop: "3.25rem" }}>
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
          <div className="section-label">Latest Insights</div>
          <h2 className="section-title">
            Africa-grounded evidence for <em style={{ fontStyle: "italic", color: "var(--ochre)" }}>global decisions.</em>
          </h2>

          <div className="home-pub-grid" style={{ marginTop: "3.25rem" }}>
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
      <section className="join-band join-band-v4 home-cta-band">
        <div>
          <h2>Ready to shape Africa's energy future?</h2>
          <p>
            Join a growing community of specialists, policymakers, researchers, and industry practitioners – collaborating across PATNA's four expert cohorts.
          </p>
          <div className="join-band-ctas">
            <Link className="cta-primary" href="/community/join">Join Our Community →</Link>
            <Link className="cta-secondary" href="/work-with-us">Work With Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
