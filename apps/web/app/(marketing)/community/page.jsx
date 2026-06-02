import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchActiveMemberDirectory } from "@/lib/member-profiles";

export const metadata = {
  title: "Community",
  description:
    "Discover PATNA's expert community, cohorts, and pathways for African specialists and institutions to contribute.",
};

const PER_PAGE = 8;

async function getMemberSnapshot({ page = 1 } = {}) {
  if (!canUseSupabaseAdmin()) {
    return { members: [], total: 0 };
  }

  try {
    const adminClient = createSupabaseAdminClient();
    const { members } = await fetchActiveMemberDirectory({ adminClient });

    const visible = members.filter((m) => m.visibility_setting !== "private");
    const total = visible.length;
    const start = (page - 1) * PER_PAGE;
    return { members: visible.slice(start, start + PER_PAGE), total };
  } catch (error) {
    console.error("Unable to load public member snapshot", error);
    return { members: [], total: 0 };
  }
}

function getInitials(name) {
  return (
    String(name || "PATNA Member")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PM"
  );
}

export default async function CommunityPage({ searchParams }) {
  const resolved = await searchParams;
  const page = Math.max(1, parseInt(resolved?.page || "1", 10));

  const [t, { members, total }] = await Promise.all([
    getTranslations(),
    getMemberSnapshot({ page }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

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
          <h1 className="sub-page-hero-title">{t("community.heroH1")}</h1>
          <p className="sub-page-hero-sub">{t("community.heroDesc")}</p>
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
            {/* Left: member experience panel */}
            <div className="feat-main-card feat-member-exp">
              <div className="feat-main-img">
                <img
                  src="/images/PATNA community image.jpg"
                  alt="PATNA community members"
                />
                <div className="feat-main-img-overlay" />
              </div>
              <div className="feat-main-body">
                <div className="feat-main-tag">{t("community.memberExpLabel")}</div>
                <h2 className="feat-main-title">{t("community.memberExpTitle")}</h2>
                <p className="feat-main-desc">{t("community.memberExpDesc")}</p>
                <Link className="feat-main-cta" href="/community/join">
                  {t("community.memberExpCta")}
                </Link>
              </div>
            </div>

            {/* Right: 4 cohorts stacked */}
            <div className="feat-cohorts-stack">
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
        </div>
      </div>

      {total > 0 && (
        <section className="v3-members-section" id="experts">
          <div className="section-narrow">
            <div className="v3-members-header">
              <div>
                <div className="v3-members-label">{t("community.networkLabel")}</div>
                <h2 className="v3-members-title">{t("community.networkH2")}</h2>
              </div>
              {totalPages > 1 && (
                <div className="v3-members-pagination">
                  {hasPrev ? (
                    <Link
                      className="v3-members-page-btn"
                      href={`?page=${page - 1}#experts`}
                    >
                      ← {t("community.networkPrev")}
                    </Link>
                  ) : (
                    <span className="v3-members-page-btn v3-members-page-btn--disabled">
                      ← {t("community.networkPrev")}
                    </span>
                  )}
                  <span className="v3-members-page-count">
                    {page} / {totalPages}
                  </span>
                  {hasNext ? (
                    <Link
                      className="v3-members-page-btn"
                      href={`?page=${page + 1}#experts`}
                    >
                      {t("community.networkNext")} →
                    </Link>
                  ) : (
                    <span className="v3-members-page-btn v3-members-page-btn--disabled">
                      {t("community.networkNext")} →
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="v3-members-grid">
              {members.map((member) => {
                const name = member.displayNameLabel || member.displayName;
                const cohort =
                  member.primaryCohort?.nameDisplay ||
                  member.primaryCohort?.name ||
                  "PATNA";
                return (
                  <article className="v3-member-card" key={member.id}>
                    <div className="v3-member-avatar">
                      {member.headshotSrc ? (
                        <img src={member.headshotSrc} alt={name} />
                      ) : (
                        <span className="v3-member-avatar-fallback">
                          {getInitials(name)}
                        </span>
                      )}
                    </div>
                    <h3 className="v3-member-name">{name}</h3>
                    <p className="v3-member-role">
                      {member.roleTitleDisplay ||
                        member.roleTitleLabel ||
                        member.organisationDisplay ||
                        t("community.memberFallback")}
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
