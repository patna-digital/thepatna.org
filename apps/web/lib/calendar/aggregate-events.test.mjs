import test from "node:test";
import assert from "node:assert/strict";

import { buildCalendarFeedEvents } from "./aggregate-events.js";

test("buildCalendarFeedEvents keeps member tasks and meetings in the merged calendar timeline", () => {
  const events = buildCalendarFeedEvents({
    communityEvents: [
      {
        id: "community_1",
        title: "PATNA community event",
        starts_at: "2026-04-09T12:00:00.000Z",
        ends_at: "2026-04-09T13:00:00.000Z",
        event_type: "workshop",
      },
    ],
    hostBookings: [
      {
        id: "booking_1",
        title: "Host booking",
        starts_at: "2026-04-09T09:00:00.000Z",
        ends_at: "2026-04-09T09:30:00.000Z",
        location_type: "video",
        location_details: "https://meet.google.com/booking",
      },
    ],
    memberCalendarItems: [
      {
        id: "task_1",
        member_id: "member_1",
        item_type: "task",
        title: "Draft agenda",
        notes: "Prepare remarks",
        starts_at: "2026-04-09T00:00:00.000Z",
        ends_at: "2026-04-09T23:59:59.000Z",
        is_all_day: true,
        location: null,
        meeting_url: null,
      },
      {
        id: "meeting_1",
        member_id: "member_1",
        item_type: "meeting",
        title: "Internal sync",
        notes: "Team coordination",
        starts_at: "2026-04-09T14:00:00.000Z",
        ends_at: "2026-04-09T14:30:00.000Z",
        is_all_day: false,
        location: "Room 2",
        meeting_url: "https://meet.google.com/internal-sync",
      },
    ],
    externalEvents: [
      {
        id: "external_1",
        connection_id: "google_1",
        external_event_id: "external_google_1",
        title: "Connected calendar event",
        description: "Imported from Google",
        location: "Online",
        starts_at: "2026-04-09T16:00:00.000Z",
        ends_at: "2026-04-09T17:00:00.000Z",
        connection: {
          provider: "google",
          calendar_name: "Work",
        },
      },
    ],
    rsvpedEventIds: new Set(["community_1"]),
  });

  assert.deepEqual(
    events.map((event) => ({ title: event.title, source: event.event_source })),
    [
      { title: "Draft agenda", source: "member_local" },
      { title: "Host booking", source: "personal" },
      { title: "PATNA community event", source: "community" },
      { title: "Internal sync", source: "member_local" },
      { title: "Connected calendar event", source: "external" },
    ],
  );

  const task = events.find((event) => event.id === "task_1");
  const meeting = events.find((event) => event.id === "meeting_1");
  const community = events.find((event) => event.id === "community_1");

  assert.equal(task.event_type_label, "Task");
  assert.equal(task.source_label, "My calendar");
  assert.equal(meeting.meeting_url, "https://meet.google.com/internal-sync");
  assert.equal(community.is_rsvped, true);
});
