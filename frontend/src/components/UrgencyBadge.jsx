// UrgencyBadge.jsx — Displays a colored badge for urgency level
// ==============================================================
// Usage: <UrgencyBadge level="critical" />
// Levels: critical, high, medium, low

import React from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

/**
 * Maps urgency level to an icon component for visual clarity.
 */
function getIcon(level) {
  const size = 12;
  switch (level) {
    case "critical":
      return <AlertTriangle size={size} />;
    case "high":
      return <AlertCircle size={size} />;
    case "medium":
      return <Info size={size} />;
    case "low":
      return <CheckCircle size={size} />;
    default:
      return null;
  }
}

export default function UrgencyBadge({ level, large = false }) {
  // Normalize to lowercase for consistent matching
  const normalized = (level || "").toLowerCase();

  return (
    <span
      className={`urgency-badge urgency-badge--${normalized}${large ? " urgency-badge--large" : ""}`}
    >
      {getIcon(normalized)}
      {normalized}
    </span>
  );
}
