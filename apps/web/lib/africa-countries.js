const AFRICA_GEOGRAPHY_LIST = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cameroon",
  "Central African Rep.",
  "Chad",
  "Comoros",
  "Congo",
  "Côte d'Ivoire",
  "Dem. Rep. Congo",
  "Djibouti",
  "Egypt",
  "Eq. Guinea",
  "Eritrea",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "S. Sudan",
  "São Tomé and Principe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "Somaliland",
  "South Africa",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "W. Sahara",
  "Zambia",
  "Zimbabwe",
  "eSwatini",
];

export const AFRICA_GEOGRAPHY_NAMES = new Set(AFRICA_GEOGRAPHY_LIST);

export const AFRICAN_COUNTRIES = [
  { code: "DZA", name: "Algeria" },
  { code: "AGO", name: "Angola" },
  { code: "BEN", name: "Benin" },
  { code: "BWA", name: "Botswana" },
  { code: "BFA", name: "Burkina Faso" },
  { code: "BDI", name: "Burundi" },
  { code: "CPV", name: "Cabo Verde", aliases: ["Cape Verde"], geographyName: "Cabo Verde" },
  { code: "CMR", name: "Cameroon" },
  { code: "CAF", name: "Central African Republic", aliases: ["Central African Rep."], geographyName: "Central African Rep." },
  { code: "TCD", name: "Chad" },
  { code: "COM", name: "Comoros" },
  { code: "COG", name: "Republic of the Congo", aliases: ["Congo"], geographyName: "Congo" },
  { code: "COD", name: "Democratic Republic of the Congo", aliases: ["Dem. Rep. Congo", "DR Congo", "Democratic Republic of Congo"], geographyName: "Dem. Rep. Congo" },
  { code: "CIV", name: "Côte d'Ivoire", aliases: ["Cote d'Ivoire", "Ivory Coast"], geographyName: "Côte d'Ivoire" },
  { code: "DJI", name: "Djibouti" },
  { code: "EGY", name: "Egypt" },
  { code: "GNQ", name: "Equatorial Guinea", aliases: ["Eq. Guinea"], geographyName: "Eq. Guinea" },
  { code: "ERI", name: "Eritrea" },
  { code: "ETH", name: "Ethiopia" },
  { code: "GAB", name: "Gabon" },
  { code: "GMB", name: "Gambia", aliases: ["The Gambia"] },
  { code: "GHA", name: "Ghana" },
  { code: "GIN", name: "Guinea" },
  { code: "GNB", name: "Guinea-Bissau" },
  { code: "KEN", name: "Kenya" },
  { code: "LSO", name: "Lesotho" },
  { code: "LBR", name: "Liberia" },
  { code: "LBY", name: "Libya" },
  { code: "MDG", name: "Madagascar" },
  { code: "MWI", name: "Malawi" },
  { code: "MLI", name: "Mali" },
  { code: "MRT", name: "Mauritania" },
  { code: "MUS", name: "Mauritius" },
  { code: "MAR", name: "Morocco" },
  { code: "MOZ", name: "Mozambique" },
  { code: "NAM", name: "Namibia" },
  { code: "NER", name: "Niger" },
  { code: "NGA", name: "Nigeria" },
  { code: "RWA", name: "Rwanda" },
  { code: "STP", name: "São Tomé and Principe", aliases: ["Sao Tome and Principe"], geographyName: "São Tomé and Principe" },
  { code: "SEN", name: "Senegal" },
  { code: "SYC", name: "Seychelles" },
  { code: "SLE", name: "Sierra Leone" },
  { code: "SOM", name: "Somalia" },
  { code: "ZAF", name: "South Africa" },
  { code: "SSD", name: "South Sudan", aliases: ["S. Sudan"], geographyName: "S. Sudan" },
  { code: "SDN", name: "Sudan" },
  { code: "TZA", name: "Tanzania" },
  { code: "TGO", name: "Togo" },
  { code: "TUN", name: "Tunisia" },
  { code: "UGA", name: "Uganda" },
  { code: "SWZ", name: "Eswatini", aliases: ["eSwatini"], geographyName: "eSwatini" },
  { code: "ZMB", name: "Zambia" },
  { code: "ZWE", name: "Zimbabwe" },
];

export const AFRICAN_COUNTRY_OPTIONS = AFRICAN_COUNTRIES
  .map((country) => ({ label: country.name, value: country.code }))
  .sort((a, b) => a.label.localeCompare(b.label));

function normalizeCountryKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

const COUNTRIES_BY_CODE = new Map();
const COUNTRIES_BY_NAME = new Map();

for (const country of AFRICAN_COUNTRIES) {
  COUNTRIES_BY_CODE.set(country.code, country);

  for (const name of [country.name, country.geographyName, ...(country.aliases || [])].filter(Boolean)) {
    COUNTRIES_BY_NAME.set(normalizeCountryKey(name), country);
  }
}

export function getAfricanCountryByCode(code) {
  return COUNTRIES_BY_CODE.get(String(code || "").toUpperCase()) || null;
}

export function getAfricanCountryByName(name) {
  return COUNTRIES_BY_NAME.get(normalizeCountryKey(name)) || null;
}

export function getAfricanCountryNameByCode(code) {
  return getAfricanCountryByCode(code)?.name || "";
}

export function resolveAfricanCountryCode({ code, name }) {
  if (code) {
    return getAfricanCountryByCode(code)?.code || null;
  }

  return getAfricanCountryByName(name)?.code || null;
}

export function isAfricaGeographyName(name) {
  return AFRICA_GEOGRAPHY_NAMES.has(String(name || ""));
}
