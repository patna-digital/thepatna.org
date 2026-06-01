import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionIntro } from "@/components/section-intro";
import {
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

      {/* ── ABOUT PATNA ── */}
      <section className="about-patna-section">
        <div className="section-inner">
          <div className="section-label">{t("home.aboutLabel")}</div>
          <h2 className="about-patna-h2">
            {t("home.aboutH2")} <em>{t("home.aboutH2Em")}</em>
          </h2>

          <div className="about-patna-grid">
            {/* Left text column — ~38% width on desktop */}
            <div className="about-patna-text">
              <div className="about-patna-vm">
                <div className="about-patna-vm-row">
                  <span className="about-patna-tag">{t("home.aboutVisionTag")}</span>
                  <p>{t("home.aboutVision")}</p>
                </div>
                <div className="about-patna-vm-row">
                  <span className="about-patna-tag">{t("home.aboutMissionTag")}</span>
                  <p>{t("home.aboutMission")}</p>
                </div>
              </div>
              <div className="about-patna-story-inline">
                <h2 className="about-patna-story-heading">{t("home.aboutStoryHeading")}</h2>
                <p className="about-patna-story-body">{t("home.aboutStoryBody")}</p>
                <Link className="about-patna-cta" href="/about">
                  {t("home.aboutLearnMore")}
                </Link>
              </div>
            </div>

            {/* Right column — photo fills remaining space */}
            <div className="about-patna-image-wrap">
              <img
                src="/images/Dakar.jpeg"
                alt="PATNA network delegates at the Dakar conference"
                className="about-patna-img"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="stats-band" aria-label="PATNA by the numbers">
        <div className="section-inner stats-band-inner">
          <div className="stats-grid">
            <div className="stats-item">
              <span className="stats-num">100<sup>+</sup></span>
              <span className="stats-lbl">{t("home.statExperts")}</span>
            </div>
            <div className="stats-item">
              <span className="stats-num">25</span>
              <span className="stats-lbl">{t("home.statStates")}</span>
            </div>
            <div className="stats-item">
              <span className="stats-num">4</span>
              <span className="stats-lbl">{t("home.statCohorts")}</span>
            </div>
            <div className="stats-item">
              <span className="stats-num">3</span>
              <span className="stats-lbl">{t("home.statLeap")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COHORTS ── */}
      <section className="cohorts-section">
        <div className="section-inner">
          <div className="section-label">{t("home.cohortsLabel")}</div>
          <h2 className="cohorts-heading">
            {t("home.cohortsH2")} <em style={{ fontStyle: "italic", color: "var(--ochre)" }}>{t("home.cohortsH2Em")}</em>
          </h2>
          <div className="cohorts-grid">
            {[
              { key: "1", icon: "academics" },
              { key: "2", icon: "policy" },
              { key: "3", icon: "legal" },
              { key: "4", icon: "industry" },
            ].map(({ key, icon }) => (
              <div className="cohort-card" key={key}>
                <div className={`cohort-icon cohort-icon--${icon}`} aria-hidden="true" />
                <h3 className="cohort-card-title">{t(`home.cohort${key}Title`)}</h3>
                <p className="cohort-card-desc">{t(`home.cohort${key}Desc`)}</p>
              </div>
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

      {/* ── COMMUNITY SNAPSHOT (v3 member cards) ── */}
      <section className="v3-members-section" aria-label="Community snapshot">
        <div className="v3-members-inner">
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
                <Link className="home-event-card" href={`/events/${event.slug}`} key={event.slug}>
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
                </Link>
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
