// StatusBadge.jsx — Displays a colored badge for item status
// ============================================================
// Usage: <StatusBadge status="new" />
// Statuses: new, in_review, actioned, closed

import React from "react";

/**
 * Converts status keys like "in_review" to readable labels like "In Review".
 */
function formatStatus(status) {
  const labels = {
    new: "New",
    in_review: "In Review",
    actioned: "Actioned",
    closed: "Closed",
  };
  return labels[status] || status;
}

export default function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();

  return (
    <span className={`status-badge status-badge--${normalized}`}>
      {formatStatus(normalized)}
    </span>
  );
}
