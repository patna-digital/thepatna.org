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
  publicEvents,
  publicInsights,
} from "@/lib/patna-data";
import {
  eventMediaBySlug,
  insightMediaBySlug,
  projectMediaBySlug,
  publicPageMedia,
} from "@/lib/public-media";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">Africa&apos;s voice in global climate decisions</div>
            <h1>
              Data-Driven Climate Action and <em>Energy Transition</em> for Africa
            </h1>
            <p>
              PATNA brings together experts, policymakers, industry leaders, and civil society to
              advance a just, inclusive, and evidence-based energy transition across maritime,
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
            subtitle="Project sections now use official PATNA imagery and source metadata so programme work reads like a credible archive rather than a set of abstract cards."
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
            title="A unified publishing system for reports, briefs, and commentary"
            subtitle="The interface now mirrors the darker insights band in the original mockup while keeping the content model ready for Supabase-backed publishing."
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
            title="Public credibility comes from visible institutions, events, and outcomes"
            subtitle="Partner organisations, event outputs, and cohort-facing evidence all now sit inside one coherent visual system."
          />

          <div className="media-article-grid">
            {publicEvents.map((event) => (
              <MediaArticleCard
                key={event.slug}
                label={event.type}
                media={eventMediaBySlug[event.slug]}
                meta={[event.date, event.location]}
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
            The redesigned site now connects the public story to the real community application and
            review workflow already running on Supabase.
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
