import { MarketingPageHero } from "@/components/marketing-page-hero";

export default function LegalPage() {
  return (
    <>
      <MarketingPageHero
        label="Legal"
        subtitle="PATNA can add privacy, terms, accessibility, and data handling content here before launch without breaking the shared page system."
        title="Privacy, terms, and accessibility"
      />

      <section className="section">
        <div className="section-inner">
          <div className="content-card">
            <ul className="check-list">
              <li>Privacy policy</li>
              <li>Terms of use</li>
              <li>Accessibility statement</li>
              <li>Data handling notes for forms and member content</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
