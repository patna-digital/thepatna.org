import test from "node:test";
import assert from "node:assert/strict";

import {
  extractGoogleConferenceDetails,
  findConferenceLink,
  getConferenceCtaLabel,
} from "./conference.js";

test("findConferenceLink detects Google Meet and Zoom links from mixed values", () => {
  assert.deepEqual(
    findConferenceLink(
      null,
      {
        description: "Join via https://meet.google.com/abc-defg-hij",
      },
    ),
    {
      url: "https://meet.google.com/abc-defg-hij",
      provider: "google_meet",
    },
  );

  assert.deepEqual(
    findConferenceLink("Dial in", "Zoom room: https://patna.zoom.us/j/123456789?pwd=abc."),
    {
      url: "https://patna.zoom.us/j/123456789?pwd=abc",
      provider: "zoom",
    },
  );
});

test("extractGoogleConferenceDetails prefers conference payload and falls back to parsed links", () => {
  const meetEvent = extractGoogleConferenceDetails({
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
  });

  assert.equal(meetEvent.conferenceUrl, "https://meet.google.com/abc-defg-hij");
  assert.equal(meetEvent.conferenceProvider, "google_meet");
  assert.equal(meetEvent.conferenceData.conferenceId, "abc-defg-hij");

  const zoomFallback = extractGoogleConferenceDetails({
    location: "Zoom: https://patna.zoom.us/j/987654321",
  });

  assert.equal(zoomFallback.conferenceUrl, "https://patna.zoom.us/j/987654321");
  assert.equal(zoomFallback.conferenceProvider, "zoom");
});

test("getConferenceCtaLabel returns PATNA-ready labels", () => {
  assert.equal(getConferenceCtaLabel("google_meet"), "Join Google Meet");
  assert.equal(getConferenceCtaLabel("zoom"), "Join Zoom");
  assert.equal(getConferenceCtaLabel("custom"), "Join meeting");
});
