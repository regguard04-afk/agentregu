// Dashboard.jsx — Main single-page layout
// ==========================================
// This is the root page that assembles all components:
//   • Header bar (top)
//   • Error banner (if backend unreachable)
//   • UpdatesFeed (left panel)
//   • Detail panel (right — ImpactAnalysis, ControlMapping, ActionPlan, PredictionSignals)
//   • ChatBot (floating)

import React, { useState, useCallback } from "react";
import { FileSearch } from "lucide-react";
import Header from "../components/Header.jsx";
import UpdatesFeed from "../components/UpdatesFeed.jsx";
import ImpactAnalysis from "../components/ImpactAnalysis.jsx";
import ControlMapping from "../components/ControlMapping.jsx";
import ActionPlan from "../components/ActionPlan.jsx";
import PredictionSignals from "../components/PredictionSignals.jsx";
import ChatBot from "../components/ChatBot.jsx";

export default function Dashboard() {
  // ── State ──────────────────────────────────────────────
  // The currently selected update (shown in the right panel)
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  // Counter to trigger re-fetch in UpdatesFeed after analysis
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Called when "Run Analysis" completes successfully.
   * Increments refreshKey to tell UpdatesFeed to re-fetch.
   */
  const handleAnalysisTriggered = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  /**
   * Called when a card is clicked in the UpdatesFeed.
   */
  const handleSelectUpdate = useCallback((item) => {
    setSelectedUpdate(item);
  }, []);

  return (
    <div className="dashboard" id="dashboard">
      {/* ── Header Bar ── */}
      <Header onAnalysisTriggered={handleAnalysisTriggered} />

      {/* ── Main Content: left panel + right detail ── */}
      <div className="dashboard__content">
        {/* Left panel — Regulatory Updates Feed */}
        <UpdatesFeed
          selectedId={selectedUpdate?.id}
          onSelectUpdate={handleSelectUpdate}
          refreshKey={refreshKey}
        />

        {/* Right panel — Detail view */}
        <main className="detail-panel" id="detail-panel">
          {selectedUpdate ? (
            <>
              {/* Impact Analysis section */}
              <ImpactAnalysis item={selectedUpdate} />

              {/* Affected Controls + Gaps section */}
              <ControlMapping
                affectedControls={selectedUpdate.affected_controls}
                controlGaps={selectedUpdate.control_gaps}
              />

              {/* Action Plan section */}
              <ActionPlan actions={selectedUpdate.recommended_actions} />

              {/* Prediction Signals section */}
              <PredictionSignals signals={selectedUpdate.prediction_signals} />
            </>
          ) : (
            /* Empty state — no card selected */
            <div className="detail-panel__empty">
              <div className="detail-panel__empty-icon">
                <FileSearch size={36} />
              </div>
              <h3>Select an Update</h3>
              <p>
                Click on a regulatory update from the left panel to view its
                full impact analysis, affected controls, and action plan.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ── Floating ChatBot ── */}
      <ChatBot />
    </div>
  );
}
