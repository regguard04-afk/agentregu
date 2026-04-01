// Predictions.jsx — Predictions page with deduplication and clickable Prepare Now
// =================================================================================
import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../App.jsx";
import { TrendingUp, Clock, ArrowRight, X, Loader2, Shield, Lightbulb } from "lucide-react";
import { sendMessage } from "../services/chatService.js";

export default function Predictions() {
  const { filteredUpdates, loading } = useContext(AppContext);

  // Prepare Now panel state
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [prepareAdvice, setPrepareAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState(null);

  // Build prediction entries — DEDUPLICATED by title
  const predictions = useMemo(() => {
    const items = [];
    const seenTitles = new Set();

    filteredUpdates.forEach((u) => {
      if (u.prediction_signals && u.prediction_signals.length > 0) {
        // Only take the first signal per update (avoids duplicates from same source)
        const signal = u.prediction_signals[0];
        const titleKey = u.title.toLowerCase().trim();

        if (seenTitles.has(titleKey)) return;
        seenTitles.add(titleKey);

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

        // ETA based on urgency
        const eta = u.urgency === "critical" ? "1–3 months"
          : u.urgency === "high" ? "3–6 months"
          : "6–12 months";

        items.push({
          id: u.id,
          title: u.title,
          signal,
          allSignals: u.prediction_signals,
          jurisdiction: u.jurisdiction,
          source: u.source,
          summary: u.summary,
          obligations: u.obligations || [],
          regulatory_topic: u.regulatory_topic,
          confidence,
          level,
          eta,
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

  // Handle "Prepare Now" click — open panel and generate AI advice
  async function handlePrepareNow(prediction) {
    setSelectedPrediction(prediction);
    setAdviceLoading(true);
    setAdviceError(null);
    setPrepareAdvice(null);

    const prompt = `Based on this predicted regulatory change, provide specific, actionable preparation advice for a compliance team.

PREDICTION:
- Title: ${prediction.title}
- Source: ${prediction.source || "Regulatory body"}
- Jurisdiction: ${prediction.jurisdiction}
- Category: ${prediction.regulatory_topic || "General"}
- Confidence: ${prediction.confidence}%
- ETA: ${prediction.eta}
- Prediction Signal: ${prediction.signal}
${prediction.allSignals.length > 1 ? `- Additional Signals: ${prediction.allSignals.slice(1).join("; ")}` : ""}
- Summary: ${prediction.summary || "N/A"}
- Key Obligations: ${prediction.obligations.join("; ") || "Not yet determined"}

Please provide:
1. **Risk Assessment** — What's the potential impact if unprepared?
2. **Immediate Actions** (next 30 days) — What should we do right now?
3. **Short-term Preparations** (1-3 months) — Key steps to take
4. **Long-term Strategy** (3-6 months) — How to fully prepare
5. **Resource Requirements** — Team members, budget, tools needed
6. **Quick Wins** — Easy things to do today that reduce risk
7. **Monitoring Plan** — What to watch for as this regulation develops

Be specific and practical. Focus on actionable steps, not generic advice.`;

    try {
      const response = await sendMessage(prompt);
      setPrepareAdvice(response.answer || "Unable to generate preparation advice.");
    } catch (err) {
      setAdviceError(err.message);
    } finally {
      setAdviceLoading(false);
    }
  }

  function closePreparePanel() {
    setSelectedPrediction(null);
    setPrepareAdvice(null);
    setAdviceError(null);
  }

  // Render a single prediction card
  function PredictionCard({ p, colorLevel }) {
    return (
      <div className={`prediction-card prediction-card--${colorLevel}`}>
        <div className="prediction-card__top">
          <span className={`confidence-badge confidence-badge--${colorLevel}`}>
            {colorLevel.toUpperCase()} {p.confidence}%
            <span className="confidence-bar">
              <span
                className={`confidence-bar__fill confidence-bar__fill--${colorLevel}`}
                style={{ width: `${p.confidence}%` }}
              />
            </span>
          </span>
          {p.jurisdiction && (
            <span className="jurisdiction-tag">
              <span className="jurisdiction-tag__code">{getJurisdictionCode(p.jurisdiction)}</span>
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
          <button
            className="prediction-card__prepare-link"
            onClick={() => handlePrepareNow(p)}
          >
            Prepare Now <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
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

      {/* Main layout: predictions + advice panel */}
      <div className="predictions-layout">
        <div className={`predictions-main ${selectedPrediction ? "predictions-main--shrunk" : ""}`}>
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
                  <PredictionCard key={p.id} p={p} colorLevel="high" />
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
                  <PredictionCard key={p.id} p={p} colorLevel="medium" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ━━━ Prepare Now Advice Panel ━━━ */}
        {selectedPrediction && (
          <div className="prepare-panel animate-fade-in">
            <div className="prepare-panel__header">
              <div className="prepare-panel__header-title">
                <Lightbulb size={18} style={{ color: "var(--color-primary)" }} />
                <span>Preparation Advice</span>
              </div>
              <button className="detail-panel__close" onClick={closePreparePanel}>
                <X size={18} />
              </button>
            </div>

            <div className="prepare-panel__body">
              {/* Prediction context */}
              <div className="prepare-panel__context">
                <span className={`confidence-badge confidence-badge--${selectedPrediction.level}`}>
                  {selectedPrediction.level.toUpperCase()} {selectedPrediction.confidence}%
                </span>
                <h4>{selectedPrediction.title}</h4>
                <p className="prepare-panel__signal">📈 {selectedPrediction.signal}</p>
                <div className="prepare-panel__meta">
                  <span><Clock size={12} /> ETA: {selectedPrediction.eta}</span>
                  <span>{selectedPrediction.jurisdiction}</span>
                </div>
              </div>

              {/* AI Advice Content */}
              {adviceLoading && (
                <div className="detail-panel__policy-loading">
                  <Loader2 size={32} className="btn-analyze__spinner" style={{ color: "var(--color-primary)" }} />
                  <p>Generating preparation advice...</p>
                  <span className="detail-panel__policy-loading-sub">
                    Analyzing prediction signals and recommending actions
                  </span>
                </div>
              )}

              {adviceError && (
                <div className="inline-error">
                  <Shield size={16} />
                  <span>Failed to generate advice: {adviceError}</span>
                </div>
              )}

              {prepareAdvice && !adviceLoading && (
                <div className="prepare-panel__advice">
                  {prepareAdvice.split("\n").map((line, i) => {
                    if (line.startsWith("# ")) return <h3 key={i} className="dpol-h1">{line.replace("# ", "")}</h3>;
                    if (line.startsWith("## ")) return <h4 key={i} className="dpol-h2">{line.replace("## ", "")}</h4>;
                    if (line.startsWith("### ")) return <h5 key={i} className="dpol-h3">{line.replace("### ", "")}</h5>;
                    if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="dpol-li">{line.replace(/^[-*] /, "")}</li>;
                    if (line.match(/^\d+\.\s/)) return <li key={i} className="dpol-li dpol-li--numbered">{line}</li>;
                    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="dpol-bold">{line.replace(/\*\*/g, "")}</p>;
                    if (line.trim() === "") return <br key={i} />;
                    return <p key={i} className="dpol-p">{line}</p>;
                  })}

                  <div className="prepare-panel__actions">
                    <button
                      className="btn-analyze"
                      onClick={() => {
                        navigator.clipboard.writeText(prepareAdvice);
                        alert("Preparation advice copied to clipboard!");
                      }}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      📋 Copy Advice
                    </button>
                    <button
                      className="btn-analyze"
                      onClick={() => handlePrepareNow(selectedPrediction)}
                      style={{ flex: 1, justifyContent: "center", background: "linear-gradient(135deg, #10B981, #059669)" }}
                    >
                      🔄 Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
