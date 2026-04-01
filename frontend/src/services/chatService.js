// chatService.js — Handles all chat-related API calls
// ====================================================
// The ChatBot component uses this service to send questions
// to the AI agent and receive answers with source citations.

import CONFIG from "../config/settings.js";

/**
 * Send a question to the AI chat endpoint.
 * @param {string} question — The user's question text
 * @returns {Promise<{answer: string, sources: Array}>} — AI response
 */
export async function sendMessage(question) {
  const url = `${CONFIG.apiBaseUrl}/api/chat`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Chat request failed (${response.status}): ${errorText}`);
    }

    // Returns { answer: "...", sources: [...] }
    return await response.json();
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Cannot reach the chat service. Is the backend running?"
      );
    }
    throw error;
  }
}
