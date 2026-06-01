import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { contactDetails } from "@/lib/patna-data";
import { ContactForm } from "./contact-form";

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

      <section className="section">
        <div className="section-inner">
          <div className="contact-layout">
            {/* Left — contact details */}
            <aside className="contact-details-card">
              <h3>{t("contact.detailsTitle")}</h3>

              <div className="contact-detail-row">
                <span className="contact-detail-label">{t("contact.labelEmail")}</span>
                <a className="contact-detail-value text-link" href={`mailto:${contactDetails.email}`}>
                  {contactDetails.email}
                </a>
              </div>

              <div className="contact-detail-row">
                <span className="contact-detail-label">{t("contact.labelPhone")}</span>
                <a className="contact-detail-value text-link" href={`tel:${contactDetails.phone}`}>
                  {contactDetails.phone}
                </a>
              </div>

              <div className="contact-detail-row">
                <span className="contact-detail-label">{t("contact.labelAddress")}</span>
                <span className="contact-detail-value">{contactDetails.address}</span>
              </div>

              {contactDetails.socials?.length > 0 && (
                <div className="contact-social-links">
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
              )}
            </aside>

            {/* Right — general enquiry form */}
            <article className="contact-form-card">
              <h3>Send a message</h3>
              <p className="contact-form-subtitle">
                Not sure which route to use? Send a general message and the PATNA team will
                direct you to the right conversation. For partnership, support, or collaboration
                enquiries, use the <a className="text-link" href="/work-with-us">Work With Us</a> pathways.
              </p>
              <ContactForm />
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
