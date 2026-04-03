import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeroMediaCarousel } from "@/components/public/hero-media-carousel";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { PublicationCard } from "@/components/publication-card";
import { SectionIntro } from "@/components/section-intro";
import {
  coreValues,
  featuredProjects,
  heroStats,
  partnerGroups,
} from "@/lib/patna-data";
import { fetchPublicEvents, splitPublicEventCollections } from "@/lib/events";
import { fetchPublicPublications } from "@/lib/publications";
import {
  getEventMedia,
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
  const [allEvents, latestPublications] = await Promise.all([
    fetchPublicEvents(),
    fetchPublicPublications({ limit: 3 }),
  ]);
  const { patnaEvents } = splitPublicEventCollections(allEvents);
  const featuredEvents = patnaEvents.slice(0, 3);

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

          <HeroMediaCarousel section={publicPageMedia.home.hero} />
        </div>
      </section>

      <section className="section mission-band">
        <div className="section-inner">
          <div className="mission-grid">
            <div>
              <div className="section-label">{t("home.storyLabel")}</div>
              <h2 className="section-title">{t("home.storyTitle")}</h2>
              <p className="mission-body">
                {t("home.missionPara1")}
              </p>
              <p className="mission-body">
                {t("home.missionPara2")}
              </p>
              <Link className="text-link" href="/about">
                {t("home.readFullStory")}
              </Link>
            </div>

            <div>
              <div className="mission-pull">
                {t("home.pullQuote")}
              </div>
              <div className="values-list">
                {coreValues.map((value) => (
                  <span className="value-chip" key={value}>
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedStoryRail section={publicPageMedia.home.featuredMoments} />

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

      <section className="section insights-band">
        <div className="section-inner">
          <SectionIntro
            label={t("home.highlightsLabel")}
            title={t("home.highlightsTitle")}
            subtitle={t("home.highlightsSubtitle")}
          />

          {latestPublications.length ? (
            <div className="publications-grid">
              {latestPublications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </div>
          ) : (
            <article className="content-card">
              <h3>Publications archive</h3>
              <p>{t("home.publicationsEmpty")}</p>
            </article>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("home.conveningsLabel")}
            title={t("home.conveningsTitle")}
            subtitle={t("home.conveningsSubtitle")}
          />

          <div className="media-article-grid">
            {featuredEvents.map((event) => (
              <MediaArticleCard
                key={event.slug}
                label={event.eventTypeDisplay || event.event_type || "Event"}
                media={getEventMedia(event.slug)}
                meta={[event.displayDateDisplay || event.display_date, event.location].filter(Boolean)}
                summary={event.summary}
                sourceLabel={t("home.coverageLabel")}
                title={event.title}
              />
            ))}
          </div>

          <div className="partner-grid">
            {partnerGroups.map((group) => (
              <article className="partner-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="partners-cloud">
                  {group.partners.map((partner) => (
                    <span key={partner}>{partner}</span>
                  ))}
                </div>
              </article>
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
            <Link className="secondary-button" href="/community">
              {t("home.btnExploreCommunity")}
            </Link>
            <Link className="pill-link" href="/community/join">
              {t("home.btnStartApplication")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
