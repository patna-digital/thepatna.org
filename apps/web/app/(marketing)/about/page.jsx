import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { cohortSummary } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export default function AboutPage() {
  return (
    <>
      <MarketingPageHero
        actions={[{ href: "/community", label: "Explore community", variant: "primary" }]}
        label="About PATNA"
        subtitle="PATNA began as an effort to strengthen Africa's voice in maritime decarbonisation and has evolved into a broader network for climate action, evidence, and energy transition coordination across sectors and regions."
        title="The platform now reflects how PATNA actually works"
      />

      <PhotoQuoteSplit section={publicPageMedia.about.mission} />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <SectionIntro
                label="How PATNA works"
                title="The public site should show both institutional purpose and operational form"
                subtitle="This page now pairs PATNA's mission with real public imagery so the organisation reads as a living network rather than a purely conceptual platform."
              />
              <p>
                The PATNA digital platform should support awareness, policy influence, community
                coordination, and long-term institutional continuity. That means the website is
                only one surface of a larger product.
              </p>
            </article>

            <article className="content-card feature-list">
              <h3>Core values</h3>
              <ul>
                <li>Inclusivity across African voices, regions, and constituencies</li>
                <li>Innovation grounded in practical institutional needs</li>
                <li>Sustainability through reusable knowledge and durable systems</li>
                <li>Collaboration across sectors, disciplines, and languages</li>
                <li>Transparency in governance, evidence, and coordination workflows</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <FeaturedStoryRail section={publicPageMedia.about.portraits} />

      <section className="section">
        <div className="section-inner">
          <div className="card-grid">
            {cohortSummary.map((cohort) => (
              <article className="content-card" key={cohort.title}>
                <h3>{cohort.title}</h3>
                <p>{cohort.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
