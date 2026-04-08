import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { fetchPublicEventBySlug } from "@/lib/events";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { sanitizeProseHtml } from "@/lib/threads";

export const revalidate = 3600;

function createPublicEventsClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = createPublicEventsClient();
  const { event } = await fetchPublicEventBySlug({ supabase, slug });

  if (!event) return { title: "Event not found" };

  return {
    title: event.title,
    description: event.summary || undefined,
    openGraph: {
      title: event.title,
      description: event.summary || undefined,
      images: event.cover_image_url
        ? [{ url: event.cover_image_url, alt: event.cover_image_alt || event.title }]
        : undefined,
    },
  };
}

export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const supabase = createPublicEventsClient();

  const { event } = await fetchPublicEventBySlug({ supabase, slug });

  if (!event) notFound();

  const { data: galleryImages } = await supabase
    .from("event_gallery")
    .select("id, image_url, alt_text, caption, sort_order")
    .eq("event_id", event.id)
    .order("sort_order");

  const sanitizedBody = sanitizeProseHtml(event.body || "");

  return (
    <>
      <MarketingPageHero
        label={event.event_type || "Event"}
        title={event.title}
        subtitle={event.summary}
      />

      <div className="section">
        <div className="section-inner">
          <div className="event-detail-layout">
            <div className="event-detail-main">
              {event.cover_image_url ? (
                <div className="event-detail-cover">
                  <img
                    alt={event.cover_image_alt || event.title}
                    className="event-detail-cover-image"
                    src={event.cover_image_url}
                  />
                </div>
              ) : null}

              <div className="event-detail-meta">
                {event.display_date ? (
                  <p className="event-detail-date">{event.display_date}</p>
                ) : null}
                {event.location ? (
                  <p className="event-detail-location">{event.location}</p>
                ) : null}
                {event.organising_institutions?.length > 0 ? (
                  <p className="event-detail-orgs">
                    {event.organising_institutions.join(" · ")}
                  </p>
                ) : null}
              </div>

              {sanitizedBody ? (
                <div
                  className="event-detail-body rte-prose"
                  dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                />
              ) : null}

              {event.patna_involvement ? (
                <div className="event-detail-involvement">
                  <strong>PATNA involvement:</strong> {event.patna_involvement}
                </div>
              ) : null}

              {galleryImages?.length > 0 ? (
                <div className="event-detail-gallery">
                  <h2 className="event-detail-section-title">Gallery</h2>
                  <div className="event-gallery-grid">
                    {galleryImages.map((image) => (
                      <figure className="event-gallery-figure" key={image.id}>
                        <img
                          alt={image.alt_text || ""}
                          className="event-gallery-img"
                          src={image.image_url}
                        />
                        {image.caption ? (
                          <figcaption className="event-gallery-caption">
                            {image.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="event-detail-sidebar">
              <div className="event-sidebar-card">
                <dl className="event-sidebar-data-list">
                  {event.display_date ? (
                    <>
                      <dt>Date</dt>
                      <dd>{event.display_date}</dd>
                    </>
                  ) : null}
                  {event.location ? (
                    <>
                      <dt>Location</dt>
                      <dd>{event.location}</dd>
                    </>
                  ) : null}
                  {event.themes?.length > 0 ? (
                    <>
                      <dt>Themes</dt>
                      <dd>{event.themes.join(", ")}</dd>
                    </>
                  ) : null}
                  {event.official_link ? (
                    <>
                      <dt>Official link</dt>
                      <dd>
                        <a
                          className="text-link"
                          href={event.official_link}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          View event page ↗
                        </a>
                      </dd>
                    </>
                  ) : null}
                </dl>
              </div>

              <Link className="text-link" href="/events">
                ← All events
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
