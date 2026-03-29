import { MarketingPageHero } from "@/components/marketing-page-hero";
import { CommunityApplicationForm } from "./community-application-form";

export default function JoinCommunityPage() {
  return (
    <>
      <MarketingPageHero
        label="Join PATNA"
        subtitle="This route is now visually aligned with the main community mockup while still mapping directly to the live Supabase application tables."
        title="Submit your expression of interest"
      />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>Application stages</h3>
              <p>
                The form fields map directly onto the first-stage application table and interest
                join tables already connected to Supabase.
              </p>
              <ul className="check-list">
                <li>Applicant details and organization</li>
                <li>Motivation statement</li>
                <li>Cohort interests and domain interests</li>
                <li>Admin review, interview, approval, and invite issuance</li>
              </ul>
            </article>

            <CommunityApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
