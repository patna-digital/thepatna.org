import { findConferenceLink } from "./conference.js";
import { transformMemberCalendarItems } from "../member-calendar-items.js";

const PROVIDER_NAMES = {
  google: "Google Calendar",
  microsoft: "Outlook Calendar",
  zoho: "Zoho Calendar",
  apple: "Apple Calendar",
  generic_ical: "iCal Feed",
};

function getMeetingMetadata({
  conferenceUrl = null,
  conferenceProvider = null,
  description = null,
  location = null,
  locationDetails = null,
  locationType = null,
}) {
  const matchedConference = conferenceUrl
    ? {
        url: conferenceUrl,
        provider: conferenceProvider || findConferenceLink(conferenceUrl)?.provider || null,
      }
    : findConferenceLink(locationDetails, location, description);
  const meetingUrl = matchedConference?.url || null;

  return {
    meeting_url: meetingUrl,
    meeting_provider: conferenceProvider || matchedConference?.provider || null,
    location_type: meetingUrl ? "video" : locationType || null,
  };
}

function getExternalSourceLabel(connection) {
  return connection?.calendar_name || PROVIDER_NAMES[connection?.provider] || "Connected Calendar";
}

function getExternalSourceDetail(connection) {
  const providerLabel = connection?.provider
    ? PROVIDER_NAMES[connection.provider] || connection.provider
    : null;

  if (!providerLabel) {
    return null;
  }

  return connection?.calendar_name && connection.calendar_name !== providerLabel
    ? providerLabel
    : null;
}

export function transformExternalCalendarEvents(events = []) {
  return events.map((event) => {
    const meetingMetadata = getMeetingMetadata({
      conferenceUrl: event.conference_url,
      conferenceProvider: event.conference_provider,
      description: event.description,
      location: event.location,
    });

    return {
      ...event,
      ...meetingMetadata,
      event_source: "external",
      event_type_label: event.connection?.provider
        ? `${PROVIDER_NAMES[event.connection.provider] || event.connection.provider} Event`
        : "External Event",
      source_label: getExternalSourceLabel(event.connection),
      source_detail: getExternalSourceDetail(event.connection),
      is_rsvped: true,
    };
  });
}

export function buildCalendarFeedEvents({
  communityEvents = [],
  hostBookings = [],
  memberCalendarItems = [],
  externalEvents = [],
  rsvpedEventIds = new Set(),
}) {
  const bookingExternalIds = new Set(
    hostBookings
      .map((booking) => booking.host_calendar_event_id)
      .filter(Boolean),
  );

  return [
    ...communityEvents.map((event) => ({
      ...event,
      event_source: "community",
      event_type_label: event.event_type || "Community Event",
      source_label: "PATNA Event",
      source_detail: null,
      is_rsvped: rsvpedEventIds.has(event.id),
    })),
    ...hostBookings.map((booking) => ({
      ...booking,
      ...getMeetingMetadata({
        locationDetails: booking.location_details,
        locationType: booking.location_type,
      }),
      event_source: "personal",
      event_type_label: "Meeting",
      source_label: "PATNA Booking",
      source_detail: null,
      title: booking.title,
      is_rsvped: true,
    })),
    ...transformMemberCalendarItems(memberCalendarItems),
    ...transformExternalCalendarEvents(externalEvents)
      .filter((event) => !bookingExternalIds.has(event.external_event_id))
      .map((event) => ({
        ...event,
        event_type_label:
          event.connection?.provider
            ? `${PROVIDER_NAMES[event.connection.provider] || event.connection.provider} Event`
            : "Connected Calendar Event",
      })),
  ].sort((left, right) => new Date(left.starts_at) - new Date(right.starts_at));
}
