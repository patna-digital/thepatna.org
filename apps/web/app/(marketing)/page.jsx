import Link from "next/link";
import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import { SectionIntro } from "@/components/section-intro";
import {
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

    // Check admin-configured featured members
    const { data: settingRow } = await adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "home_featured_members")
      .single();

    const setting = settingRow?.value || { mode: "default", member_ids: [] };
    const useCustom = setting.mode === "custom" && setting.member_ids?.length > 0;

    let profilesQuery = adminClient
      .from("profiles")
      .select("id, first_name, surname, title, role_title, organisation_name, country_of_residence, country_code")
      .eq("onboarding_status", "active")
      .eq("profile_status", "active");

    if (useCustom) {
      profilesQuery = profilesQuery.in("id", setting.member_ids);
    } else {
      profilesQuery = profilesQuery.limit(12);
    }

    const { data: profiles, error } = await profilesQuery;

    if (error || !profiles?.length) return [];

    // Preserve admin-specified order when in custom mode
    const orderedProfiles = useCustom
      ? setting.member_ids.map((id) => profiles.find((p) => p.id === id)).filter(Boolean)
      : profiles;

    const userIds = orderedProfiles.map((p) => p.id);

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

    return orderedProfiles.slice(0, 8).map((p) => ({
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
  const [t, events, communityMembers] = await Promise.all([
    getTranslations(),
    fetchPublicEvents({ limit: 3 }),
    fetchCommunitySnapshot(),
  ]);

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero hero-video-home" aria-label="PATNA hero">
        <div className="hero-video-wrap" aria-hidden="true">
          <video
            className="hero-video-iframe"
            src="https://idupqjzvkpsscyjetmll.supabase.co/storage/v1/object/sign/videos/PATNA%20Website%20Hero%20Video%20(latest).mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iY2JlYThjMS04YjhmLTRkOTEtOTgxYy1hNmIzYjZhMmNhMmYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2aWRlb3MvUEFUTkEgV2Vic2l0ZSBIZXJvIFZpZGVvIChsYXRlc3QpLm1wNCIsImlhdCI6MTc4MDMwMzIxOCwiZXhwIjoyMDk1NjYzMjE4fQ.OsemGAmN6z6LZ8HKOIHquCbpj6tFviPi2a_B148Kn6k"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>
        <div className="hero-video-overlay" aria-hidden="true" />

        <div className="hero-video-content">
          <div className="hero-video-inner">
            <p className="eyebrow hero-eyebrow">{t("home.heroEyebrow")}</p>
            <h1 className="hero-video-h1">
              {t("home.heroH1")}
            </h1>
            <p className="hero-video-sub">
              {t("home.heroDesc")}
            </p>
            <div className="hero-actions">
              <Link className="primary-button hero-video-primary" href="/community/join">
                {t("home.heroCtaPrimary")}
              </Link>
              <Link className="secondary-button hero-video-secondary" href="/work-with-us">
                {t("home.heroCtaSecondary")}
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* ── PARTNERS ── */}
      <section className="section partners-marquee-section" aria-label="Partners and institutional affiliations">
        <div className="partners-marquee-inner">
          <p className="partners-marquee-label">{t("home.partnersMarqueeLabel")}</p>
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
              <div className="value-prop-label">{t("home.valuePropLabel")}</div>
              <h2 className="value-prop-title" id="value-prop-heading">
                {t("home.valuePropTitle")}<br /><em>{t("home.valuePropTitleEm")}</em>
              </h2>
            </div>
            <p className="value-prop-subtitle">
              {t("home.valuePropSubtitle")}
            </p>
          </div>

          <div className="value-prop-pillars">
            {homePillars.map((pillar, i) => (
              <Fragment key={pillar.number}>
                {i > 0 && <div className="value-prop-divider" aria-hidden="true" />}
                <article className="value-prop-pillar">
                  <div className="value-prop-pillar-num">{pillar.number}</div>
                  <h3 className="value-prop-pillar-title">{t(`home.pillar${i + 1}Title`)}</h3>
                  <p className="value-prop-pillar-body">{t(`home.pillar${i + 1}Body`)}</p>
                  <div className="value-prop-proof">{t(`home.pillar${i + 1}Proof`)}</div>
                </article>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT INTRO ── */}
      <section className="about-intro-section-v3">
        <div className="section-inner">
          <div className="section-label">{t("home.aboutLabel")}</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            {t("home.aboutH2Start")} <em style={{ fontStyle: "italic", color: "var(--ochre)" }}>{t("home.aboutH2Em")}</em>
          </h2>

          <div className="about-intro-grid-v3">
            <div className="about-intro-text-v3">
              <p>{t("home.aboutPara1")}</p>
              <p>{t("home.aboutPara2")}</p>
              <Link className="about-intro-link-v3" href="/about">
                {t("home.aboutReadStory")}
              </Link>
            </div>

            <div className="about-intro-stats" aria-label="PATNA by the numbers">
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">100<sup>+</sup></span>
                <span className="about-intro-stat-lbl">{t("home.statExperts")}</span>
              </div>
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">54</span>
                <span className="about-intro-stat-lbl">{t("home.statStates")}</span>
              </div>
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">4</span>
                <span className="about-intro-stat-lbl">{t("home.statCohorts")}</span>
              </div>
              <div className="about-intro-stat">
                <span className="about-intro-stat-num">3</span>
                <span className="about-intro-stat-lbl">{t("home.statLeap")}</span>
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
              <div className="v3-members-label">{t("home.communityLabel")}</div>
              <h2 className="v3-members-title">
                {t("home.communityH2")} <em>{t("home.communityH2Em")}</em>
              </h2>
            </div>
            <Link className="v3-members-link" href="/community">
              {t("home.communityViewAll")}
            </Link>
          </div>

          <p className="v3-members-subtext">
            {t("home.communityDesc")}
          </p>

          <div className="v3-cohort-pillars">
            <div className="v3-cohort-pill">
              <strong>{t("home.cohort1Title")}</strong>
              <span>{t("home.cohort1Desc")}</span>
            </div>
            <div className="v3-cohort-pill">
              <strong>{t("home.cohort2Title")}</strong>
              <span>{t("home.cohort2Desc")}</span>
            </div>
            <div className="v3-cohort-pill">
              <strong>{t("home.cohort3Title")}</strong>
              <span>{t("home.cohort3Desc")}</span>
            </div>
            <div className="v3-cohort-pill">
              <strong>{t("home.cohort4Title")}</strong>
              <span>{t("home.cohort4Desc")}</span>
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
          <div className="section-label">{t("home.leapLabel")}</div>
          <h2 className="section-title">
            {t("home.leapH2")} <em style={{ fontStyle: "italic", color: "var(--ochre)" }}>{t("home.leapH2Em")}</em>
          </h2>
          <p style={{ fontSize: "16px", color: "var(--ink-soft)", maxWidth: "640px", marginTop: "0.875rem", lineHeight: "1.7" }}>
            {t("home.leapDesc")}
          </p>

          <div className="leap-grid" style={{ marginTop: "3.25rem" }}>
            {leapPhases.map((phase) => (
              <article className="leap-card" key={phase.slug} data-status={phase.status}>
                <div className="leap-card-head">
                  <span className={`leap-status-pill leap-status-${phase.status}`}>
                    {phase.status === "active" ? t("home.leapStatusActive") : t("home.leapStatusComplete")}
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
                    {t("home.leapReadFullProject")}
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
          <div className="section-label">{t("home.pubsLabel")}</div>
          <h2 className="section-title">
            {t("home.pubsH2")} <em style={{ fontStyle: "italic", color: "var(--ochre)" }}>{t("home.pubsH2Em")}</em>
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
                {t("home.pubsDownload")}
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
              {t("home.pubsBrowseAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── EVENTS ── */}
      {events.length > 0 && (
        <section className="section home-events-section">
          <div className="section-inner">
            <SectionIntro
              label={t("home.eventsLabel")}
              title={t("home.eventsH2")}
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
                    <span className="home-event-status-pill">{t("home.eventUpcoming")}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="section-cta-row">
              <Link className="secondary-button" href="/events">
                {t("home.eventsViewAll")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── JOIN CTA BAND ── */}
      <section className="join-band join-band-v4 home-cta-band">
        <div>
          <h2>{t("home.ctaTitle")}</h2>
          <p>{t("home.ctaDesc")}</p>
          <div className="join-band-ctas">
            <Link className="cta-primary" href="/community/join">{t("home.ctaPrimary")}</Link>
            <Link className="cta-secondary" href="/work-with-us">{t("home.ctaSecondary")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
