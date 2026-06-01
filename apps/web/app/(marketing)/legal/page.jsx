import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing-page-hero";

export const metadata = {
  title: "Legal | The PATNA Initiative",
  description: "Privacy policy, terms of service, and legal information for The PATNA Initiative.",
};

export default function LegalPage() {
  return (
    <>
      <MarketingPageHero
        label="Legal"
        subtitle="Privacy, terms, and legal information governing use of the PATNA platform and community workspace."
        title="Legal"
      />

      <section className="section">
        <div className="section-inner">
          <div className="legal-index-grid">
            <Link className="legal-index-card" href="/legal/privacy">
              <div className="legal-index-card-icon">🔒</div>
              <h3>Privacy Policy</h3>
              <p>
                How we collect, use, protect, and retain your personal information when you use
                our website, workspace, and community services.
              </p>
              <span className="legal-index-card-cta">Read Privacy Policy →</span>
            </Link>

            <Link className="legal-index-card" href="/legal/terms">
              <div className="legal-index-card-icon">📄</div>
              <h3>Terms of Service</h3>
              <p>
                The terms and conditions governing membership, acceptable use, content, and your
                relationship with The PATNA Initiative.
              </p>
              <span className="legal-index-card-cta">Read Terms of Service →</span>
            </Link>
          </div>

          <div className="content-card" style={{ marginTop: "1.5rem" }}>
            <h4>Questions or data requests?</h4>
            <p style={{ margin: "0.5rem 0 0" }}>
              Contact us at{" "}
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a> or write to
              The PATNA Initiative, JLARZON ADJ, University of Liberia, Fendell Campus,
              Montserrado, Monrovia, Liberia.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
