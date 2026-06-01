import test from "node:test";
import assert from "node:assert/strict";

import {
  createAssistantWorkflowState,
  mergeAssistantWorkflowEvent,
} from "./assistant-workflow.js";

test("createAssistantWorkflowState returns the guided workflow defaults", () => {
  const workflow = createAssistantWorkflowState();

  assert.equal(workflow.stages.length, 4);
  assert.deepEqual(
    workflow.stages.map((stage) => stage.id),
    ["planning", "snapshot", "search", "answer"],
  );
  assert.equal(workflow.scopeSummary, "");
  assert.deepEqual(workflow.sourceSummaries, []);
});

test("mergeAssistantWorkflowEvent updates stages, scope, and source summaries", () => {
  let workflow = createAssistantWorkflowState();

  workflow = mergeAssistantWorkflowEvent(workflow, {
    kind: "scope",
    scopeSummary: "Using IMO MEPC Submissions and Insights Hub.",
  });
  workflow = mergeAssistantWorkflowEvent(workflow, {
    kind: "stage",
    stageId: "planning",
    label: "Understanding your request",
    status: "completed",
    summary: "Split into a document inventory check and a thematic search.",
  });
  workflow = mergeAssistantWorkflowEvent(workflow, {
    kind: "source_summaries",
    sourceSummaries: [
      {
        key: "external_document:IMO MEPC Submissions",
        label: "IMO MEPC Submissions",
        hitCount: 12,
        resultKind: "snapshot",
      },
      {
        key: "content_item:Insights Hub",
        label: "Insights Hub",
        hitCount: 2,
        resultKind: "snapshot",
      },
    ],
  });

  assert.equal(workflow.scopeSummary, "Using IMO MEPC Submissions and Insights Hub.");
  assert.equal(
    workflow.stages.find((stage) => stage.id === "planning")?.summary,
    "Split into a document inventory check and a thematic search.",
  );
  assert.deepEqual(
    workflow.sourceSummaries.map((item) => item.label),
    ["IMO MEPC Submissions", "Insights Hub"],
  );
});
