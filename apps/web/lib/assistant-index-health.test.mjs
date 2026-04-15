import test from "node:test";
import assert from "node:assert/strict";

import {
  checkEmbedDocumentFunction,
  classifyEmbedDocumentResponse,
  isMissingAssistantRpcError,
  isMissingDocumentEmbeddingsError,
} from "./assistant-index-health.js";

test("isMissingDocumentEmbeddingsError detects missing schema-cache relation errors", () => {
  assert.equal(
    isMissingDocumentEmbeddingsError({
      code: "PGRST205",
      message: "Could not find the table 'public.document_embeddings' in the schema cache",
    }),
    true,
  );
});

test("isMissingAssistantRpcError detects missing assistant RPC errors", () => {
  assert.equal(
    isMissingAssistantRpcError({
      code: "PGRST202",
      message: "Could not find the function public.match_assistant_documents",
    }),
    true,
  );
});

test("classifyEmbedDocumentResponse marks missing functions as missing", () => {
  const result = classifyEmbedDocumentResponse({ status: 404 }, "");
  assert.equal(result.ok, false);
  assert.equal(result.status, "missing");
  assert.match(result.error.message, /not found/i);
});

test("classifyEmbedDocumentResponse treats 405 as an unhealthy contract mismatch", () => {
  const result = classifyEmbedDocumentResponse({ status: 405 }, "");
  assert.equal(result.ok, false);
  assert.equal(result.status, "error");
  assert.match(result.error.message, /method contract/i);
});

test("checkEmbedDocumentFunction uses a POST healthcheck and reports ready on success", async () => {
  let captured = null;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const result = await checkEmbedDocumentFunction({
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return {
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      };
    },
  });

  try {
    assert.equal(result.ok, true);
    assert.equal(result.status, "ready");
    assert.equal(captured.init.method, "POST");
    assert.equal(captured.init.headers["Content-Type"], "application/json");
    assert.equal(captured.init.body, JSON.stringify({ healthcheck: true }));
  } finally {
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }

    if (originalKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    }
  }
});
