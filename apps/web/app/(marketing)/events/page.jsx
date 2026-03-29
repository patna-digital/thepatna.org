import { MarketingPageHero } from "@/components/marketing-page-hero";
import { EventGalleryStrip } from "@/components/public/event-gallery-strip";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import { fetchPublicEvents } from "@/lib/events";
import { getEventMedia, publicPageMedia } from "@/lib/public-media";

export default async function EventsPage() {
  const publicEvents = await fetchPublicEvents();

  return (
    <>
      <MarketingPageHero
        label="Events"
        subtitle="Convenings, workshops, and coalition moments documented with the same editorial discipline as the rest of the PATNA archive."
        title="Convenings, workshops, and coordination moments"
      />

      <EventGalleryStrip section={publicPageMedia.events.gallery} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Event register"
            title="An event register for upcoming convenings and documented outputs"
            subtitle="Each entry pairs institutional context with clear metadata so the archive remains useful beyond the event itself."
          />

          <div className="media-article-grid">
            {publicEvents.length ? (
              publicEvents.map((event) => (
                <MediaArticleCard
                  key={event.slug}
                  label={event.event_type || "Event"}
                  media={getEventMedia(event.slug)}
                  meta={[event.display_date, event.location].filter(Boolean)}
                  summary={event.summary}
                  title={event.title}
                />
              ))
            ) : (
              <article className="content-card">
                <h3>No events published yet</h3>
                <p>The PATNA event register will appear here as soon as published records are available.</p>
              </article>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
