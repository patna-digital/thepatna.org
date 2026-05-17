const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

export function normalizePlaceLookupQuery(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function buildPlaceOptionLabel(place = {}) {
  return [
    place.name || place.label,
    place.locality || place.city,
    place.region,
    place.country?.name || place.country_name || place.country,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function normalizeNominatimCandidate(candidate = {}, { countryCode = "" } = {}) {
  const address = candidate.address || {};
  const name =
    candidate.name ||
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    candidate.display_name;

  const latitude = Number.parseFloat(candidate.lat);
  const longitude = Number.parseFloat(candidate.lon);

  if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    address: candidate.display_name || "",
    country_code: String(countryCode || address.country_code || "").toUpperCase(),
    label: buildPlaceOptionLabel({
      name,
      locality: address.city || address.town || address.village || address.municipality || "",
      region: address.state || address.region || "",
      country: address.country || "",
    }),
    latitude,
    locality: address.city || address.town || address.village || address.municipality || "",
    longitude,
    name,
    place_type: candidate.type === "city" || candidate.class === "place" ? "city" : "other",
    region: address.state || address.region || "",
    source: "nominatim",
    source_id: String(candidate.osm_id || candidate.place_id || ""),
  };
}

export async function lookupNominatimPlaces({
  countryAlpha2 = "",
  countryCode = "",
  fetchImpl = fetch,
  limit = 6,
  query,
} = {}) {
  const q = normalizePlaceLookupQuery(query);
  if (!q) return [];

  const params = new URLSearchParams({
    addressdetails: "1",
    format: "jsonv2",
    limit: String(limit),
    q,
  });

  if (countryAlpha2 || countryCode) {
    params.set("countrycodes", String(countryAlpha2 || countryCode).slice(0, 2).toLowerCase());
  }

  const response = await fetchImpl(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "PATNA-admin-location-lookup/1.0 (https://thepatna.org)",
    },
  });

  if (!response.ok) {
    throw new Error(`Place lookup failed with status ${response.status}`);
  }

  const data = await response.json();
  return (Array.isArray(data) ? data : [])
    .map((candidate) => normalizeNominatimCandidate(candidate, { countryCode }))
    .filter(Boolean);
}
