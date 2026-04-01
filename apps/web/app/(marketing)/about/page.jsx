import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { cohortSummary } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "About",
  description:
    "Learn about PATNA's mission, vision, and Africa-centred approach to climate action, maritime decarbonisation, and energy transition.",
};

export default function AboutPage() {
  return (
    <>
      <MarketingPageHero
        actions={[{ href: "/projects", label: "View projects", variant: "primary" }]}
        label="About PATNA"
        subtitle="PATNA is a non-profit organisation dedicated to supporting African-centred climate action and energy transition pathways grounded in evidence, collaboration, and institutional understanding."
        title="Africa-centred evidence, diplomacy, and institutional coordination"
      />

      <PhotoQuoteSplit section={publicPageMedia.about.mission} />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <SectionIntro
                label="Who PATNA is"
                title="A pan-African network built for long-term public influence"
                subtitle="PATNA emerged from the recognition that African perspectives were too often under-represented in global maritime and climate processes, despite the continent bearing major economic and social consequences."
              />
              <p>
                What began as a small group of African experts engaging the International Maritime
                Organization (IMO) has grown into a network that bridges disciplines, languages,
                and regions so African realities can inform global climate and energy outcomes.
              </p>
              <p>
                PATNA works across climate governance, maritime decarbonisation, energy transition,
                and institutional readiness, combining evidence, convening power, and collective
                strategy to help African actors move from participation to leadership.
              </p>
            </article>

            <article className="content-card feature-list">
              <h3>Vision and mission</h3>
              <p>
                <strong>Vision:</strong> To be the leading coalition of African technical experts
                advancing innovative, inclusive, and Africa-centred solutions for climate action
                and energy transition across interconnected systems.
              </p>
              <p>
                <strong>Mission:</strong> To harness the collective expertise of African
                professionals to generate, coordinate, and apply evidence-based strategies that
                support climate resilience, energy transition, and sustainable development across
                the continent.
              </p>
              <h3>Core values</h3>
              <ul>
                <li>Inclusivity across African voices, regions, and constituencies</li>
                <li>Innovation grounded in practical institutional needs</li>
                <li>Sustainability through reusable knowledge and durable systems</li>
                <li>Collaboration across sectors, disciplines, and languages</li>
                <li>Transparency in governance, evidence, and coordination processes</li>
                <li>Leadership that strengthens Africa's voice in global decision-making</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <FeaturedStoryRail section={publicPageMedia.about.portraits} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="How the network is organised"
            title="Four core constituencies shape PATNA's public community"
            subtitle="PATNA's work is strengthened by a mix of researchers, policymakers, industry practitioners, and civil society leaders."
          />
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
