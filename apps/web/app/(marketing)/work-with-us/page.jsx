import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { SectionIntro } from "@/components/section-intro";
import { workWithUsPaths } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export default function WorkWithUsPage() {
  return (
    <>
      <MarketingPageHero
        label="Work With Us"
        subtitle="The PATNA platform now gives public engagement routes the same level of structure and polish as the core programme pages."
        title="Three pathways into support, partnership, and collaboration"
      />

      <PhotoQuoteSplit section={publicPageMedia.workWithUs.feature} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Engagement pathways"
            title="Structured entry points into PATNA support, partnership, and collaboration"
            subtitle="These pages line up with the service request, partnership lead, and collaboration lead tables in the planned schema."
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
        </div>
      </section>
    </>
  );
}
