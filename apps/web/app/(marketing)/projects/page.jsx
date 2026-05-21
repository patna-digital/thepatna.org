import Link from "next/link";
import { ContinentalFootprintMap } from "@/components/maps/continental-footprint-map";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsTimeline } from "@/components/projects/projects-timeline";
import { buildLeapSeriesFootprint } from "@/lib/project-footprints";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPublishedProjects } from "@/lib/projects";
import { journeyPhases } from "@/lib/patna-data";

export const revalidate = 3600;

export const metadata = {
  title: "Projects",
  description:
    "Explore PATNA's flagship project work, including the LEAP series supporting African leadership in maritime decarbonisation.",
};

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const { projects } = await fetchPublishedProjects({ supabase });

  const publishedProjectIds = new Set(projects.map((p) => p.id));
  const topLevel = projects.filter(
    (p) => !p.parent_project_id || !publishedProjectIds.has(p.parent_project_id)
  );
  const flagship = topLevel.filter((p) => p.section === "flagship");
  const convenings = topLevel.filter((p) => p.section === "convening");
  const leapFootprint = buildLeapSeriesFootprint(projects);

  // Pin active project as featured; remaining as side list
  const activeProject = flagship.find((p) => ["Active", "Ongoing"].includes(p.status_label)) || flagship[0];
  const sideProjects = flagship.filter((p) => p !== activeProject).slice(0, 3);

  return (
    <>
      {/* ── HERO ── */}
      <section className="sub-page-hero" aria-label="Projects">
        <div className="sub-page-hero-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=700&fit=crop&q=80"
            alt=""
          />
        </div>
        <div className="sub-page-hero-overlay" aria-hidden="true" />
        <div className="sub-page-hero-dot" aria-hidden="true" />
        <div className="sub-page-hero-inner">
          <div className="sub-page-hero-eyebrow">Flagship Programme</div>
          <h1 className="sub-page-hero-title">
            The LEAP <em>Project Series</em>
          </h1>
          <p className="sub-page-hero-sub">
            Leading Effective Afrocentric Participation — Africa's most sustained, evidence-driven effort to shape the IMO's Net-Zero Framework, spanning three phases from 2024 to 2026.
          </p>
        </div>
      </section>

      {/* ── FEATURED SPLIT ── */}
      {flagship.length > 0 && (
        <div className="feat-split-section" id="projects-flagship">
          <div className="feat-split-inner">
            <div className="feat-split-bar">
              <span className="feat-split-label">
                {activeProject?.status_label === "Active" || activeProject?.status_label === "Ongoing"
                  ? "Active Project"
                  : "Flagship Project"}
              </span>
              <Link className="feat-split-view-all" href="#projects-convenings">
                View all work →
              </Link>
            </div>

            <div className="feat-split-grid">
              {/* Large featured card */}
              {activeProject && (
                <Link className="feat-main-card" href={`/projects/${activeProject.slug}`}>
                  <div className="feat-main-img">
                    <img
                      src={activeProject.cover_image_url || "https://images.unsplash.com/photo-1488590731756-b66e26a6a1c9?w=900&h=680&fit=crop&q=80"}
                      alt={activeProject.cover_image_alt || activeProject.title}
                    />
                    <div className="feat-main-img-overlay" />
                    {activeProject.status_label && (
                      <span className={`feat-main-status ${
                        ["Active", "Ongoing"].includes(activeProject.status_label)
                          ? "feat-status-active"
                          : "feat-status-upcoming"
                      }`}>
                        {activeProject.status_label}
                      </span>
                    )}
                    {/* Phase watermark */}
                    <span style={{
                      fontFamily: "var(--serif)",
                      fontSize: "6rem",
                      fontWeight: 500,
                      color: "rgba(225,240,247,0.08)",
                      position: "absolute",
                      right: "1.25rem",
                      bottom: "-0.625rem",
                      lineHeight: 1,
                      pointerEvents: "none",
                      userSelect: "none",
                    }} aria-hidden="true">
                      {activeProject.short_title || activeProject.title?.match(/\b(I{1,3}|IV|V)\b/)?.[0] || ""}
                    </span>
                  </div>
                  <div className="feat-main-body">
                    <div className="feat-main-tag">
                      {activeProject.period_label || ""}{activeProject.partner_line ? ` · ${activeProject.partner_line}` : ""}
                    </div>
                    <h2 className="feat-main-title">{activeProject.title}</h2>
                    <p className="feat-main-desc">{activeProject.summary}</p>
                    <div className="feat-main-footer">
                      <div className="feat-main-meta">
                        {activeProject.highlights?.slice(0, 1).map((h) => h.value + " " + h.label).join(" · ")}
                      </div>
                      <span className="feat-main-cta">Read more →</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Side list */}
              <div className="feat-side-list">
                {sideProjects.map((project) => (
                  <Link className="feat-side-item" href={`/projects/${project.slug}`} key={project.id}>
                    <div className="feat-side-content">
                      <div className="feat-side-tag">
                        {project.period_label || project.project_type || "Project"} · {project.status_label || ""}
                      </div>
                      <div className="feat-side-title">{project.title}</div>
                      <div className="feat-side-meta">{project.summary?.slice(0, 100)}…</div>
                    </div>
                    <span className="feat-side-arrow">→</span>
                  </Link>
                ))}

                {/* Always show the AUC study link */}
                <div className="feat-side-item" style={{ cursor: "default" }}>
                  <div className="feat-side-content">
                    <div className="feat-side-tag">AUC Study · March 2026</div>
                    <div className="feat-side-title">Africa's Continental Maritime Decarbonisation Strategy</div>
                    <div className="feat-side-meta">Commissioned by the African Union Commission · PATNA Lead Technical Consultant</div>
                  </div>
                  <span className="feat-side-arrow" style={{ color: "var(--ink-muted)" }}>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REGIONAL CONVENINGS ── */}
      {convenings.length > 0 && (
        <section className="section section-tinted" id="projects-convenings">
          <div className="section-inner">
            <div className="section-label">Regional Convenings</div>
            <h2 className="section-title">Workshops, summits &amp; delegations</h2>
            <p style={{ fontSize: "15px", color: "var(--ink-soft)", maxWidth: "600px", marginTop: "0.5rem", lineHeight: "1.7" }}>
              High-impact events that build African coordination capacity and deliver unified positions at international forums.
            </p>
            <div className="project-cards-grid" style={{ marginTop: "2.5rem" }}>
              {convenings.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PROGRAMME TIMELINE ── */}
      <section className="section" id="projects-timeline">
        <div className="section-inner">
          <div className="section-label">Journey</div>
          <h2 className="section-title">Programme timeline</h2>
          <p style={{ fontSize: "15px", color: "var(--ink-soft)", maxWidth: "600px", marginTop: "0.5rem", lineHeight: "1.7" }}>
            A three-phase journey from foundational country analysis to a permanent African coordination platform.
          </p>
          <ProjectsTimeline phases={journeyPhases} />
        </div>
      </section>

      {/* ── CONTINENTAL FOOTPRINT (D3 MAP — kept) ── */}
      {(leapFootprint.countries.length > 0 || leapFootprint.hubs.length > 0) && (
        <section className="section section-tinted" id="projects-countries">
          <div className="section-inner">
            <div className="section-label">Reach</div>
            <h2 className="section-title">Continental footprint across the LEAP series</h2>
            <p style={{ fontSize: "15px", color: "var(--ink-soft)", maxWidth: "600px", marginTop: "0.5rem", lineHeight: "1.7" }}>
              Evidence production, diplomatic alignment, and programme delivery now touch a widening set of African maritime states.
            </p>
            <ContinentalFootprintMap footprint={leapFootprint} />
          </div>
        </section>
      )}

      {/* ── JOIN CTA ── */}
      <section className="join-band join-band-v4">
        <div>
          <h2>Work with Africa's leading maritime climate network.</h2>
          <p>
            Commission a study, sponsor a cohort, or commission PATNA as your technical consultant for IMO and AU fora engagement.
          </p>
          <div className="join-band-ctas">
            <Link className="cta-primary" href="/work-with-us/partner">Partner with PATNA →</Link>
            <Link className="cta-secondary" href="/insights">Explore Our Research</Link>
          </div>
        </div>
      </section>
    </>
  );
}
