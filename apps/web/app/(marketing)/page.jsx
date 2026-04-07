import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import {
  cohortSummary,
  featuredProjects,
  heroStats,
} from "@/lib/patna-data";
import {
  projectMediaBySlug,
  publicPageMedia,
} from "@/lib/public-media";

export const metadata = {
  title: "Home",
  description:
    "Data-driven climate action and energy transition for Africa through PATNA's convenings, evidence, and institutional collaboration.",
};

export default async function HomePage() {
  const t = await getTranslations();
  const heroMedia = publicPageMedia.home.hero.items[0];

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">{t("home.eyebrow")}</div>
            <h1>
              {t("home.h1")}
            </h1>
            <p>
              {t("home.intro")}
            </p>

            <div className="hero-actions">
              <Link className="secondary-button" href="/about">
                {t("home.btnLearnMore")}
              </Link>
              <Link className="pill-link" href="/community/join">
                {t("home.btnJoinCommunity")}
              </Link>
            </div>

            <div className="hero-stats">
              {heroStats.map((item) => (
                <div className="metric-card" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-media-frame">
              <img
                alt={heroMedia.alt}
                className="hero-media-image"
                loading="eager"
                src={heroMedia.src}
              />
              <div className="hero-media-overlay">
                <div className="tag">{t("home.coverageLabel")}</div>
                <strong>{heroMedia.title}</strong>
                <p>{heroMedia.body}</p>
                <div className="media-caption-row">
                  <span>{heroMedia.caption}</span>
                  <a href={heroMedia.sourceUrl} rel="noreferrer" target="_blank">
                    Source
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section cohorts-section">
        <div className="section-inner">
          <SectionIntro
            label={t("home.storyLabel")}
            title={t("home.storyTitle")}
            subtitle={t("home.missionPara1")}
          />

          <div className="cohorts-grid">
            {cohortSummary.map((cohort) => (
              <article className="cohort-card" key={cohort.slug}>
                <div className="cohort-icon">{cohort.icon}</div>
                <h3>{cohort.title}</h3>
                <p>{cohort.summary}</p>
              </article>
            ))}
          </div>

          <div>
            <Link className="secondary-button" href="/community">
              {t("home.btnExploreCommunity")}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("home.workLabel")}
            title={t("home.workTitle")}
            subtitle={t("home.workSubtitle")}
          />

          <div className="media-article-grid media-article-grid-projects">
            {featuredProjects.map((project) => (
              <MediaArticleCard
                featured={project.featured}
                key={project.slug}
                label={project.type}
                media={projectMediaBySlug[project.slug]}
                meta={project.outcomes}
                summary={project.summary}
                sourceLabel={t("home.readProjectPage")}
                sourceUrl={project.sourceUrl}
                title={project.title}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="join-band">
        <div className="section-inner">
          <div className="section-label">{t("home.joinLabel")}</div>
          <h2>{t("home.joinTitle")}</h2>
          <p>
            {t("home.joinPara")}
          </p>
          <div className="join-band-btns">
            <Link className="secondary-button" href="/community/join">
              {t("home.btnStartApplication")}
            </Link>
            <Link className="pill-link" href="/community">
              {t("home.btnExploreCommunity")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
