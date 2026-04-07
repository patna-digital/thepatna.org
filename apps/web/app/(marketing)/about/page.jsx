import { getTranslations } from "next-intl/server";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import {
  cohortSummary,
  journeyPhases,
  keyResults,
  strategicPillars,
  workingGroups,
} from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "About",
  description:
    "Learn about PATNA's mission, vision, and Africa-centred approach to maritime decarbonisation, climate action, and energy transition.",
};

export default async function AboutPage() {
  const t = await getTranslations();
  return (
    <>
      <MarketingPageHero
        actions={[{ href: "/projects", label: t("about.btnViewProjects"), variant: "primary" }]}
        label={t("about.label")}
        subtitle={t("about.subtitle")}
        title={t("about.title")}
      />

      <PhotoQuoteSplit section={publicPageMedia.about.mission} />

      {/* Who PATNA Is + Vision/Mission/Values */}
      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <SectionIntro
                label={t("about.whoLabel")}
                title={t("about.whoTitle")}
                subtitle={t("about.whoSubtitle")}
              />
              <p>
                {t("about.whoPara1")}
              </p>
              <p>
                {t("about.whoPara2")}
              </p>
            </article>

            <article className="content-card feature-list">
              <h3>{t("about.visionMission")}</h3>
              <p>
                <strong>{t("about.visionLabel")}</strong> {t("about.visionText")}
              </p>
              <p>
                <strong>{t("about.missionLabel")}</strong> {t("about.missionText")}
              </p>
              <h3>{t("about.coreValues")}</h3>
              <ul>
                <li>Inclusivity across African voices, regions, and constituencies</li>
                <li>Innovation grounded in practical institutional needs</li>
                <li>Sustainability through reusable knowledge and durable systems</li>
                <li>Collaboration across sectors, disciplines, and languages</li>
                <li>Transparency in governance, evidence, and coordination processes</li>
                <li>Leadership that strengthens Africa's voice in global decision-making</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
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

      {/* Four Pillars */}
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

      <FeaturedStoryRail section={publicPageMedia.about.portraits} />

      {/* UCL Partnership */}
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

            {/* 2026 Working Groups */}
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

      {/* Strategic Outlook 2026–2028 */}
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

      {/* How the network is organised */}
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

      {/* PATNA Data Vision */}
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
