import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAssistantDocumentChunks,
  buildCommentAssistantPayload,
  buildCommunityApplicationAssistantPayload,
  buildContentItemAssistantPayload,
  buildExternalDocumentCatalogMetadata,
  buildEventAssistantPayload,
  buildExternalDocumentAssistantPayload,
  buildProfileAssistantPayload,
  buildThreadAssistantPayload,
  shouldSyncExternalFile,
  summarizeExternalSyncErrors,
  upsertAssistantDocument,
} from "./assistant-indexing.js";

function createDocumentEmbeddingsSupabaseStub() {
  const state = {
    deleteCalls: 0,
    deleteFilters: [],
    insertBatches: [],
  };

  return {
    client: {
      from(table) {
        assert.equal(table, "document_embeddings");

        return {
          delete() {
            const filters = [];
            const chain = {
              eq(column, value) {
                filters.push([column, value]);

                if (filters.length >= 2) {
                  state.deleteCalls += 1;
                  state.deleteFilters.push(filters.slice());
                  return Promise.resolve({ error: null });
                }

                return chain;
              },
            };

            return chain;
          },
          insert(rows) {
            state.insertBatches.push(rows);
            return Promise.resolve({ error: null });
          },
        };
      },
    },
    state,
  };
}

async function withSupabaseFunctionEnv(run) {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  try {
    return await run();
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
}

test("buildEventAssistantPayload maps restricted events to admin-only visibility", () => {
  const payload = buildEventAssistantPayload({
    id: "event_1",
    title: "Restricted PATNA event",
    summary: "Members-only briefing",
    body: "<p>Important update</p>",
    event_type: "Briefing",
    location: "Lagos",
    starts_at: "2026-04-20T00:00:00.000Z",
    ends_at: null,
    display_date: "",
    visibility: "restricted",
    status: "published",
    schedule_status: "upcoming",
    themes: ["GHG"],
  });

  assert.equal(payload.visibility, "admin_only");
  assert.equal(payload.metadata.path, "/admin/events/event_1");
  assert.match(payload.content_text, /Important update/);
});

test("buildContentItemAssistantPayload skips drafts and maps restricted publications to admin-only", () => {
  assert.equal(
    buildContentItemAssistantPayload({
      id: "draft_1",
      title: "Draft",
      publish_status: "draft",
      visibility: "members",
    }),
    null,
  );

  const payload = buildContentItemAssistantPayload({
    id: "content_1",
    title: "Restricted brief",
    slug: "restricted-brief",
    summary: "Internal PATNA brief",
    body: "<p>Internal only</p>",
    content_type: "brief",
    visibility: "restricted",
    publish_status: "published",
    published_at: "2026-04-01T00:00:00.000Z",
  });

  assert.equal(payload.visibility, "admin_only");
  assert.equal(payload.metadata.path, "/admin/insights/content_1");
});

test("buildThreadAssistantPayload and buildCommentAssistantPayload preserve space paths", () => {
  const threadPayload = buildThreadAssistantPayload({
    id: "thread_1",
    space_id: "space_1",
    title: "Levy coordination",
    body: "<p>Discussion body</p>",
    updated_at: "2026-04-10T10:00:00.000Z",
    spaces: { name: "Policy Cohort", slug: "policy-cohort" },
  });

  const commentPayload = buildCommentAssistantPayload({
    id: "comment_1",
    body: "<p>Reply body</p>",
    updated_at: "2026-04-10T10:10:00.000Z",
    thread: {
      id: "thread_1",
      title: "Levy coordination",
      space_id: "space_1",
      space_name: "Policy Cohort",
      space_slug: "policy-cohort",
    },
  });

  assert.equal(threadPayload.metadata.path, "/app/spaces/policy-cohort/threads/thread_1");
  assert.equal(commentPayload.metadata.path, "/app/spaces/policy-cohort/threads/thread_1#replies");
  assert.match(commentPayload.content_text, /Reply in Levy coordination/);
});

test("buildProfileAssistantPayload drops hidden profiles and strips sensitive contact fields", () => {
  const hiddenPayload = buildProfileAssistantPayload({
    profile: {
      id: "profile_hidden",
      visibility_setting: "hidden",
      onboarding_status: "active",
      profile_status: "active",
    },
  });

  assert.equal(hiddenPayload, null);

  const visiblePayload = buildProfileAssistantPayload({
    profile: {
      id: "profile_1",
      first_name: "Ada",
      surname: "Lovelace",
      role_title: "Policy Lead",
      organisation_name: "PATNA",
      country_of_residence: "Nigeria",
      professional_bio: "Works on <strong>SIDS</strong> policy.",
      visibility_setting: "members_only",
      onboarding_status: "active",
      profile_status: "active",
      availability_status: "available",
    },
    cohortProfile: {
      focus_area: "Small island developing states",
      domain_knowledge: "GHG levy and negotiation strategy",
    },
    primaryCohort: { name: "Policy Cohort" },
    tags: [{ name: "SIDS" }, { name: "GHG" }],
  });

  assert.equal(visiblePayload.visibility, "members");
  assert.equal(visiblePayload.metadata.path, "/app/members");
  assert.doesNotMatch(visiblePayload.content_text, /@/);
  assert.match(visiblePayload.content_text, /SIDS/);
});

test("buildCommunityApplicationAssistantPayload stays admin-only", () => {
  const payload = buildCommunityApplicationAssistantPayload({
    application: {
      id: "app_1",
      first_name: "Grace",
      surname: "Hopper",
      status: "submitted",
      organisation: "IMO",
      role_title: "Advisor",
      country: "Liberia",
      motivation_text: "Interested in PATNA collaboration.",
      expertise_slugs: ["policy", "finance"],
      engagement_slugs: ["membership"],
      submitted_at: "2026-04-09T09:00:00.000Z",
    },
    assignedCohortName: "Policy Cohort",
  });

  assert.equal(payload.visibility, "admin_only");
  assert.equal(payload.metadata.path, "/admin/applications");
  assert.match(payload.content_text, /Policy Cohort/);
});

test("buildExternalDocumentAssistantPayload includes its parent source id in metadata", () => {
  const payload = buildExternalDocumentAssistantPayload({
    externalDoc: {
      id: "doc_1",
      document_code_display: "MEPC 84/6",
      document_code_normalized: "MEPC 84/6",
      indexed_chunk_count: 3,
      meeting_body: "MEPC",
      meeting_session: 84,
      mime_type: "application/pdf",
      modified_at: "2026-04-12T00:00:00.000Z",
      source_url: "https://drive.google.com/file/d/doc_1/view",
      title: "Energy Efficiency of Ships",
    },
    source: {
      id: "drive_1",
      provider: "google_drive",
      title: "IMO MEPC Submissions",
      visibility: "members",
    },
    contentText: "Energy Efficiency of Ships appears later in this submission.",
  });

  assert.equal(payload.metadata.external_source_id, "drive_1");
  assert.equal(payload.metadata.source_title, "IMO MEPC Submissions");
  assert.equal(payload.metadata.document_code_display, "MEPC 84/6");
  assert.equal(payload.metadata.meeting_body, "MEPC");
  assert.equal(payload.metadata.meeting_session, 84);
  assert.equal(payload.metadata.indexed_chunk_count, 3);
});

test("buildExternalDocumentCatalogMetadata extracts normalized catalog fields", () => {
  const metadata = buildExternalDocumentCatalogMetadata({
    title: "MEPC 84/6 Energy Efficiency of Ships",
    contentText: [
      "MEPC 84/6 Energy Efficiency of Ships",
      "Submitted by China, ICS and BIMCO.",
      "This paper discusses EEXI, CII and SEEMP implementation support.",
    ].join("\n"),
  });

  assert.equal(metadata.document_code_display, "MEPC 84/6");
  assert.equal(metadata.document_code_normalized, "MEPC 84/6");
  assert.equal(metadata.meeting_body, "MEPC");
  assert.equal(metadata.meeting_session, 84);
  assert.deepEqual(metadata.submitter_entities, ["China", "ICS", "BIMCO"]);
  assert.deepEqual(metadata.country_entities, ["China"]);
  assert.deepEqual(metadata.organization_entities, ["ICS", "BIMCO"]);
  assert.equal(metadata.topic_tags.includes("energy-efficiency"), true);
  assert.equal(metadata.indexed_chunk_count > 0, true);
});

test("buildAssistantDocumentChunks preserves later phrases beyond the opening chunk", () => {
  const laterPhrase = "Energy Efficiency of Ships";
  const chunks = buildAssistantDocumentChunks({
    contentText: `${"intro ".repeat(320)}${"middle ".repeat(120)}${laterPhrase}`,
    metadata: {
      source_family: "Google Drive Document",
      source_title: "IMO MEPC Submissions",
      title: "MEPC 84 agenda item",
    },
  });

  assert.ok(chunks.length > 1);
  assert.equal(chunks[0].includes(laterPhrase), false);
  assert.ok(chunks.slice(1).some((chunk) => chunk.includes(laterPhrase)));
});

test("summarizeExternalSyncErrors groups repeated root causes for drive syncs", () => {
  const summary = summarizeExternalSyncErrors([
    { title: "A.pdf", reason: 'embed-document failed: {"code":"NOT_FOUND","message":"Requested function was not found"}' },
    { title: "B.pdf", reason: 'embed-document failed: {"code":"NOT_FOUND","message":"Requested function was not found"}' },
    { title: "C.pdf", reason: "PDF produced no extractable text." },
    { title: "D.pdf", reason: 'embed-document failed: {"error":"Unsupported source_type"}' },
  ]);

  assert.deepEqual(
    summary.map(({ kind, count }) => ({ kind, count })),
    [
      { kind: "embedding_function_missing", count: 2 },
      { kind: "text_extraction_failed", count: 1 },
      { kind: "embedding_payload_rejected", count: 1 },
    ],
  );
});

test("summarizeExternalSyncErrors classifies missing Drive env separately", () => {
  const summary = summarizeExternalSyncErrors([
    { title: "Sync", reason: "GOOGLE_DRIVE_API_KEY is not configured." },
  ]);

  assert.deepEqual(summary, [
    {
      kind: "drive_env_missing",
      label: "Drive API key missing",
      count: 1,
      detail: "GOOGLE_DRIVE_API_KEY is not configured.",
    },
  ]);
});

test("summarizeExternalSyncErrors separates worker resource limits from transient upstream failures", () => {
  const summary = summarizeExternalSyncErrors([
    {
      title: "A.pdf",
      reason: 'embed-document failed (500): {"code":"WORKER_RESOURCE_LIMIT","message":"Function failed due to not having enough compute resources"}',
    },
    {
      title: "B.pdf",
      reason: "embed-document failed (502): <html><body>502 Bad Gateway</body></html>",
    },
  ]);

  assert.deepEqual(
    summary.map(({ kind, count }) => ({ kind, count })),
    [
      { kind: "embedding_resource_limited", count: 1 },
      { kind: "embedding_transient_failure", count: 1 },
    ],
  );
});

test("shouldSyncExternalFile retries unchanged files that previously failed", () => {
  const driveFile = { md5Checksum: "abc", modifiedTime: "2026-04-12T00:00:00.000Z" };

  assert.equal(
    shouldSyncExternalFile(driveFile, {
      checksum_or_version: "abc",
      status: "error",
    }),
    true,
  );

  assert.equal(
    shouldSyncExternalFile(driveFile, {
      checksum_or_version: "abc",
      status: "indexed",
    }),
    false,
  );

  assert.equal(
    shouldSyncExternalFile(driveFile, {
      checksum_or_version: "abc",
      status: "indexed",
    }, { force: true }),
    true,
  );
});

test("upsertAssistantDocument retries transient embed failures and stores chunk rows after success", async () => {
  const { client, state } = createDocumentEmbeddingsSupabaseStub();
  let fetchAttempts = 0;

  await withSupabaseFunctionEnv(async () => {
    await upsertAssistantDocument({
      adminSupabase: client,
      payload: {
        source_type: "external_document",
        source_id: "doc_1",
        space_id: null,
        visibility: "members",
        content_text: "A short submission body for indexing.",
        metadata: {
          title: "MEPC short note",
          source_family: "Google Drive Document",
          source_title: "IMO MEPC Submissions",
        },
      },
      fetchImpl: async (_url, init) => {
        fetchAttempts += 1;

        if (fetchAttempts === 1) {
          return {
            ok: false,
            status: 502,
            statusText: "Bad Gateway",
            text: async () => "<html><body>502 Bad Gateway</body></html>",
          };
        }

        const { chunks } = JSON.parse(init.body);

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            ok: true,
            embeddings: chunks.map((_, index) => [index + 0.25]),
          }),
        };
      },
      sleepImpl: async () => {},
    });
  });

  assert.equal(fetchAttempts, 2);
  assert.equal(state.deleteCalls, 1);
  assert.equal(state.insertBatches.length, 1);
  assert.equal(state.insertBatches[0][0].chunk_index, 0);
  assert.equal(state.insertBatches[0][0].metadata.chunk_total, 1);
});

