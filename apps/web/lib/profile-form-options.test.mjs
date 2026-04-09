import test from "node:test";
import assert from "node:assert/strict";
import {
  formatProfileAvailabilityStatus,
  formatProfileVisibilitySetting,
  isValidProfileAvailabilityStatus,
  isValidProfileVisibilitySetting,
} from "./profile-form-options.js";

test("profile visibility settings only accept database-backed values", () => {
  assert.equal(isValidProfileVisibilitySetting("members_only"), true);
  assert.equal(isValidProfileVisibilitySetting("limited"), true);
  assert.equal(isValidProfileVisibilitySetting("hidden"), true);
  assert.equal(isValidProfileVisibilitySetting("public"), false);
  assert.equal(isValidProfileVisibilitySetting("private"), false);
});

test("profile availability settings only accept supported values", () => {
  assert.equal(isValidProfileAvailabilityStatus("available"), true);
  assert.equal(isValidProfileAvailabilityStatus("unavailable"), true);
  assert.equal(isValidProfileAvailabilityStatus("limited"), false);
});

test("formatters return PATNA-friendly labels", () => {
  assert.equal(formatProfileVisibilitySetting("limited"), "Limited");
  assert.equal(formatProfileAvailabilityStatus("unavailable"), "Unavailable");
});
