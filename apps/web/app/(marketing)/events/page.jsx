import { MarketingPageHero } from "@/components/marketing-page-hero";
import { EventGalleryStrip } from "@/components/public/event-gallery-strip";
import { MediaArticleCard } from "@/components/public/media-article-card";
import { SectionIntro } from "@/components/section-intro";
import { publicEvents } from "@/lib/patna-data";
import { eventMediaBySlug, publicPageMedia } from "@/lib/public-media";

export default function EventsPage() {
  return (
    <>
      <MarketingPageHero
        label="Events"
        subtitle="PATNA events are now presented as first-class content with the same card language used throughout the redesigned site."
        title="Convenings, workshops, and coordination moments"
      />

      <EventGalleryStrip section={publicPageMedia.events.gallery} />

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label="Event register"
            title="Upcoming and past events can share one event model with optional outputs"
            subtitle="The route now leads with real PATNA event imagery and then falls back to structured metadata, which is much closer to how an events archive should feel."
          />

          <div className="media-article-grid">
            {publicEvents.map((event) => (
              <MediaArticleCard
                key={event.slug}
                label={event.type}
                media={eventMediaBySlug[event.slug]}
                meta={[event.date, event.location]}
                summary={event.summary}
                title={event.title}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
