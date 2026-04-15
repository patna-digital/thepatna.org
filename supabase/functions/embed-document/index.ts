// embed-document Edge Function
// Receives a content chunk, generates a 384-dim gte-small embedding via
// Supabase's built-in AI inference, and upserts it into document_embeddings.
//
// Called by:
//   - Database webhooks (threads, content_items, events on INSERT/UPDATE)
//   - The backfill script (apps/web/scripts/backfill-embeddings.js)
//
// Expected request body:
// {
//   source_type:  'thread' | 'comment' | 'content_item' | 'event' | 'profile' | 'community_application'
//   source_id:    uuid string
//   content_text: string (the text to embed)
//   space_id?:    uuid string | null
//   visibility?:  'space_members' | 'members' | 'public' | 'admin_only'
//   metadata?:    object (title, url, author, etc.)
// }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const ALLOWED_SOURCE_TYPES = new Set([
  "thread",
  "comment",
  "content_item",
  "event",
  "profile",
  "community_application",
  "external_document",
]);

const ALLOWED_VISIBILITIES = new Set([
  "space_members",
  "members",
  "public",
  "admin_only",
]);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: {
    source_type: string;
    source_id: string;
    content_text: string;
    space_id?: string | null;
    visibility?: string;
    metadata?: Record<string, unknown>;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { source_type, source_id, content_text, space_id, visibility, metadata } = body;

  if (body?.healthcheck === true) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!source_type || !source_id || !content_text?.trim()) {
    return new Response(
      JSON.stringify({ error: "source_type, source_id, and content_text are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!ALLOWED_SOURCE_TYPES.has(source_type)) {
    return new Response(JSON.stringify({ error: "Unsupported source_type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (visibility && !ALLOWED_VISIBILITIES.has(visibility)) {
    return new Response(JSON.stringify({ error: "Unsupported visibility" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Truncate to avoid exceeding model's token limit (~512 tokens ≈ ~2000 chars)
  const truncatedText = content_text.slice(0, 2000);

  // Generate embedding using Supabase's built-in gte-small model (384 dims, no API key needed)
  // @ts-ignore — Supabase.ai is injected at runtime in Edge Function environment
  const session = new Supabase.ai.Session("gte-small");
  let embedding: number[];
  try {
    embedding = await session.run(truncatedText, {
      mean_pool: true,
      normalize: true,
    }) as number[];
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Embedding generation failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabase.from("document_embeddings").upsert(
    {
      source_type,
      source_id,
      space_id: space_id ?? null,
      visibility: visibility ?? "space_members",
      content_text: truncatedText,
      embedding: JSON.stringify(embedding),
      metadata: metadata ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "source_type,source_id" }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
