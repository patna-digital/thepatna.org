import { MarketingPageHero } from "@/components/marketing-page-hero";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import { publicInsights } from "@/lib/patna-data";
import { insightMediaBySlug, publicPageMedia } from "@/lib/public-media";

export default function InsightsPage() {
  return (
    <>
      <MarketingPageHero
        label="Insights"
        subtitle="Briefs, reports, and commentary now sit inside the same publishing aesthetic established by the original PATNA mockup."
        title="Knowledge products with a clearer editorial identity"
      />

      <FeaturedStoryRail section={publicPageMedia.insights.featured} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Editorial system"
            title="One content system for public articles, reports, briefs, and event outputs"
            subtitle="The listing below now uses real PATNA event and article imagery so the insight archive feels connected to actual rooms, audiences, and institutions."
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
    </>
  );
}
