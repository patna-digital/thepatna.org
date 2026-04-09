/**
 * PATNA Assistant — Embedding Backfill Script
 *
 * One-time script to embed all existing community content into the
 * document_embeddings table for RAG retrieval.
 *
 * Content embedded:
 *   - threads       → space-scoped (visibility: space_members)
 *   - content_items → globally scoped (visibility: members)
 *   - events        → globally scoped (visibility: members or public)
 *
 * SETUP:
 *   1. Ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      and SUPABASE_PROJECT_ID are in .env.local
 *   2. Deploy the embed-document Edge Function first:
 *      supabase functions deploy embed-document
 *   3. Run: node scripts/backfill-embeddings.mjs
 *
 * The script is idempotent — re-running it upserts rather than duplicates.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EMBED_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/embed-document`;
const BATCH_DELAY_MS = 200; // polite delay between calls

let successCount = 0;
let errorCount = 0;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function embedDocument(payload) {
  const res = await fetch(EMBED_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text, maxLen = 1500) {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

async function processItems(label, items, buildPayload) {
  console.log(`\n▶ ${label}: ${items.length} items`);
  for (const item of items) {
    const payload = buildPayload(item);
    if (!payload.content_text?.trim()) continue;
    try {
      await embedDocument(payload);
      successCount++;
      process.stdout.write(".");
    } catch (err) {
      errorCount++;
      process.stdout.write("✗");
      console.error(`\n  Error embedding ${payload.source_type} ${payload.source_id}:`, err.message);
    }
    await sleep(BATCH_DELAY_MS);
  }
  console.log(""); // newline after dots
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("PATNA Assistant — Embedding Backfill");
  console.log("=====================================");
  console.log(`Target: ${EMBED_FUNCTION_URL}\n`);

  // ── 1. Threads ─────────────────────────────────────────────────────────────
  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .select("id, title, body, space_id");

  if (threadsError) {
    console.error("Failed to fetch threads:", threadsError.message);
  } else {
    await processItems("Threads", threads ?? [], (thread) => ({
      source_type: "thread",
      source_id: thread.id,
      content_text: truncate(`${thread.title}\n\n${thread.body ?? ""}`),
      space_id: thread.space_id,
      visibility: "space_members",
      metadata: { title: thread.title },
    }));
  }

  // ── 2. Published content items (insights/publications) ─────────────────────
  const { data: contentItems, error: contentError } = await supabase
    .from("content_items")
    .select("id, title, summary, body, visibility, content_type")
    .eq("publish_status", "published");

  if (contentError) {
    console.error("Failed to fetch content_items:", contentError.message);
  } else {
    await processItems("Content Items", contentItems ?? [], (item) => ({
      source_type: "content_item",
      source_id: item.id,
      content_text: truncate(`${item.title}\n\n${item.summary ?? ""}\n\n${item.body ?? ""}`),
      space_id: null,
      visibility: item.visibility === "public" ? "public" : "members",
      metadata: { title: item.title, content_type: item.content_type },
    }));
  }

  // ── 3. Published events ────────────────────────────────────────────────────
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, summary, body, visibility, event_type, location")
    .eq("status", "published");

  if (eventsError) {
    console.error("Failed to fetch events:", eventsError.message);
  } else {
    await processItems("Events", events ?? [], (event) => ({
      source_type: "event",
      source_id: event.id,
      content_text: truncate(
        `${event.title}\n${event.location ? `Location: ${event.location}` : ""}\n\n${event.summary ?? ""}\n\n${event.body ?? ""}`
      ),
      space_id: null,
      visibility: event.visibility === "public" ? "public" : "members",
      metadata: {
        title: event.title,
        event_type: event.event_type,
        location: event.location,
      },
    }));
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n=====================================");
  console.log(`Done. Embedded: ${successCount} | Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log("Re-run the script to retry failed items (upsert is idempotent).");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
