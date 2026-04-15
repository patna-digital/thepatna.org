"use client";

import { useEffect, useRef, useState } from "react";
import { X, Lock, Send, Sparkles, CheckSquare, Ban } from "lucide-react";
import { AssistantMessageMarkdown } from "@/components/assistant-message-markdown";

// ─────────────────────────────────────────────────────────────────────────────
// PatnaAssistant
// Floating AI chat widget. Mounts in app/app/layout.jsx.
//
// Desktop: fixed 480×600 panel, bottom-right
// Mobile:  full-screen overlay
// ─────────────────────────────────────────────────────────────────────────────

const ASSISTANT_STORAGE_KEY = "patna-assistant-session-v1";

function isStoredMessageList(value) {
  return Array.isArray(value) && value.every((item) =>
    item &&
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string",
  );
}

export function PatnaAssistant() {
  const [assistantAvailability, setAssistantAvailability] = useState("loading");
  const [isOpen, setIsOpen] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [accessContext, setAccessContext] = useState({ permitted: [], blocked: [] });
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
    } catch (error) {
      console.error("Failed to restore assistant session state:", error);
    }
  }

  // ── Load assistant access context from the server on mount ─────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadAssistantContext() {
      try {
        const response = await fetch("/api/assistant/access", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) {
            setAssistantAvailability("hidden");
          }
          return;
        }

        const payload = await response.json();
        if (!isMounted) {
          return;
        }

        if (payload?.accessContext) {
          setAccessContext(payload.accessContext);
        }

        if (Array.isArray(payload?.suggestedPrompts) && payload.suggestedPrompts.length > 0) {
          setSuggestedPrompts(payload.suggestedPrompts);
        }

        if (typeof payload?.welcomeMessage === "string" && payload.welcomeMessage.trim()) {
          setWelcomeMessage(payload.welcomeMessage.trim());
        }

        restoreSessionState();
        setAssistantAvailability("ready");
      } catch (error) {
        console.error("Failed to load assistant access context:", error);
        if (isMounted) {
          setAssistantAvailability("hidden");
        }
      }
    }

    loadAssistantContext();

    return () => {
      isMounted = false;
    };
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
      }),
    );
  }, [assistantAvailability, inputValue, isOpen, messages]);

  // ── Auto-scroll on new messages ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // ── Focus input when panel opens ───────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !showAccess) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showAccess]);

  // ── Lock background scroll while the mobile overlay is open ──────────────
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

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

  // ── Send a message ─────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setInputValue("");
    setShowAccess(false);

    const userMessage = { role: "user", content: trimmed };
    const assistantMessage = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-10),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content:
              "I encountered an error. Please try again or refresh the page.",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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

  if (assistantAvailability !== "ready") {
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger button ─────────────────────────────────────────────────── */}
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

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="patna-assistant-panel"
          role="dialog"
          aria-label="PATNA Assistant"
          aria-modal="true"
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
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
                onClick={() => setShowAccess((v) => !v)}
                aria-label="View data access"
                aria-pressed={showAccess}
                className={`patna-assistant-access-button${showAccess ? " is-active" : ""}`}
                type="button"
              >
                <Lock className="patna-assistant-access-button-icon" />
                Access
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

          {/* ── Access panel ────────────────────────────────────────────────── */}
          {showAccess && (
            <div className="patna-assistant-access-panel">
              <p className="patna-assistant-section-label">
                Your data access for this session
              </p>
              <div className="patna-assistant-access-list">
                {accessContext.permitted.map((item, i) => (
                  <div
                    key={i}
                    className="patna-assistant-access-item"
                  >
                    <CheckSquare className="patna-assistant-access-icon is-permitted" />
                    <div className="patna-assistant-access-copy">
                      <p className="patna-assistant-access-name">{item.name}</p>
                      <p className="patna-assistant-access-detail">{item.detail}</p>
                    </div>
                  </div>
                ))}
                {accessContext.blocked.map((item, i) => (
                  <div
                    key={i}
                    className="patna-assistant-access-item"
                  >
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

          {/* ── Chat area ───────────────────────────────────────────────────── */}
          {!showAccess && (
            <>
              <div className="patna-assistant-thread">
                {/* Welcome message */}
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

                    {/* Suggested prompts */}
                    {suggestedPrompts.length > 0 && (
                      <div className="patna-assistant-prompts">
                        <p className="patna-assistant-section-label patna-assistant-prompts-label">
                          Try asking
                        </p>
                        <div className="patna-assistant-prompt-list">
                          {suggestedPrompts.map((prompt, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(prompt)}
                              className="patna-assistant-prompt-button"
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

                {/* Message thread */}
                {messages.map((msg, i) => (
                  <div
                    key={i}
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

              {/* ── Input area ────────────────────────────────────────────── */}
              <div className="patna-assistant-composer">
                <div className="patna-assistant-composer-row">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about PATNA discussions, members, events, publications…"
                    rows={1}
                    disabled={isStreaming}
                    className="patna-assistant-input"
                    style={{ lineHeight: "1.4" }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                    }}
                  />
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isStreaming}
                    aria-label="Send message"
                    className="patna-assistant-send-button"
                    type="button"
                  >
                    <Send className="patna-assistant-send-icon" />
                  </button>
                </div>
                <p className="patna-assistant-disclaimer">
                  Responses are scoped to your permitted PATNA spaces.
                  Admin-restricted data is never surfaced.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
