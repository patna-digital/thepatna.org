import { getTranslations } from "next-intl/server";
import { FeaturedStoryRail } from "@/components/public/featured-story-rail";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { cohortSummary } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "About",
  description:
    "Learn about PATNA's mission, vision, and Africa-centred approach to climate action, maritime decarbonisation, and energy transition.",
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

      <FeaturedStoryRail section={publicPageMedia.about.portraits} />

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
    </>
  );
}
