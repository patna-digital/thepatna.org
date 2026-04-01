import { MarketingPageHero } from "@/components/marketing-page-hero";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import { featuredProjects } from "@/lib/patna-data";
import { projectMediaBySlug } from "@/lib/public-media";

export const metadata = {
  title: "Projects",
  description:
    "Explore PATNA's flagship project work, including the LEAP series supporting African leadership in maritime decarbonisation.",
};

export default function ProjectsPage() {
  return (
    <>
      <MarketingPageHero
        label="Projects"
        subtitle="Building Africa's technical and diplomatic capacity to influence global climate and energy rules, from the IMO to international finance mechanisms."
        title="The LEAP project series"
      />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Project archive"
            title="PATNA's flagship public projects"
            subtitle="The current project record is anchored in LEAP, a multi-phase effort to strengthen Africa's evidence base, negotiation readiness, and institutional voice in maritime decarbonisation."
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
    </>
  );
}
