import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { ContinentalFootprintMap } from "@/components/maps/continental-footprint-map";
import { FlagshipProjectCard } from "@/components/projects/flagship-project-card";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsTimeline } from "@/components/projects/projects-timeline";
import { buildLeapSeriesFootprint } from "@/lib/project-footprints";
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

  const publishedProjectIds = new Set(projects.map((project) => project.id));
  const topLevelProjects = projects.filter(
    (project) => !project.parent_project_id || !publishedProjectIds.has(project.parent_project_id)
  );
  const flagship  = topLevelProjects.filter((p) => p.section === "flagship");
  const convenings = topLevelProjects.filter((p) => p.section === "convening");
  const leapFootprint = buildLeapSeriesFootprint(projects);

  return (
    <>
      <MarketingPageHero
        actions={[
          { href: "/work-with-us/partner", label: "Partner with PATNA", variant: "primary" },
          { href: "#projects-flagship", label: "Explore flagship work", variant: "secondary" },
        ]}
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

      <div className="projects-jump-bar">
        <div className="section-inner">
          <nav aria-label="Project page sections" className="projects-jump-links">
            <a href="#projects-flagship">Flagship programmes</a>
            <a href="#projects-convenings">Convenings</a>
            <a href="#projects-timeline">Timeline</a>
            <a href="#projects-countries">Countries</a>
          </nav>
        </div>
      </div>

      {/* ── Flagship Programmes ──────────────────────────────────────────────── */}
      {flagship.length > 0 && (
        <section className="section" id="projects-flagship">
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
        <section className="section section-tinted" id="projects-convenings">
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
      <section className="section" id="projects-timeline">
        <div className="section-inner">
          <SectionIntro
            label={t("projects.timelineLabel")}
            title={t("projects.timelineTitle")}
            subtitle="A three-phase journey from foundational country analysis to a permanent African coordination platform."
          />
          <ProjectsTimeline phases={journeyPhases} />
        </div>
      </section>

      {/* ── Countries ────────────────────────────────────────────────────────── */}
      {(leapFootprint.countries.length > 0 || leapFootprint.hubs.length > 0) && (
        <section className="section" id="projects-countries">
          <div className="section-inner">
            <SectionIntro
              subtitle="Evidence production, diplomatic alignment, and programme delivery now touch a widening set of African maritime states."
              title="Continental footprint across the LEAP series"
            />
            <ContinentalFootprintMap
              footprint={leapFootprint}
            />
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-inner">
          <div className="projects-cta-bar">
            <div className="projects-cta-text">
              <h3>Bring PATNA into your next programme, convening, or partnership</h3>
              <p>
                PATNA helps institutions connect evidence, coordination, and African-led policy
                strategy across maritime decarbonisation and just transition work.
              </p>
            </div>
            <div className="projects-cta-actions">
              <Link className="primary-button" href="/work-with-us/partner">
                Partner with PATNA
              </Link>
              <Link className="secondary-button" href="/work-with-us/collaborate">
                Explore collaboration
              </Link>
              <Link className="text-link" href="/community/join">
                Join the community
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
