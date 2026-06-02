import { CommunityApplicationForm } from "./community-application-form";

export const metadata = {
  title: "Join PATNA",
  description:
    "Submit your expression of interest to join the PATNA Initiative — Africa's leading network on maritime decarbonisation and energy transition.",
};

export default function JoinCommunityPage() {
  return (
    <div className="join-page">

      {/* Page header */}
      <header className="join-page-header">
        <div className="join-page-header-inner">
          <div className="join-page-eyebrow">Join PATNA</div>
          <h1 className="join-page-title">Express your interest</h1>
          <p className="join-page-subtitle">
            PATNA membership is by application. Complete the form below — the secretariat
            reviews every submission for expertise, geographic fit, and cohort alignment.
          </p>
        </div>
      </header>

      {/* Admin invite callout */}
      <div className="join-invite-banner-wrap">
        <div className="join-invite-banner">
          <span aria-hidden="true" className="join-invite-banner-icon">✉</span>
          <div className="join-invite-banner-text">
            <strong>Already been directly invited?</strong>
            {" "}If you received an email invite from PATNA, check your inbox for a direct account-setup link. You don't need to fill in this form.
          </div>
        </div>
      </div>

      {/* Body: form + sidebar */}
      <div className="join-body">
        <div className="join-body-inner">

          {/* Form — primary */}
          <div className="join-form-col">
            <CommunityApplicationForm />
          </div>

          {/* Sidebar — what happens next */}
          <aside className="join-sidebar-col" aria-label="Application process">
            <div className="join-sidebar-card">
              <div className="join-sidebar-card-label">What happens next</div>
              <p className="join-sidebar-card-intro">
                Every submission is reviewed by the secretariat. Here's how the process works.
              </p>

              <ol className="join-steps-v2">
                {[
                  { n: 1, title: "Secretariat review", body: "Your application is assessed for expertise, geographic representation, and cohort fit." },
                  { n: 2, title: "Interview", body: "Shortlisted applicants are invited for a brief conversation to confirm alignment." },
                  { n: 3, title: "Cohort assignment", body: "Accepted members are placed in the cohort that best matches their expertise and goals." },
                  { n: 4, title: "Welcome & onboarding", body: "You receive your invite email, community profile, and access to PATNA member spaces." },
                ].map((s, i, arr) => (
                  <li className="join-step-v2" key={s.n}>
                    <div className="join-step-v2-left">
                      <div className="join-step-v2-num">{s.n}</div>
                      {i < arr.length - 1 && <div aria-hidden="true" className="join-step-v2-line" />}
                    </div>
                    <div className="join-step-v2-body">
                      <strong className="join-step-v2-title">{s.title}</strong>
                      <p className="join-step-v2-desc">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="join-sidebar-timing">
                <strong>Typical timeline</strong>
                <span>2–4 weeks from submission to decision</span>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
