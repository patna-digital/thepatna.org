import test from "node:test";
import assert from "node:assert/strict";

import {
  getDateKeysForEvent,
  getDisplayRangeForEvent,
  normalizeAllDayDateRange,
  toLocalDateKey,
} from "./date-helpers.mjs";

test("toLocalDateKey keeps browser-local calendar dates in Africa/Lagos", () => {
  assert.equal(toLocalDateKey(new Date(2026, 3, 2)), "2026-04-02");
});

test("timed events keep their local day placement", () => {
  const event = {
    starts_at: "2026-04-01T17:00:00Z",
    ends_at: "2026-04-01T18:00:00Z",
    is_all_day: false,
    event_source: "external",
  };

  assert.deepEqual(getDateKeysForEvent(event), ["2026-04-01"]);
});

test("external all-day events use exclusive end dates for display", () => {
  const event = {
    starts_at: "2026-04-03T00:00:00.000Z",
    ends_at: "2026-04-04T00:00:00.000Z",
    is_all_day: true,
    event_source: "external",
  };

  const range = getDisplayRangeForEvent(event);

  assert.equal(toLocalDateKey(range.start), "2026-04-03");
  assert.equal(toLocalDateKey(range.end), "2026-04-03");
  assert.deepEqual(getDateKeysForEvent(event), ["2026-04-03"]);
});

test("multi-day external all-day events keep exclusive-end semantics", () => {
  const event = {
    starts_at: "2026-04-03T00:00:00.000Z",
    ends_at: "2026-04-06T00:00:00.000Z",
    is_all_day: true,
    event_source: "external",
  };

  assert.deepEqual(getDateKeysForEvent(event), [
    "2026-04-03",
    "2026-04-04",
    "2026-04-05",
  ]);
});

test("all-day normalization produces explicit midnight UTC timestamps", () => {
  assert.deepEqual(
    normalizeAllDayDateRange("2026-04-03", "2026-04-04"),
    {
      startsAt: "2026-04-03T00:00:00.000Z",
      endsAt: "2026-04-04T00:00:00.000Z",
    },
  );
});
