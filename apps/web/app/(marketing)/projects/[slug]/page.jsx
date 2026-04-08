import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { getSiteUrl, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import {
  fetchProjectBySlug,
  fetchPublishedProjectSlugs,
  fetchPublishedProjects,
  formatProjectType,
  getProjectHref,
} from "@/lib/projects";
import { sanitizeProseHtml } from "@/lib/threads";

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

  const canonicalUrl = `${getSiteUrl()}${getProjectHref(slug)}`;

  return {
    title: project.title,
    description: project.summary || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: project.title,
      description: project.summary || undefined,
      url: canonicalUrl,
      images: project.cover_image_url
        ? [
            {
              url: project.cover_image_url,
              alt: project.cover_image_alt || project.title,
            },
          ]
        : undefined,
    },
  };
}

const STATUS_CHIP = {
  Active: "chip-success",
  Ongoing: "chip-success",
  Completed: "chip-muted",
  Upcoming: "chip-warning",
};

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const t = await getTranslations();

  const supabase = createPublicProjectsClient();
  const [{ project }, { projects }] = await Promise.all([
    fetchProjectBySlug({ supabase, slug }),
    fetchPublishedProjects({ supabase }),
  ]);

  if (!project) {
    notFound();
  }

  const relatedProjects = pickRelatedProjects(project, projects);
  const sanitizedBody = sanitizeProseHtml(project.body || "");
  const chipClass = STATUS_CHIP[project.status_label] || "chip-neutral";
  const overviewLabel =
    project.section === "convening" ? "Event snapshot" : "Programme snapshot";
  const deliverablesTitle =
    project.section === "convening" ? "Key outcomes" : "Key outputs";

  return (
    <>
      <MarketingPageHero
        actions={[
          { href: "/work-with-us/partner", label: "Partner with PATNA", variant: "primary" },
          { href: "/work-with-us/collaborate", label: "Explore collaboration", variant: "secondary" },
        ]}
        label={formatProjectType(project.project_type) || t("projects.label")}
        title={project.title}
        subtitle={project.summary}
      />

      {project.highlights?.length > 0 ? (
        <section className="project-hero-highlights">
          <div className="section-inner">
            <div className="project-highlight-grid">
              {project.highlights.slice(0, 4).map((item, index) => (
                <div className="project-highlight-card" key={`${item.label}-${index}`}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-inner">
          <div className="project-detail-layout">
            <div className="project-detail-main">
              <div className="project-detail-meta">
                {project.status_label ? (
                  <span className={`status-chip ${chipClass}`}>{project.status_label}</span>
                ) : null}
                {project.period_label ? (
                  <span className="project-detail-period">{project.period_label}</span>
                ) : null}
              </div>

              {project.partner_line ? (
                <p className="project-detail-partner">{project.partner_line}</p>
              ) : null}

              {project.cover_image_url ? (
                <div className="project-detail-cover">
                  <img
                    alt={project.cover_image_alt || project.title}
                    className="project-detail-cover-image"
                    src={project.cover_image_url}
                  />
                </div>
              ) : null}

              <div className="project-detail-overview-card">
                <h2 className="project-detail-section-title">{overviewLabel}</h2>
                <p>
                  {project.summary ||
                    "PATNA uses project pages to show how evidence, coordination, and partnership work fit together in practice."}
                </p>
              </div>

              {sanitizedBody ? (
                <div
                  className="project-detail-body rte-prose"
                  dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                />
              ) : null}

              {project.deliverables?.length > 0 ? (
                <div className="project-detail-deliverables">
                  <h2 className="project-detail-section-title">{deliverablesTitle}</h2>
                  <ul className="project-detail-deliverables-list">
                    {project.deliverables.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {project.project_countries?.length > 0 ? (
                <div className="project-detail-countries">
                  <h2 className="project-detail-section-title">Countries engaged</h2>
                  <div className="project-detail-countries-grid">
                    {project.project_countries
                      .slice()
                      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                      .map((country, index) => (
                        <span className="status-chip chip-neutral" key={`${country.country}-${index}`}>
                          {country.country}
                          {country.phase_label ? ` · ${country.phase_label}` : ""}
                        </span>
                      ))}
                  </div>
                </div>
              ) : null}

              {project.project_resources?.length > 0 ? (
                <div className="project-detail-resources">
                  <h2 className="project-detail-section-title">Resources and references</h2>
                  <div className="project-resource-grid">
                    {project.project_resources.map((resource) => (
                      <article className="project-resource-card" key={resource.id}>
                        <span className="project-resource-type">
                          {resource.resource_type || "Reference"}
                        </span>
                        <h3>{resource.resource_title}</h3>
                        {resource.resource_url ? (
                          <ProjectHref
                            className="text-link"
                            href={resource.resource_url}
                            label="Open resource"
                          />
                        ) : (
                          <span className="project-resource-muted">Link not available</span>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {project.project_gallery?.length > 0 ? (
                <div className="project-detail-gallery">
                  <h2 className="project-detail-section-title">Gallery</h2>
                  <div className="project-gallery-grid">
                    {project.project_gallery
                      .slice()
                      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                      .map((image) => (
                        <figure className="project-gallery-figure" key={image.id}>
                          <img
                            alt={image.alt_text || ""}
                            className="project-gallery-img"
                            src={image.image_url}
                          />
                          {image.caption ? (
                            <figcaption className="project-gallery-caption">
                              {image.caption}
                            </figcaption>
                          ) : null}
                        </figure>
                      ))}
                  </div>
                </div>
              ) : null}

              {project.tags?.length > 0 ? (
                <div className="project-detail-tags">
                  {project.tags.map((tag, index) => (
                    <span className="status-chip chip-neutral" key={`${tag}-${index}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="project-detail-sidebar">
              <div className="project-sidebar-card project-sidebar-card-cta">
                <h3 className="project-sidebar-card-title">Work with PATNA</h3>
                <p className="project-sidebar-card-body">
                  Bring PATNA into evidence-building, stakeholder alignment, and African-led
                  programme design around maritime decarbonisation and just transition work.
                </p>
                <div className="project-sidebar-actions">
                  <Link className="primary-button" href="/work-with-us/partner">
                    Partner with PATNA
                  </Link>
                  <Link className="secondary-button" href="/work-with-us/collaborate">
                    Explore collaboration
                  </Link>
                </div>
              </div>

              <div className="project-sidebar-card">
                <h3 className="project-sidebar-card-title">
                  {project.section === "convening" ? "Event snapshot" : "Project snapshot"}
                </h3>
                <dl className="project-sidebar-data-list">
                  {project.status_label ? (
                    <>
                      <dt>Status</dt>
                      <dd>{project.status_label}</dd>
                    </>
                  ) : null}
                  {project.period_label ? (
                    <>
                      <dt>When</dt>
                      <dd>{project.period_label}</dd>
                    </>
                  ) : null}
                  {project.project_countries?.length > 0 ? (
                    <>
                      <dt>Countries</dt>
                      <dd>{project.project_countries.length} engaged</dd>
                    </>
                  ) : null}
                  {project.deliverables?.length > 0 ? (
                    <>
                      <dt>{project.section === "convening" ? "Outcomes" : "Outputs"}</dt>
                      <dd>{project.deliverables.length} highlighted</dd>
                    </>
                  ) : null}
                </dl>
              </div>

              {project.linked_space ? (
                <div className="project-sidebar-card">
                  <h3 className="project-sidebar-card-title">Community workspace</h3>
                  <p className="project-sidebar-card-body">
                    This project has a dedicated PATNA space for members coordinating evidence,
                    discussion, and follow-through work.
                  </p>
                  <Link className="secondary-button" href="/app/spaces">
                    Open in community
                  </Link>
                </div>
              ) : null}

              {project.external_url ? (
                <div className="project-sidebar-card">
                  <h3 className="project-sidebar-card-title">Legacy reference</h3>
                  <p className="project-sidebar-card-body">
                    The earlier PATNA site still hosts archival material related to this project.
                  </p>
                  <ProjectHref
                    className="text-link"
                    href={project.external_url}
                    label="Open legacy page"
                  />
                </div>
              ) : null}

              <Link className="text-link project-sidebar-back" href="/projects">
                ← All projects
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {relatedProjects.length > 0 ? (
        <section className="section section-tinted">
          <div className="section-inner">
            <SectionIntro
              label="Keep exploring"
              title="Related PATNA project pages"
              subtitle="Move from one programme or convening into the wider body of PATNA work without leaving the new site experience."
            />
            <div className="project-related-grid">
              {relatedProjects.map((relatedProject) => (
                <article className="project-related-card" key={relatedProject.slug}>
                  <div className="project-related-meta">
                    <span className="status-chip chip-neutral">
                      {formatProjectType(relatedProject.project_type) || "Project"}
                    </span>
                    {relatedProject.status_label ? (
                      <span
                        className={`status-chip ${
                          STATUS_CHIP[relatedProject.status_label] || "chip-neutral"
                        }`}
                      >
                        {relatedProject.status_label}
                      </span>
                    ) : null}
                  </div>
                  <h3>{relatedProject.title}</h3>
                  {relatedProject.summary ? <p>{relatedProject.summary}</p> : null}
                  <Link className="text-link" href={getProjectHref(relatedProject.slug)}>
                    View project →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function pickRelatedProjects(project, projects = []) {
  const sameSection = [];
  const fallback = [];

  for (const item of projects) {
    if (!item || item.slug === project.slug) continue;

    if (item.section === project.section) {
      sameSection.push(item);
    } else {
      fallback.push(item);
    }
  }

  return [...sameSection, ...fallback].slice(0, 3);
}

function ProjectHref({ className, href, label }) {
  const isInternal = href?.startsWith("/");

  if (isInternal) {
    return (
      <Link className={className} href={href}>
        {label}
      </Link>
    );
  }

  return (
    <a className={className} href={href} rel="noopener noreferrer" target="_blank">
      {label}
    </a>
  );
}
