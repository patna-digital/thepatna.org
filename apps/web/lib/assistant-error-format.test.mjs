import test from "node:test";
import assert from "node:assert/strict";

import {
  formatStoredSyncSummary,
  summarizeDriveProviderError,
  summarizeSyncErrorReason,
} from "./assistant-error-format.js";

test("summarizeDriveProviderError condenses Google HTML abuse pages", () => {
  const html = `
    <html>
      <body>
        <div>We're sorry...</div>
        <div>Our systems have detected unusual traffic from your computer network.</div>
        <div>We can't process your request right now.</div>
      </body>
    </html>
  `;

  assert.equal(
    summarizeDriveProviderError(html),
    "Google Drive blocked the request. Check the API key restrictions, quota, and sharing settings.",
  );
});

test("summarizeSyncErrorReason preserves Drive API prefixes while cleaning details", () => {
  const raw = `Drive API download error (403): <html><body>We're sorry... We can't process your request right now.</body></html>`;

  assert.equal(
    summarizeSyncErrorReason(raw),
    "Drive API download error (403): Google Drive blocked the request. Check the API key restrictions, quota, and sharing settings.",
  );
});

test("summarizeSyncErrorReason keeps env failures concise", () => {
  assert.equal(
    summarizeSyncErrorReason("GOOGLE_DRIVE_API_KEY is not configured."),
    "GOOGLE_DRIVE_API_KEY is not configured.",
  );
});

test("formatStoredSyncSummary formats grouped errors onto separate lines", () => {
  const summary = formatStoredSyncSummary(
    "PDF download failed (13): Drive API download error (403): <html>We're sorry...</html>; Drive API key missing (1): GOOGLE_DRIVE_API_KEY is not configured.",
  );

  assert.equal(
    summary,
    [
      "PDF download failed (13): Drive API download error (403): Google Drive blocked the request. Check the API key restrictions, quota, and sharing settings.",
      "Drive API key missing (1): GOOGLE_DRIVE_API_KEY is not configured.",
    ].join("\n"),
  );
});
