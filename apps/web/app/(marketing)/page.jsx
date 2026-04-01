import Link from "next/link";
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
            <div className="eyebrow">Data-driven climate action and energy transition for Africa</div>
            <h1>
              Africa-centred evidence and <em>coordination</em> for climate transition
            </h1>
            <p>
              The Professional African Technical Network Advisory (PATNA) Initiative brings
              together experts, policymakers, industry leaders, and civil society to advance a
              just, inclusive, and evidence-based energy transition for Africa across maritime,
              energy, and climate systems.
            </p>

            <div className="hero-actions">
              <Link className="secondary-button" href="/about">
                Learn More
              </Link>
              <Link className="pill-link" href="/community/join">
                Join Our Community
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
              <div className="section-label">Our story</div>
              <h2 className="section-title">Africa must shape its own climate future</h2>
              <p className="mission-body">
                The Professional African Technical Network Advisory (PATNA) Initiative is a
                non-profit organisation dedicated to advancing climate-resilient development and
                energy transition pathways that work for Africa.
              </p>
              <p className="mission-body">
                PATNA was born from a simple but urgent conviction: Africa must shape its future
                in global climate and energy decision-making. What began as a focused effort to
                strengthen Africa's voice in maritime decarbonisation has grown into a broader
                mandate supporting climate governance, energy transition, and institutional
                readiness across sectors.
              </p>
              <Link className="text-link" href="/about">
                Read our full story
              </Link>
            </div>

            <div>
              <div className="mission-pull">
                To harness the collective expertise of African professionals to generate,
                coordinate, and apply <em>evidence-based strategies</em>.
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
            label="Our work"
            title="The LEAP project series"
            subtitle="PATNA's flagship public project record is anchored in LEAP, a long-term effort to strengthen African technical capacity, evidence, and influence in maritime decarbonisation."
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
                sourceLabel="Read project page"
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
            label="Latest highlights"
            title="Reports, articles, and event outputs from across PATNA's work"
            subtitle="This section draws directly from the current publications archive, bringing PATNA's latest reports, articles, and event outputs together in one place."
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
              <p>The publications library will appear here as soon as public records are available.</p>
            </article>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Convenings and affiliations"
            title="Documented PATNA convenings and visible institutional partnerships"
            subtitle="The current public record is grounded in summits, workshops, and affiliations that show how PATNA operates across Africa and internationally."
          />

          <div className="media-article-grid">
            {featuredEvents.map((event) => (
              <MediaArticleCard
                key={event.slug}
                label={event.event_type || "Event"}
                media={getEventMedia(event.slug)}
                meta={[event.display_date, event.location].filter(Boolean)}
                summary={event.summary}
                sourceLabel="Open PATNA coverage"
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
          <div className="section-label">Join the network</div>
          <h2>Ready to shape Africa's maritime future?</h2>
          <p>
            Join more than 100 specialists already collaborating through PATNA's cohorts,
            convenings, and shared evidence work.
          </p>
          <div className="join-band-btns">
            <Link className="secondary-button" href="/community">
              Explore community
            </Link>
            <Link className="pill-link" href="/community/join">
              Start application
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
