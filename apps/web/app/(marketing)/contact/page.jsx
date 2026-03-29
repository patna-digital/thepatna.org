import { MarketingPageHero } from "@/components/marketing-page-hero";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { publicPageMedia } from "@/lib/public-media";

export default function ContactPage() {
  return (
    <>
      <MarketingPageHero
        label="Contact"
        subtitle="Public contact routes should be simple, clear, and ready to connect to workflow tables as the platform expands."
        title="Reach the PATNA team"
      />

      <PhotoQuoteSplit section={publicPageMedia.contact.feature} />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>Contact details</h3>
              <p>
                Public contact flows can stay simple while still routing cleanly into structured
                workflows later.
              </p>
              <div className="stack">
                <div>
                  <strong>Email</strong>
                  <p>contact@thepatna.org</p>
                </div>
                <div>
                  <strong>Address</strong>
                  <p>Unity House, Victoria, Mahe, Seychelles</p>
                </div>
              </div>
            </article>

            <form className="form-card">
              <h3>Send a message</h3>
              <label>
                Name
                <input placeholder="Your full name" />
              </label>
              <label>
                Email
                <input placeholder="you@example.org" type="email" />
              </label>
              <label>
                Message
                <textarea placeholder="Tell PATNA how to help." />
              </label>
              <button className="primary-button" type="button">
                Send message
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
