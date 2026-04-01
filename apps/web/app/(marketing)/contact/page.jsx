import { MarketingPageHero } from "@/components/marketing-page-hero";
import { PhotoQuoteSplit } from "@/components/public/photo-quote-split";
import { contactDetails } from "@/lib/patna-data";
import { publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "Contact",
  description:
    "Contact PATNA for enquiries, partnerships, and programme conversations across Africa's climate and maritime transition agenda.",
};

export default function ContactPage() {
  return (
    <>
      <MarketingPageHero
        label="Contact"
        subtitle="For enquiries, partnerships, and programme conversations, the PATNA team can be reached through email, phone, and public social channels."
        title="Reach the PATNA team"
      />

      <PhotoQuoteSplit section={publicPageMedia.contact.feature} />

      <section className="section">
        <div className="section-inner">
          <div className="page-grid">
            <article className="content-card">
              <h3>Contact details</h3>
              <p>
                PATNA's public contact routes are straightforward and designed to connect you to
                the right conversation quickly.
              </p>
              <div className="stack">
                <div>
                  <strong>Email</strong>
                  <p>{contactDetails.email}</p>
                </div>
                <div>
                  <strong>Phone</strong>
                  <p>{contactDetails.phone}</p>
                </div>
                <div>
                  <strong>Address</strong>
                  <p>{contactDetails.address}</p>
                </div>
              </div>
            </article>

            <article className="content-card">
              <h3>Best ways to connect</h3>
              <p>
                The fastest route is direct contact by email or phone.
              </p>
              <div className="stack">
                <a className="primary-button" href={`mailto:${contactDetails.email}`}>
                  Email PATNA
                </a>
                <a className="secondary-button" href={`tel:${contactDetails.phone}`}>
                  Call PATNA
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
