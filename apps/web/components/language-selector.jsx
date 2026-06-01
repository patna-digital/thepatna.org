"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useTransition } from "react";
import { setLocale } from "@/app/actions/set-locale";

const LANGUAGES = [
  { code: "en", label: "English", abbr: "EN" },
  { code: "fr", label: "Français", abbr: "FR" },
  { code: "pt", label: "Português", abbr: "PT" },
  { code: "ar", label: "العربية", abbr: "AR" },
];

export function LanguageSelector({ variant = "compact" }) {
  const locale = useLocale();
  const languageT = useTranslations("language");
  const settingsT = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const selectId = useId();

  function handleChange(e) {
    const newLocale = e.target.value;
    startTransition(() => setLocale(newLocale));
  }

  if (variant === "full") {
    return (
      <div className="language-selector language-selector--full">
        <label className="language-selector-label" htmlFor={selectId}>
          {languageT("label")}
        </label>
        <select
          className="language-selector-select"
          disabled={isPending}
          id={selectId}
          onChange={handleChange}
          value={locale}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {languageT(lang.code)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="language-selector language-selector--sidebar">
        <div className="language-selector-copy">
          <strong className="language-selector-title">{settingsT("languageTitle")}</strong>
          <p className="language-selector-description">{settingsT("languageDescription")}</p>
        </div>
        <label className="sr-only" htmlFor={selectId}>
          {languageT("label")}
        </label>
        <select
          aria-label={languageT("label")}
          className="language-selector-select language-selector-select--sidebar"
          disabled={isPending}
          id={selectId}
          onChange={handleChange}
          value={locale}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {languageT(lang.code)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="language-selector language-selector--compact">
      <label className="sr-only" htmlFor={selectId}>
        {languageT("label")}
      </label>
      <select
        aria-label={languageT("label")}
        className="language-selector-select language-selector-select--compact"
        disabled={isPending}
        id={selectId}
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
