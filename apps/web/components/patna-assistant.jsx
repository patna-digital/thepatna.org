"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, Lock, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { AssistantMessageMarkdown } from "@/components/assistant-message-markdown";
import {
  createAssistantWorkflowState,
  mergeAssistantWorkflowEvent,
} from "@/lib/assistant-workflow";

const ASSISTANT_STORAGE_KEY = "patna-assistant-session-v2";

function isStoredMessageList(value) {
  return Array.isArray(value) && value.every((item) =>
    item &&
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string",
  );
}

function isStoredScopeIdList(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getDefaultScopeIds(scopes = []) {
  return scopes
    .filter((item) => item?.enabled !== false && item?.defaultChecked !== false && item?.id)
    .map((item) => item.id);
}

function reconcileSelectedScopeIds(scopes = [], selectedScopeIds = null) {
  const allowedIds = new Set(
    scopes
      .filter((item) => item?.enabled !== false && item?.id)
      .map((item) => item.id),
  );

  if (!allowedIds.size) {
    return [];
  }

  if (!Array.isArray(selectedScopeIds)) {
    return getDefaultScopeIds(scopes);
  }

  if (selectedScopeIds.length === 0) {
    return [];
  }

  const filtered = [...new Set(selectedScopeIds.filter((scopeId) => allowedIds.has(scopeId)))];
  return filtered.length ? filtered : getDefaultScopeIds(scopes);
}

function hasVisibleWorkflow(workflow) {
  return Boolean(
    workflow?.scopeSummary ||
    workflow?.sourceSummaries?.length ||
    workflow?.stages?.some((stage) => stage.status !== "pending" || stage.summary),
  );
}

function AssistantWorkflowPanel({ workflow }) {
  if (!hasVisibleWorkflow(workflow)) {
    return null;
  }

  return (
    <div className="patna-assistant-workflow" aria-label="Assistant workflow">
      {workflow.scopeSummary && (
        <p className="patna-assistant-workflow-scope">{workflow.scopeSummary}</p>
      )}

      <div className="patna-assistant-workflow-stage-list">
        {workflow.stages.map((stage) => (
          <div
            key={stage.id}
            className={`patna-assistant-workflow-stage is-${stage.status || "pending"}`}
          >
            <div className="patna-assistant-workflow-stage-top">
              <span className="patna-assistant-workflow-stage-label">{stage.label}</span>
              <span className="patna-assistant-workflow-stage-status">
                {stage.status === "in_progress"
                  ? "In progress"
                  : stage.status === "completed"
                    ? "Done"
                    : stage.status === "error"
                      ? "Error"
                      : "Pending"}
              </span>
            </div>
            {stage.summary && (
              <p className="patna-assistant-workflow-stage-summary">{stage.summary}</p>
            )}
          </div>
        ))}
      </div>

      {workflow.sourceSummaries.length > 0 && (
        <div className="patna-assistant-workflow-source-list">
          {workflow.sourceSummaries.map((summary) => (
            <span key={summary.key} className="patna-assistant-workflow-source-chip">
              {summary.label}: {summary.hitCount}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatnaAssistant() {
  const [assistantAvailability, setAssistantAvailability] = useState("loading");
  const [isOpen, setIsOpen] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [accessScopes, setAccessScopes] = useState([]);
  const [blockedScopes, setBlockedScopes] = useState([]);
  const [selectedScopeIds, setSelectedScopeIds] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "Summarise recent PATNA discussions",
    "What events are coming up?",
    "What are the latest PATNA publications?",
    "Who in the member directory works on SIDS issues?",
  ]);
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hello. I'm PATNA Assistant. I can search your PATNA discussions, published events, publications, and the member directory within your access scope.",
  );

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const hasSelectedScope = Array.isArray(selectedScopeIds) && selectedScopeIds.length > 0;

  function restoreSessionState() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(ASSISTANT_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (isStoredMessageList(parsed?.messages)) {
        setMessages(parsed.messages);
      }
      if (typeof parsed?.inputValue === "string") {
        setInputValue(parsed.inputValue);
      }
      if (typeof parsed?.isOpen === "boolean") {
        setIsOpen(parsed.isOpen);
      }
      if (isStoredScopeIdList(parsed?.selectedScopeIds)) {
        setSelectedScopeIds(parsed.selectedScopeIds);
      }
    } catch (error) {
      console.error("Failed to restore assistant session state:", error);
    }
  }

  async function refreshAssistantContext() {
    try {
      const response = await fetch("/api/assistant/access", {
        cache: "no-store",
      });

      if (!response.ok) {
        setAssistantAvailability("hidden");
        return;
      }

      const payload = await response.json();

      if (Array.isArray(payload?.scopes)) {
        setAccessScopes(payload.scopes);
        setSelectedScopeIds((prev) => reconcileSelectedScopeIds(payload.scopes, prev));
      }

      if (Array.isArray(payload?.blockedScopes)) {
        setBlockedScopes(payload.blockedScopes);
      }

      if (Array.isArray(payload?.suggestedPrompts) && payload.suggestedPrompts.length > 0) {
        setSuggestedPrompts(payload.suggestedPrompts);
      }

      if (typeof payload?.welcomeMessage === "string" && payload.welcomeMessage.trim()) {
        setWelcomeMessage(payload.welcomeMessage.trim());
      }

      setAssistantAvailability("ready");
    } catch (error) {
      console.error("Failed to load assistant access context:", error);
      setAssistantAvailability("hidden");
    }
  }

  useEffect(() => {
    restoreSessionState();
    refreshAssistantContext();
  }, []);

  useEffect(() => {
    if (assistantAvailability !== "ready" || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      ASSISTANT_STORAGE_KEY,
      JSON.stringify({
        inputValue,
        isOpen,
        messages,
        selectedScopeIds: Array.isArray(selectedScopeIds) ? selectedScopeIds : [],
      }),
    );
  }, [assistantAvailability, inputValue, isOpen, messages, selectedScopeIds]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !showAccess) {
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showAccess]);

  useEffect(() => {
    if (!showAccess) {
      return;
    }

    refreshAssistantContext();
  }, [showAccess]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 720px)");

    function syncBodyScrollLock() {
      if (isOpen && mediaQuery.matches) {
        document.body.classList.add("patna-assistant-body-locked");
      } else {
        document.body.classList.remove("patna-assistant-body-locked");
      }
    }

    syncBodyScrollLock();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncBodyScrollLock);
      return () => {
        mediaQuery.removeEventListener("change", syncBodyScrollLock);
        document.body.classList.remove("patna-assistant-body-locked");
      };
    }

    window.addEventListener("resize", syncBodyScrollLock);
    return () => {
      window.removeEventListener("resize", syncBodyScrollLock);
      document.body.classList.remove("patna-assistant-body-locked");
    };
  }, [isOpen]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || !hasSelectedScope) {
      return;
    }

    const recentHistory = messages.slice(-10);
    setInputValue("");
    setShowAccess(false);

    const userMessage = { role: "user", content: trimmed };
    const assistantMessage = {
      role: "assistant",
      content: "",
      workflow: createAssistantWorkflowState(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: recentHistory,
          message: trimmed,
          selectedScopeIds,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        let errorMessage = `Something went wrong (${res.status}). Please try again.`;
        try {
          const payload = await res.json();
          if (res.status === 401 || payload?.error === "Unauthorized") {
            errorMessage = "Your session has expired. Please refresh the page and sign in again.";
          } else if (payload?.error) {
            errorMessage = payload.error;
          }
        } catch {
          // Fall back to the status-derived message.
        }

        throw new Error(errorMessage);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Streaming response was unavailable.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        while (buffer.includes("\n\n")) {
          const boundaryIndex = buffer.indexOf("\n\n");
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);

          const data = rawEvent
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");

          if (!data) {
            continue;
          }

          let event;
          try {
            event = JSON.parse(data);
          } catch (error) {
            console.error("Failed to parse assistant workflow event:", error);
            continue;
          }

          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];

            if (!lastMessage || lastMessage.role !== "assistant") {
              return prev;
            }

            const nextMessage = {
              ...lastMessage,
              workflow: mergeAssistantWorkflowEvent(lastMessage.workflow, event),
            };

            if (event.kind === "final") {
              nextMessage.content = typeof event.content === "string" ? event.content : nextMessage.content;
            }

            if (event.kind === "error") {
              nextMessage.content = typeof event.message === "string"
                ? event.message
                : "I encountered an error. Please try again or refresh the page.";
            }

            if (event.kind === "answer_delta") {
              nextMessage.content = `${nextMessage.content}${event.delta || ""}`;
            }

            updated[updated.length - 1] = nextMessage;
            return updated;
          });
        }
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: err?.message || "I encountered an error. Please try again or refresh the page.",
            workflow: mergeAssistantWorkflowEvent(updated[updated.length - 1]?.workflow, {
              kind: "stage",
              stageId: "answer",
              label: "Drafting answer",
              status: "error",
              summary: "The assistant hit an error before it could finish the answer.",
            }),
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(inputValue);
    }
  }

  function handleClose() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsOpen(false);
    setShowAccess(false);
  }

  function handleStartNewConversation() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setMessages([]);
    setInputValue("");
    setIsStreaming(false);
    setShowAccess(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleScopeToggle(scopeId) {
    setSelectedScopeIds((prev) => {
      const current = Array.isArray(prev) ? prev : getDefaultScopeIds(accessScopes);
      if (current.includes(scopeId)) {
        return current.filter((item) => item !== scopeId);
      }

      return [...current, scopeId];
    });
  }

  if (assistantAvailability !== "ready") {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open PATNA Assistant"
          className="patna-assistant-fab"
          type="button"
        >
          <Sparkles className="patna-assistant-fab-icon" />
        </button>
      )}

      {isOpen && (
        <div
          className="patna-assistant-panel"
          role="dialog"
          aria-label="PATNA Assistant"
          aria-modal="true"
        >
          <div className="patna-assistant-header">
            <div className="patna-assistant-header-main">
              <div className="patna-assistant-mark">
                <Sparkles className="patna-assistant-mark-icon" />
              </div>
              <div className="patna-assistant-header-copy">
                <p className="patna-assistant-title">PATNA Assistant</p>
                <p className="patna-assistant-subtitle">
                  Context-aware · Access-restricted
                </p>
              </div>
            </div>
            <div className="patna-assistant-header-actions">
              <button
                onClick={() => setShowAccess((value) => !value)}
                aria-label="View data access"
                aria-pressed={showAccess}
                className={`patna-assistant-access-button${showAccess ? " is-active" : ""}`}
                type="button"
              >
                <Lock className="patna-assistant-access-button-icon" />
                Access
              </button>
              <button
                onClick={handleStartNewConversation}
                aria-label="Start new conversation"
                className="patna-assistant-icon-button"
                type="button"
              >
                <RefreshCw className="patna-assistant-icon-button-icon" />
              </button>
              <button
                onClick={handleClose}
                aria-label="Close PATNA Assistant"
                className="patna-assistant-icon-button"
                type="button"
              >
                <X className="patna-assistant-icon-button-icon" />
              </button>
            </div>
          </div>

          {showAccess && (
            <div className="patna-assistant-access-panel">
              <p className="patna-assistant-section-label">
                Your data access for this session
              </p>
              <p className="patna-assistant-access-hint">
                Checked items will be used the next time you ask a question.
              </p>
              <div className="patna-assistant-access-list">
                {accessScopes.map((item) => (
                  <label
                    key={item.id}
                    className={`patna-assistant-access-item patna-assistant-access-item-selectable${
                      item.enabled === false ? " is-disabled" : ""
                    }`}
                  >
                    <input
                      checked={Array.isArray(selectedScopeIds) && selectedScopeIds.includes(item.id)}
                      className="patna-assistant-access-checkbox"
                      disabled={item.enabled === false}
                      onChange={() => handleScopeToggle(item.id)}
                      type="checkbox"
                    />
                    <div className="patna-assistant-access-copy">
                      <p className="patna-assistant-access-name">{item.label}</p>
                      <p className="patna-assistant-access-detail">{item.detail}</p>
                    </div>
                  </label>
                ))}

                {blockedScopes.map((item) => (
                  <div key={item.name} className="patna-assistant-access-item">
                    <Ban className="patna-assistant-access-icon is-blocked" />
                    <div className="patna-assistant-access-copy">
                      <p className="patna-assistant-access-name is-blocked">{item.name}</p>
                      <p className="patna-assistant-access-detail is-blocked">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showAccess && (
            <>
              <div className="patna-assistant-thread">
                {messages.length === 0 && (
                  <div className="patna-assistant-welcome">
                    <div className="patna-assistant-message-row">
                      <div className="patna-assistant-avatar">
                        <Sparkles className="patna-assistant-avatar-icon" />
                      </div>
                      <div className="patna-assistant-bubble patna-assistant-bubble-assistant">
                        <p className="patna-assistant-bubble-copy">
                          {welcomeMessage}
                        </p>
                        <p className="patna-assistant-bubble-copy">What would you like to explore today?</p>
                      </div>
                    </div>

                    {suggestedPrompts.length > 0 && (
                      <div className="patna-assistant-prompts">
                        <p className="patna-assistant-section-label patna-assistant-prompts-label">
                          Try asking
                        </p>
                        <div className="patna-assistant-prompt-list">
                          {suggestedPrompts.map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => sendMessage(prompt)}
                              className="patna-assistant-prompt-button"
                              disabled={!hasSelectedScope || isStreaming}
                              type="button"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={`${msg.role}-${index}-${msg.content.slice(0, 12)}`}
                    className={`patna-assistant-message-row${msg.role === "user" ? " is-user" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="patna-assistant-avatar">
                        <Sparkles className="patna-assistant-avatar-icon" />
                      </div>
                    )}
                    <div
                      className={`patna-assistant-bubble ${
                        msg.role === "user"
                          ? "patna-assistant-bubble-user"
                          : "patna-assistant-bubble-assistant"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <AssistantWorkflowPanel workflow={msg.workflow} />
                      )}
                      {msg.content ? (
                        msg.role === "assistant" ? (
                          <AssistantMessageMarkdown content={msg.content} />
                        ) : (
                          <p className="patna-assistant-bubble-copy">{msg.content}</p>
                        )
                      ) : (
                        <span className="patna-assistant-typing" aria-label="PATNA Assistant is typing">
                          <span className="patna-assistant-typing-dot" />
                          <span className="patna-assistant-typing-dot" />
                          <span className="patna-assistant-typing-dot" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              <div className="patna-assistant-composer">
                <div className="patna-assistant-composer-row">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about PATNA discussions, members, events, publications…"
                    rows={1}
                    disabled={isStreaming}
                    className="patna-assistant-input"
                    style={{ lineHeight: "1.4" }}
                    onInput={(event) => {
                      event.target.style.height = "auto";
                      event.target.style.height = `${Math.min(event.target.scrollHeight, 128)}px`;
                    }}
                  />
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isStreaming || !hasSelectedScope}
                    aria-label="Send message"
                    className="patna-assistant-send-button"
                    type="button"
                  >
                    <Send className="patna-assistant-send-icon" />
                  </button>
                </div>
                <p className="patna-assistant-disclaimer">
                  {hasSelectedScope
                    ? "Responses use only the PATNA sources that are currently checked in Access."
                    : "Select at least one checked source in Access before sending a message."}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
