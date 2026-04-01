// ControlMapping.jsx — Displays affected controls table and control gaps
// =====================================================================
// Shows a table of affected_controls and a warning-styled list of control_gaps.

import React from "react";
import { ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";

export default function ControlMapping({ affectedControls, controlGaps }) {
  // Don't render if there's nothing to show
  const hasControls = affectedControls && affectedControls.length > 0;
  const hasGaps = controlGaps && controlGaps.length > 0;

  if (!hasControls && !hasGaps) return null;

  return (
    <div className="section-card">
      {/* Section header */}
      <div className="section-card__header">
        <div className="section-card__icon section-card__icon--purple">
          <ShieldCheck size={18} />
        </div>
        <h2 className="section-card__title">Affected Controls &amp; Gaps</h2>
      </div>

      {/* Controls table */}
      {hasControls && (
        <table className="controls-table">
          <thead>
            <tr>
              <th>Control ID</th>
              <th>Control Name</th>
              <th>Policy Name</th>
            </tr>
          </thead>
          <tbody>
            {affectedControls.map((ctrl, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "0.8rem" }}>
                  {ctrl.control_id}
                </td>
                <td>{ctrl.control_name}</td>
                <td style={{ color: "var(--color-text-secondary)" }}>
                  {ctrl.policy_name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Control gaps — shown in warning/red style */}
      {hasGaps ? (
        <div className="gaps-list">
          <div className="gaps-list__title">
            <AlertTriangle size={14} />
            Control Gaps Identified
          </div>
          {controlGaps.map((gap, index) => (
            <div key={index} className="gap-item">
              {gap}
            </div>
          ))}
        </div>
      ) : (
        /* No gaps = good news */
        <div className="no-gaps">
          <CheckCircle size={16} />
          No control gaps found — all controls are covered.
        </div>
      )}
    </div>
  );
}
