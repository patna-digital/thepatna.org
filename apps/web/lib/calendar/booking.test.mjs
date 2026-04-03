import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPublicBookingUrl,
  getAvailableDateKeysForMonth,
  getAvailableSlotsForDate,
  normalizeBookingSlug,
  normalizeBookingSettingsRecord,
} from "./booking.js";

test("normalizeBookingSlug creates clean public slugs", () => {
  assert.equal(normalizeBookingSlug(" Dr. Jane O'Connor "), "dr-jane-oconnor");
  assert.equal(normalizeBookingSlug("PATNA / Research Team"), "patna-research-team");
});

test("buildPublicBookingUrl uses the configured site origin", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://thepatna.org/";
  assert.equal(buildPublicBookingUrl("jane-doe"), "https://thepatna.org/book/jane-doe");
});

test("normalizeBookingSettingsRecord keeps textarea-backed fields controlled", () => {
  const settings = normalizeBookingSettingsRecord({
    public_booking_url_slug: "jane-doe",
    confirmation_message: null,
    cancellation_policy: undefined,
  });

  assert.equal(settings.confirmation_message, "");
  assert.equal(settings.cancellation_policy, "");
  assert.equal(settings.public_booking_url, "https://thepatna.org/book/jane-doe");
});

test("getAvailableSlotsForDate removes conflicting external events", () => {
  const dateKey = "2099-04-06";
  const dayOfWeek = new Date(Date.UTC(2099, 3, 6)).getUTCDay();

  const context = {
    memberId: "member-1",
    settings: {
      public_booking_enabled: true,
      default_meeting_duration: 30,
      minimum_notice_hours: 0,
      maximum_booking_days_ahead: 50000,
      buffer_minutes_between_meetings: 0,
      timezone: "Africa/Lagos",
      available_days: [dayOfWeek],
    },
    recurringRules: [
      {
        rule_type: "recurring",
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "11:00",
        is_blocked: false,
      },
    ],
    exceptionRules: [],
    bookings: [],
    externalEvents: [
      {
        starts_at: "2099-04-06T09:00:00.000Z",
        ends_at: "2099-04-06T09:30:00.000Z",
      },
    ],
    slotRows: [],
  };

  const slots = getAvailableSlotsForDate({ dateKey, context });

  assert.deepEqual(
    slots.map((slot) => slot.start_time),
    ["09:00", "09:30", "10:30"],
  );
});

test("getAvailableDateKeysForMonth only returns dates with free slots", () => {
  const dateKey = "2099-04-06";
  const monthKey = "2099-04";
  const dayOfWeek = new Date(Date.UTC(2099, 3, 6)).getUTCDay();

  const context = {
    memberId: "member-2",
    settings: {
      public_booking_enabled: true,
      default_meeting_duration: 60,
      minimum_notice_hours: 0,
      maximum_booking_days_ahead: 50000,
      buffer_minutes_between_meetings: 0,
      timezone: "UTC",
      available_days: [dayOfWeek],
    },
    recurringRules: [
      {
        rule_type: "recurring",
        day_of_week: dayOfWeek,
        start_time: "13:00",
        end_time: "15:00",
        is_blocked: false,
      },
    ],
    exceptionRules: [],
    bookings: [],
    externalEvents: [],
    slotRows: [],
  };

  const availableDates = getAvailableDateKeysForMonth({ monthKey, context });

  assert.ok(availableDates.includes(dateKey));
});
