import Link from "next/link";
import { getTranslations } from "next-intl/server";
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

export default async function CommunityPage() {
  const t = await getTranslations();
  return (
    <>
      <section className="community-hero">
        <div className="community-hero-inner">
          <div className="community-hero-eyebrow">{t("community.eyebrow")}</div>
          <h1>
            {t("community.h1")}
          </h1>
          <p>
            {t("community.intro")}
          </p>
          <div className="hero-actions">
            <Link className="secondary-button" href="/community/join">
              {t("community.btnApply")}
            </Link>
            <Link className="pill-link" href="/auth/login">
              {t("community.btnLogin")}
            </Link>
          </div>
        </div>
      </section>

      <section className="section cohorts-section">
        <div className="section-inner">
          <div className="cohorts-intro">
            <SectionIntro
              label={t("community.cohortsLabel")}
              title={t("community.cohortsTitle")}
              subtitle={t("community.cohortsSubtitle")}
            />

            <article className="content-card">
              <h3>{t("community.supportTitle")}</h3>
              <ul className="check-list">
                <li>{t("community.supportItem1")}</li>
                <li>{t("community.supportItem2")}</li>
                <li>{t("community.supportItem3")}</li>
                <li>{t("community.supportItem4")}</li>
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
            label={t("community.journeyLabel")}
            title={t("community.journeyTitle")}
            subtitle={t("community.journeySubtitle")}
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
            label={t("community.structureLabel")}
            title={t("community.structureTitle")}
            subtitle={t("community.structureSubtitle")}
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
          <div className="section-label">{t("community.joinLabel")}</div>
          <h2>{t("community.joinTitle")}</h2>
          <p>
            {t("community.joinPara")}
          </p>
          <div className="join-band-btns">
            <Link className="secondary-button" href="/community/join">
              {t("community.btnStartApplication")}
            </Link>
            <Link className="pill-link" href="/auth/login">
              {t("community.btnMemberLogin")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
