import { MarketingPageHero } from "@/components/marketing-page-hero";
import { ServiceRequestForm } from "./service-request-form";

export const metadata = {
  title: "Request Support",
  description:
    "Contact PATNA for technical support, briefings, analysis, and convening design support.",
};

export default function RequestSupportPage() {
  return (
    <>
      <MarketingPageHero
        label="Request Support"
        subtitle="Use this route if you need a briefing, technical analysis, convening design support, or coordination input from PATNA."
        title="Request technical support from PATNA"
      />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>When to use this route</h3>
              <ul className="check-list">
                <li>Briefings for policymakers, negotiators, or public institutions</li>
                <li>Technical analysis connected to maritime, climate, or energy transition issues</li>
                <li>Convening design, facilitation, or event support</li>
                <li>Coordination support around high-stakes public meetings or policy moments</li>
              </ul>
            </article>

            <div className="wwu-form-col">
              <h3>Submit a support request</h3>
              <p className="muted-note">
                Include the institution you represent, the decision context, the support needed, and any time-sensitive milestones.
              </p>
              <ServiceRequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
