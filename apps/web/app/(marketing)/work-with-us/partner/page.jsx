import { MarketingPageHero } from "@/components/marketing-page-hero";

export default function PartnershipPage() {
  return (
    <>
      <MarketingPageHero
        label="Explore Partnership"
        subtitle="Share strategic priorities, funding interests, and possible programme alignment with PATNA."
        title="Start a partnership conversation"
      />

      <section className="section">
        <div className="section-inner">
          <form className="form-card">
            <h3>Explore partnership</h3>
            <label>
              Name
              <input placeholder="Your full name" />
            </label>
            <label>
              Organisation
              <input placeholder="Organisation" />
            </label>
            <label>
              Focus areas
              <textarea placeholder="Areas of shared interest or funding focus." />
            </label>
            <label>
              Success definition
              <textarea placeholder="What would success look like for this partnership?" />
            </label>
            <button className="primary-button" type="button">
              Submit partnership enquiry
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
