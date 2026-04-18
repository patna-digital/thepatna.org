// app/api/assistant/route.js
// PATNA Assistant — streaming chat API endpoint.
//
// POST /api/assistant
// Body: { message: string, history?: Array<{ role: 'user'|'assistant', content: string }> }
// Response: text/plain stream (raw Claude token stream)

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { getAnthropicApiKey } from "@/lib/env";
import {
  ASSISTANT_TOOLS,
  buildAssistantQueryPlan,
  buildSystemPrompt,
  executeAssistantTool,
  resolveAccessibleExternalSources,
  resolveAssistantAccessScope,
  resolveSelectedAssistantScopes,
} from "@/lib/assistant";

const WORKFLOW_STAGE_LABELS = {
  answer: "Drafting answer",
  planning: "Understanding your request",
  search: "Inspecting matching records",
  snapshot: "Checking PATNA sources",
};

function buildScopeSummary(activeScope) {
  const selectedLabels = Array.isArray(activeScope?.selectedLabels)
    ? activeScope.selectedLabels
    : [];

  if (!selectedLabels.length) {
    return "No PATNA sources were selected for this answer.";
  }

  return `Using: ${selectedLabels.join(", ")}.`;
}

function getToolStageId(toolName) {
  if (toolName === "plan_patna_query") {
    return "planning";
  }

  if (toolName === "get_patna_snapshot") {
    return "snapshot";
  }

  if (toolName === "search_patna_documents" || toolName === "get_patna_document") {
    return "search";
  }

  return "answer";
}

function formatAssistantError(error) {
  const message = String(error?.message || "");

  if (/unauthorized/i.test(message)) {
    return "Your session has expired. Please refresh the page and sign in again.";
  }

  return "PATNA Assistant encountered an error. Please try again.";
}

