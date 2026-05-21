import Link from "next/link";

export const metadata = {
  title: "Work With Us",
  description:
    "Work with PATNA on technical advisory, partnerships, evidence production, and institutional climate-maritime strategy.",
};

const services = [
  {
    tag: "Service · Research",
    title: "Research & Evidence Production",
    meta: "Commissioned country impact studies, shipping GHG inventories, port decarbonisation roadmaps, and policy briefs timed to negotiating sessions.",
  },
  {
    tag: "Service · Capacity",
    title: "Capacity Building & Negotiator Training",
    meta: "Simulation exercises, delegation preparation workshops, and fellowship programmes building Africa's long-term institutional capability.",
  },
  {
    tag: "Service · Partnerships",
    title: "Strategic Partnerships & Funding Navigation",
    meta: "Institutional partnership development, climate finance navigation, and coalition building at AU and international levels.",
  },
];

const steps = [
  {
    label: "Understand",
    title: "We assess your institutional need",
    desc: "An initial consultation clarifies your objectives, negotiating context, and the specific gap PATNA can fill with its network and expertise.",
  },
  {
    label: "Build",
    title: "We construct the evidence and strategy",
    desc: "We produce or curate the evidence base, from country impact assessments to position papers, and shape it into a politically viable strategy.",
  },
  {
    label: "Deliver",
    title: "We deploy, represent, and report",
    desc: "We deploy our network, attend sessions, and deliver post-engagement reporting that tracks outcomes, coalition shifts, and implications.",
  },
];

export default function WorkWithUsPage() {
  return (
    <>
      <section className="sub-page-hero" aria-label="Work with PATNA">
        <div className="sub-page-hero-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=700&fit=crop&q=80"
            alt=""
          />
        </div>
        <div className="sub-page-hero-overlay" aria-hidden="true" />
        <div className="sub-page-hero-dot" aria-hidden="true" />
        <div className="sub-page-hero-inner">
          <div className="sub-page-hero-eyebrow">Advisory &amp; Partnerships</div>
          <h1 className="sub-page-hero-title">
            Commission Africa&apos;s expert <em>climate network</em>
          </h1>
          <p className="sub-page-hero-sub">
            PATNA serves as lead technical consultant to governments, the African Union
            Commission, and international institutions navigating consequential maritime
            climate decisions.
          </p>
        </div>
      </section>

      <div className="feat-split-section">
        <div className="feat-split-inner">
          <div className="feat-split-bar">
            <span className="feat-split-label">Our Services</span>
            <Link className="feat-split-view-all" href="/contact">
              Get in touch →
            </Link>
          </div>

          <div className="feat-split-grid">
            <article className="feat-main-card">
              <div className="feat-main-img">
                <img
                  src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=900&h=680&fit=crop&q=80"
                  alt="PATNA technical advisory and institutional engagement"
                />
                <div className="feat-main-img-overlay" />
                <span className="feat-main-status feat-status-upcoming">Flagship Service</span>
              </div>
              <div className="feat-main-body">
                <div className="feat-main-tag">Technical Advisory · Governments &amp; AU Institutions</div>
                <h2 className="feat-main-title">
                  Technical Advisory — Commission PATNA as Your Expert Consultant
                </h2>
                <p className="feat-main-desc">
                  PATNA produces the evidence, coordinates positions, and deploys expert
                  fellows to represent institutional interests at the IMO, UNFCCC, and AU fora.
                </p>
                <div className="service-features">
                  <div className="service-feature">Country impact assessments and GHG inventories</div>
                  <div className="service-feature">Pre-session briefings and 72-hour post-session analysis</div>
                  <div className="service-feature">Expert fellow deployment to delegations</div>
                  <div className="service-feature">Coordination with African delegations and the AU Commission</div>
                </div>
                <div className="feat-main-footer">
                  <div className="feat-main-meta">AUC · AU STC-T&amp;E · IMO MEPC · UNFCCC COP</div>
                  <Link className="feat-main-cta" href="/contact">
                    Start a Conversation →
                  </Link>
                </div>
              </div>
            </article>

            <div className="feat-side-list">
              {services.map((service) => (
                <Link className="feat-side-item" href="/contact" key={service.title}>
                  <div className="feat-side-content">
                    <div className="feat-side-tag">{service.tag}</div>
                    <div className="feat-side-title">{service.title}</div>
                    <div className="feat-side-meta">{service.meta}</div>
                  </div>
                  <span className="feat-side-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="how-section">
        <div className="how-section-inner">
          <div className="section-label">Our Approach</div>
          <h2 className="section-title">
            How we <em>work with you</em>
          </h2>

          <div className="how-grid">
            {steps.map((step, index) => (
              <article className="how-step" key={step.label}>
                <div className="how-step-circle">{index + 1}</div>
                <div className="how-step-label">{step.label}</div>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="join-band join-band-v4">
        <h2>Ready to commission PATNA?</h2>
        <p>
          Tell us your institutional challenge. We will tell you exactly how PATNA&apos;s
          network, evidence base, and presence can help.
        </p>
        <div className="join-band-ctas">
          <Link className="cta-primary" href="/contact">
            Contact Us →
          </Link>
          <Link className="cta-secondary" href="/community">
            Join Our Community
          </Link>
        </div>
      </section>
    </>
  );
}
