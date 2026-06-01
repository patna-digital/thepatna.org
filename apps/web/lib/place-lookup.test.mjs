import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPlaceOptionLabel,
  lookupNominatimPlaces,
  normalizeNominatimCandidate,
} from "./place-lookup.js";

test("normalizeNominatimCandidate produces a PATNA place candidate", () => {
  const candidate = normalizeNominatimCandidate(
    {
      address: {
        city: "Dakar",
        country: "Senegal",
        country_code: "sn",
        state: "Dakar Region",
      },
      display_name: "Dakar, Senegal",
      lat: "14.7167",
      lon: "-17.4677",
      osm_id: 123,
      type: "city",
    },
    { countryCode: "SEN" },
  );

  assert.equal(candidate.country_code, "SEN");
  assert.equal(candidate.name, "Dakar");
  assert.equal(candidate.latitude, 14.7167);
  assert.equal(candidate.longitude, -17.4677);
  assert.match(candidate.label, /Dakar/);
});

test("buildPlaceOptionLabel keeps saved places scannable", () => {
  assert.equal(
    buildPlaceOptionLabel({
      country_name: "Nigeria",
      locality: "Abuja",
      name: "African Strategic Summit",
    }),
    "African Strategic Summit · Abuja · Nigeria",
  );
});

test("lookupNominatimPlaces uses alpha-2 country filters and normalizes results", async () => {
  let requestedUrl = "";
  const candidates = await lookupNominatimPlaces({
    countryAlpha2: "SN",
    countryCode: "SEN",
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        async json() {
          return [
            {
              address: { city: "Dakar", country: "Senegal" },
              display_name: "Dakar, Senegal",
              lat: "14.7167",
              lon: "-17.4677",
              place_id: "abc",
            },
          ];
        },
      };
    },
    query: "Dakar",
  });

  assert.match(requestedUrl, /countrycodes=sn/);
  assert.equal(candidates[0].country_code, "SEN");
});