function buildPreloadedToolResultsBlock(results = []) {
  if (!results.length) {
    return "";
  }

  return [
    "",
    "PRELOADED PATNA TOOL RESULTS:",
    ...results.map(({ toolName, result }, index) =>
      `${index + 1}. ${toolName}\n${JSON.stringify(result, null, 2)}`
    ),
  ].join("\n\n");
}

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
  let history, message, selectedScopeIds;
  try {
    ({ message, history = [], selectedScopeIds = null } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Cap history to last 10 turns to keep prompt size manageable
  const recentHistory = history.slice(-10);

  // ── 3. Resolve assistant access + gather evidence ─────────────────────────
  const accessScope = await resolveAssistantAccessScope({
    isAdmin,
    supabase,
    userId: user.id,
  });
  accessScope.externalSources = await resolveAccessibleExternalSources(accessScope, supabase);
  const activeScope = resolveSelectedAssistantScopes({
    accessScope,
    selectedScopeIds,
  });

  if (Array.isArray(selectedScopeIds) && !activeScope.hasAnyScope) {
    return NextResponse.json(
      { error: "Select at least one assistant content scope." },
      { status: 400 },
    );
  }

  let adminSupabase = null;
  try {
    adminSupabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Assistant admin client unavailable:", error);
  }

  // ── 4. Build system prompt ────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({ accessScope, activeScope, profile });
  const initialQueryPlan = buildAssistantQueryPlan({
    accessScope,
    activeScope,
    message,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const anthropic = new Anthropic({ apiKey: getAnthropicApiKey() });
      const conversation = [
        ...recentHistory.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ];
      const MAX_TOOL_ROUNDS = 4;

      function emit(event) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        emit({
          kind: "scope",
          scopeSummary: buildScopeSummary(activeScope),
        });
        emit({
          kind: "stage",
          stageId: "planning",
          label: WORKFLOW_STAGE_LABELS.planning,
          status: "in_progress",
          summary: "Working out the best PATNA retrieval path for your request.",
        });
        emit({
          kind: "stage",
          stageId: "planning",
          label: WORKFLOW_STAGE_LABELS.planning,
          status: "completed",
          summary: initialQueryPlan.summary,
        });

        const preloadedToolResults = [];

        for (const task of initialQueryPlan.tasks) {
          if (task.toolName === "plan_patna_query") {
            continue;
          }

          const stageId = getToolStageId(task.toolName);
          emit({
            kind: "stage",
            stageId,
            label: WORKFLOW_STAGE_LABELS[stageId],
            status: "in_progress",
            summary: task.reason,
          });

          const toolResult = await executeAssistantTool({
            toolName: task.toolName,
            toolInput:
              task.toolName === "get_patna_document"
                ? { title_query: initialQueryPlan.namedDocumentReference || message }
                : {
                    query: message,
                    source_types: initialQueryPlan.preferredSourceTypes.length
                      ? initialQueryPlan.preferredSourceTypes
                      : undefined,
                  },
            accessScope,
            activeScope,
            supabase,
            semanticSupabase: adminSupabase,
            queryPlan: initialQueryPlan,
          });

          preloadedToolResults.push({
            toolName: task.toolName,
            result: toolResult,
          });

          if (Array.isArray(toolResult?.sourceSummaries) && toolResult.sourceSummaries.length) {
            emit({
              kind: "source_summaries",
              sourceSummaries: toolResult.sourceSummaries,
            });
          }

          emit({
            kind: "stage",
            stageId,
            label: WORKFLOW_STAGE_LABELS[stageId],
            status: "completed",
            summary: toolResult?.summary || task.reason,
          });
        }

        emit({
          kind: "stage",
          stageId: "answer",
          label: WORKFLOW_STAGE_LABELS.answer,
          status: "in_progress",
          summary: "Drafting a response from the retrieved PATNA evidence.",
        });

        let finalText = null;
        const systemPromptWithPreloadedResults = `${systemPrompt}${buildPreloadedToolResultsBlock(preloadedToolResults)}`;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: systemPromptWithPreloadedResults,
            tools: ASSISTANT_TOOLS,
            messages: conversation,
          });

          if (response.stop_reason === "end_turn") {
            finalText = response.content
              .filter((block) => block.type === "text")
              .map((block) => block.text)
              .join("");
            break;
          }

          if (response.stop_reason === "tool_use") {
            conversation.push({ role: "assistant", content: response.content });
            const toolResults = [];

            for (const toolBlock of response.content.filter((block) => block.type === "tool_use")) {
              const stageId = getToolStageId(toolBlock.name);
              emit({
                kind: "stage",
                stageId,
                label: WORKFLOW_STAGE_LABELS[stageId],
                status: "in_progress",
                summary: `Running ${toolBlock.name.replaceAll("_", " ")}.`,
              });

              const toolResult = await executeAssistantTool({
                toolName: toolBlock.name,
                toolInput: toolBlock.input,
                accessScope,
                activeScope,
                supabase,
                semanticSupabase: adminSupabase,
                queryPlan: initialQueryPlan,
              });

              if (Array.isArray(toolResult?.sourceSummaries) && toolResult.sourceSummaries.length) {
                emit({
                  kind: "source_summaries",
                  sourceSummaries: toolResult.sourceSummaries,
                });
              }

              emit({
                kind: "stage",
                stageId,
                label: WORKFLOW_STAGE_LABELS[stageId],
                status: "completed",
                summary: toolResult?.summary || `Finished ${toolBlock.name.replaceAll("_", " ")}.`,
              });

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolBlock.id,
                content: JSON.stringify(toolResult, null, 2),
              });
            }

            conversation.push({ role: "user", content: toolResults });
            continue;
          }

          finalText = response.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("");
          break;
        }

        const responseText = finalText || "[No response generated. Please try again.]";

        emit({
          kind: "stage",
          stageId: "answer",
          label: WORKFLOW_STAGE_LABELS.answer,
          status: "completed",
          summary: "Answer drafted from the retrieved PATNA evidence.",
        });
        emit({
          kind: "final",
          content: responseText,
        });
      } catch (error) {
        console.error("Claude agentic loop error:", error);
        emit({
          kind: "stage",
          stageId: "answer",
          label: WORKFLOW_STAGE_LABELS.answer,
          status: "error",
          summary: "The assistant hit an error before it could finish the answer.",
        });
        emit({
          kind: "error",
          message: formatAssistantError(error),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
