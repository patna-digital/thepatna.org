import test from "node:test";
import assert from "node:assert/strict";

import {
  isValidEmailAddress,
  normalizeEmailAddress,
  normalizeGuestEmailsInput,
} from "./booking-attendees.js";

test("normalizeEmailAddress trims and lowercases email addresses", () => {
  assert.equal(normalizeEmailAddress("  Jane.Doe@Example.COM "), "jane.doe@example.com");
});

test("isValidEmailAddress validates basic email structure", () => {
  assert.equal(isValidEmailAddress("jane@example.com"), true);
  assert.equal(isValidEmailAddress("not-an-email"), false);
});

test("normalizeGuestEmailsInput trims, dedupes, and excludes the primary email", () => {
  const result = normalizeGuestEmailsInput(
    "guest.one@example.com, GUEST.TWO@example.com\njane@example.com\nguest.one@example.com",
    { primaryEmail: "jane@example.com" },
  );

  assert.deepEqual(result.guestEmails, [
    "guest.one@example.com",
    "guest.two@example.com",
  ]);
  assert.deepEqual(result.invalidEmails, []);
});

test("normalizeGuestEmailsInput reports invalid guest emails", () => {
  const result = normalizeGuestEmailsInput(["valid@example.com", "bad-email"], {
    primaryEmail: "host@example.com",
  });

  assert.deepEqual(result.guestEmails, ["valid@example.com"]);
  assert.deepEqual(result.invalidEmails, ["bad-email"]);
});
