import Link from "next/link";
import { getEventMedia } from "@/lib/public-media";

const SCHEDULE_CHIP = {
  upcoming: { className: "chip-success", label: "Upcoming" },
  tbc: { className: "chip-warning", label: "TBC" },
  past: { className: "chip-muted", label: "Past" },
};

export function EventArchiveCard({ event, labels = {} }) {
  const media = event.cover_image_url
    ? {
        src: event.cover_image_url,
        alt: event.cover_image_alt || event.title,
      }
    : getEventMedia(event.slug);

  const href = `/events/${event.slug}`;
  const typeLabel = event.eventTypeDisplay || event.event_type || "Event";
  const dateLabel = event.displayDateDisplay || event.display_date || labels.datePending || "Date pending";
  const scheduleChip = SCHEDULE_CHIP[event.schedule_status]
    ? {
        className: SCHEDULE_CHIP[event.schedule_status].className,
        label:
          labels[event.schedule_status] ||
          SCHEDULE_CHIP[event.schedule_status].label,
      }
    : null;

  return (
    <article className="publication-card event-archive-card">
      <Link
        aria-hidden="true"
        className="publication-card-image-link"
        href={href}
        tabIndex={-1}
      >
        <div className="publication-card-image event-archive-card-image">
          <img alt={media.alt || event.title} loading="lazy" src={media.src} />
        </div>
      </Link>

      <div className="publication-card-body">
        <div className="publication-card-meta">
          <span className="status-chip chip-neutral">{typeLabel}</span>
          <time className="publication-card-date">{dateLabel}</time>
        </div>

        <Link className="publication-card-title-link" href={href}>
          <h3 className="publication-card-title">{event.title}</h3>
        </Link>

        <div className="event-archive-card-submeta">
          <span>{event.location || labels.locationPending || "Location pending"}</span>
          {scheduleChip ? (
            <span className={`status-chip ${scheduleChip.className}`}>{scheduleChip.label}</span>
          ) : null}
        </div>

        {event.summary ? <p className="publication-card-summary">{event.summary}</p> : null}

        <div className="publication-card-footer">
          <Link className="publication-card-read-link" href={href}>
            {labels.viewEvent || "View event"}
          </Link>
          {event.official_link ? (
            <a
              className="text-link"
              href={event.official_link}
              rel="noreferrer"
              target="_blank"
            >
              {labels.officialPage || "Official page"}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
