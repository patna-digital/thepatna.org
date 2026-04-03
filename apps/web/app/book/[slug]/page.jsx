import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { fetchPublicBookingPageData } from "@/lib/calendar/booking";
import { getSiteUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BookingPageClient } from "./booking-page-client";

export const dynamic = "force-dynamic";

function getBookingPageData(slug) {
  const supabase = createSupabaseAdminClient();
  return fetchPublicBookingPageData({ slug, supabase });
}

function buildMetadataDescription(settings) {
  const roleLine = [settings.member?.role_title, settings.member?.organisation_name]
    .filter(Boolean)
    .join(" at ");

  return (
    settings.member?.profileSummary ||
    `Book ${settings.default_meeting_duration}-minute time with ${settings.member?.displayName || "a PATNA member"}${roleLine ? `, ${roleLine}` : ""}.`
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { settings } = await getBookingPageData(slug);

  if (!settings || !settings.public_booking_enabled) {
    return {
      title: "Booking unavailable | PATNA",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = `${getSiteUrl()}/book/${slug}`;
  const title = `Book time with ${settings.member?.displayName || "PATNA"} | PATNA`;
  const description = buildMetadataDescription(settings);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PATNA",
      type: "profile",
      images: settings.member?.headshotSrc
        ? [
            {
              url: settings.member.headshotSrc,
              alt: `${settings.member.displayName} headshot`,
            },
          ]
        : [],
    },
    twitter: {
      card: settings.member?.headshotSrc ? "summary_large_image" : "summary",
      title,
      description,
      images: settings.member?.headshotSrc ? [settings.member.headshotSrc] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublicBookingPage({ params }) {
  const { slug } = await params;
  const [t, { settings }] = await Promise.all([getTranslations(), getBookingPageData(slug)]);

  if (!settings || !settings.public_booking_enabled) {
    notFound();
  }

  const member = settings.member;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member?.displayName,
    description: member?.profileSummary,
    image: member?.headshotSrc || undefined,
    jobTitle: member?.role_title || undefined,
    worksFor: member?.organisation_name
      ? {
          "@type": "Organization",
          name: member.organisation_name,
        }
      : undefined,
    url: settings.public_booking_url,
    potentialAction: {
      "@type": "ReserveAction",
      target: settings.public_booking_url,
      result: {
        "@type": "Reservation",
        name: `Meeting with ${member?.displayName || "PATNA member"}`,
      },
    },
  };

  return (
    <div className="public-booking-page">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
        type="application/ld+json"
      />

      <div className="public-booking-shell">
        <header className="public-booking-header">
          <div className="public-booking-brand">
            <BrandLogo
              href={getSiteUrl()}
              label="The PATNA Initiative"
              showCopy={false}
              size="md"
              variant="mark"
            />
            <div className="public-booking-brand-copy">
              <span className="public-booking-tag">{t("bookingPage.publicBookingPage")}</span>
              <strong>{t("bookingPage.patnaScheduling")}</strong>
            </div>
          </div>
          <a className="secondary-button public-booking-home" href={getSiteUrl()}>
            {t("bookingPage.platform")}
          </a>
        </header>

        <main className="public-booking-main">
          <section className="public-booking-profile-card">
            <div className="public-booking-profile-header">
              <div className="public-booking-avatar">
                {member?.headshotSrc ? (
                  <img alt={`${member.displayName} headshot`} src={member.headshotSrc} />
                ) : (
                  <span>{member?.initials || "P"}</span>
                )}
              </div>
              <div className="public-booking-profile-copy">
                <span className="public-booking-kicker">{t("bookingPage.bookDirectly")}</span>
                <h1>{member?.displayName || "PATNA Member"}</h1>
                <p>
                  {[member?.role_title, member?.organisation_name].filter(Boolean).join(" · ") ||
                    t("bookingPage.communityMember")}
                </p>
              </div>
            </div>

            <div className="public-booking-meta-row">
              <span>{t("bookingPage.defaultDuration", { count: settings.default_meeting_duration })}</span>
              <span>{settings.timezone}</span>
              {member?.country_of_residence ? <span>{member.country_of_residence}</span> : null}
            </div>

            {member?.professional_bio ? (
              <p className="public-booking-bio">{member.professional_bio}</p>
            ) : null}

            <div className="public-booking-note">
              <strong>{t("bookingPage.schedulingQuality")}</strong>
              <p>
                {t("bookingPage.schedulingQualityBody")}
              </p>
            </div>
          </section>

          <section className="public-booking-flow-card">
            <BookingPageClient
              memberId={settings.member_id}
              memberName={member?.displayName || "PATNA Member"}
              settings={settings}
            />
          </section>
        </main>

        <footer className="public-booking-footer">
          <p>
            {t.rich("bookingPage.poweredBy", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </footer>
      </div>
    </div>
  );
}
