import Link from "next/link";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { SectionIntro } from "@/components/section-intro";
import { cohortSummary, communityJourney, memberSpaces } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export default function CommunityPage() {
  return (
    <>
      <section className="community-hero">
        <div className="community-hero-inner">
          <div className="community-hero-eyebrow">PATNA Community</div>
          <h1>
            A professional coordination space for <em>African expertise</em>
          </h1>
          <p>
            The PATNA community brings together experts, policymakers, practitioners, and civil
            society contributors through cohort spaces, working groups, events, and structured
            applications.
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
              title="A community model built around how PATNA actually organises expertise"
              subtitle="The public page now reflects the cohort-based structure shown in the original mockup while staying aligned with the application and membership schema."
            />

            <article className="content-card">
              <h3>How the community works</h3>
              <ul className="check-list">
                <li>Expressions of interest are captured through the live Supabase application flow.</li>
                <li>Admins review applications, record notes, and manage status changes in-platform.</li>
                <li>Approved members join spaces, discussions, events, and knowledge-sharing surfaces.</li>
                <li>Each cohort can branch into working groups, constituencies, and thematic collaboration.</li>
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
            title="From application to participation"
            subtitle="This stage-by-stage flow mirrors the real PATNA review pipeline already connected to the admin workspace."
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
            label="Community spaces"
            title="Cohort rooms, constituencies, and working groups"
            subtitle="The live dashboard shell now inherits this same space structure so the public and member experiences stay visually connected."
          />

          <div className="spaces-grid">
            {memberSpaces.map((space) => (
              <article className="space-card" key={space.slug}>
                <div className="tag">{space.type}</div>
                <strong>{space.name}</strong>
                <p>{space.role} access inside the PATNA community platform.</p>
                <div className="content-meta">
                  <span>{space.members} members</span>
                  <span>{space.threads} threads</span>
                  <span>{space.unread} unread</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="join-band">
        <div className="section-inner">
          <div className="section-label">Applications open</div>
          <h2>Join a network designed for evidence, coordination, and impact.</h2>
          <p>
            Start the PATNA application flow today and route directly into the review process now
            live in the admin workspace.
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
