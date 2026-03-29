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
        subtitle="Briefs, reports, and commentary presented with the clarity expected of a serious policy archive."
        title="Knowledge products with a clearer editorial identity"
      />

      <FeaturedStoryRail section={publicPageMedia.insights.featured} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Editorial system"
            title="One content system for public articles, reports, briefs, and event outputs"
            subtitle="The archive connects content to audience, context, and source so each item feels grounded in real PATNA work."
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
