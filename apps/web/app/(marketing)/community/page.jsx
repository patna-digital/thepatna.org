import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchActiveMemberDirectory } from "@/lib/member-profiles";

export const metadata = {
  title: "Community",
  description:
    "Discover PATNA's expert community, cohorts, and pathways for African specialists and institutions to contribute.",
};

async function getMemberSnapshot() {
  if (!canUseSupabaseAdmin()) {
    return [];
  }

  try {
    const adminClient = createSupabaseAdminClient();
    const { members } = await fetchActiveMemberDirectory({ adminClient });

    return members
      .filter((member) => member.visibility_setting !== "private")
      .slice(0, 8);
  } catch (error) {
    console.error("Unable to load public member snapshot", error);
    return [];
  }
}

function getInitials(name) {
  return String(name || "PATNA Member")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PM";
}

export default async function CommunityPage() {
  const [t, members] = await Promise.all([getTranslations(), getMemberSnapshot()]);

  return (
    <>
      <section className="sub-page-hero" aria-label="Community">
        <div className="sub-page-hero-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=700&fit=crop&q=80"
            alt=""
          />
        </div>
        <div className="sub-page-hero-overlay" aria-hidden="true" />
        <div className="sub-page-hero-dot" aria-hidden="true" />
        <div className="sub-page-hero-inner">
          <div className="sub-page-hero-eyebrow">{t("community.heroEyebrow")}</div>
          <h1 className="sub-page-hero-title">
            {t("community.heroH1")}
          </h1>
          <p className="sub-page-hero-sub">
            {t("community.heroDesc")}
          </p>
        </div>
      </section>

      <div className="feat-split-section" id="cohort-programme">
        <div className="feat-split-inner">
          <div className="feat-split-bar">
            <span className="feat-split-label">{t("community.cohortProgrammeLabel")}</span>
            <Link className="feat-split-view-all" href="/community/join">
              {t("community.cohortApplyLink")}
            </Link>
          </div>

          <div className="feat-split-grid">
            <article className="feat-main-card">
              <div className="feat-main-img">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=680&fit=crop&q=80"
                  alt="PATNA cohort members in a collaborative session"
                />
                <div className="feat-main-img-overlay" />
                <span className="feat-main-status feat-status-active">{t("community.cohortStatusOpen")}</span>
              </div>
              <div className="feat-main-body">
                <div className="feat-main-tag">{t("community.cohortTag")}</div>
                <h2 className="feat-main-title">{t("community.cohortTitle")}</h2>
                <p className="feat-main-desc">{t("community.cohortDesc")}</p>
                <div className="cohort-features">
                  <div className="cohort-feature">{t("community.cohortFeature1")}</div>
                  <div className="cohort-feature">{t("community.cohortFeature2")}</div>
                  <div className="cohort-feature">{t("community.cohortFeature3")}</div>
                  <div className="cohort-feature">{t("community.cohortFeature4")}</div>
                </div>
                <div className="feat-main-footer">
                  <div className="feat-main-meta">{t("community.cohortMeta")}</div>
                  <Link className="feat-main-cta" href="/community/join">
                    {t("community.cohortCta")}
                  </Link>
                </div>
              </div>
            </article>

            <div className="feat-side-list">
              {[
                { titleKey: "community.track1Title", metaKey: "community.track1Meta" },
                { titleKey: "community.track2Title", metaKey: "community.track2Meta" },
                { titleKey: "community.track3Title", metaKey: "community.track3Meta" },
              ].map((track) => (
                <Link className="feat-side-item" href="/community/join" key={track.titleKey}>
                  <div className="feat-side-content">
                    <div className="feat-side-tag">{t("community.trackOngoing")}</div>
                    <div className="feat-side-title">{t(track.titleKey)}</div>
                    <div className="feat-side-meta">{t(track.metaKey)}</div>
                  </div>
                  <span className="feat-side-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {members.length > 0 && (
        <section className="v3-members-section">
          <div className="section-narrow">
            <div className="v3-members-header">
              <div>
                <div className="v3-members-label">{t("community.networkLabel")}</div>
                <h2 className="v3-members-title">
                  {t("community.networkH2")}
                </h2>
              </div>
              <Link className="v3-members-link" href="/auth/login">
                {t("community.networkViewDir")}
              </Link>
            </div>

            <div className="v3-members-grid">
              {members.map((member) => {
                const name = member.displayNameLabel || member.displayName;
                const cohort = member.primaryCohort?.nameDisplay || member.primaryCohort?.name || "PATNA";
                return (
                  <article className="v3-member-card" key={member.id}>
                    <div className="v3-member-avatar">
                      {member.headshotSrc ? (
                        <img src={member.headshotSrc} alt={name} />
                      ) : (
                        <span className="v3-member-avatar-fallback">{getInitials(name)}</span>
                      )}
                    </div>
                    <h3 className="v3-member-name">{name}</h3>
                    <p className="v3-member-role">
                      {member.roleTitleDisplay || member.roleTitleLabel || member.organisationDisplay || t("community.memberFallback")}
                    </p>
                    <span className="v3-member-cohort">{cohort}</span>
                    {member.countryDisplay || member.country_of_residence ? (
                      <div className="v3-member-country">
                        {member.countryDisplay || member.country_of_residence}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="join-band join-band-v4">
        <h2>{t("community.ctaTitle")}</h2>
        <p>{t("community.ctaDesc")}</p>
        <div className="join-band-ctas">
          <Link className="cta-primary" href="/community/join">
            {t("community.ctaPrimary")}
          </Link>
          <Link className="cta-secondary" href="/work-with-us">
            {t("community.ctaSecondary")}
          </Link>
        </div>
      </section>
    </>
  );
}
