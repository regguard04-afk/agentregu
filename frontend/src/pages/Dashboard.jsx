// Dashboard.jsx — Main dashboard page matching reference UI
// ==========================================================
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../App.jsx";
import {
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const { filteredUpdates, loading } = useContext(AppContext);
  const navigate = useNavigate();

  // Compute stats
  const total = filteredUpdates.length;
  const critical = filteredUpdates.filter((u) => u.urgency === "critical").length;
  const high = filteredUpdates.filter((u) => u.urgency === "high").length;
  const medium = filteredUpdates.filter((u) => u.urgency === "medium").length;

  // Extract prediction signals from all updates
  const allPredictions = [];
  filteredUpdates.forEach((u) => {
    if (u.prediction_signals && u.prediction_signals.length > 0) {
      u.prediction_signals.forEach((signal) => {
        allPredictions.push({
          signal,
          title: u.title,
          jurisdiction: u.jurisdiction,
          urgency: u.urgency,
        });
      });
    }
  });

  // Jurisdiction breakdown
  const jurisdictionCounts = {};
  filteredUpdates.forEach((u) => {
    const j = u.jurisdiction || "Unknown";
    jurisdictionCounts[j] = (jurisdictionCounts[j] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(jurisdictionCounts), 1);

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="stat-cards">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-line skeleton-line--short" />
              <div className="skeleton skeleton-line skeleton-line--title" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-line skeleton-line--title" />
            <div className="skeleton skeleton-line skeleton-line--medium" />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    );
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getJurisdictionCode(j) {
    if (!j) return "";
    if (j.toLowerCase().includes("india")) return "IN";
    if (j.toLowerCase().includes("eu") || j.toLowerCase().includes("europe")) return "EU";
    if (j.toLowerCase().includes("us") || j.toLowerCase().includes("america")) return "US";
    return "🌐";
  }

  return (
    <div className="animate-fade-in">
      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon stat-card__icon--blue">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="stat-card__value">{total}</div>
            <div className="stat-card__label">Active Alerts</div>
            <div className="stat-card__sub">Across all jurisdictions</div>
          </div>
        </div>

        <div className="stat-card stat-card--critical">
          <div className="stat-card__icon stat-card__icon--red">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="stat-card__value">{critical + high}</div>
            <div className="stat-card__label">High Priority</div>
            <div className="stat-card__sub">Require immediate action</div>
          </div>
        </div>

        <div className="stat-card stat-card--medium">
          <div className="stat-card__icon stat-card__icon--amber">
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-card__value">{medium}</div>
            <div className="stat-card__label">Medium Priority</div>
            <div className="stat-card__sub">Monitor closely</div>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__icon stat-card__icon--green">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-card__value">{allPredictions.length}</div>
            <div className="stat-card__label">Predictions</div>
            <div className="stat-card__sub">Active signals</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts + Sidebar */}
      <div className="dashboard-grid">
        {/* Left: Recent Regulatory Alerts */}
        <div className="dashboard-grid__main">
          <h3 className="section-heading">Recent Regulatory Alerts</h3>
          {filteredUpdates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__title">No alerts found</div>
              <p className="empty-state__text">
                No regulatory alerts match the current filter.
              </p>
            </div>
          ) : (
            filteredUpdates.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className={`alert-card alert-card--${item.urgency || "low"}`}
              >
                <div className="alert-card__top">
                  <div className="alert-card__tags">
                    <span
                      className={`severity-badge severity-badge--${item.urgency || "low"}`}
                    >
                      {item.urgency === "critical" && (
                        <span className="severity-badge__dot" />
                      )}
                      {(item.urgency || "low").charAt(0).toUpperCase() +
                        (item.urgency || "low").slice(1)}
                    </span>
                    {item.jurisdiction && (
                      <span className="jurisdiction-tag">
                        <span className="jurisdiction-tag__code">
                          {getJurisdictionCode(item.jurisdiction)}
                        </span>
                        {item.jurisdiction}
                      </span>
                    )}
                  </div>
                  <span className="alert-card__date">
                    {formatDate(item.published_at)}
                  </span>
                </div>

                <div className="alert-card__title">{item.title}</div>
                <div className="alert-card__summary">
                  {item.summary
                    ? item.summary.length > 160
                      ? item.summary.slice(0, 160) + "…"
                      : item.summary
                    : "No description available."}
                </div>

                <div className="alert-card__bottom">
                  <span className="alert-card__category">
                    {item.regulatory_topic || "General"}
                  </span>
                  <button
                    className="alert-card__action-link"
                    onClick={() => navigate("/actions")}
                  >
                    View Action Plan <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Sidebar: Predictions + Breakdown */}
        <div className="dashboard-grid__sidebar">
          {/* Prediction Signals */}
          <h3 className="section-heading">Prediction Signals</h3>
          {allPredictions.slice(0, 3).map((p, i) => {
            const confidence = p.urgency === "critical" || p.urgency === "high" ? 78 : 52;
            const level = confidence >= 65 ? "high" : "medium";

            return (
              <div key={i} className={`prediction-card prediction-card--${level}`}>
                <div className="prediction-card__top">
                  <span className={`confidence-badge confidence-badge--${level}`}>
                    {level.toUpperCase()} {confidence}%
                    <span className="confidence-bar">
                      <span
                        className={`confidence-bar__fill confidence-bar__fill--${level}`}
                        style={{ width: `${confidence}%` }}
                      />
                    </span>
                  </span>
                  {p.jurisdiction && (
                    <span className="jurisdiction-tag">
                      <span className="jurisdiction-tag__code">
                        {getJurisdictionCode(p.jurisdiction)}
                      </span>
                      {p.jurisdiction}
                    </span>
                  )}
                </div>

                <div className="prediction-card__title">{p.title}</div>
                <div className="prediction-card__trigger">
                  📈 Triggered by: {p.signal}
                </div>

                <div className="prediction-card__eta">
                  <span className="prediction-card__eta-text">
                    <Clock size={12} />
                    ETA: 3–6 months
                  </span>
                  <button
                    className="prediction-card__prepare-link"
                    onClick={() => navigate("/predictions")}
                  >
                    Prepare Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Jurisdiction Breakdown */}
          <h3 className="section-heading" style={{ marginTop: "var(--space-lg)" }}>
            Jurisdiction Breakdown
          </h3>
          <div className="breakdown-card">
            {Object.entries(jurisdictionCounts).map(([name, count]) => (
              <div key={name} className="breakdown-row">
                <span className="breakdown-row__label">{name}</span>
                <div className="breakdown-row__bar">
                  <div
                    className="breakdown-row__fill"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="breakdown-row__count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
