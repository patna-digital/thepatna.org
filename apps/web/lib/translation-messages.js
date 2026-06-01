import enMessages from "../messages/en.json" with { type: "json" };

import { normalizeError } from "./error-utils.js";
import { defaultLocale, resolveLocale } from "./locales.js";

const LOCALE_MESSAGE_IMPORTERS = {
  en: async () => enMessages,
  fr: async () => {
    const module = await import("../messages/fr.json", { with: { type: "json" } });
    return module.default;
  },
  pt: async () => {
    const module = await import("../messages/pt.json", { with: { type: "json" } });
    return module.default;
  },
  ar: async () => {
    const module = await import("../messages/ar.json", { with: { type: "json" } });
    return module.default;
  },
};

export async function loadBundledMessages(locale) {
  const safeLocale = resolveLocale(locale);
  const importer = LOCALE_MESSAGE_IMPORTERS[safeLocale] || LOCALE_MESSAGE_IMPORTERS[defaultLocale];

  try {
    return await importer();
  } catch (error) {
    console.warn(
      "Failed to load bundled locale messages; falling back to English.",
      { locale: safeLocale, ...normalizeError(error) },
    );
    return enMessages;
  }
}

export function getDefaultBundledMessages() {
  return enMessages;
}
