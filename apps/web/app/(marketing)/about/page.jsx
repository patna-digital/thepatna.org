import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SectionIntro } from "@/components/section-intro";
import {
  storyTimeline,
  boardMembers,
  secretariatMembers,
  cohortSummary,
  journeyPhases,
  keyResults,
  strategicPillars,
  workingGroups,
} from "@/lib/patna-data";

export const metadata = {
  title: "About",
  description:
    "Learn about PATNA's mission, vision, and Africa-centred approach to maritime decarbonisation, climate action, and energy transition.",
};

export default async function AboutPage() {
  const t = await getTranslations();

  return (
    <>
      {/* ── PAGE HERO ── */}
      <section className="about-page-hero" aria-label="About PATNA">
        <div className="about-page-hero-inner">
          <p className="eyebrow about-hero-eyebrow">About PATNA</p>
          <h1 className="about-page-hero-h1">
            Building Africa's institutional capacity at the frontier of global climate governance.
          </h1>
          <p className="about-page-hero-sub">
            The Professional African Technical Network Advisory (PATNA) Initiative is a non-profit organisation of more than 100 African technical experts, policymakers, researchers, and maritime professionals. Our mandate is Pan-African, covering all 54 AU member states. Our mission is to enable Africa to shape the rules of the global energy transition.
          </p>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="section about-mv-section" aria-labelledby="about-mv-heading">
        <div className="section-inner">
          <div className="section-label">Purpose</div>
          <h2 className="section-title" id="about-mv-heading">Mission &amp; Vision</h2>

          <div className="about-mv-grid">
            <div className="about-mv-panel about-mv-mission">
              <div className="about-mv-panel-bar" aria-hidden="true" />
              <h3 className="about-mv-panel-label">Our mission</h3>
              <p>
                To strengthen Africa's agency in global energy transition and climate governance — by building the coordinated, evidence-based positions, the institutional networks, and the technical capacity that allow African states to participate as architects of international frameworks, not inheritors of them.
              </p>
              <p>
                The PATNA Initiative exists because the gap between Africa's exposure to global climate rules and Africa's influence over them is not a natural condition. It is the consequence of under-investment in coordination, evidence, and advisory capacity. The PATNA Initiative closes that gap.
              </p>
            </div>

            <div className="about-mv-panel about-mv-vision">
              <div className="about-mv-panel-bar" aria-hidden="true" />
              <h3 className="about-mv-panel-label">Our vision</h3>
              <p>
                A world in which Africa's participation in global energy transition and climate governance decisions demonstrably strengthens successively — where the technical capacity, coordinated positions, and institutional credibility that The PATNA Initiative builds are reflected in the language, mechanisms, and equity provisions of the frameworks that govern Africa's maritime and energy future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="section about-story-section" aria-labelledby="about-story-heading">
        <div className="section-inner">
          <div className="section-label">Our Story</div>
          <h2 className="section-title" id="about-story-heading">
            From a bold intervention to a continental institution.
          </h2>

          <div className="about-story-grid">
            {/* Timeline */}
            <div className="about-timeline" aria-label="PATNA timeline">
              {storyTimeline.map((item, i) => (
                <div className={`about-tl-item${item.active ? " about-tl-item--active" : ""}`} key={i}>
                  <div className="about-tl-dot" aria-hidden="true">
                    <span>{item.year.slice(-2)}</span>
                  </div>
                  <div className="about-tl-body">
                    <strong className="about-tl-year">{item.year}</strong>
                    <h4 className="about-tl-title">{item.title}</h4>
                    <p className="about-tl-desc">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Narrative */}
            <div className="about-story-narrative">
              <p className="about-story-lead">
                The PATNA Initiative was founded on a documented gap and a deliberate decision to close it.
              </p>
              <p>
                Africa faces a structural contradiction. It carries over 90% of its trade by sea and bears the first economic consequences of rising shipping costs. It also holds 60% of the world's prime solar resources and the technical potential to produce the zero-emission fuels that the global shipping fleet will need by 2050. The Net-Zero Framework being finalised at the IMO could impose an estimated 20% increase in African shipping costs by 2035 on nations from a continent that contributes less than 5% of global emissions. It could also unlock a green hydrogen and green ammonia export market worth hundreds of billions of dollars — if Africa's engagement is organised, evidence-backed, and diplomatically coordinated.
              </p>
              <p>
                PATNA was established because organised engagement does not happen by default. Without a convening of expertise, African data-driven evidence, and coordinated positions, Africa's 44 IMO member states remain individually present but collectively absent from the rooms where decisions are made.
              </p>
              <p>
                Across the LEAP series, PATNA has produced the continent's first national shipping emissions inventories; convened the first Africa Strategic Maritime Summit on Shipping Decarbonisation; co-organised the Dakar Workshop that produced the 15 Dakar Declarations; contributed to Africa's first continental maritime decarbonisation strategy; and contributed — through sustained technical advocacy — to the IMO's decisions on the NZF to allow informed guidelines that reflect Africa's realities, including just transition provisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOVERNANCE ── */}
      <section className="section about-governance-section" aria-labelledby="about-gov-heading">
        <div className="section-inner">
          <div className="section-label">Governance</div>
          <h2 className="section-title" id="about-gov-heading">Leadership &amp; Structure</h2>
          <p className="section-subtitle">
            The PATNA Initiative is a non-profit organisation registered in Monrovia, Liberia, with a presence in Seychelles and Mauritius. It is governed by a Board of Directors and supported by a Secretariat and a research partnership with the UCL Energy Institute.
          </p>

          {/* Board */}
          <div className="about-gov-sub-heading">
            <h3>Board of Directors</h3>
            <div className="about-gov-rule" aria-hidden="true" />
          </div>

          <div className="about-board-grid">
            {boardMembers.map((member) => (
              <article
                className={`about-board-card${member.role === "co-chair" ? " about-board-card--chair" : ""}`}
                key={member.name}
              >
                {member.role === "co-chair" && (
                  <span className="about-board-badge" aria-label="Co-Chair">Co-Chair</span>
                )}
                <div className="about-board-av" aria-hidden="true">
                  {member.name.split(" ").filter(w => !["Dr", "Ambassador", "Maj", "Gen", "(Rt)"].includes(w)).slice(0, 2).map(w => w[0]).join("")}
                </div>
                <strong className="about-board-name">{member.name}</strong>
                <span className="about-board-title">{member.title}</span>
                <span className="about-board-org">{member.org}</span>
                <p className="about-board-bio">{member.bio}</p>
              </article>
            ))}
          </div>

          {/* Secretariat */}
          <div className="about-gov-sub-heading" style={{ marginTop: "3rem" }}>
            <h3>Secretariat</h3>
            <div className="about-gov-rule" aria-hidden="true" />
          </div>

          <div className="about-secretariat-grid">
            {secretariatMembers.map((member) => (
              <article className="about-sec-card" key={member.name}>
                <div
                  className="about-sec-av"
                  style={{ background: member.color }}
                  aria-hidden="true"
                >
                  {member.initials}
                </div>
                <div className="about-sec-body">
                  <strong className="about-sec-name">{member.name}</strong>
                  <span className="about-sec-title">{member.title}</span>
                  <a className="about-sec-contact" href={`mailto:${member.contact}`}>
                    {member.contact}
                  </a>
                  <p className="about-sec-bio">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN CTA BAND ── */}
      <section className="join-band about-cta-band">
        <div className="section-inner">
          <h2>Join the institutions shaping Africa's energy future.</h2>
          <p>
            The PATNA Initiative welcomes four kinds of engagement: funders and development partners; governments and national delegations that need technical support; research and academic partners; and technical experts ready to contribute to Africa's most active technical network on maritime governance.
          </p>
          <div className="join-band-btns">
            <Link className="primary-button" href="/work-with-us">
              Work With Us →
            </Link>
            <Link className="secondary-button" href="/community/join">
              Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* ── EXISTING SECTIONS (preserved below the wireframe layout) ── */}

      {/* Journey Timeline (existing) */}
      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("about.journeyLabel")}
            title={t("about.journeyTitle")}
            subtitle={t("about.journeySubtitle")}
          />
          <div className="journey-timeline">
            {journeyPhases.map((phase) => (
              <article className="journey-phase" key={phase.period}>
                <div className="journey-period">
                  <strong>{phase.period}</strong>
                  <span>{phase.phase}</span>
                </div>
                <div className="journey-content">
                  <h3>{phase.title}</h3>
                  <p>{phase.body}</p>
                  <div className="journey-highlights">
                    {phase.highlights.map((h) => (
                      <span className="value-chip" key={h}>{h}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Four Pillars (existing) */}
      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("about.pillarsLabel")}
            title={t("about.pillarsTitle")}
            subtitle={t("about.pillarsSubtitle")}
          />
          <div className="card-grid">
            {strategicPillars.map((pillar) => (
              <article className="content-card" key={pillar.number}>
                <div className="pillar-number">{pillar.number}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* UCL Partnership + Working Groups (existing) */}
      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <SectionIntro
                label={t("about.uclLabel")}
                title={t("about.uclTitle")}
              />
              <p>{t("about.uclBody")}</p>
            </article>

            <article className="content-card">
              <SectionIntro
                label={t("about.wgLabel")}
                title={t("about.wgTitle")}
                subtitle={t("about.wgSubtitle")}
              />
              <div className="feature-list">
                {workingGroups.map((wg) => (
                  <div className="working-group-item" key={wg.slug}>
                    <strong>{wg.title}</strong>
                    <p>{wg.summary}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Strategic Outlook (existing) */}
      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("about.stratLabel")}
            title={t("about.stratTitle")}
            subtitle={t("about.stratSubtitle")}
          />

          <div className="card-grid" style={{ marginBottom: "2rem" }}>
            <article className="content-card">
              <h3>{t("about.stratImperative1Title")}</h3>
              <p>{t("about.stratImperative1Body")}</p>
            </article>
            <article className="content-card">
              <h3>{t("about.stratImperative2Title")}</h3>
              <p>{t("about.stratImperative2Body")}</p>
            </article>
            <article className="content-card">
              <h3>{t("about.stratImperative3Title")}</h3>
              <p>{t("about.stratImperative3Body")}</p>
            </article>
          </div>

          <div className="key-results-table">
            {keyResults.map((kr) => (
              <div className="key-result-row" key={kr.id}>
                <div className="key-result-meta">
                  <strong>{kr.id}</strong>
                  <span>{kr.deadline}</span>
                </div>
                <p>{kr.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Network Organisation (existing) */}
      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("about.orgLabel")}
            title={t("about.orgTitle")}
            subtitle={t("about.orgSubtitle")}
          />
          <div className="card-grid">
            {cohortSummary.map((cohort) => (
              <article className="content-card" key={cohort.title}>
                <h3>{cohort.title}</h3>
                <p>{cohort.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Data Vision (existing) */}
      <section className="section">
        <div className="section-inner">
          <div className="data-vision-block">
            <div className="section-label">{t("about.dataVisionLabel")}</div>
            <blockquote className="mission-pull">
              {t("about.dataVisionQuote")}
            </blockquote>
            <p className="data-vision-tagline">
              <strong>{t("about.dataVisionTagline")}</strong>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
