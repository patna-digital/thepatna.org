import Link from "next/link";

export const metadata = {
  title: "Work With Us",
  description:
    "Engage PATNA through the right route — partnership enquiries, technical support requests, collaboration proposals, or a general enquiry.",
};

const PartnershipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CollaborateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);

const pathways = [
  {
    type: "partnership",
    icon: <PartnershipIcon />,
    tag: "Funding · Institutional",
    title: "Explore Partnership",
    audience: "For funders, institutions, and strategic partners",
    desc: "Introduce your organisation and areas of shared interest. PATNA routes partnership conversations directly to the right programme or leadership contact.",
    href: "/work-with-us/partner",
    cta: "Start a partnership enquiry →",
  },
  {
    type: "support",
    icon: <SupportIcon />,
    tag: "Technical · Advisory",
    title: "Request Support",
    audience: "For policymakers, negotiators, and public institutions",
    desc: "Use this route if your institution needs a briefing, technical analysis, convening design, or coordination input ahead of a decision moment.",
    href: "/work-with-us/request-support",
    cta: "Submit a support request →",
  },
  {
    type: "collaborate",
    icon: <CollaborateIcon />,
    tag: "Research · Co-creation",
    title: "Collaborate",
    audience: "For researchers, academics, and peer organisations",
    desc: "Propose a joint initiative — a workshop, research partnership, pilot, or co-authored output. PATNA's team will review and respond to discuss fit and next steps.",
    href: "/work-with-us/collaborate",
    cta: "Send a collaboration proposal →",
  },
];

const contactItems = [
  "Media and press enquiries",
  "Speaking invitations and event appearances",
  "Academic citations and reprint permissions",
  "Any other question or introduction",
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
            Four routes to <em>engage PATNA</em>
          </h1>
          <p className="sub-page-hero-sub">
            Whether you want to fund, commission, collaborate, or simply ask a question —
            choose the route that fits your context and we will get you to the right conversation quickly.
          </p>
        </div>
      </section>

      <section className="pathway-section" aria-labelledby="pathways-heading">
        <div className="pathway-section-header">
          <p className="pathway-section-label">How to engage</p>
          <h2 id="pathways-heading">
            Choose the route that <em>fits your need</em>
          </h2>
        </div>

        <div className="pathway-layout">
          {/* Left: General contact — always-relevant entry point */}
          <div className="pathway-featured-contact">
            <div className="pathway-featured-contact-tag">General · Enquiry</div>
            <h3 className="pathway-featured-contact-title">Get in Touch</h3>
            <p className="pathway-featured-contact-audience">For everyone else</p>
            <p className="pathway-featured-contact-desc">
              Not sure which route fits? Send a general message to the PATNA team and we will point you in the right direction. We typically respond within two working days.
            </p>
            <ul className="pathway-featured-contact-items">
              {contactItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="pathway-featured-contact-cta" href="/contact">
              Send a message
            </Link>
          </div>

          {/* Right: Three specific routes stacked */}
          <div className="pathway-routes">
            {pathways.map((p) => (
              <article className="pathway-card" data-type={p.type} key={p.type}>
                <div className="pathway-card-header">
                  <div className="pathway-card-icon">{p.icon}</div>
                  <div>
                    <div className="pathway-card-tag">{p.tag}</div>
                    <h3 className="pathway-card-title">{p.title}</h3>
                  </div>
                </div>
                <div className="pathway-card-audience">{p.audience}</div>
                <p className="pathway-card-desc">{p.desc}</p>
                <Link className="pathway-card-cta" href={p.href}>
                  {p.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="join-band join-band-v4" aria-label="Community invitation">
        <h2>Want to join the PATNA community?</h2>
        <p>
          The community application route is separate — for African experts, policymakers,
          and practitioners who want to participate in PATNA's network.
        </p>
        <div className="join-band-ctas">
          <Link className="cta-primary" href="/community">
            Apply to join →
          </Link>
          <Link className="cta-secondary" href="/about">
            Learn about PATNA
          </Link>
        </div>
      </section>
    </>
  );
}
