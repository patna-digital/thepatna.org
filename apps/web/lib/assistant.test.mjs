import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAccessContext,
  buildAssistantQueryPlan,
  buildContextBlock,
  buildEvidenceBundles,
  buildSuggestedPrompts,
  buildSystemPrompt,
  buildWelcomeMessage,
  detectAssistantIntent,
  extractDocumentReference,
  extractLexicalSearchInput,
  extractMeetingReference,
  resolveSelectedAssistantScopes,
} from "./assistant.js";

test("buildAccessContext exposes selectable scopes and blocked scopes consistently", () => {
  const accessContext = buildAccessContext({
    canReadAdminContent: false,
    canReadMemberContent: true,
    externalSources: [
      { id: "drive_1", indexedCount: 100, title: "IMO MEPC Submissions", visibility: "members" },
    ],
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  });

  assert.equal(accessContext.scopes[0].id, "space:space_1");
  assert.equal(accessContext.scopes[0].label, "Policy Cohort");
  assert.equal(accessContext.scopes[1].id, "external_source:drive_1");
  assert.match(accessContext.scopes[1].detail, /100 indexed/);
  assert.equal(
    accessContext.scopes.some((item) => item.label === "Events & Calendar"),
    true,
  );
  assert.equal(
    accessContext.blocked.some((item) => item.name === "Admin / Applications"),
    true,
  );
});

test("buildSuggestedPrompts adds admin prompt only for admin sessions", () => {
  const memberPrompts = buildSuggestedPrompts({
    canReadAdminContent: false,
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  });
  const adminPrompts = buildSuggestedPrompts({
    canReadAdminContent: true,
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  });

  assert.equal(
    memberPrompts.includes("Show me applications awaiting review"),
    false,
  );
  assert.equal(
    adminPrompts.includes("Show me applications awaiting my review"),
    true,
  );
});

test("detectAssistantIntent routes structured event and admin queue queries", () => {
  const eventsIntent = detectAssistantIntent("what events are coming up next?");
  const applicationsIntent = detectAssistantIntent("show me pending applications awaiting review");

  assert.equal(eventsIntent.wantsEvents, true);
  assert.equal(eventsIntent.shouldUseStructured, true);
  assert.equal(applicationsIntent.wantsApplications, true);
  assert.equal(applicationsIntent.wantsStatus, true);
});

test("buildContextBlock groups structured and semantic evidence with paths", () => {
  const block = buildContextBlock([
    {
      id: "external_document:3:lexical",
      origin: "lexical",
      sourceType: "external_document",
      sourceFamily: "Google Drive Document",
      sourceId: "3",
      title: "Energy Efficiency of Ships submission",
      path: "/app/documents/3",
      summary: "Exact phrase match from the uploaded submission.",
      detailLines: ["Source: IMO MEPC Submissions"],
      lexicalRank: 8,
    },
    {
      id: "event:1:structured",
      origin: "structured",
      sourceType: "event",
      sourceFamily: "Event",
      sourceId: "1",
      title: "Upcoming PATNA events",
      path: "/app/events",
      summary: "2 events matched this request.",
      detailLines: ["ISWG-GHG 21 | 20 April 2026 | London"],
    },
    {
      id: "thread:2:semantic",
      origin: "semantic",
      sourceType: "thread",
      sourceFamily: "Discussion",
      sourceId: "2",
      title: "GHG levy coordination thread",
      path: "/app/spaces/policy/threads/2",
      summary: "Members discussed levy positioning.",
      detailLines: [],
      similarity: 0.88,
    },
  ]);

  assert.match(block, /LEXICAL EVIDENCE/);
  assert.match(block, /STRUCTURED EVIDENCE/);
  assert.match(block, /SEMANTIC EVIDENCE/);
  assert.match(block, /Link: \[Open document\]\(\/app\/documents\/3\)/);
  assert.match(block, /Link: \[Open event\]\(\/app\/events\)/);
  assert.match(block, /Link: \[Open discussion\]\(\/app\/spaces\/policy\/threads\/2\)/);
});

test("resolveSelectedAssistantScopes narrows retrieval to checked items", () => {
  const accessScope = {
    canReadAdminContent: true,
    canReadMemberContent: true,
    externalSources: [{ id: "drive_1", indexedCount: 100, title: "IMO MEPC Submissions", visibility: "members" }],
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  };

  const activeScope = resolveSelectedAssistantScopes({
    accessScope,
    selectedScopeIds: ["space:space_1", "external_source:drive_1", "source:insights"],
  });

  assert.deepEqual(activeScope.selectedSpaceIds, ["space_1"]);
  assert.deepEqual(activeScope.selectedExternalSourceIds, ["drive_1"]);
  assert.equal(activeScope.enabledSourceTypes.has("content_item"), true);
  assert.equal(activeScope.enabledSourceTypes.has("event"), false);
});

