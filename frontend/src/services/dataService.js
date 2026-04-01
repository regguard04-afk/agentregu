// dataService.js — Centralized API calls for all backend data
// =============================================================
// Every API call in the app goes through this file.
// Components never call fetch() directly — they use these functions.

import CONFIG from "../config/settings.js";

/**
 * Helper: makes a fetch request and handles errors consistently.
 * Returns the parsed JSON data or throws a user-friendly error.
 */
async function request(endpoint, options = {}) {
  const url = `${CONFIG.apiBaseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    // If the server returned an error status code
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    // Network error (backend not running, CORS, etc.)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Cannot connect to backend. Make sure it is running at " +
          CONFIG.apiBaseUrl
      );
    }
    throw error;
  }
}

// ── GET endpoints ──────────────────────────────────────────────

/** Fetch all regulatory updates */
export async function getUpdates() {
  return request("/api/updates");
}

/** Fetch a single update by its ID */
export async function getUpdateById(id) {
  return request(`/api/updates/${id}`);
}

/** Get the current pipeline status (idle / running / done / error) */
export async function getPipelineStatus() {
  return request("/api/status");
}

/** Get the list of internal controls */
export async function getControls() {
  return request("/api/controls");
}

/** Get only critical + high urgency items */
export async function getUrgentUpdates() {
  return request("/api/updates/urgent");
}

/** Filter updates by jurisdiction (e.g., "India", "EU", "USA") */
export async function getByJurisdiction(name) {
  return request(`/api/updates/jurisdiction/${encodeURIComponent(name)}`);
}

// ── POST endpoints ─────────────────────────────────────────────

/** Trigger the AI analysis pipeline */
export async function triggerAnalysis() {
  return request("/api/analyze", { method: "POST" });
}
