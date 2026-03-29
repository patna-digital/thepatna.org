import Link from "next/link";
import { HeroMediaCarousel } from "@/components/public/hero-media-carousel";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import {
  coreValues,
  featuredProjects,
  heroStats,
  partnerGroups,
  publicInsights,
} from "@/lib/patna-data";
import { fetchPublicEvents } from "@/lib/events";
import {
  getEventMedia,
  insightMediaBySlug,
  projectMediaBySlug,
  publicPageMedia,
} from "@/lib/public-media";

export default async function HomePage() {
  const publicEvents = await fetchPublicEvents({ limit: 3 });

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">African coordination for climate, maritime, and energy transitions</div>
            <h1>
              Evidence, coordination, and <em>transition strategy</em> for Africa
            </h1>
            <p>
              PATNA convenes African professionals across policy, maritime, energy, industry, and
              civil society to generate evidence, align positions, and strengthen implementation.
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
                PATNA was born from a simple but urgent conviction: Africa must shape its future
                in global climate and energy decision-making. For too long, international rules
                affecting African economies, infrastructure, and livelihoods have been designed
                with limited African participation.
              </p>
              <p className="mission-body">
                What began as a focused effort on maritime decarbonisation has evolved into a
                broader platform supporting energy transitions, climate governance, and
                institutional readiness across sectors.
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
            title="Featured projects and initiatives"
            subtitle="Programme work, convenings, and technical support presented as a clear institutional record."
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
                title={project.title}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section insights-band">
        <div className="section-inner">
          <SectionIntro
            label="Insights"
            title="Reports, briefs, and commentary organised for decision-making"
            subtitle="Knowledge products structured around source, audience, and policy relevance."
          />

          <div className="media-article-grid">
            {publicInsights.map((item) => (
              <MediaArticleCard
                key={item.slug}
                label={item.type}
                media={insightMediaBySlug[item.slug]}
                meta={[item.date, item.audience]}
                summary={item.summary}
                title={item.title}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Partners and convenings"
            title="Public credibility is built through institutions, convenings, and outcomes"
            subtitle="PATNA’s work is grounded in visible partnerships, documented events, and shared outputs."
          />

          <div className="media-article-grid">
            {publicEvents.map((event) => (
              <MediaArticleCard
                key={event.slug}
                label={event.event_type || "Event"}
                media={getEventMedia(event.slug)}
                meta={[event.display_date, event.location].filter(Boolean)}
                summary={event.summary}
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
          <h2>Bring evidence, expertise, and coordination into one PATNA system.</h2>
          <p>
            Join a network built for African technical coordination, shared evidence, and stronger
            positioning across climate, maritime, and energy transitions.
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
