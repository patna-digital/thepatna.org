import { getTranslations } from "next-intl/server";
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

export default async function ProjectsPage() {
  const t = await getTranslations();
  return (
    <>
      <MarketingPageHero
        label={t("projects.label")}
        subtitle={t("projects.subtitle")}
        title={t("projects.title")}
      />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("projects.archiveLabel")}
            title={t("projects.archiveTitle")}
            subtitle={t("projects.archiveSubtitle")}
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
                sourceLabel={t("projects.readProjectPage")}
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
