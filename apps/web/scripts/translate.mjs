/**
 * Auto-translation script for PATNA
 *
 * Reads messages/en.json (source of truth) and auto-translates all strings
 * to fr, pt, and ar using the Google Cloud Translation API v2.
 *
 * SETUP:
 *   1. Get a Google Cloud Translation API key from https://console.cloud.google.com/
 *      (enable "Cloud Translation API" on the project)
 *   2. Add GOOGLE_TRANSLATE_API_KEY=your_key to .env.local
 *
 * WORKFLOW:
 *   1. Add new strings to messages/en.json
 *   2. Run: pnpm translate
 *   3. All other language files are updated automatically
 *
 * Only MISSING keys are translated (existing translations are preserved so
 * you can manually override auto-translations without them being overwritten).
 *
 * To force re-translate a key: delete it from the target language file,
 * then run pnpm translate again.
 */

import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

// Load .env.local so the script can run standalone outside Next.js
async function loadEnv() {
  try {
    const raw = await readFile(resolve(__dir, "../.env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // .env.local not found — rely on process.env set externally
  }
}

const TARGETS = ["fr", "pt", "ar"];
const SOURCE = "en";

async function googleTranslate(text, from, to) {
  if (!text || typeof text !== "string" || !text.trim()) return text;

  const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY is not set");
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: from, target: to, format: "text" }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data.translations[0].translatedText;
  } catch (err) {
    console.warn(`  ⚠ Could not translate "${text.slice(0, 40)}…": ${err.message}`);
    return text; // fall back to English on error
  }
}

// ── Flatten nested object → { "a.b.c": "value" } ────────────────────────────
function flatten(obj, prefix = "") {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      Object.assign(acc, flatten(val, fullKey));
    } else {
      acc[fullKey] = val;
    }
    return acc;
  }, {});
}

// ── Unflatten { "a.b.c": "value" } → nested object ──────────────────────────
function unflatten(flat) {
  const result = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split(".");
    let curr = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof curr[parts[i]] !== "object") curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = val;
  }
  return result;
}

// ── Sleep helper for rate-limiting ──────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await loadEnv();

  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    console.error("❌ GOOGLE_TRANSLATE_API_KEY is not set in .env.local");
    console.error("   Get a key at https://console.cloud.google.com/ (enable Cloud Translation API)");
    process.exit(1);
  }

  const enPath = resolve(ROOT, "messages", "en.json");
  const en = JSON.parse(await readFile(enPath, "utf-8"));
  const flatEn = flatten(en);

  console.log(`\n📖 Loaded ${Object.keys(flatEn).length} strings from en.json\n`);

  for (const target of TARGETS) {
    console.log(`🌐 Translating to [${target}]...`);

    const targetPath = resolve(ROOT, "messages", `${target}.json`);

    // Load existing translations (preserves manual overrides)
    let existing = {};
    try {
      existing = JSON.parse(await readFile(targetPath, "utf-8"));
    } catch {
      console.log(`  Creating new ${target}.json`);
    }
    const flatExisting = flatten(existing);

    const translated = { ...flatExisting };
    const missing = Object.keys(flatEn).filter((k) => !(k in flatExisting));

    if (missing.length === 0) {
      console.log(`  ✓ Already up to date (${Object.keys(flatEn).length} keys)\n`);
      continue;
    }

    console.log(`  Translating ${missing.length} new/missing keys...`);

    let count = 0;
    for (const key of missing) {
      const original = flatEn[key];
      process.stdout.write(`  [${++count}/${missing.length}] ${key} ... `);
      translated[key] = await googleTranslate(original, SOURCE, target);
      console.log(`✓`);
      await sleep(150); // gentle rate-limit — ~6 requests/second
    }

    // Write back, preserving key order from en.json
    const ordered = {};
    for (const key of Object.keys(flatEn)) {
      ordered[key] = translated[key] ?? flatEn[key];
    }

    await writeFile(targetPath, JSON.stringify(unflatten(ordered), null, 2) + "\n");
    console.log(`  ✓ Wrote messages/${target}.json\n`);
  }

  console.log("✅ Translation complete.\n");
  console.log(
    "Tip: To re-translate a specific key, delete it from the target .json file and re-run pnpm translate."
  );
}

main().catch((err) => {
  console.error("❌ Translation failed:", err);
  process.exit(1);
});
