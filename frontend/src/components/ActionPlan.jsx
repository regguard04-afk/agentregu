// ActionPlan.jsx — Displays recommended action tasks sorted by priority
// =====================================================================
// Each task is rendered as a card with priority-colored left border.
// P1 tasks appear first (most urgent).

import React from "react";
import { ClipboardList, User, Calendar, FileText } from "lucide-react";

/**
 * Sorts actions by priority: P1 first, then P2, then P3.
 */
function sortByPriority(actions) {
  const order = { P1: 1, P2: 2, P3: 3 };
  return [...actions].sort(
    (a, b) => (order[a.priority] || 99) - (order[b.priority] || 99)
  );
}

export default function ActionPlan({ actions }) {
  // Don't render if no actions
  if (!actions || actions.length === 0) return null;

  const sorted = sortByPriority(actions);

  return (
    <div className="section-card">
      {/* Section header */}
      <div className="section-card__header">
        <div className="section-card__icon section-card__icon--blue">
          <ClipboardList size={18} />
        </div>
        <h2 className="section-card__title">Action Plan</h2>
      </div>

      {/* Action cards */}
      <div className="action-cards">
        {sorted.map((action, index) => {
          // Determine priority class: p1, p2, or p3
          const prioClass = (action.priority || "P3").toLowerCase();

          return (
            <div key={index} className={`action-card action-card--${prioClass}`}>
              {/* Header: task ID + priority badge */}
              <div className="action-card__header">
                <span className="action-card__task-id">{action.task_id}</span>
                <span className={`priority-badge priority-badge--${prioClass}`}>
                  {action.priority}
                </span>
              </div>

              {/* Description */}
              <p className="action-card__description">
                {action.task_description}
              </p>

              {/* Meta tags: owner, deadline */}
              <div className="action-card__meta">
                {action.suggested_owner && (
                  <span className="action-card__meta-tag">
                    <User size={12} />
                    {action.suggested_owner}
                  </span>
                )}
                {action.suggested_deadline_days != null && (
                  <span className="action-card__meta-tag">
                    <Calendar size={12} />
                    {action.suggested_deadline_days} days
                  </span>
                )}
              </div>

              {/* Evidence required */}
              {action.evidence_required && (
                <div className="action-card__evidence">
                  <div className="action-card__evidence-label">
                    <FileText size={10} style={{ display: "inline", marginRight: 4 }} />
                    Evidence Required
                  </div>
                  {action.evidence_required}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
