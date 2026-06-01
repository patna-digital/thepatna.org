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

            <aside className="content-card join-sidebar">
              <h3>What happens next</h3>
              <p className="join-sidebar-intro">
                PATNA membership is by application. Every submission is reviewed by the
                secretariat against expertise, geographic representation, and cohort fit.
              </p>

              <ol className="join-steps">
                <li className="join-step">
                  <span className="join-step-num">1</span>
                  <div>
                    <strong>Review</strong>
                    <p>Your application is assessed for fit and completeness by the PATNA secretariat.</p>
                  </div>
                </li>
                <li className="join-step">
                  <span className="join-step-num">2</span>
                  <div>
                    <strong>Interview</strong>
                    <p>Shortlisted applicants are invited for a brief conversation to confirm alignment.</p>
                  </div>
                </li>
                <li className="join-step">
                  <span className="join-step-num">3</span>
                  <div>
                    <strong>Cohort assignment</strong>
                    <p>Accepted members are placed in the cohort that best matches their expertise and goals.</p>
                  </div>
                </li>
                <li className="join-step">
                  <span className="join-step-num">4</span>
                  <div>
                    <strong>Welcome &amp; onboarding</strong>
                    <p>You receive your community invite, member profile, and access to PATNA spaces.</p>
                  </div>
                </li>
              </ol>

              <div className="join-sidebar-note">
                <strong>Typical timeline:</strong> 2–4 weeks from submission to decision.
              </div>
            </aside>

            <CommunityApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
