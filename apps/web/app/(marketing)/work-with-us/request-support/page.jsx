import { MarketingPageHero } from "@/components/marketing-page-hero";

export default function RequestSupportPage() {
  return (
    <>
      <MarketingPageHero
        label="Request Support"
        subtitle="Use this route for briefing requests, coordination support, analysis, and other public-facing service enquiries."
        title="Request technical support from PATNA"
      />

      <section className="section">
        <div className="section-inner">
          <form className="form-card">
            <h3>Request technical support</h3>
            <label>
              Name
              <input placeholder="Your full name" />
            </label>
            <label>
              Email
              <input placeholder="you@example.org" type="email" />
            </label>
            <label>
              Organisation
              <input placeholder="Organisation" />
            </label>
            <label>
              Request type
              <select defaultValue="Briefing">
                <option>Briefing</option>
                <option>Analysis</option>
                <option>Coordination</option>
                <option>Convening</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Details
              <textarea placeholder="Describe the decision context, timing, and support needed." />
            </label>
            <button className="primary-button" type="button">
              Submit request
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
