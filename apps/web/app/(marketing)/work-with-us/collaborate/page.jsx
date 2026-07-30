import { MarketingPageHero } from "@/components/marketing-page-hero";
import { CollaborationProposalForm } from "./collaboration-proposal-form";

export const metadata = {
  title: "Collaborate",
  description:
    "Propose a workshop, pilot, research collaboration, or co-created initiative with PATNA.",
};

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

            <div className="wwu-form-col">
              <h3>Send your collaboration proposal</h3>
              <p className="muted-note">
                Outline the idea, your contribution, and the public value or outcome the initiative should create.
              </p>
              <CollaborationProposalForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
