import test from "node:test";
import assert from "node:assert/strict";

import { syncMatchedBookingConferenceDetails } from "./sync-bookings.js";

function createBookingsSupabaseStub({ bookings = [], updateErrors = {} } = {}) {
  const updates = [];

  return {
    updates,
    from(table) {
      assert.equal(table, "bookings");

      return {
        select() {
          return {
            eq(field, value) {
              assert.equal(field, "host_id");
              assert.equal(typeof value, "string");

              return {
                in(inField, values) {
                  assert.equal(inField, "host_calendar_event_id");

                  return Promise.resolve({
                    data: bookings.filter((booking) => values.includes(booking.host_calendar_event_id)),
                    error: null,
                  });
                },
              };
            },
          };
        },
        update(patch) {
          return {
            eq(field, value) {
              assert.equal(field, "id");
              updates.push({ id: value, patch });

              return Promise.resolve({
                error: updateErrors[value]
                  ? { message: updateErrors[value] }
                  : null,
              });
            },
          };
        },
      };
    },
  };
}

test("syncMatchedBookingConferenceDetails copies synced meeting links onto PATNA bookings", async () => {
  const supabase = createBookingsSupabaseStub({
    bookings: [
      {
        id: "booking_1",
        host_calendar_event_id: "evt_123",
        location_type: null,
        location_details: null,
      },
    ],
  });

  const result = await syncMatchedBookingConferenceDetails({
    memberId: "member_1",
    externalEvents: [
      {
        externalEventId: "evt_123",
        conferenceUrl: "https://meet.google.com/abc-defg-hij",
      },
    ],
    supabase,
  });

  assert.equal(result.updatedCount, 1);
  assert.deepEqual(supabase.updates, [
    {
      id: "booking_1",
      patch: {
        location_type: "video",
        location_details: "https://meet.google.com/abc-defg-hij",
        updated_at: supabase.updates[0].patch.updated_at,
      },
    },
  ]);
  assert.match(supabase.updates[0].patch.updated_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("syncMatchedBookingConferenceDetails clears stale video metadata when conferencing is removed", async () => {
  const supabase = createBookingsSupabaseStub({
    bookings: [
      {
        id: "booking_2",
        host_calendar_event_id: "evt_456",
        location_type: "video",
        location_details: "https://meet.google.com/old-room",
      },
    ],
  });

  const result = await syncMatchedBookingConferenceDetails({
    memberId: "member_1",
    externalEvents: [
      {
        externalEventId: "evt_456",
        conferenceUrl: null,
      },
    ],
    supabase,
  });

  assert.equal(result.updatedCount, 1);
  assert.equal(supabase.updates[0].patch.location_type, null);
  assert.equal(supabase.updates[0].patch.location_details, null);
});
