// ImpactAnalysis.jsx — Detailed view of a selected regulatory update
// ==================================================================
// Shows: title, tags, summary, obligations, relevance score bar,
// urgency badge, published date, and source link.

import React from "react";
import { FileText, ExternalLink, Calendar } from "lucide-react";
import UrgencyBadge from "./UrgencyBadge.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function ImpactAnalysis({ item }) {
  if (!item) return null;

  // Convert relevance_score (0.0-1.0) to percentage (0-100)
  const relevancePercent = Math.round((item.relevance_score || 0) * 100);

  // Format the published date for display
  const publishedDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="section-card">
      {/* Section header */}
      <div className="section-card__header">
        <div className="section-card__icon section-card__icon--blue">
          <FileText size={18} />
        </div>
        <h2 className="section-card__title">Impact Analysis</h2>
      </div>

      {/* Title */}
      <h3 className="impact__detail-title">{item.title}</h3>

      {/* Tags row: urgency, status, jurisdiction, topic */}
      <div className="impact__tags">
        <UrgencyBadge level={item.urgency} large />
        <StatusBadge status={item.status} />
        {item.jurisdiction && (
          <span className="impact__tag impact__tag--jurisdiction">
            {item.jurisdiction}
          </span>
        )}
        {item.regulatory_topic && (
          <span className="impact__tag impact__tag--topic">
            {item.regulatory_topic}
          </span>
        )}
      </div>

      {/* Meta: date, source, link */}
      <div className="impact__meta-row">
        <div className="impact__meta-item">
          <Calendar size={14} />
          <span className="impact__meta-label">Published:</span>
          {publishedDate}
        </div>
        <div className="impact__meta-item">
          <span className="impact__meta-label">Source:</span>
          <strong>{item.source}</strong>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
            ({item.source_type})
          </span>
        </div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="impact__source-link"
          >
            <ExternalLink size={13} style={{ marginRight: 4 }} />
            View Source
          </a>
        )}
      </div>

      {/* Summary */}
      <div className="impact__summary">{item.summary}</div>

      {/* Relevance Score visual bar */}
      <div className="relevance-bar">
        <div className="relevance-bar__label">
          <span>Relevance Score</span>
          <span className="relevance-bar__score">{relevancePercent}%</span>
        </div>
        <div className="relevance-bar__track">
          <div
            className="relevance-bar__fill"
            style={{ width: `${relevancePercent}%` }}
          />
        </div>
      </div>

      {/* Obligations list */}
      {item.obligations && item.obligations.length > 0 && (
        <>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 8, color: "var(--color-text-secondary)" }}>
            Key Obligations
          </h4>
          <ul className="obligations-list">
            {item.obligations.map((ob, index) => (
              <li key={index}>{ob}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
