import { getTranslations } from "next-intl/server";
import { MarketingPageHero } from "@/components/marketing-page-hero";
import { EventArchiveCard } from "@/components/public/event-archive-card";
import { EventsArchiveClient } from "@/components/public/events-archive-client";
import { SectionIntro } from "@/components/section-intro";
import { fetchPublicEvents, isPatnaLedEvent } from "@/lib/events";

export const metadata = {
  title: "Events",
  description:
    "Browse PATNA-led convenings and the wider international policy calendar shaping African climate and maritime strategy.",
};

export default async function EventsPage() {
  const t = await getTranslations();
  const events = await fetchPublicEvents();
  const upcomingEvents = events.filter((event) => event.schedule_status !== "past");
  const eventCardLabels = {
    viewEvent: t("events.viewEvent"),
    officialPage: t("events.officialPage"),
    datePending: t("events.datePending"),
    locationPending: t("events.locationPending"),
    upcoming: t("events.scheduleUpcoming"),
    tbc: t("events.scheduleTbc"),
    past: t("events.schedulePast"),
  };
  const metrics = [
    { value: `${events.length}`, label: t("events.metricsTotal") },
    { value: `${upcomingEvents.length}`, label: t("events.metricsUpcoming") },
    { value: `${events.filter((event) => isPatnaLedEvent(event)).length}`, label: t("events.metricsPatna") },
  ];

  return (
    <>
      <MarketingPageHero
        label={t("events.label")}
        subtitle={t("events.subtitle")}
        title={t("events.title")}
      />

      <div className="projects-hero-stats">
        <div className="section-inner">
          <div className="projects-hero-stats-row">
            {metrics.map((stat) => (
              <div className="projects-hero-stat" key={stat.label}>
                <strong className="projects-hero-stat-num">{stat.value}</strong>
                <span className="projects-hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("events.upcomingLabel")}
            title={t("events.upcomingTitle")}
            subtitle={t("events.upcomingSubtitle")}
          />

          {upcomingEvents.length ? (
            <div className="publications-grid">
              {upcomingEvents.map((event) => (
                <EventArchiveCard event={event} key={event.id || event.slug} labels={eventCardLabels} />
              ))}
            </div>
          ) : (
            <article className="content-card">
              <h3>{t("events.emptyTitle")}</h3>
              <p>{t("events.emptyText")}</p>
            </article>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <SectionIntro
            label={t("events.archiveLabel")}
            title={t("events.archiveTitle")}
            subtitle={t("events.archiveSubtitle")}
          />

          <EventsArchiveClient
            cardLabels={eventCardLabels}
            clearLabel={t("events.searchClear")}
            defaultResultsLabel={t.raw("events.searchDefaultResults")}
            emptyBody={t("events.searchEmptyText")}
            emptyTitle={t("events.searchEmptyTitle")}
            events={events}
            placeholder={t("events.searchPlaceholder")}
            searchLabel={t("events.searchLabel")}
            searchResultsLabel={t.raw("events.searchResults")}
          />
        </div>
      </section>
    </>
  );
}
