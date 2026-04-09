// app/api/assistant/route.js
// PATNA Assistant — streaming chat API endpoint.
//
// POST /api/assistant
// Body: { message: string, history?: Array<{ role: 'user'|'assistant', content: string }> }
// Response: text/plain stream (raw Claude token stream)

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { getAnthropicApiKey } from "@/lib/env";
import {
  embedQuery,
  retrieveRelevantChunks,
  buildSystemPrompt,
  buildContextBlock,
} from "@/lib/assistant";

export async function POST(request) {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const { supabase, user, profile, isAdmin } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: true,
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse request body ─────────────────────────────────────────────────
  let message, history;
  try {
    ({ message, history = [] } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Cap history to last 10 turns to keep prompt size manageable
  const recentHistory = history.slice(-10);

  // ── 3. Fetch user's space memberships ─────────────────────────────────────
  const { data: memberships, error: membershipError } = await supabase
    .from("space_memberships")
    .select("space_id, spaces(id, name, space_type)")
    .eq("user_id", user.id);

  if (membershipError) {
    console.error("space_memberships fetch error:", membershipError);
  }

  const spaces = (memberships ?? [])
    .map((m) => m.spaces)
    .filter(Boolean);

  const spaceIds = spaces.map((s) => s.id);

  // ── 4. Embed query + retrieve relevant chunks ─────────────────────────────
  let chunks = [];
  try {
    const queryEmbedding = await embedQuery(message);
    chunks = await retrieveRelevantChunks(supabase, {
      embedding: queryEmbedding,
      spaceIds,
      isAdmin,
      limit: 8,
    });
  } catch (err) {
    // Non-fatal: answer without RAG context rather than failing entirely
    console.error("RAG retrieval error:", err);
  }

  // ── 5. Build Claude prompt ────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({ profile, spaces, isAdmin });
  const contextBlock = buildContextBlock(chunks);

  // ── 6. Stream Claude response ─────────────────────────────────────────────
  const anthropic = new Anthropic({ apiKey: getAnthropicApiKey() });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt + contextBlock,
          messages: [
            ...recentHistory.map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: message },
          ],
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("Claude streaming error:", err);
        controller.enqueue(
          encoder.encode(
            "\n\n[PATNA Assistant encountered an error. Please try again.]"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
