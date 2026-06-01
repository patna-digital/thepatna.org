import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGoogleEventRequestBody,
  mapGoogleEvent,
} from "./providers/google.js";

test("buildGoogleEventRequestBody requests Google Meet for timed bookings", () => {
  const requestBody = buildGoogleEventRequestBody(
    {
      title: "PATNA booking",
      description: "Booked via PATNA",
      startsAt: "2026-04-07T10:00:00.000Z",
      endsAt: "2026-04-07T10:30:00.000Z",
      timezone: "Africa/Lagos",
      attendees: [{ email: "guest@example.com" }],
      createConference: true,
    },
    "request-123",
  );

  assert.equal(requestBody.summary, "PATNA booking");
  assert.equal(requestBody.start.dateTime, "2026-04-07T10:00:00.000Z");
  assert.equal(requestBody.end.timeZone, "Africa/Lagos");
  assert.equal(requestBody.conferenceData.createRequest.requestId, "request-123");
  assert.equal(
    requestBody.conferenceData.createRequest.conferenceSolutionKey.type,
    "hangoutsMeet",
  );
});

test("mapGoogleEvent preserves conference metadata from Google events", () => {
  const event = mapGoogleEvent(
    {
      id: "evt_123",
      summary: "PATNA booking",
      description: "Video call",
      start: { dateTime: "2026-04-07T10:00:00.000Z", timeZone: "Africa/Lagos" },
      end: { dateTime: "2026-04-07T10:30:00.000Z", timeZone: "Africa/Lagos" },
      status: "confirmed",
      hangoutLink: "https://meet.google.com/abc-defg-hij",
      conferenceData: {
        conferenceId: "abc-defg-hij",
        conferenceSolution: {
          key: { type: "hangoutsMeet" },
          name: "Google Meet",
        },
        entryPoints: [
          {
            entryPointType: "video",
            uri: "https://meet.google.com/abc-defg-hij",
          },
        ],
      },
    },
    "primary",
  );

  assert.equal(event.externalEventId, "evt_123");
  assert.equal(event.externalCalendarId, "primary");
  assert.equal(event.conferenceUrl, "https://meet.google.com/abc-defg-hij");
  assert.equal(event.conferenceProvider, "google_meet");
  assert.equal(event.conferenceData.conferenceId, "abc-defg-hij");
});
