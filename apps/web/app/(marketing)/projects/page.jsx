import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import { featuredProjects } from "@/lib/patna-data";
import { projectMediaBySlug } from "@/lib/public-media";

export default function ProjectsPage() {
  return (
    <>
      <MarketingPageHero
        label="Projects"
        subtitle="Projects are now styled as structured programme records so the website can grow without fragmenting into one-off page designs."
        title="Programme work, convenings, and institutional capacity-building"
      />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Portfolio"
            title="Projects should feel like an editorial programme archive"
            subtitle="Each flagship initiative now carries official PATNA imagery and source provenance, making the page more readable and more credible."
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
    </>
  );
}
