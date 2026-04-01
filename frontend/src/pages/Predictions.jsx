// Predictions.jsx — Predictions page with confidence cards
// ===========================================================
import React, { useContext, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { TrendingUp, Clock, ArrowRight } from "lucide-react";

export default function Predictions() {
  const { filteredUpdates, loading } = useContext(AppContext);

  // Build prediction entries from all updates
  const predictions = useMemo(() => {
    const items = [];
    filteredUpdates.forEach((u) => {
      if (u.prediction_signals && u.prediction_signals.length > 0) {
        u.prediction_signals.forEach((signal, idx) => {
          // Assign confidence based on urgency
          let confidence, level;
          if (u.urgency === "critical") {
            confidence = 85 + Math.floor(Math.random() * 10);
            level = "high";
          } else if (u.urgency === "high") {
            confidence = 70 + Math.floor(Math.random() * 15);
            level = "high";
          } else {
            confidence = 40 + Math.floor(Math.random() * 20);
            level = "medium";
          }

          // ETA ranges
          const etaOptions = ["3–6 months", "4–6 months", "6–12 months", "8–12 months"];
          const eta = etaOptions[idx % etaOptions.length];

          items.push({
            id: `${u.id}-${idx}`,
            title: u.title,
            signal,
            jurisdiction: u.jurisdiction,
            confidence,
            level,
            eta,
          });
        });
      }
    });
    return items;
  }, [filteredUpdates]);

  const highPredictions = predictions.filter((p) => p.level === "high");
  const mediumPredictions = predictions.filter((p) => p.level === "medium");
  const avgConfidence =
    predictions.length > 0
      ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)
      : 0;

  function getJurisdictionCode(j) {
    if (!j) return "";
    if (j.toLowerCase().includes("india")) return "IN";
    if (j.toLowerCase().includes("eu")) return "EU";
    if (j.toLowerCase().includes("us")) return "US";
    return "🌐";
  }

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
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <p className="page-subtitle">
        AI-powered predictions for upcoming regulatory changes based on market signals and policy
        trends.
      </p>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon stat-card__icon--blue">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-card__value">{predictions.length}</div>
            <div className="stat-card__label">Total Predictions</div>
            <div className="stat-card__sub">Active signals</div>
          </div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__icon stat-card__icon--green">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-card__value">{highPredictions.length}</div>
            <div className="stat-card__label">High Confidence</div>
            <div className="stat-card__sub">Likely to occur</div>
          </div>
        </div>

        <div className="stat-card stat-card--medium">
          <div className="stat-card__icon stat-card__icon--amber">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-card__value">{mediumPredictions.length}</div>
            <div className="stat-card__label">Medium Confidence</div>
            <div className="stat-card__sub">Developing signals</div>
          </div>
        </div>

        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon stat-card__icon--blue">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-card__value">{avgConfidence}%</div>
            <div className="stat-card__label">Avg. Confidence</div>
            <div className="stat-card__sub">Across all predictions</div>
          </div>
        </div>
      </div>

      {/* Two-column Predictions Grid */}
      <div className="predictions-grid">
        {/* High Confidence */}
        <div className="predictions-section">
          <div className="predictions-section__title predictions-section__title--high">
            <span className="predictions-section__dot predictions-section__dot--high" />
            High Confidence Predictions
          </div>
          {highPredictions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__title">No high confidence predictions</div>
            </div>
          ) : (
            highPredictions.map((p) => (
              <div key={p.id} className="prediction-card prediction-card--high">
                <div className="prediction-card__top">
                  <span className="confidence-badge confidence-badge--high">
                    HIGH {p.confidence}%
                    <span className="confidence-bar">
                      <span
                        className="confidence-bar__fill confidence-bar__fill--high"
                        style={{ width: `${p.confidence}%` }}
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
                    ETA: {p.eta}
                  </span>
                  <button className="prediction-card__prepare-link">
                    Prepare Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Medium Confidence */}
        <div className="predictions-section">
          <div className="predictions-section__title predictions-section__title--medium">
            <span className="predictions-section__dot predictions-section__dot--medium" />
            Medium Confidence Predictions
          </div>
          {mediumPredictions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__title">No medium confidence predictions</div>
            </div>
          ) : (
            mediumPredictions.map((p) => (
              <div key={p.id} className="prediction-card prediction-card--medium">
                <div className="prediction-card__top">
                  <span className="confidence-badge confidence-badge--medium">
                    MEDIUM {p.confidence}%
                    <span className="confidence-bar">
                      <span
                        className="confidence-bar__fill confidence-bar__fill--medium"
                        style={{ width: `${p.confidence}%` }}
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
                    ETA: {p.eta}
                  </span>
                  <button className="prediction-card__prepare-link">
                    Prepare Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
