import "server-only";

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cache } from "react";
import { cookies } from "next/headers";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDatabaseAccessError, isMissingDatabaseFeatureError, normalizeError } from "@/lib/error-utils";
import { getGoogleTranslateApiKey } from "@/lib/env";
import { defaultLocale, resolveLocale } from "@/lib/locales";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(MODULE_DIR, "..");
const MESSAGES_DIR = resolve(APP_ROOT, "messages");
const CACHE_TABLE = "content_translations";
const GOOGLE_TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";
const PLACEHOLDER_PATTERN = /\{[^{}]+\}/g;
const MAX_BATCH_SIZE = 50;
let translationCacheReadEnabled = true;
let translationCacheWriteEnabled = true;

function flattenObject(obj, prefix = "") {
  return Object.entries(obj || {}).reduce((acc, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, nextKey));
    } else {
      acc[nextKey] = value;
    }
    return acc;
  }, {});
}

function unflattenObject(flatObject) {
  const output = {};

  for (const [key, value] of Object.entries(flatObject || {})) {
    const parts = key.split(".");
    let pointer = output;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      if (!pointer[part] || typeof pointer[part] !== "object" || Array.isArray(pointer[part])) {
        pointer[part] = {};
      }
      pointer = pointer[part];
    }

    pointer[parts.at(-1)] = value;
  }

  return output;
}

function chunkArray(values, size = MAX_BATCH_SIZE) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function createSourceHash(value, format = "text") {
  return createHash("sha256")
    .update(`${format}:${String(value || "")}`)
    .digest("hex");
}

function detectFormat(text, explicitFormat) {
  if (explicitFormat === "html" || explicitFormat === "text") {
    return explicitFormat;
  }

  return /<[^>]+>/.test(String(text || "")) ? "html" : "text";
}

function maskPlaceholders(text) {
  const placeholders = [];
  const maskedText = String(text || "").replace(PLACEHOLDER_PATTERN, (match) => {
    const token = `__PATNA_TOKEN_${placeholders.length}__`;
    placeholders.push({ token, match });
    return token;
  });

  return { maskedText, placeholders };
}

function restorePlaceholders(text, placeholders) {
  return (placeholders || []).reduce(
    (output, placeholder) => output.replaceAll(placeholder.token, placeholder.match),
    String(text || ""),
  );
}

