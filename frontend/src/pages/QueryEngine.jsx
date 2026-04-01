// QueryEngine.jsx — AI compliance query engine (replaces floating chatbot)
// =========================================================================
import React, { useState, useRef, useEffect } from "react";
import { Shield, Send, ArrowRight } from "lucide-react";
import { sendMessage } from "../services/chatService.js";

const SUGGESTIONS = [
  "Are we GDPR compliant for EU users?",
  "What RBI rules apply to our lending product?",
  "Do we need SEBI registration?",
  "What are our DPDP Act obligations?",
];

export default function QueryEngine() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend(question) {
    const text = question || input.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessage(text);
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
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="query-engine animate-fade-in">
      {/* Only show hero when no messages */}
      {messages.length === 0 && (
        <>
          <div className="query-engine__icon">
            <Shield size={28} />
          </div>
          <h2 className="query-engine__title">Compliance Query Engine</h2>
          <p className="query-engine__subtitle">
            Ask questions about regulatory compliance in plain English
          </p>
        </>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="query-engine__messages">
          {messages.map((msg, i) => (
            <div key={i} className={`qe-bubble qe-bubble--${msg.role}`}>
              {msg.text}
              {msg.role === "bot" && msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                    Sources
                  </div>
                  {msg.sources.map((src, si) => (
                    <div key={si} style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", padding: "2px 0" }}>
                      • {typeof src === "string" ? src : src.title || src.name || JSON.stringify(src)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="qe-loading">
              <span className="qe-loading__dot" />
              <span className="qe-loading__dot" />
              <span className="qe-loading__dot" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="query-engine__input-wrapper">
        <input
          className="query-engine__input"
          type="text"
          placeholder="Am I compliant for offering UPI-linked credit lines?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          id="query-input"
        />
        <button
          className="query-engine__send-btn"
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          title="Send"
          id="query-send-btn"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <div className="query-engine__suggestions">
          <div className="query-engine__suggestions-label">Try asking:</div>
          <div className="query-engine__chips">
            {SUGGESTIONS.map((q, i) => (
              <button
                key={i}
                className="query-chip"
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
