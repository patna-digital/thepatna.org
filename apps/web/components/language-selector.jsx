"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/set-locale";

const LANGUAGES = [
  { code: "en", label: "English", abbr: "EN" },
  { code: "fr", label: "Français", abbr: "FR" },
  { code: "pt", label: "Português", abbr: "PT" },
  { code: "ar", label: "العربية", abbr: "AR" },
];

export function LanguageSelector({ variant = "compact" }) {
  const locale = useLocale();
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    const newLocale = e.target.value;
    startTransition(() => setLocale(newLocale));
  }

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  if (variant === "full") {
    return (
      <div className="language-selector language-selector--full">
        <label className="language-selector-label" htmlFor="language-select-full">
          {t("label")}
        </label>
        <select
          className="language-selector-select"
          disabled={isPending}
          id="language-select-full"
          onChange={handleChange}
          value={locale}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {t(lang.code)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="language-selector language-selector--compact">
      <label className="sr-only" htmlFor="language-select-compact">
        {t("label")}
      </label>
      <select
        aria-label={t("label")}
        className="language-selector-select language-selector-select--compact"
        disabled={isPending}
        id="language-select-compact"
        onChange={handleChange}
        value={locale}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.abbr}
          </option>
        ))}
      </select>
    </div>
  );
}
