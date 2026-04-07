import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { fetchProjectBySlug, fetchPublishedProjectSlugs, formatProjectType } from "@/lib/projects";

export const revalidate = 3600;

function createPublicProjectsClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function generateStaticParams() {
  const supabase = createPublicProjectsClient();
  const { slugs } = await fetchPublishedProjectSlugs({ supabase });
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = createPublicProjectsClient();
  const { project } = await fetchProjectBySlug({ supabase, slug });

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.title,
    description: project.summary || undefined,
  };
}

const STATUS_CHIP = {
  Active:    "chip-success",
  Ongoing:   "chip-success",
  Completed: "chip-muted",
  Upcoming:  "chip-warning",
};

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const t = await getTranslations();

  const supabase = createPublicProjectsClient();
  const { project } = await fetchProjectBySlug({ supabase, slug });

  if (!project) {
    notFound();
  }

  const {
    title,
    summary,
    body,
    project_type,
    status_label,
    period_label,
    partner_line,
    external_url,
    deliverables = [],
    tags = [],
    project_resources = [],
    project_countries = [],
    linked_space,
    cover_image_url,
    cover_image_alt,
  } = project;

  const chipClass = STATUS_CHIP[status_label] || "chip-neutral";

  return (
    <>
      <MarketingPageHero
        label={formatProjectType(project_type) || t("projects.label")}
        title={title}
        subtitle={summary}
      />

      <section className="section">
        <div className="section-inner">
          <div className="project-detail-layout">

            {/* Main content column */}
            <div className="project-detail-main">

              {/* Meta row */}
              <div className="project-detail-meta">
                {status_label && (
                  <span className={`status-chip ${chipClass}`}>{status_label}</span>
                )}
                {period_label && (
                  <span className="project-detail-period">{period_label}</span>
                )}
              </div>

              {/* Partner line */}
              {partner_line && (
                <p className="project-detail-partner">{partner_line}</p>
              )}

              {/* Body */}
              {body && (
                <div
                  className="project-detail-body rich-text"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              )}

              {/* Deliverables */}
              {deliverables.length > 0 && (
                <div className="project-detail-deliverables">
                  <h2 className="project-detail-section-title">Key deliverables</h2>
                  <ul className="project-detail-deliverables-list">
                    {deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="project-detail-tags">
                  {tags.map((tag, i) => (
                    <span className="status-chip chip-neutral" key={i}>{tag}</span>
                  ))}
                </div>
              )}

              {/* Countries */}
              {project_countries.length > 0 && (
                <div className="project-detail-countries">
                  <h2 className="project-detail-section-title">Countries engaged</h2>
                  <div className="project-detail-countries-grid">
                    {project_countries
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((c, i) => (
                        <span className="status-chip chip-neutral" key={i}>
                          {c.country}
                          {c.phase_label ? ` · ${c.phase_label}` : ""}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* External link */}
              {external_url && (
                <div className="project-detail-external">
                  <a
                    className="primary-button"
                    href={external_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t("projects.readProjectPage")} →
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="project-detail-sidebar">

              {/* Resources */}
              {project_resources.length > 0 && (
                <div className="project-sidebar-card">
                  <h3 className="project-sidebar-card-title">Resources</h3>
                  <ul className="project-sidebar-resource-list">
                    {project_resources.map((r) => (
                      <li key={r.id}>
                        {r.resource_url ? (
                          <a
                            className="text-link"
                            href={r.resource_url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {r.resource_title}
                          </a>
                        ) : (
                          <span>{r.resource_title}</span>
                        )}
                        {r.resource_type && (
                          <span className="project-sidebar-resource-type">
                            {r.resource_type}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Community workspace */}
              {linked_space && (
                <div className="project-sidebar-card">
                  <h3 className="project-sidebar-card-title">Community workspace</h3>
                  <p className="project-sidebar-card-body">
                    This project has a dedicated space in the PATNA community for members
                    to coordinate, share evidence, and collaborate.
                  </p>
                  <Link className="secondary-button" href="/app/spaces">
                    Open in community →
                  </Link>
                </div>
              )}

              {/* Back link */}
              <Link className="text-link project-sidebar-back" href="/projects">
                ← All projects
              </Link>
            </aside>

          </div>
        </div>
      </section>
    </>
  );
}