test("extractLexicalSearchInput captures focused uploaded-document phrases", () => {
  const searchInput = extractLexicalSearchInput(
    "What are the emerging themes across IMO MEPC submissions related to Energy Efficiency of Ships that should be seen as high priority?",
  );

  assert.equal(searchInput.phrase, "Energy Efficiency of Ships");
  assert.equal(searchInput.terms.includes("energy"), true);
  assert.equal(searchInput.terms.includes("efficiency"), true);
  assert.equal(searchInput.terms.includes("ships"), true);
});

test("document and meeting reference extractors normalize MEPC references", () => {
  assert.equal(
    extractDocumentReference("Summarise document MEPC 84/6 and compare it with newer papers."),
    "MEPC 84/6",
  );
  assert.deepEqual(
    extractMeetingReference("Which submissions from MEPC 84 do you have indexed?"),
    {
      display: "MEPC 84",
      meetingBody: "MEPC",
      meetingSession: 84,
    },
  );
});

test("buildAssistantQueryPlan prefers exact document lookup plus supporting retrieval", () => {
  const accessScope = {
    canReadAdminContent: false,
    canReadMemberContent: true,
    externalSources: [{ id: "drive_1", indexedCount: 34, title: "IMO MEPC Submissions", visibility: "members" }],
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  };
  const activeScope = resolveSelectedAssistantScopes({
    accessScope,
    selectedScopeIds: ["external_source:drive_1", "source:insights"],
  });

  const plan = buildAssistantQueryPlan({
    accessScope,
    activeScope,
    message: "Summarise document MEPC 84/6",
  });

  assert.equal(plan.namedDocumentReference, "MEPC 84/6");
  assert.equal(plan.shouldUseDocumentLookup, true);
  assert.equal(plan.shouldUseSnapshot, true);
  assert.equal(plan.shouldUseSearch, true);
  assert.deepEqual(plan.preferredSourceTypes, ["external_document"]);
  assert.equal(plan.tasks[0].toolName, "get_patna_document");
});

test("buildEvidenceBundles keeps multiple chunk excerpts from the same document", () => {
  const bundles = buildEvidenceBundles([
    {
      id: "external_document:1:lexical:0",
      origin: "lexical",
      sourceType: "external_document",
      sourceFamily: "Google Drive Document",
      sourceId: "1",
      title: "MEPC 84/6",
      path: "/app/documents/1",
      summary: "Opening section on the draft measure.",
      detailLines: [],
      lexicalRank: 8,
      metadata: { chunk_index: 0 },
    },
    {
      id: "external_document:1:semantic:5",
      origin: "semantic",
      sourceType: "external_document",
      sourceFamily: "Google Drive Document",
      sourceId: "1",
      title: "MEPC 84/6",
      path: "/app/documents/1",
      summary: "Later section on implementation support for developing states.",
      detailLines: [],
      similarity: 0.88,
      metadata: { chunk_index: 5 },
    },
  ]);

  assert.equal(bundles.length, 1);
  assert.equal(bundles[0].excerpts.length, 2);
  assert.match(bundles[0].excerpts[1].text, /Later section/);
});

test("system prompt and welcome message reflect admin scope and active filters", () => {
  const accessScope = {
    canReadAdminContent: true,
    canReadMemberContent: true,
    externalSources: [{ id: "drive_1", indexedCount: 100, title: "IMO MEPC Submissions", visibility: "members" }],
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  };
  const activeScope = resolveSelectedAssistantScopes({
    accessScope,
    selectedScopeIds: ["space:space_1", "external_source:drive_1", "source:insights"],
  });

  const prompt = buildSystemPrompt({
    accessScope,
    activeScope,
    profile: { first_name: "Ada", surname: "Lovelace", role_title: "Super Administrator" },
  });
  const welcome = buildWelcomeMessage(accessScope);

  assert.match(prompt, /Admin PATNA data/);
  assert.match(prompt, /Policy Cohort/);
  assert.match(prompt, /ACTIVE SCOPE FOR THIS ANSWER/);
  assert.match(prompt, /IMO MEPC Submissions/);
  assert.match(prompt, /always use markdown links, not raw paths/);
  assert.match(welcome, /community discussions, member profiles, events, and insights/i);
});
