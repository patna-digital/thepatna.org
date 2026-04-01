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
  const publicEvents = await fetchPublicEvents();
  const { patnaEvents, externalEvents } = splitPublicEventCollections(publicEvents);

  return (
    <>
      <MarketingPageHero
        label="Events"
        subtitle="From PATNA-led summits and workshops to the international forums shaping African negotiating space, this archive tracks the convenings that matter."
        title="Convenings, workshops, and the wider policy calendar"
      />

      <EventGalleryStrip section={publicPageMedia.events.gallery} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="PATNA convenings"
            title="Summits, workshops, and coalition moments led by PATNA"
            subtitle="These public events reflect PATNA's own convening history and the role the network has played in African climate and maritime coordination."
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
                  sourceLabel="Open PATNA coverage"
                  title={event.title}
                />
              ))
            ) : (
              <article className="content-card">
                <h3>No PATNA convenings published yet</h3>
                <p>The PATNA event archive will appear here as soon as public records are available.</p>
              </article>
            )}
          </div>
        </div>
      </section>

      {externalEvents.length ? (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label="Policy calendar"
              title="Wider meetings shaping Africa's climate and maritime agenda"
              subtitle="PATNA also tracks key external IMO, UNFCCC, and ocean-governance meetings that influence African strategy, negotiation, and implementation."
            />

            <div className="media-article-grid">
              {externalEvents.map((event) => (
                <MediaArticleCard
                  key={event.slug}
                  label={event.event_type || "Event"}
                  media={getEventMedia(event.slug)}
                  meta={[event.display_date, event.location].filter(Boolean)}
                  summary={event.summary}
                  sourceLabel={isPatnaLedEvent(event) ? "Open PATNA coverage" : "Official event page"}
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
