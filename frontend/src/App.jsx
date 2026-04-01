// App.jsx — Root layout with Sidebar, TopHeader, and Router
// ===========================================================
import React, { useState, useEffect, createContext } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import TopHeader from "./components/TopHeader.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AlertFeed from "./pages/AlertFeed.jsx";
import Predictions from "./pages/Predictions.jsx";
import QueryEngine from "./pages/QueryEngine.jsx";
import Settings from "./pages/Settings.jsx";
import { getUpdates } from "./services/dataService.js";

// Global context so all pages can access updates + filters
export const AppContext = createContext();

export default function App() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeJurisdiction, setActiveJurisdiction] = useState("all");

  // Fetch updates on mount
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const data = await getUpdates();
      const list = Array.isArray(data) ? data : data.updates || data.data || [];
      setUpdates(list);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filter updates by jurisdiction
  const filteredUpdates =
    activeJurisdiction === "all"
      ? updates
      : updates.filter((u) => {
          const j = (u.jurisdiction || "").toLowerCase();
          const filter = activeJurisdiction.toLowerCase();
          return j.includes(filter) || j === filter;
        });

  // Count for badge
  const criticalCount = updates.filter(
    (u) => u.urgency === "critical" || u.urgency === "high"
  ).length;

  return (
    <AppContext.Provider
      value={{
        updates,
        filteredUpdates,
        loading,
        error,
        activeJurisdiction,
        refreshData: fetchData,
      }}
    >
      <div className="app-layout">
        <Sidebar alertCount={criticalCount} />
        <div className="app-main">
          <TopHeader
            activeJurisdiction={activeJurisdiction}
            onJurisdictionChange={setActiveJurisdiction}
            onAnalysisComplete={fetchData}
          />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<AlertFeed />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/query" element={<QueryEngine />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
