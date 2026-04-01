// Header.jsx — Top navigation bar with branding and actions
// ===========================================================
// Contains: project name, Run Analysis button, Pipeline status

import React, { useState } from "react";
import { Shield, Play } from "lucide-react";
import PipelineStatus from "./PipelineStatus.jsx";
import { triggerAnalysis } from "../services/dataService.js";

export default function Header({ onAnalysisTriggered }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles the "Run Analysis" button click.
   * Calls POST /api/analyze and manages loading + error states.
   */
  async function handleRunAnalysis() {
    setIsAnalyzing(true);
    setError(null);

    try {
      await triggerAnalysis();
      // Notify the parent (Dashboard) so it can refresh data
      if (onAnalysisTriggered) onAnalysisTriggered();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <header className="header" id="main-header">
      {/* Brand / Logo */}
      <div className="header__brand">
        <div className="header__logo-icon">
          <Shield size={20} color="white" />
        </div>
        <div>
          <h1 className="header__title">Regulatory Intelligence Agent</h1>
          <p className="header__subtitle">AI-Powered Compliance Dashboard</p>
        </div>
      </div>

      {/* Actions: Pipeline Status + Run Analysis */}
      <div className="header__actions">
        {/* Live pipeline status (polls every 5s) */}
        <PipelineStatus />

        {/* Run Analysis button */}
        <button
          className="btn-analyze"
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          id="run-analysis-btn"
          title={isAnalyzing ? "Analysis is running..." : "Start AI analysis pipeline"}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" />
              Analyzing…
            </>
          ) : (
            <>
              <Play size={16} />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Inline error if analysis call fails */}
      {error && (
        <div style={{ position: "absolute", top: "100%", right: 24, zIndex: 50 }}>
          <div className="inline-error" style={{ marginTop: 8 }}>
            {error}
          </div>
        </div>
      )}
    </header>
  );
}
