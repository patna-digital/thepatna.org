import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { SectionIntro } from "@/components/section-intro";
import { workWithUsPaths } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "Work With Us",
  description:
    "Work with PATNA on technical support, partnerships, and collaborative initiatives across climate and maritime transition.",
};

export default function WorkWithUsPage() {
  return (
    <>
      <MarketingPageHero
        label="Work With Us"
        subtitle="PATNA works with governments, regional bodies, researchers, funders, and strategic partners across maritime decarbonisation, climate governance, and energy transition."
        title="Work with PATNA on evidence, convenings, and implementation strategy"
      />

      <PhotoQuoteSplit section={publicPageMedia.workWithUs.feature} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Engagement pathways"
            title="Choose the route that best matches the work you want to advance"
            subtitle="Whether you need technical support, want to explore a partnership, or have an idea for joint work, PATNA starts with a focused conversation grounded in clear public priorities."
          />

          <div className="card-grid">
            {workWithUsPaths.map((path) => (
              <article className="content-card" key={path.href}>
                <h3>{path.title}</h3>
                <p>{path.summary}</p>
                <div className="content-meta">
                  <Link className="primary-button" href={path.href}>
                    Open pathway
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="muted-note">
            First-contact enquiries are currently handled directly by email so the PATNA team can
            respond quickly and route each conversation appropriately.
          </p>
        </div>
      </section>
    </>
  );
}
