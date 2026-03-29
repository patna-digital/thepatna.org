import { MarketingPageHero } from "@/components/marketing-page-hero";
import { CommunityApplicationForm } from "./community-application-form";

export default function JoinCommunityPage() {
  return (
    <>
      <MarketingPageHero
        label="Join PATNA"
        subtitle="Submit your interest through a structured PATNA application designed around expertise, motivation, and how you want to engage."
        title="Submit your expression of interest"
      />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>Application stages</h3>
              <p>
                The form captures the information PATNA needs to assess fit, route applications,
                and prepare review decisions.
              </p>
              <ul className="check-list">
                <li>Applicant details, contact information, and organisation</li>
                <li>Motivation statement</li>
                <li>Expertise areas and engagement preferences</li>
                <li>Admin review, interview, cohort assignment, approval, and invite issuance</li>
              </ul>
            </article>

            <CommunityApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
