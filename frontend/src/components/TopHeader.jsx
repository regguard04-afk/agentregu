// TopHeader.jsx — Top header bar with page title, jurisdiction filters, Run Analysis, and utility icons
// =====================================================================================================
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Calendar, Bell, User, Play, Loader2 } from "lucide-react";
import { triggerAnalysis } from "../services/dataService.js";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/alerts": "Alert Feed",
  "/predictions": "Predictions",
  "/query": "Query Engine",
  "/settings": "Settings",
};

const JURISDICTIONS = [
  { id: "all", label: "All", flag: "" },
  { id: "India", label: "India", flag: "IN" },
  { id: "EU", label: "EU", flag: "EU" },
  { id: "US", label: "US", flag: "US" },
  { id: "Global", label: "Global", flag: "🌐" },
];

export default function TopHeader({ activeJurisdiction, onJurisdictionChange, onAnalysisComplete }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "Dashboard";

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState(null); // 'success' | 'error' | null

  async function handleRunAnalysis() {
    setIsAnalyzing(true);
    setAnalysisStatus(null);

    try {
      await triggerAnalysis();
      setAnalysisStatus("success");
      if (onAnalysisComplete) onAnalysisComplete();
      // Auto-hide success message after 5s
      setTimeout(() => setAnalysisStatus(null), 5000);
    } catch (err) {
      setAnalysisStatus("error");
      console.error("Analysis failed:", err.message);
      setTimeout(() => setAnalysisStatus(null), 8000);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Format current date range
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const dateRange = `${fmt(monthAgo)} – ${fmt(now)}`;

  return (
    <header className="top-header" id="top-header">
      <h2 className="top-header__title">{title}</h2>

      {/* Jurisdiction Filter Pills */}
      <div className="top-header__center">
        <div className="jurisdiction-pills">
          {JURISDICTIONS.map((j) => (
            <button
              key={j.id}
              className={`jurisdiction-pill ${
                activeJurisdiction === j.id ? "jurisdiction-pill--active" : ""
              }`}
              onClick={() => onJurisdictionChange(j.id)}
            >
              {j.flag && (
                <span className="jurisdiction-pill__flag">{j.flag}</span>
              )}
              {j.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Side: Run Analysis, Date, Notifications, Avatar */}
      <div className="top-header__right">
        {/* Run Analysis Button */}
        <button
          className={`btn-analyze ${analysisStatus === "success" ? "btn-analyze--success" : ""} ${analysisStatus === "error" ? "btn-analyze--error" : ""}`}
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          id="run-analysis-btn"
          title={isAnalyzing ? "Analysis is running — scraping & processing..." : "Scrape regulatory sources & run AI analysis pipeline"}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={15} className="btn-analyze__spinner" />
              Analyzing…
            </>
          ) : analysisStatus === "success" ? (
            <>✓ Done</>
          ) : analysisStatus === "error" ? (
            <>⚠ Failed</>
          ) : (
            <>
              <Play size={14} />
              Run Analysis
            </>
          )}
        </button>

        <button className="date-range-btn">
          <Calendar size={16} />
          <span>{dateRange}</span>
        </button>

        <button className="header-icon-btn" title="Notifications">
          <Bell size={20} />
          <span className="header-icon-btn__dot" />
        </button>

        <div className="header-avatar" title="Profile">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
