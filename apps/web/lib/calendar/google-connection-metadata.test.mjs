import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGoogleCalendarMetadataPatches,
  isGoogleCalendarPermissionError,
} from "./google-connection-metadata.js";

test("buildGoogleCalendarMetadataPatches updates matching Google connections with fresh access roles", () => {
  const patches = buildGoogleCalendarMetadataPatches({
    updatedAt: "2026-04-03T00:00:00.000Z",
    calendars: [
      {
        id: "cal_writer",
        name: "Team Calendar",
        accessRole: "writer",
        primary: false,
      },
      {
        id: "cal_primary",
        name: "Primary Calendar",
        accessRole: "owner",
        primary: true,
      },
    ],
    connections: [
      {
        id: "conn_1",
        calendar_id: "cal_writer",
        calendar_name: "Old Name",
        access_role: null,
      },
      {
        id: "conn_2",
        calendar_id: "cal_primary",
        calendar_name: "Primary Calendar",
        access_role: "owner",
      },
    ],
  });

  assert.deepEqual(patches, [
    {
      id: "conn_1",
      calendar_name: "Team Calendar",
      access_role: "writer",
      updated_at: "2026-04-03T00:00:00.000Z",
    },
  ]);
});

test("isGoogleCalendarPermissionError detects raw Google writer-access failures", () => {
  assert.equal(
    isGoogleCalendarPermissionError({
      code: 403,
      message: "You need to have writer access to this calendar.",
    }),
    true,
  );

  assert.equal(
    isGoogleCalendarPermissionError({
      code: 500,
      message: "Internal server error",
    }),
    false,
  );
});
