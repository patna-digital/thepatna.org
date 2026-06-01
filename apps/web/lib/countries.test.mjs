import assert from "node:assert/strict";
import test from "node:test";
import {
  getCountryNameByCodeFromOptions,
  normalizeCountryLookup,
  resolveCountryOption,
  toCountryOptions,
} from "./countries.js";

const countries = [
  { code: "CMR", name: "Cameroon" },
  { code: "COD", name: "Democratic Republic of the Congo" },
  { code: "CIV", name: "Côte d'Ivoire" },
  { code: "STP", name: "São Tomé and Príncipe" },
  { code: "GMB", name: "Gambia" },
];

test("normalizeCountryLookup handles punctuation, accents, and ampersands", () => {
  assert.equal(normalizeCountryLookup(" São Tomé & Príncipe "), "sao tome and principe");
});

test("resolveCountryOption supports PATNA country aliases", () => {
  assert.equal(resolveCountryOption({ countries, name: "Cameroun" })?.code, "CMR");
  assert.equal(resolveCountryOption({ countries, name: "DRC" })?.code, "COD");
  assert.equal(resolveCountryOption({ countries, name: "Cote d'Ivoire" })?.code, "CIV");
  assert.equal(resolveCountryOption({ countries, name: "The Gambia" })?.code, "GMB");
  assert.equal(resolveCountryOption({ countries, name: "Sao Tome & Principe" })?.code, "STP");
});

test("country option helpers return stable labels and sorted options", () => {
  assert.equal(getCountryNameByCodeFromOptions("COD", countries), "Democratic Republic of the Congo");
  assert.deepEqual(
    toCountryOptions(countries).map((country) => country.value),
    ["CMR", "CIV", "COD", "GMB", "STP"],
  );
});
