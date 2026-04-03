import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { EventGalleryStrip } from "@/components/public/event-gallery-strip";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import {
  fetchPublicEvents,
  isPatnaLedEvent,
  splitPublicEventCollections,
} from "@/lib/events";
import { getEventMedia, publicPageMedia } from "@/lib/public-media";

export const metadata = {
  title: "Events",
  description:
    "Browse PATNA-led convenings and the wider international policy calendar shaping African climate and maritime strategy.",
};

export default async function EventsPage() {
  const t = await getTranslations();
  const publicEvents = await fetchPublicEvents();
  const { patnaEvents, externalEvents } = splitPublicEventCollections(publicEvents);

  return (
    <>
      <MarketingPageHero
        label={t("events.label")}
        subtitle={t("events.subtitle")}
        title={t("events.title")}
      />

      <EventGalleryStrip section={publicPageMedia.events.gallery} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("events.patnaLabel")}
            title={t("events.patnaTitle")}
            subtitle={t("events.patnaSubtitle")}
          />

          <div className="media-article-grid">
            {patnaEvents.length ? (
              patnaEvents.map((event) => (
                <MediaArticleCard
                  key={event.slug}
                  label={event.event_type || "Event"}
                  media={getEventMedia(event.slug)}
                  meta={[event.display_date, event.location].filter(Boolean)}
                  summary={event.summary}
                  sourceLabel={t("events.coverageLabel")}
                  title={event.title}
                />
              ))
            ) : (
              <article className="content-card">
                <h3>{t("events.emptyTitle")}</h3>
                <p>{t("events.emptyText")}</p>
              </article>
            )}
          </div>
        </div>
      </section>

      {externalEvents.length ? (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label={t("events.calendarLabel")}
              title={t("events.calendarTitle")}
              subtitle={t("events.calendarSubtitle")}
            />

            <div className="media-article-grid">
              {externalEvents.map((event) => (
                <MediaArticleCard
                  key={event.slug}
                  label={event.event_type || "Event"}
                  media={getEventMedia(event.slug)}
                  meta={[event.display_date, event.location].filter(Boolean)}
                  summary={event.summary}
                  sourceLabel={isPatnaLedEvent(event) ? t("events.coverageLabel") : t("events.officialPage")}
                  sourceUrl={
                    isPatnaLedEvent(event)
                      ? undefined
                      : event.official_link || getEventMedia(event.slug).sourceUrl
                  }
                  title={event.title}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
