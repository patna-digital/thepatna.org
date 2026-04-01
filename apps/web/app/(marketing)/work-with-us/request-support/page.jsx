import { MarketingPageHero } from "@/components/marketing-page-hero";
import { contactDetails } from "@/lib/patna-data";

export const metadata = {
  title: "Request Support",
  description:
    "Contact PATNA for technical support, briefings, analysis, and convening design support.",
};

export default function RequestSupportPage() {
  return (
    <>
      <MarketingPageHero
        actions={[
          {
            href: `mailto:${contactDetails.email}?subject=PATNA%20Technical%20Support%20Request`,
            label: "Email support request",
            variant: "primary",
          },
        ]}
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

            <article className="content-card">
              <h3>What to include</h3>
              <p>
                Share the institution you represent, the decision context, the support needed, and
                any time-sensitive milestones.
              </p>
              <div className="stack">
                <a
                  className="primary-button"
                  href={`mailto:${contactDetails.email}?subject=PATNA%20Technical%20Support%20Request`}
                >
                  Email PATNA
                </a>
                <p className="muted-note">
                  PATNA currently handles support requests directly by email so the team can
                  review each request in context and respond quickly.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
