// PipelineStatus.jsx — Shows the current pipeline status indicator
// ================================================================
// Displays a small badge in the header showing: idle, running, done, error
// Polls GET /api/status every 5 seconds to stay up-to-date.

import React, { useState, useEffect, useRef } from "react";
import { getPipelineStatus } from "../services/dataService.js";

export default function PipelineStatus() {
  // State: "idle" | "running" | "done" | "error" | "offline"
  const [status, setStatus] = useState("idle");
  const intervalRef = useRef(null);

  useEffect(() => {
    // Fetch pipeline status immediately, then every 5 seconds
    async function fetchStatus() {
      try {
        const data = await getPipelineStatus();
        // The backend returns an object — extract the status string
        setStatus(data.status || data.state || "idle");
      } catch {
        // If backend is unreachable, show as offline/idle
        setStatus("idle");
      }
    }

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);

    // Cleanup: stop polling when component unmounts
    return () => clearInterval(intervalRef.current);
  }, []);

  // Choose display label
  const labels = {
    idle: "Idle",
    running: "Running",
    done: "Complete",
    error: "Error",
  };

  return (
    <div className={`pipeline-status pipeline-status--${status}`}>
      <span className="pipeline-status__dot" />
      {/* Show a spinner when running */}
      {status === "running" && <span className="spinner spinner--small" />}
      <span>{labels[status] || "Idle"}</span>
    </div>
  );
}
