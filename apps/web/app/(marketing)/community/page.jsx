import Link from "next/link";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { SectionIntro } from "@/components/section-intro";
import {
  cohortSummary,
  communityJourney,
  communityStructures,
} from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "Community",
  description:
    "Discover PATNA's public community structure, cohorts, and pathways for African experts and institutions to contribute.",
};

export default function CommunityPage() {
  return (
    <>
      <section className="community-hero">
        <div className="community-hero-inner">
          <div className="community-hero-eyebrow">PATNA Community</div>
          <h1>
            A community for <em>African expertise</em>, coordination, and shared evidence
          </h1>
          <p>
            PATNA brings together experts, institutions, policymakers, practitioners, and civil
            society contributors who want to advance evidence-based climate action, maritime
            decarbonisation, and stronger African positioning in global decision-making.
          </p>
          <div className="hero-actions">
            <Link className="secondary-button" href="/community/join">
              Apply to Join
            </Link>
            <Link className="pill-link" href="/auth/login">
              Member Login
            </Link>
          </div>
        </div>
      </section>

      <section className="section cohorts-section">
        <div className="section-inner">
          <div className="cohorts-intro">
            <SectionIntro
              label="Four cohorts"
              title="A community organised around how PATNA brings expertise together"
              subtitle="The public community reflects the real working structure behind PATNA's policy, academic, industry, and civil-society engagement."
            />

            <article className="content-card">
              <h3>What community participation supports</h3>
              <ul className="check-list">
                <li>Promote evidence-based policymaking across African climate and maritime priorities.</li>
                <li>Advance maritime decarbonisation and just transition pathways in Africa.</li>
                <li>Strengthen Africa's voice in global maritime and climate governance.</li>
                <li>Foster regional collaboration, knowledge exchange, and capacity-building.</li>
              </ul>
            </article>
          </div>

          <div className="cohorts-grid">
            {cohortSummary.map((cohort) => (
              <article className="cohort-card" key={cohort.slug}>
                <div className="cohort-icon">{cohort.icon}</div>
                <h3>{cohort.title}</h3>
                <p>{cohort.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FeaturedStoryRail section={publicPageMedia.community.stories} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="How joining works"
            title="From expression of interest to active contribution"
            subtitle="PATNA's joining process is designed to connect people to the most relevant cohort, collaboration, or contribution pathway."
          />

          <div className="steps-row">
            {communityJourney.map((item) => (
              <div className="step" key={item.step}>
                <div className="step-num">{item.step}</div>
                <div className="step-title">{item.title}</div>
                <div className="step-body">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Community structure"
            title="Board, secretariat, cohorts, and collaborative pathways"
            subtitle="The PATNA community is more than a login surface. It is the public structure through which governance, coordination, and contribution happen."
          />

          <div className="card-grid">
            {communityStructures.map((item) => (
              <article className="content-card" key={item.title}>
                <div className="tag">{item.type}</div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="join-band">
        <div className="section-inner">
          <div className="section-label">Applications open</div>
          <h2>Ready to shape Africa's maritime future?</h2>
          <p>
            Join more than 100 specialists already collaborating through PATNA's cohorts,
            convenings, and shared evidence work.
          </p>
          <div className="join-band-btns">
            <Link className="secondary-button" href="/community/join">
              Start application
            </Link>
            <Link className="pill-link" href="/auth/login">
              Existing member login
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
