// PredictionSignals.jsx — Displays early warning signals for a regulatory item
// ==============================================================================
// Shows "prediction_signals" from the selected update as a bullet list
// inside a warning-themed card.

import React from "react";
import { Radio } from "lucide-react";

export default function PredictionSignals({ signals }) {
  // Don't render the section if there are no signals
  if (!signals || signals.length === 0) return null;

  return (
    <div className="section-card">
      {/* Section header with warning icon */}
      <div className="section-card__header">
        <div className="section-card__icon section-card__icon--amber">
          <Radio size={18} />
        </div>
        <h2 className="section-card__title">Early Warning Signals</h2>
      </div>

      {/* List of prediction signals */}
      <ul className="predictions-list">
        {signals.map((signal, index) => (
          <li key={index}>
            <Radio size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            {signal}
          </li>
        ))}
      </ul>
    </div>
  );
}
