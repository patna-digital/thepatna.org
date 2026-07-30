import { MarketingPageHero } from "@/components/marketing-page-hero";
import { PartnershipEnquiryForm } from "./partnership-enquiry-form";

export const metadata = {
  title: "Explore Partnership",
  description:
    "Start a partnership conversation with PATNA around programmes, funding, and strategic collaboration.",
};

export default function PartnershipPage() {
  return (
    <>
      <MarketingPageHero
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

            <div className="wwu-form-col">
              <h3>Send a partnership enquiry</h3>
              <p className="muted-note">
                PATNA will route your enquiry to the right programme or leadership contact and respond directly.
              </p>
              <PartnershipEnquiryForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
