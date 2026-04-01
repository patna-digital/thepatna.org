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
  const publications = await fetchPublicPublications();
  const [featured, ...rest] = publications;

  return (
    <>
      <MarketingPageHero
        label="Publications"
        subtitle="PATNA's public archive of reports, articles, and event outputs documenting African-centred evidence, technical analysis, and policy engagement."
        title="Reports, articles, and technical outputs from PATNA"
      />

      {featured && (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label="Latest"
              title="Most recent publication"
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
              label="Archive"
              title="All publications"
              subtitle="The full library of PATNA knowledge products, ordered by publication date."
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
            <p className="muted-note">No publications available yet. Check back soon.</p>
          </div>
        </section>
      )}
    </>
  );
}