test("upsertAssistantDocument falls back to smaller chunk batches after worker resource failures", async () => {
  const { client, state } = createDocumentEmbeddingsSupabaseStub();
  let fetchAttempts = 0;

  await withSupabaseFunctionEnv(async () => {
    await upsertAssistantDocument({
      adminSupabase: client,
      payload: {
        source_type: "external_document",
        source_id: "doc_1_split",
        space_id: null,
        visibility: "members",
        content_text: `${"long section ".repeat(220)}Energy Efficiency of Ships${" follow-up ".repeat(220)}`,
        metadata: {
          title: "MEPC long note",
          source_family: "Google Drive Document",
          source_title: "IMO MEPC Submissions",
        },
      },
      fetchImpl: async (_url, init) => {
        fetchAttempts += 1;
        const { chunks } = JSON.parse(init.body);

        if (chunks.length > 2) {
          return {
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            text: async () => JSON.stringify({
              code: "WORKER_RESOURCE_LIMIT",
              message: "Function failed due to not having enough compute resources",
            }),
          };
        }

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            ok: true,
            embeddings: chunks.map(() => [0.75]),
          }),
        };
      },
      sleepImpl: async () => {},
    });
  });

  assert.equal(fetchAttempts, 5);
  assert.equal(state.deleteCalls, 1);
  assert.equal(state.insertBatches.length, 1);
  assert.equal(state.insertBatches[0].length, 4);
});

test("upsertAssistantDocument does not delete existing chunks when embedding never succeeds", async () => {
  const { client, state } = createDocumentEmbeddingsSupabaseStub();
  let fetchAttempts = 0;

  await withSupabaseFunctionEnv(async () => {
    await assert.rejects(
      () => upsertAssistantDocument({
        adminSupabase: client,
        payload: {
          source_type: "external_document",
          source_id: "doc_2",
          space_id: null,
          visibility: "members",
          content_text: "This submission should keep old chunks because embedding keeps failing.",
          metadata: {
            title: "MEPC failed note",
            source_family: "Google Drive Document",
            source_title: "IMO MEPC Submissions",
          },
        },
        fetchImpl: async () => {
          fetchAttempts += 1;
          return {
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            text: async () => JSON.stringify({
              code: "WORKER_RESOURCE_LIMIT",
              message: "Function failed due to not having enough compute resources",
            }),
          };
        },
        sleepImpl: async () => {},
      }),
      /WORKER_RESOURCE_LIMIT/i,
    );
  });

  assert.equal(fetchAttempts, 3);
  assert.equal(state.deleteCalls, 0);
  assert.equal(state.insertBatches.length, 0);
});
