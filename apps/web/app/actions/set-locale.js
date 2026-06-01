"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/lib/locales";

export async function setLocale(locale) {
  if (!locales.includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set("PATNA_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
