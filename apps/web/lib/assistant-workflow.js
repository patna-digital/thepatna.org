export const DEFAULT_ASSISTANT_WORKFLOW_STAGES = [
  {
    id: "planning",
    label: "Understanding your request",
    status: "pending",
    summary: "",
  },
  {
    id: "snapshot",
    label: "Checking PATNA sources",
    status: "pending",
    summary: "",
  },
  {
    id: "search",
    label: "Inspecting matching records",
    status: "pending",
    summary: "",
  },
  {
    id: "answer",
    label: "Drafting answer",
    status: "pending",
    summary: "",
  },
];

export function createAssistantWorkflowState() {
  return {
    scopeSummary: "",
    sourceSummaries: [],
    stages: DEFAULT_ASSISTANT_WORKFLOW_STAGES.map((stage) => ({ ...stage })),
  };
}

function mergeStageState(stages, nextStage) {
  const existingIndex = stages.findIndex((stage) => stage.id === nextStage.id);

  if (existingIndex < 0) {
    return [...stages, nextStage];
  }

  const updated = [...stages];
  updated[existingIndex] = {
    ...updated[existingIndex],
    ...nextStage,
  };
  return updated;
}

function mergeSourceSummary(sourceSummaries, summary) {
  const key = summary?.key || `${summary?.label || "source"}:${summary?.resultKind || "result"}`;
  const existingIndex = sourceSummaries.findIndex((item) => item.key === key);
  const nextSummary = {
    key,
    hitCount: 0,
    label: "PATNA source",
    resultKind: "result",
    ...summary,
  };

  if (existingIndex < 0) {
    return [...sourceSummaries, nextSummary];
  }

  const updated = [...sourceSummaries];
  updated[existingIndex] = {
    ...updated[existingIndex],
    ...nextSummary,
  };
  return updated;
}

export function mergeAssistantWorkflowEvent(workflow, event) {
  const baseWorkflow = workflow || createAssistantWorkflowState();

  if (!event || typeof event !== "object") {
    return baseWorkflow;
  }

  if (event.kind === "scope") {
    return {
      ...baseWorkflow,
      scopeSummary: String(event.scopeSummary || "").trim(),
    };
  }

  if (event.kind === "stage") {
    return {
      ...baseWorkflow,
      stages: mergeStageState(baseWorkflow.stages, {
        id: event.stageId,
        label: event.label || event.stageId || "Workflow step",
        status: event.status || "pending",
        summary: String(event.summary || "").trim(),
      }),
    };
  }

  if (event.kind === "source_summary") {
    return {
      ...baseWorkflow,
      sourceSummaries: mergeSourceSummary(baseWorkflow.sourceSummaries, event.summary || event),
    };
  }

  if (event.kind === "source_summaries" && Array.isArray(event.sourceSummaries)) {
    return {
      ...baseWorkflow,
      sourceSummaries: event.sourceSummaries.reduce(
        (items, summary) => mergeSourceSummary(items, summary),
        baseWorkflow.sourceSummaries,
      ),
    };
  }

  return baseWorkflow;
}
