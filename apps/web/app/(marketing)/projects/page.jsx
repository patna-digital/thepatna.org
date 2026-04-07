import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { FlagshipProjectCard } from "@/components/projects/flagship-project-card";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsTimeline } from "@/components/projects/projects-timeline";
import { ProjectCountriesMap } from "@/components/projects/project-countries-map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPublishedProjects } from "@/lib/projects";
import { journeyPhases, heroStats } from "@/lib/patna-data";

export const revalidate = 3600;

export const metadata = {
  title: "Projects",
  description:
    "Explore PATNA's flagship project work, including the LEAP series supporting African leadership in maritime decarbonisation.",
};

export default async function ProjectsPage() {
  const t = await getTranslations();

  const supabase = await createSupabaseServerClient();
  const { projects } = await fetchPublishedProjects({ supabase });

  const flagship  = projects.filter((p) => p.section === "flagship");
  const convenings = projects.filter((p) => p.section === "convening");

  // Aggregate all project_countries for the countries section
  const allCountries = flagship.flatMap((p) => p.project_countries || []);

  return (
    <>
      <MarketingPageHero
        label={t("projects.label")}
        subtitle={t("projects.subtitle")}
        title={t("projects.title")}
      />

      {/* Hero stats strip */}
      <div className="projects-hero-stats">
        <div className="section-inner">
          <div className="projects-hero-stats-row">
            {heroStats.map((stat) => (
              <div className="projects-hero-stat" key={stat.label}>
                <strong className="projects-hero-stat-num">{stat.value}</strong>
                <span className="projects-hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Flagship Programmes ──────────────────────────────────────────────── */}
      {flagship.length > 0 && (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label={t("projects.flagshipLabel")}
              title={t("projects.flagshipTitle")}
              subtitle={t("projects.flagshipSubtitle")}
            />
            <div className="flagship-projects-stack">
              {flagship.map((project) => (
                <FlagshipProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Regional Convenings ──────────────────────────────────────────────── */}
      {convenings.length > 0 && (
        <section className="section section-tinted">
          <div className="section-inner">
            <SectionIntro
              label={t("projects.conveningLabel")}
              title={t("projects.conveningTitle")}
              subtitle={t("projects.conveningSubtitle")}
            />
            <div className="project-cards-grid">
              {convenings.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Programme Timeline ───────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("projects.timelineLabel")}
            title={t("projects.timelineTitle")}
          />
          <ProjectsTimeline phases={journeyPhases} />
        </div>
      </section>

      {/* ── Countries ────────────────────────────────────────────────────────── */}
      {allCountries.length > 0 && (
        <section className="section">
          <div className="section-inner">
            <ProjectCountriesMap countries={allCountries} />
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-inner">
          <div className="projects-cta-bar">
            <div className="projects-cta-text">
              <h3>{t("projects.ctaTitle")}</h3>
              <p>{t("projects.ctaSubtitle")}</p>
            </div>
            <div className="projects-cta-actions">
              <Link className="primary-button" href="/community/join">
                {t("projects.ctaJoin")}
              </Link>
              <Link className="secondary-button" href="/work-with-us/partner">
                {t("projects.ctaPartner")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
