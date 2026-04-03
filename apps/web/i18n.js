import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en", "fr", "pt", "ar"];
export const defaultLocale = "en";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("PATNA_LOCALE")?.value ?? defaultLocale;
  const safeLocale = locales.includes(locale) ? locale : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`./messages/${safeLocale}.json`)).default,
  };
});
