import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations();
  const publications = await fetchPublicPublications({ limit: 9 });

  return (
    <>
      <MarketingPageHero
        label={t("insights.label")}
        subtitle={t("insights.subtitle")}
        title={t("insights.title")}
      />

      <FeaturedStoryRail section={publicPageMedia.insights.featured} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("insights.latestLabel")}
            title={t("insights.latestTitle")}
            subtitle={t("insights.latestSubtitle")}
          />

          {publications.length ? (
            <div className="publications-grid">
              {publications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </div>
          ) : (
            <article className="content-card">
              <h3>{t("insights.emptyTitle")}</h3>
              <p>{t("insights.emptyText")}</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
