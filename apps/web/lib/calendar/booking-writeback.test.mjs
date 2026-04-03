import test from "node:test";
import assert from "node:assert/strict";

import {
  BookingWritebackError,
  buildGoogleBookingDescription,
  persistBookingWithGoogleWriteback,
  selectGoogleWritebackConnection,
} from "./booking-writeback.js";

test("selectGoogleWritebackConnection only chooses active synced primary Google calendars", () => {
  const connection = selectGoogleWritebackConnection([
    {
      id: "google-paused",
      provider: "google",
      access_token: "token",
      refresh_token: "refresh",
      is_primary_calendar: true,
      is_active: true,
      sync_enabled: false,
    },
    {
      id: "outlook-primary",
      provider: "microsoft",
      access_token: "token",
      refresh_token: "refresh",
      is_primary_calendar: true,
      is_active: true,
      sync_enabled: true,
    },
    {
      id: "google-readonly",
      provider: "google",
      access_role: "reader",
      access_token: "token",
      refresh_token: "refresh",
      is_primary_calendar: true,
      is_active: true,
      sync_enabled: true,
    },
    {
      id: "google-live",
      provider: "google",
      access_role: "writer",
      access_token: "token",
      refresh_token: "refresh",
      is_primary_calendar: true,
      is_active: true,
      sync_enabled: true,
    },
  ]);

  assert.equal(connection.id, "google-live");
});

test("selectGoogleWritebackConnection does not choose Google calendars with unknown access", () => {
  const connection = selectGoogleWritebackConnection([
    {
      id: "google-unknown",
      provider: "google",
      access_role: null,
      access_token: "token",
      refresh_token: "refresh",
      is_primary_calendar: true,
      is_active: true,
      sync_enabled: true,
    },
  ]);

  assert.equal(connection, null);
});

test("buildGoogleBookingDescription includes guest emails when present", () => {
  const description = buildGoogleBookingDescription({
    bookerName: "Jane Doe",
    bookerEmail: "jane@example.com",
    bookerOrganisation: "PATNA",
    guestEmails: ["guest.one@example.com", "guest.two@example.com"],
    notes: "Looking forward to it",
  });

  assert.match(description, /Guest emails: guest\.one@example\.com, guest\.two@example\.com/);
});

test("persistBookingWithGoogleWriteback confirms PATNA booking only after Google write-back succeeds", async () => {
  const loggedResults = [];
  const slotInserts = [];
  let updatedBookingPatch = null;

  const result = await persistBookingWithGoogleWriteback({
    writebackConnection: { id: "conn_1" },
    bookingInsertPayload: { title: "PATNA booking" },
    slotInsertPayload: { member_id: "member_1" },
    googleEventPayload: { title: "PATNA booking" },
    bookingInsert: async () => ({ id: "booking_1", title: "PATNA booking" }),
    bookingUpdate: async (bookingId, payload) => {
      updatedBookingPatch = { bookingId, ...payload };
      return { id: bookingId, ...payload };
    },
    bookingDelete: async () => {
      throw new Error("bookingDelete should not be called on success");
    },
    slotInsert: async (payload) => {
      slotInserts.push(payload);
    },
    createProviderEvent: async () => ({
      id: "evt_123",
      conferenceUrl: "https://meet.google.com/abc-defg-hij",
      conferenceProvider: "google_meet",
    }),
    deleteProviderEvent: async () => {
      throw new Error("deleteProviderEvent should not be called on success");
    },
    logWritebackResult: async (payload) => {
      loggedResults.push(payload);
    },
  });

  assert.deepEqual(updatedBookingPatch, {
    bookingId: "booking_1",
    host_calendar_event_id: "evt_123",
    location_type: "video",
    location_details: "https://meet.google.com/abc-defg-hij",
  });
  assert.deepEqual(slotInserts, [
    {
      member_id: "member_1",
      booking_id: "booking_1",
      source_calendar_id: "conn_1",
    },
  ]);
  assert.equal(result.booking.host_calendar_event_id, "evt_123");
  assert.equal(result.writeback.conferenceUrl, "https://meet.google.com/abc-defg-hij");
  assert.deepEqual(loggedResults, [
    {
      connectionId: "conn_1",
      eventsCreated: 1,
      status: "success",
    },
  ]);
});

test("persistBookingWithGoogleWriteback rolls back provisional PATNA state when Google Meet is missing", async () => {
  const cleanup = {
    bookingId: null,
    eventId: null,
  };

  await assert.rejects(
    () =>
      persistBookingWithGoogleWriteback({
        writebackConnection: { id: "conn_1" },
        bookingInsertPayload: { title: "PATNA booking" },
        slotInsertPayload: { member_id: "member_1" },
        googleEventPayload: { title: "PATNA booking" },
        bookingInsert: async () => ({ id: "booking_1" }),
        bookingUpdate: async () => {
          throw new Error("bookingUpdate should not run when conferenceUrl is missing");
        },
        bookingDelete: async (bookingId) => {
          cleanup.bookingId = bookingId;
        },
        slotInsert: async () => {
          throw new Error("slotInsert should not run when conferenceUrl is missing");
        },
        createProviderEvent: async () => ({
          id: "evt_123",
          conferenceUrl: null,
          conferenceProvider: null,
        }),
        deleteProviderEvent: async (eventId) => {
          cleanup.eventId = eventId;
        },
        logWritebackResult: async () => {},
      }),
    (error) => {
      assert.ok(error instanceof BookingWritebackError);
      assert.match(error.message, /Google Meet could not be created/);
      return true;
    },
  );

  assert.equal(cleanup.bookingId, "booking_1");
  assert.equal(cleanup.eventId, "evt_123");
});

test("persistBookingWithGoogleWriteback cleans up Google events if PATNA slot persistence fails", async () => {
  const cleanup = {
    bookingId: null,
    eventId: null,
  };

  await assert.rejects(
    () =>
      persistBookingWithGoogleWriteback({
        writebackConnection: { id: "conn_1" },
        bookingInsertPayload: { title: "PATNA booking" },
        slotInsertPayload: { member_id: "member_1" },
        googleEventPayload: { title: "PATNA booking" },
        bookingInsert: async () => ({ id: "booking_1" }),
        bookingUpdate: async (bookingId, payload) => ({ id: bookingId, ...payload }),
        bookingDelete: async (bookingId) => {
          cleanup.bookingId = bookingId;
        },
        slotInsert: async () => {
          throw new Error("slot insert failed");
        },
        createProviderEvent: async () => ({
          id: "evt_123",
          conferenceUrl: "https://meet.google.com/abc-defg-hij",
          conferenceProvider: "google_meet",
        }),
        deleteProviderEvent: async (eventId) => {
          cleanup.eventId = eventId;
        },
        logWritebackResult: async () => {},
      }),
    /slot insert failed/,
  );

  assert.equal(cleanup.bookingId, "booking_1");
  assert.equal(cleanup.eventId, "evt_123");
});
