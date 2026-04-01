import { MarketingPageHero } from "@/components/marketing-page-hero";
import { contactDetails } from "@/lib/patna-data";

export const metadata = {
  title: "Collaborate",
  description:
    "Propose a workshop, pilot, research collaboration, or co-created initiative with PATNA.",
};

export default function CollaboratePage() {
  return (
    <>
      <MarketingPageHero
        actions={[
          {
            href: `mailto:${contactDetails.email}?subject=PATNA%20Collaboration%20Proposal`,
            label: "Email collaboration proposal",
            variant: "primary",
          },
        ]}
        label="Collaborate"
        subtitle="Propose a workshop, pilot, joint research effort, or other collaborative initiative with PATNA."
        title="Co-create a PATNA initiative"
      />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>Useful collaboration starting points</h3>
              <ul className="check-list">
                <li>Joint workshops, roundtables, or technical dialogues</li>
                <li>Research partnerships and co-authored public outputs</li>
                <li>Pilot initiatives linked to maritime or climate transition</li>
                <li>Cross-institutional knowledge exchange or training activities</li>
              </ul>
            </article>

            <article className="content-card">
              <h3>What to send</h3>
              <p>
                Outline the collaboration idea, the contribution you have in mind, and the kind of
                outcome or public value the initiative should create.
              </p>
              <div className="stack">
                <a
                  className="primary-button"
                  href={`mailto:${contactDetails.email}?subject=PATNA%20Collaboration%20Proposal`}
                >
                  Email PATNA
                </a>
                <p className="muted-note">
                  Collaboration proposals are currently handled directly by email so the PATNA
                  team can assess fit, timing, and next steps with you.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
