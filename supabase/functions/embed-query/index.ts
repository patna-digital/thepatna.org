// embed-query Edge Function
// Generates a 384-dim gte-small embedding for a query string.
// Called from the Next.js API route at inference time — no DB writes.
//
// Expected request body: { text: string }
// Response:              { embedding: number[] }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { text: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text } = body;
  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Truncate to model token limit
  const truncatedText = text.slice(0, 2000);

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

  return new Response(JSON.stringify({ embedding }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
