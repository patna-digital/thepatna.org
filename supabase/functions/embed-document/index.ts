// embed-document Edge Function
// Receives one prepared chunk or a small batch of prepared chunks and returns
// 384-dim gte-small embeddings via Supabase's built-in AI inference.
//
// Expected request body:
// {
//   content_text?: string
//   chunks?: string[]
// }
//
// Response body:
// {
//   ok: true,
//   embeddings: number[][]
// }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: {
    content_text?: string;
    chunks?: string[];
    healthcheck?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body?.healthcheck === true) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const chunks = Array.isArray(body?.chunks)
    ? body.chunks
    : typeof body?.content_text === "string"
      ? [body.content_text]
      : [];
  const preparedChunks = chunks
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!preparedChunks.length) {
    return new Response(
      JSON.stringify({ error: "content_text or chunks[] is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Generate embedding using Supabase's built-in gte-small model (384 dims, no API key needed)
  // @ts-ignore — Supabase.ai is injected at runtime in Edge Function environment
  const session = new Supabase.ai.Session("gte-small");
  const embeddings = [];

  for (const chunkText of preparedChunks) {
    let embedding: number[];
    try {
      embedding = await session.run(chunkText, {
        mean_pool: true,
        normalize: true,
      }) as number[];
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Embedding generation failed", detail: String(err) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    embeddings.push(embedding);
  }

  return new Response(JSON.stringify({ ok: true, embeddings }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
