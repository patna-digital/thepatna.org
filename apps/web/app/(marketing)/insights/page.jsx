import { MarketingPageHero } from "@/components/marketing-page-hero";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { PublicationCard } from "@/components/publication-card";
import { SectionIntro } from "@/components/section-intro";
import { fetchPublicPublications } from "@/lib/publications";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "Insights",
  description:
    "Browse PATNA's latest reports, commentary, and public knowledge products drawn from the live publications archive.",
};

export default async function InsightsPage() {
  const publications = await fetchPublicPublications({ limit: 9 });

  return (
    <>
      <MarketingPageHero
        label="Insights"
        subtitle="Reports, commentary, and technical outputs from PATNA's public archive."
        title="Insights and evidence from PATNA's work"
      />

      <FeaturedStoryRail section={publicPageMedia.insights.featured} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Latest from PATNA"
            title="Reports, articles, and event outputs"
            subtitle="Browse recent PATNA publications, commentary, and technical outputs from the live archive."
          />

          {publications.length ? (
            <div className="publications-grid">
              {publications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </div>
          ) : (
            <article className="content-card">
              <h3>No insights published yet</h3>
              <p>Public reports and articles will appear here as soon as published records are available.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
