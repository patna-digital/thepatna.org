/**
 * PATNA Assistant — Full reindex / reconcile script
 *
 * Rebuilds the assistant document index from platform data:
 *   - threads
 *   - comments
 *   - published content items
 *   - published events
 *   - active visible member profiles
 *   - community applications (admin-only)
 *
 * Usage:
 *   node scripts/backfill-embeddings.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import {
  syncCommentAssistantDocument,
  syncCommunityApplicationAssistantDocument,
  syncContentItemAssistantDocument,
  syncEventAssistantDocument,
  syncProfileAssistantDocument,
  syncThreadAssistantDocument,
} from "../lib/assistant-indexing.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_TYPES = [
  "thread",
  "comment",
  "content_item",
  "event",
  "profile",
  "community_application",
];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BATCH_DELAY_MS = 60;
let successCount = 0;
let errorCount = 0;

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function processCollection({ label, rows, sync }) {
  console.log(`\n▶ ${label}: ${rows.length} records`);

  for (const row of rows) {
    try {
      await sync(row.id);
      successCount += 1;
      process.stdout.write(".");
    } catch (error) {
      errorCount += 1;
      process.stdout.write("✗");
      console.error(`\n  ${label} ${row.id}:`, error.message);
    }

    await sleep(BATCH_DELAY_MS);
  }

  console.log("");
}

async function main() {
  console.log("PATNA Assistant — Full reindex");
  console.log("================================");

  const { error: clearError } = await supabase
    .from("document_embeddings")
    .delete()
    .in("source_type", SOURCE_TYPES);

  if (clearError) {
    throw clearError;
  }

  console.log("Cleared existing assistant documents.");

  const [
    threadsResult,
    commentsResult,
    contentItemsResult,
    eventsResult,
    profilesResult,
    applicationsResult,
  ] = await Promise.all([
    supabase.from("threads").select("id"),
    supabase.from("comments").select("id"),
    supabase.from("content_items").select("id"),
    supabase.from("events").select("id"),
    supabase.from("profiles").select("id"),
    supabase.from("community_applications").select("id"),
  ]);

  const firstError =
    threadsResult.error ||
    commentsResult.error ||
    contentItemsResult.error ||
    eventsResult.error ||
    profilesResult.error ||
    applicationsResult.error;

  if (firstError) {
    throw firstError;
  }

  await processCollection({
    label: "Threads",
    rows: threadsResult.data || [],
    sync: (id) => syncThreadAssistantDocument({ adminSupabase: supabase, threadId: id }),
  });

  await processCollection({
    label: "Comments",
    rows: commentsResult.data || [],
    sync: (id) => syncCommentAssistantDocument({ adminSupabase: supabase, commentId: id }),
  });

  await processCollection({
    label: "Content items",
    rows: contentItemsResult.data || [],
    sync: (id) =>
      syncContentItemAssistantDocument({ adminSupabase: supabase, contentItemId: id }),
  });

  await processCollection({
    label: "Events",
    rows: eventsResult.data || [],
    sync: (id) => syncEventAssistantDocument({ adminSupabase: supabase, eventId: id }),
  });

  await processCollection({
    label: "Profiles",
    rows: profilesResult.data || [],
    sync: (id) => syncProfileAssistantDocument({ adminSupabase: supabase, profileId: id }),
  });

  await processCollection({
    label: "Applications",
    rows: applicationsResult.data || [],
    sync: (id) =>
      syncCommunityApplicationAssistantDocument({ adminSupabase: supabase, applicationId: id }),
  });

  console.log("\n================================");
  console.log(`Done. Synced: ${successCount} | Errors: ${errorCount}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal reindex error:", error);
  process.exit(1);
});
