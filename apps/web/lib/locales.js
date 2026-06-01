export const locales = ["en", "fr", "pt", "ar"];
export const defaultLocale = "en";

export function isSupportedLocale(value) {
  return locales.includes(String(value || "").trim());
}

export function resolveLocale(value) {
  return isSupportedLocale(value) ? value : defaultLocale;
}

export function isRtlLocale(locale) {
  return resolveLocale(locale) === "ar";
}
