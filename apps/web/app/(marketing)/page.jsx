import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionIntro } from "@/components/section-intro";
import { featuredProjects } from "@/lib/patna-data";
import {
  mediaAssets,
  projectMediaBySlug,
  publicPageMedia,
} from "@/lib/public-media";
import { getDefaultBundledMessages } from "@/lib/translation-messages";

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
  const heroMedia = publicPageMedia.home.hero.items[0];
  const documentaryMoments = publicPageMedia.home.featuredMoments.items.slice(0, 2);
  const capabilityPillars = [
    {
      title: homeMessage("capabilityEvidenceTitle"),
      body: homeMessage("capabilityEvidenceBody"),
    },
    {
      title: homeMessage("capabilityConveningTitle"),
      body: homeMessage("capabilityConveningBody"),
    },
    {
      title: homeMessage("capabilityImplementationTitle"),
      body: homeMessage("capabilityImplementationBody"),
    },
  ];
  const heroMetrics = [
    {
      value: "100+",
      label: homeMessage("metricExperts"),
    },
    {
      value: "25",
      label: homeMessage("metricStates"),
    },
    {
      value: "15",
      label: homeMessage("metricResolutions"),
    },
  ];

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
              <Link className="secondary-button" href="/projects">
                {homeMessage("btnViewProjects")}
              </Link>
            </div>

            <div className="hero-stats">
              {heroMetrics.map((item) => (
                <div className="metric-card" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel home-hero-panel">
            <div className="hero-media-frame home-hero-main-frame">
              <img
                alt={heroMedia.alt}
                className="hero-media-image"
                loading="eager"
                src={heroMedia.src}
              />
              <div className="hero-media-overlay home-hero-overlay">
                <div className="tag">{homeMessage("coverageLabel")}</div>
                <strong>{homeMessage("heroVisualTitle")}</strong>
                <p>{homeMessage("heroVisualBody")}</p>
                <div className="media-caption-row">
                  <span>{heroMedia.credit}</span>
                  <a href={heroMedia.sourceUrl} rel="noreferrer" target="_blank">
                    Source
                  </a>
                </div>
              </div>
            </div>

            <article className="home-context-card">
              <div className="home-context-card-image">
                <img
                  alt={mediaAssets.mombasaPort.alt}
                  loading="lazy"
                  src={mediaAssets.mombasaPort.src}
                />
              </div>
              <div className="home-context-card-body">
                <span className="tag home-context-card-tag">{homeMessage("contextLabel")}</span>
                <h3>{homeMessage("contextTitle")}</h3>
                <p>{homeMessage("contextBody")}</p>
                <a href={mediaAssets.mombasaPort.sourceUrl} rel="noreferrer" target="_blank">
                  {homeMessage("contextSource")}
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section home-focus-section">
        <div className="section-inner">
          <SectionIntro
            label={homeMessage("storyLabel")}
            title={homeMessage("storyTitle")}
            subtitle={homeMessage("missionPara1")}
          />

          <div className="home-focus-grid">
            <div className="home-capability-grid">
              {capabilityPillars.map((pillar) => (
                <article className="home-capability-card" key={pillar.title}>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                </article>
              ))}
            </div>

            <aside className="home-visual-rail">
              <div className="home-visual-rail-head">
                <div className="section-label">{homeMessage("visualLabel")}</div>
                <h3>{homeMessage("visualTitle")}</h3>
                <p>{homeMessage("visualBody")}</p>
              </div>

              <div className="home-visual-grid">
                <figure className="home-visual-card home-visual-card-large">
                  <img
                    alt={documentaryMoments[0]?.alt || ""}
                    loading="lazy"
                    src={documentaryMoments[0]?.src}
                  />
                  <figcaption>{homeMessage("visualCaptionOne")}</figcaption>
                </figure>

                <figure className="home-visual-card">
                  <img
                    alt={documentaryMoments[1]?.alt || ""}
                    loading="lazy"
                    src={documentaryMoments[1]?.src}
                  />
                  <figcaption>{homeMessage("visualCaptionTwo")}</figcaption>
                </figure>

                <figure className="home-visual-card">
                  <img
                    alt={mediaAssets.mombasaPort.alt}
                    loading="lazy"
                    src={mediaAssets.mombasaPort.src}
                  />
                  <figcaption>{homeMessage("visualCaptionThree")}</figcaption>
                </figure>
              </div>
            </aside>
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

          <div className="home-proof-grid">
            {featuredProjects.slice(0, 2).map((project) => (
              <article className="home-proof-card" key={project.slug}>
                <div className="home-proof-image">
                  <img
                    alt={projectMediaBySlug[project.slug]?.alt || project.title}
                    loading="lazy"
                    src={projectMediaBySlug[project.slug]?.src}
                  />
                </div>
                <div className="home-proof-card-body">
                  <div className="home-proof-card-meta">
                    <span className="status-chip chip-neutral">{project.type}</span>
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
        </div>
      </section>

      <section className="join-band home-cta-band">
        <div className="section-inner">
          <div className="section-label">{homeMessage("joinLabel")}</div>
          <h2>{homeMessage("joinTitle")}</h2>
          <p>{homeMessage("joinPara")}</p>
          <div className="join-band-btns">
            <Link className="primary-button" href="/work-with-us/partner">
              {homeMessage("btnPartner")}
            </Link>
            <Link className="secondary-button" href="/contact">
              {homeMessage("btnContact")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
