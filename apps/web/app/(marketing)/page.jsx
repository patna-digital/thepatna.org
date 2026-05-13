import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionIntro } from "@/components/section-intro";
import { featuredProjects, publicInsights, partnerGroups, coreValues } from "@/lib/patna-data";
import {
  eventMediaBySlug,
  insightMediaBySlug,
} from "@/lib/public-media";
import { fetchPublicEvents } from "@/lib/events";
import { getDefaultBundledMessages } from "@/lib/translation-messages";
import { HeroContentSlider } from "@/components/public/hero-content-slider";

export const metadata = {
  title: "Home",
  description:
    "Data-driven climate action and energy transition for Africa through PATNA's convenings, evidence, and institutional collaboration.",
};

export default async function HomePage() {
  const t = await getTranslations();
  const defaultHomeMessages = getDefaultBundledMessages().home;
  const homeMessage = (key) => {
    const path = `home.${key}`;
    return typeof t.has === "function" && t.has(path)
      ? t(path)
      : defaultHomeMessages[key];
  };

  const events = await fetchPublicEvents({ limit: 3 });

  const heroSlides = [
    ...publicInsights.slice(0, 2).map((insight) => ({
      href: `/insights/${insight.slug}`,
      type: insight.type,
      title: insight.title,
      summary: insight.summary,
      meta: insight.date,
      image: insightMediaBySlug[insight.slug]?.src,
      imageAlt: insightMediaBySlug[insight.slug]?.alt,
    })),
    ...events.slice(0, 2).map((event) => ({
      href: `/events/${event.slug}`,
      type: event.eventTypeDisplay || event.event_type || "Event",
      title: event.title,
      summary: event.summary,
      meta: event.displayDateDisplay || event.display_date,
      image: eventMediaBySlug[event.slug]?.src,
      imageAlt: eventMediaBySlug[event.slug]?.alt,
    })),
  ].slice(0, 4);

  const heroMetrics = [
    { value: "54", label: "African states engaged" },
    { value: "4", label: "Expert cohorts" },
    { value: "3+", label: "Years of impact" },
  ];

  const allPartners = partnerGroups.flatMap((g) => g.partners);

  // Featured project spans both columns; the rest use regular tiles.
  const [featuredProject, ...regularProjects] = featuredProjects;

  return (
    <>
      <section className="hero hero-home">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">{homeMessage("eyebrow")}</div>
            <h1>{homeMessage("h1")}</h1>
            <p>{homeMessage("intro")}</p>

            <div className="hero-actions">
              <Link className="primary-button" href="/about">
                {homeMessage("btnLearnMore")}
              </Link>
              <Link className="secondary-button" href="/community/join">
                {homeMessage("btnJoinCommunity")}
              </Link>
            </div>

            <div className="hero-stats hero-stats-inline">
              {heroMetrics.map((item, i) => (
                <div className="hero-stat-item" key={item.label}>
                  {i > 0 && <span className="hero-stat-divider" aria-hidden="true" />}
                  <strong>{item.value}</strong>
                  <span className="hero-stat-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel home-hero-panel">
            <HeroContentSlider items={heroSlides} />
          </div>
        </div>
      </section>

      <section className="section mission-band">
        <div className="section-inner">
          <div className="home-mission-grid">
            <div className="home-mission-left">
              <div className="section-label">{homeMessage("storyLabel")}</div>
              <h2 className="section-title">{homeMessage("storyTitle")}</h2>
              <p className="mission-body">{homeMessage("missionPara1")}</p>
              <p className="mission-body">{homeMessage("missionPara2")}</p>
              <Link className="text-link" href="/about">
                {homeMessage("readFullStory")}
              </Link>
            </div>

            <div className="home-mission-right">
              <blockquote className="mission-pull">
                {homeMessage("pullQuote") ||
                  "Bridging African expertise and global policy for a just energy transition."}
              </blockquote>

              <div className="values-list" role="list">
                {coreValues.map((v) => (
                  <span className="value-chip" key={v} role="listitem">{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-proof-section">
        <div className="section-inner">
          <SectionIntro
            label={homeMessage("workLabel")}
            title={homeMessage("workTitle")}
            subtitle={homeMessage("workSubtitle")}
          />

          <div className="projects-showcase home-projects-showcase">
            {featuredProject && (
              <article className="project-card project-card-featured" key={featuredProject.slug}>
                <div className="project-card-inner">
                  <div className="project-card-meta">
                    <span className="project-tag">{featuredProject.type}</span>
                  </div>
                  <h3>{featuredProject.title}</h3>
                  <p>{featuredProject.summary}</p>
                  <div className="home-proof-outcomes">
                    {featuredProject.outcomes.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <Link className="text-link" href={featuredProject.sourceUrl}>
                    {homeMessage("readProjectPage")}
                  </Link>
                </div>
              </article>
            )}

            {regularProjects.map((project) => (
              <article className="project-card" key={project.slug}>
                <div className="project-card-inner">
                  <div className="project-card-meta">
                    <span className="project-tag">{project.type}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <div className="home-proof-outcomes">
                    {project.outcomes.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <Link className="text-link" href={project.sourceUrl}>
                    {homeMessage("readProjectPage")}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="section-cta-row">
            <Link className="secondary-button" href="/projects">
              View all projects
            </Link>
          </div>
        </div>
      </section>

      <section className="section insights-band">
        <div className="section-inner">
          <SectionIntro
            label="Knowledge hub"
            subtitle="Evidence, analysis, and commentary grounded in PATNA's convenings and research."
            title="Latest insights"
          />

          <div className="insights-grid">
            {publicInsights.map((insight) => (
              <article className="content-card insights-card" key={insight.slug}>
                <div className="content-meta">
                  <span>{insight.type}</span>
                  <span>{insight.date}</span>
                </div>
                <h3>{insight.title}</h3>
                <p>{insight.summary}</p>
                <Link className="text-link insights-link" href={`/insights/${insight.slug}`}>
                  Read publication
                </Link>
              </article>
            ))}
          </div>

          <div className="section-cta-row">
            <Link className="secondary-button insights-band-btn" href="/insights">
              Browse all insights
            </Link>
          </div>
        </div>
      </section>

      <section className="section partners-section">
        <div className="section-inner">
          <div className="partners-label">
            <div className="section-label">Partnerships &amp; affiliations</div>
            <p>
              PATNA works with governments, international organisations, academic institutions,
              and civil society across Africa and globally.
            </p>
          </div>

          <div className="partners-cloud partners-cloud-centered">
            {allPartners.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="join-band home-cta-band">
        <div className="section-inner">
          <div className="section-label">{homeMessage("joinLabel")}</div>
          <h2>{homeMessage("joinTitle")}</h2>
          <p>{homeMessage("joinPara")}</p>
          <div className="join-band-btns">
            <Link className="primary-button" href="/community/join">
              {homeMessage("btnJoinCommunity")}
            </Link>
            <Link className="secondary-button" href="/work-with-us">
              {homeMessage("btnPartner")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
