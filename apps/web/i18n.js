import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales } from "@/lib/locales";
import { getTranslatedMessages } from "@/lib/translation";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("PATNA_LOCALE")?.value ?? defaultLocale;
  const safeLocale = locales.includes(locale) ? locale : defaultLocale;

  return {
    locale: safeLocale,
    messages: await getTranslatedMessages(safeLocale),
  };
});
