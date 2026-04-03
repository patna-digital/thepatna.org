import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { PublicationCard, FeaturedPublicationCard } from "@/components/publication-card";
import { fetchPublicPublications } from "@/lib/publications";

export const metadata = {
  title: "Publications | PATNA",
  description:
    "Reports, briefs, articles, and event outputs from PATNA's work on African climate action, maritime decarbonisation, and energy transition.",
};

export default async function PublicationsPage() {
  const t = await getTranslations();
  const publications = await fetchPublicPublications();
  const [featured, ...rest] = publications;

  return (
    <>
      <MarketingPageHero
        label={t("publications.label")}
        subtitle={t("publications.subtitle")}
        title={t("publications.title")}
      />

      {featured && (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label={t("publications.latestLabel")}
              title={t("publications.latestTitle")}
            />
            <FeaturedPublicationCard
              href={`/publications/${featured.slug}`}
              publication={featured}
            />
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label={t("publications.archiveLabel")}
              title={t("publications.archiveTitle")}
              subtitle={t("publications.archiveSubtitle")}
            />
            <div className="publications-grid">
              {rest.map((pub) => (
                <PublicationCard
                  href={`/publications/${pub.slug}`}
                  key={pub.id}
                  publication={pub}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {publications.length === 0 && (
        <section className="section">
          <div className="section-inner">
            <p className="muted-note">{t("publications.empty")}</p>
          </div>
        </section>
      )}
    </>
  );
}