async function readMessageFile(locale) {
  try {
    const raw = await readFile(resolve(MESSAGES_DIR, `${locale}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const loadSourceMessages = cache(async () => readMessageFile(defaultLocale));
const loadFallbackMessages = cache(async (locale) => readMessageFile(locale));

async function getRequestLocaleFromCookies() {
  try {
    const cookieStore = await cookies();
    return resolveLocale(cookieStore.get("PATNA_LOCALE")?.value);
  } catch {
    return defaultLocale;
  }
}

async function getAdminTranslationClient() {
  if (!canUseSupabaseAdmin()) {
    return null;
  }

  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

function disableTranslationCache(mode, error) {
  const normalizedError = normalizeError(error);

  if (mode === "read" || mode === "all") {
    translationCacheReadEnabled = false;
  }

  if (mode === "write" || mode === "all") {
    translationCacheWriteEnabled = false;
  }

  console.warn("Translation cache disabled; continuing without persisted cache.", normalizedError);
}

async function fetchCachedTranslations({ locale, items }) {
  if (!translationCacheReadEnabled) {
    return new Map();
  }

  const adminClient = await getAdminTranslationClient();

  if (!adminClient || !items.length) {
    return new Map();
  }

  const cacheKeys = [...new Set(items.map((item) => item.cacheKey).filter(Boolean))];
  const rows = [];

  for (const keys of chunkArray(cacheKeys, 150)) {
    const { data, error } = await adminClient
      .from(CACHE_TABLE)
      .select("cache_key, target_locale, source_hash, source_text, translated_text, detected_source_locale, provider")
      .eq("target_locale", locale)
      .in("cache_key", keys);

    if (error) {
      if (isMissingDatabaseFeatureError(error) || isDatabaseAccessError(error)) {
        disableTranslationCache("all", error);
        return new Map();
      }

      console.warn("Failed to read cached translations for this request.", normalizeError(error));
      return new Map();
    }

    rows.push(...(data || []));
  }

  return new Map(rows.map((row) => [row.cache_key, row]));
}

async function persistTranslations(rows) {
  if (!translationCacheWriteEnabled) {
    return;
  }

  const adminClient = await getAdminTranslationClient();

  if (!adminClient || !rows.length) {
    return;
  }

  const { error } = await adminClient
    .from(CACHE_TABLE)
    .upsert(rows, { onConflict: "cache_key,target_locale" });

  if (error) {
    if (isMissingDatabaseFeatureError(error) || isDatabaseAccessError(error)) {
      disableTranslationCache("write", error);
      return;
    }

    console.warn("Failed to persist translated content cache for this request.", normalizeError(error));
  }
}

async function translateBatchWithGoogle({ entries, locale, sourceLocale = "", format = "text" }) {
  const apiKey = getGoogleTranslateApiKey();

  if (!apiKey || !entries.length) {
    return entries.map((entry) => ({
      cacheKey: entry.cacheKey,
      translatedText: entry.text,
      detectedSourceLocale: sourceLocale || defaultLocale,
    }));
  }

  const maskedEntries = entries.map((entry) => {
    const { maskedText, placeholders } = maskPlaceholders(entry.text);
    return {
      ...entry,
      maskedText,
      placeholders,
    };
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: maskedEntries.map((entry) => entry.maskedText),
      target: locale,
      format,
      ...(sourceLocale ? { source: sourceLocale } : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  const json = await response.json();
  const translations = json?.data?.translations || [];

  return maskedEntries.map((entry, index) => {
    const translation = translations[index] || {};
    const restored = restorePlaceholders(
      decodeHtmlEntities(translation.translatedText || entry.maskedText),
      entry.placeholders,
    );

    return {
      cacheKey: entry.cacheKey,
      translatedText: restored || entry.text,
      detectedSourceLocale: translation.detectedSourceLanguage || sourceLocale || defaultLocale,
    };
  });
}

export async function getRequestLocale() {
  return getRequestLocaleFromCookies();
}

export async function translateContentItems(locale, items = [], options = {}) {
  const safeLocale = resolveLocale(locale);
  const googleApiKey = getGoogleTranslateApiKey();
  const preparedItems = (items || []).map((item) => ({
    ...item,
    text: typeof item?.text === "string" ? item.text : "",
    format: detectFormat(item?.text, item?.format),
  }));

  if (safeLocale === defaultLocale || !preparedItems.length) {
    return preparedItems.map((item) => ({
      ...item,
      displayText: item.text,
      translatedText: item.text,
      detectedSourceLocale: options.sourceLocale || defaultLocale,
      isTranslated: false,
      sourceHash: createSourceHash(item.text, item.format),
    }));
  }

  const cachedRows = await fetchCachedTranslations({ locale: safeLocale, items: preparedItems });
  const resultsByKey = new Map();
  const missingItems = [];

  for (const item of preparedItems) {
    const sourceHash = createSourceHash(item.text, item.format);
    const cached = cachedRows.get(item.cacheKey);

    if (
      cached &&
      cached.source_hash === sourceHash &&
      typeof cached.translated_text === "string" &&
      cached.translated_text.trim()
    ) {
      resultsByKey.set(item.cacheKey, {
        ...item,
        displayText: cached.translated_text,
        translatedText: cached.translated_text,
        detectedSourceLocale: cached.detected_source_locale || options.sourceLocale || defaultLocale,
        isTranslated: cached.translated_text !== item.text,
        sourceHash,
      });
    } else {
      missingItems.push({ ...item, sourceHash });
    }
  }

  if (missingItems.length) {
    if (!googleApiKey) {
      for (const sourceItem of missingItems) {
        resultsByKey.set(sourceItem.cacheKey, {
          ...sourceItem,
          displayText: sourceItem.text,
          translatedText: sourceItem.text,
          detectedSourceLocale: options.sourceLocale || defaultLocale,
          isTranslated: false,
          sourceHash: sourceItem.sourceHash,
        });
      }

      return preparedItems.map((item) => {
        const result = resultsByKey.get(item.cacheKey);

        return result || {
          ...item,
          displayText: item.text,
          translatedText: item.text,
          detectedSourceLocale: options.sourceLocale || defaultLocale,
          isTranslated: false,
          sourceHash: createSourceHash(item.text, item.format),
        };
      });
    }

    const translatedRows = [];

    for (const format of ["text", "html"]) {
      const formatItems = missingItems.filter((item) => item.format === format && item.text.trim());

      for (const batch of chunkArray(formatItems)) {
        try {
          const translatedBatch = await translateBatchWithGoogle({
            entries: batch,
            locale: safeLocale,
            sourceLocale: options.sourceLocale || "",
            format,
          });

          for (const translated of translatedBatch) {
            const sourceItem = batch.find((item) => item.cacheKey === translated.cacheKey);
            if (!sourceItem) continue;

            const displayText = translated.translatedText || sourceItem.text;
            resultsByKey.set(sourceItem.cacheKey, {
              ...sourceItem,
              displayText,
              translatedText: displayText,
              detectedSourceLocale: translated.detectedSourceLocale || options.sourceLocale || defaultLocale,
              isTranslated: displayText !== sourceItem.text,
              sourceHash: sourceItem.sourceHash,
            });

            translatedRows.push({
              cache_key: sourceItem.cacheKey,
              content_type: sourceItem.contentType || "content",
              field_name: sourceItem.fieldName || "",
              target_locale: safeLocale,
              source_hash: sourceItem.sourceHash,
              source_text: sourceItem.text,
              translated_text: displayText,
              detected_source_locale: translated.detectedSourceLocale || options.sourceLocale || defaultLocale,
              format: sourceItem.format,
              provider: "google_cloud_translation",
              updated_at: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Google translation request failed:", normalizeError(error));
          for (const sourceItem of batch) {
            resultsByKey.set(sourceItem.cacheKey, {
              ...sourceItem,
              displayText: sourceItem.text,
              translatedText: sourceItem.text,
              detectedSourceLocale: options.sourceLocale || defaultLocale,
              isTranslated: false,
              sourceHash: sourceItem.sourceHash,
            });
          }
        }
      }
    }

    await persistTranslations(translatedRows);

    for (const sourceItem of missingItems.filter((item) => !item.text.trim())) {
      resultsByKey.set(sourceItem.cacheKey, {
        ...sourceItem,
        displayText: sourceItem.text,
        translatedText: sourceItem.text,
        detectedSourceLocale: options.sourceLocale || defaultLocale,
        isTranslated: false,
        sourceHash: sourceItem.sourceHash,
      });
    }
  }

  return preparedItems.map((item) => {
    const result = resultsByKey.get(item.cacheKey);

    return result || {
      ...item,
      displayText: item.text,
      translatedText: item.text,
      detectedSourceLocale: options.sourceLocale || defaultLocale,
      isTranslated: false,
      sourceHash: createSourceHash(item.text, item.format),
    };
  });
}

export const getTranslatedMessages = cache(async (locale) => {
  const safeLocale = resolveLocale(locale);
  const sourceMessages = await loadSourceMessages();

  if (safeLocale === defaultLocale) {
    return sourceMessages;
  }

  if (!getGoogleTranslateApiKey()) {
    const fallbackMessages = await loadFallbackMessages(safeLocale);
    return Object.keys(fallbackMessages || {}).length ? fallbackMessages : sourceMessages;
  }

  const flatSourceMessages = flattenObject(sourceMessages);
  const fallbackMessages = flattenObject(await loadFallbackMessages(safeLocale));
  const translatableItems = Object.entries(flatSourceMessages)
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => ({
      cacheKey: `message:${key}`,
      contentType: "message",
      fieldName: key,
      text: value,
      format: "text",
    }));

  const translatedItems = await translateContentItems(safeLocale, translatableItems, {
    sourceLocale: defaultLocale,
  });

  const translatedByKey = new Map(
    translatedItems.map((item) => [item.fieldName, item.displayText]),
  );
  const finalFlatMessages = {};

  for (const [key, value] of Object.entries(flatSourceMessages)) {
    if (typeof value !== "string") {
      finalFlatMessages[key] = value;
      continue;
    }

    const translatedValue = translatedByKey.get(key);
    finalFlatMessages[key] =
      (translatedValue && translatedValue !== value ? translatedValue : "") ||
      fallbackMessages[key] ||
      translatedValue ||
      value;
  }

  return unflattenObject(finalFlatMessages);
});
