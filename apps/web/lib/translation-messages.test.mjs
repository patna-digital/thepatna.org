import test from "node:test";
import assert from "node:assert/strict";

import { getDefaultBundledMessages, loadBundledMessages } from "./translation-messages.js";

test("getDefaultBundledMessages returns the bundled English message tree", () => {
  const messages = getDefaultBundledMessages();

  assert.equal(messages.nav.home, "Home");
  assert.equal(typeof messages.home.h1, "string");
  assert.ok(messages.home.h1.length > 0);
});

test("loadBundledMessages returns non-empty bundled messages for every supported locale", async () => {
  const [enMessages, frMessages, ptMessages, arMessages] = await Promise.all([
    loadBundledMessages("en"),
    loadBundledMessages("fr"),
    loadBundledMessages("pt"),
    loadBundledMessages("ar"),
  ]);

  assert.equal(enMessages.nav.home, "Home");
  assert.equal(typeof frMessages.nav.home, "string");
  assert.equal(typeof ptMessages.nav.home, "string");
  assert.equal(typeof arMessages.nav.home, "string");
});

test("loadBundledMessages falls back to English for unsupported locales", async () => {
  const messages = await loadBundledMessages("yo");

  assert.equal(messages.nav.home, "Home");
  assert.equal(messages.home.btnLearnMore, "About PATNA");
});
