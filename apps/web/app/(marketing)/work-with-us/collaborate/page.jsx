import { MarketingPageHero } from "@/components/marketing-page-hero";

export default function CollaboratePage() {
  return (
    <>
      <MarketingPageHero
        label="Collaborate"
        subtitle="Propose a workshop, pilot, joint research effort, or other collaborative initiative with PATNA."
        title="Co-create a PATNA initiative"
      />

      <section className="section">
        <div className="section-inner">
          <form className="form-card">
            <h3>Propose a collaboration</h3>
            <label>
              Name
              <input placeholder="Your full name" />
            </label>
            <label>
              Organisation
              <input placeholder="Organisation" />
            </label>
            <label>
              Collaboration type
              <input placeholder="Workshop, pilot, co-authored research, other" />
            </label>
            <label>
              Proposal
              <textarea placeholder="Describe the collaboration idea and expected contribution." />
            </label>
            <button className="primary-button" type="button">
              Submit collaboration enquiry
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
