import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAccessContext,
  buildContextBlock,
  buildSuggestedPrompts,
  buildSystemPrompt,
  buildWelcomeMessage,
  detectAssistantIntent,
} from "./assistant.js";

test("buildAccessContext exposes member and blocked scopes consistently", () => {
  const accessContext = buildAccessContext({
    canReadAdminContent: false,
    canReadMemberContent: true,
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  });

  assert.equal(accessContext.permitted[0].name, "Policy Cohort");
  assert.equal(
    accessContext.permitted.some((item) => item.name === "Events"),
    true,
  );
  assert.equal(
    accessContext.blocked.some((item) => item.name === "Admin-only PATNA records"),
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
    adminPrompts.includes("Show me applications awaiting review"),
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

  assert.match(block, /STRUCTURED EVIDENCE/);
  assert.match(block, /SEMANTIC EVIDENCE/);
  assert.match(block, /Go to: \/app\/events/);
  assert.match(block, /Go to: \/app\/spaces\/policy\/threads\/2/);
});

test("system prompt and welcome message reflect admin scope", () => {
  const accessScope = {
    canReadAdminContent: true,
    canReadMemberContent: true,
    spaces: [{ id: "space_1", name: "Policy Cohort", space_type: "cohort" }],
  };

  const prompt = buildSystemPrompt({
    accessScope,
    profile: { first_name: "Ada", surname: "Lovelace", role_title: "Super Administrator" },
  });
  const welcome = buildWelcomeMessage(accessScope);

  assert.match(prompt, /Admin PATNA data/);
  assert.match(prompt, /Policy Cohort/);
  assert.match(welcome, /admin application queues/i);
});
