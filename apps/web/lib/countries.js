export const COUNTRY_ALIAS_ENTRIES = [
  ["COD", "DRC"],
  ["COD", "DR Congo"],
  ["COD", "Dem. Rep. Congo"],
  ["COD", "Democratic Republic of Congo"],
  ["COD", "Congo (Democratic Republic of)"],
  ["COG", "Congo"],
  ["GMB", "The Gambia"],
  ["CIV", "Cote d'Ivoire"],
  ["CIV", "Ivory Coast"],
  ["CMR", "Cameroun"],
  ["CPV", "Cape Verde"],
  ["STP", "São Tomé & Príncipe"],
  ["STP", "Sao Tome and Principe"],
  ["STP", "Sao Tome & Principe"],
  ["GNQ", "Eq. Guinea"],
  ["CAF", "Central African Rep."],
  ["SSD", "S. Sudan"],
  ["SWZ", "eSwatini"],
  ["TZA", "Tanzania"],
  ["TUR", "Turkey"],
  ["GBR", "UK"],
  ["GBR", "Britain"],
  ["USA", "US"],
  ["USA", "United States of America"],
];

export function normalizeCountryLookup(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function buildCountryLookup(countries = []) {
  const byCode = new Map();
  const byName = new Map();

  for (const country of countries || []) {
    if (!country) continue;

    const code = String(country.code || country.country_code || country.value || "").toUpperCase();
    const name = country.name || country.country || country.label || "";

    if (!code || !name) continue;

    const normalized = {
      ...country,
      code,
      label: country.label || name,
      name,
      value: country.value || code,
    };

    byCode.set(code, normalized);

    for (const label of [name, country.official_name, country.label, ...(country.aliases || [])]) {
      const key = normalizeCountryLookup(label);
      if (key) byName.set(key, normalized);
    }
  }

  for (const [code, alias] of COUNTRY_ALIAS_ENTRIES) {
    const country = byCode.get(code);
    const key = normalizeCountryLookup(alias);
    if (country && key) byName.set(key, country);
  }

  return { byCode, byName };
}

export function resolveCountryOption({ code, countries = [], name } = {}) {
  const lookup = buildCountryLookup(countries);
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (normalizedCode && lookup.byCode.has(normalizedCode)) {
    return lookup.byCode.get(normalizedCode);
  }

  const normalizedName = normalizeCountryLookup(name);
  return normalizedName ? lookup.byName.get(normalizedName) || null : null;
}

export function getCountryNameByCodeFromOptions(code, countries = []) {
  return resolveCountryOption({ code, countries })?.name || "";
}

export function toCountryOptions(countries = [], fallbackOptions = []) {
  const source = countries?.length ? countries : fallbackOptions;

  return (source || [])
    .map((country) => {
      const value = String(country.code || country.country_code || country.value || "").toUpperCase();
      const label = country.name || country.country || country.label || value;
      return value && label ? { label, value } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.label.localeCompare(right.label));
}
