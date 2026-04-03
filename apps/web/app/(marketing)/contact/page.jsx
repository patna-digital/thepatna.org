import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { contactDetails } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "Contact",
  description:
    "Contact PATNA for enquiries, partnerships, and programme conversations across Africa's climate and maritime transition agenda.",
};

export default async function ContactPage() {
  const t = await getTranslations();
  return (
    <>
      <MarketingPageHero
        label={t("contact.label")}
        subtitle={t("contact.subtitle")}
        title={t("contact.title")}
      />

      <PhotoQuoteSplit section={publicPageMedia.contact.feature} />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>{t("contact.detailsTitle")}</h3>
              <p>
                {t("contact.detailsIntro")}
              </p>
              <div className="stack">
                <div>
                  <strong>{t("contact.labelEmail")}</strong>
                  <p>{contactDetails.email}</p>
                </div>
                <div>
                  <strong>{t("contact.labelPhone")}</strong>
                  <p>{contactDetails.phone}</p>
                </div>
                <div>
                  <strong>{t("contact.labelAddress")}</strong>
                  <p>{contactDetails.address}</p>
                </div>
              </div>
            </article>

            <article className="content-card">
              <h3>{t("contact.bestWaysTitle")}</h3>
              <p>
                {t("contact.bestWaysIntro")}
              </p>
              <div className="stack">
                <a className="primary-button" href={`mailto:${contactDetails.email}`}>
                  {t("contact.btnEmail")}
                </a>
                <a className="secondary-button" href={`tel:${contactDetails.phone}`}>
                  {t("contact.btnCall")}
                </a>
                {contactDetails.socials.map((social) => (
                  <a
                    className="text-link"
                    href={social.href}
                    key={social.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
