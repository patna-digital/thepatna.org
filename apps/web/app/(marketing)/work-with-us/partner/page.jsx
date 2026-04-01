import { MarketingPageHero } from "@/components/marketing-page-hero";
import { contactDetails } from "@/lib/patna-data";

export const metadata = {
  title: "Explore Partnership",
  description:
    "Start a partnership conversation with PATNA around programmes, funding, and strategic collaboration.",
};

export default function PartnershipPage() {
  return (
    <>
      <MarketingPageHero
        actions={[
          {
            href: `mailto:${contactDetails.email}?subject=PATNA%20Partnership%20Enquiry`,
            label: "Email partnership enquiry",
            variant: "primary",
          },
        ]}
        label="Explore Partnership"
        subtitle="Share strategic priorities, funding interests, and potential programme alignment with PATNA."
        title="Start a partnership conversation"
      />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>Partnership conversations can cover</h3>
              <ul className="check-list">
                <li>Programme partnerships and institutional collaboration</li>
                <li>Research support and public-interest evidence generation</li>
                <li>Funding for convenings, technical analysis, or long-term capacity-building</li>
                <li>Regional and international collaboration around African climate priorities</li>
              </ul>
            </article>

            <article className="content-card">
              <h3>How to get started</h3>
              <p>
                Introduce your organisation, the area of shared interest, and what success would
                look like from your side.
              </p>
              <div className="stack">
                <a
                  className="primary-button"
                  href={`mailto:${contactDetails.email}?subject=PATNA%20Partnership%20Enquiry`}
                >
                  Email PATNA
                </a>
                <p className="muted-note">
                  Partnership enquiries are currently handled directly by email so PATNA can route
                  each conversation to the right programme or leadership contact.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
