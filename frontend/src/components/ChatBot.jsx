// ChatBot.jsx — Floating chat panel for AI Q&A
// ==============================================
// Features:
//   • Toggle button (floating bottom-right)
//   • Chat bubble UI (user right, bot left)
//   • Suggested question chips
//   • Source citations below bot replies
//   • Loading indicator while waiting

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ExternalLink } from "lucide-react";
import { sendMessage } from "../services/chatService.js";

// Starter suggested questions — shown when chat history is empty
const SUGGESTED_QUESTIONS = [
  "What's the most urgent update?",
  "Which controls are affected?",
  "What actions are due this week?",
  "Any prediction signals?",
];

export default function ChatBot() {
  // ── State ──────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: "user"|"bot", text, sources? }
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Send a message ─────────────────────────────────────
  async function handleSend(question) {
    const text = question || input.trim();
    if (!text || isLoading) return;

    // Add user message to the chat
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessage(text);
      // Add bot reply (with optional sources)
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.answer || "I couldn't generate a response.",
          sources: response.sources || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Sorry, something went wrong: ${err.message}`,
          sources: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Enter key in input
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* ── Toggle Button (floating) ── */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        id="chatbot-toggle"
        title={isOpen ? "Close chat" : "Open AI Chat"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className="chatbot-panel" id="chatbot-panel">
          {/* Header */}
          <div className="chatbot-panel__header">
            <div className="chatbot-panel__header-left">
              <div className="chatbot-panel__header-dot" />
              <h3>AI Assistant</h3>
            </div>
            <button
              className="chatbot-panel__close"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-panel__messages">
            {/* Suggested questions (show only when no messages yet) */}
            {messages.length === 0 && (
              <div>
                <p style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-md)",
                }}>
                  Ask me anything about regulatory updates, controls, or action plans.
                </p>
                <div className="chat-suggestions">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      className="chat-chip"
                      onClick={() => handleSend(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble chat-bubble--${msg.role}`}>
                <div>{msg.text}</div>

                {/* Show sources below bot messages */}
                {msg.role === "bot" && msg.sources && msg.sources.length > 0 && (
                  <div className="chat-bubble__sources">
                    <div className="chat-bubble__sources-title">Sources</div>
                    {msg.sources.map((src, si) =>
                      typeof src === "string" ? (
                        src.startsWith("http") ? (
                          <a
                            key={si}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chat-bubble__source-link"
                          >
                            <ExternalLink size={10} style={{ marginRight: 4 }} />
                            {src}
                          </a>
                        ) : (
                          <span key={si} className="chat-bubble__source-text">
                            • {src}
                          </span>
                        )
                      ) : (
                        <span key={si} className="chat-bubble__source-text">
                          • {src.title || src.name || JSON.stringify(src)}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="chat-loading">
                <span className="chat-loading__dot" />
                <span className="chat-loading__dot" />
                <span className="chat-loading__dot" />
              </div>
            )}

            {/* Invisible scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-panel__input-area">
            <input
              className="chatbot-panel__input"
              type="text"
              placeholder="Type a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              id="chat-input"
            />
            <button
              className="chatbot-panel__send"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              title="Send"
              id="chat-send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
