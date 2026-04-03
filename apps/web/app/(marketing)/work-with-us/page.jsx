import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { SectionIntro } from "@/components/section-intro";
import { workWithUsPaths } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "Work With Us",
  description:
    "Work with PATNA on technical support, partnerships, and collaborative initiatives across climate and maritime transition.",
};

export default async function WorkWithUsPage() {
  const t = await getTranslations();
  return (
    <>
      <MarketingPageHero
        label={t("workWithUs.label")}
        subtitle={t("workWithUs.subtitle")}
        title={t("workWithUs.title")}
      />

      <PhotoQuoteSplit section={publicPageMedia.workWithUs.feature} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("workWithUs.pathwaysLabel")}
            title={t("workWithUs.pathwaysTitle")}
            subtitle={t("workWithUs.pathwaysSubtitle")}
          />

          <div className="card-grid">
            {workWithUsPaths.map((path) => (
              <article className="content-card" key={path.href}>
                <h3>{path.title}</h3>
                <p>{path.summary}</p>
                <div className="content-meta">
                  <Link className="primary-button" href={path.href}>
                    {t("workWithUs.btnOpenPathway")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="muted-note">
            {t("workWithUs.note")}
          </p>
        </div>
      </section>
    </>
  );
}
