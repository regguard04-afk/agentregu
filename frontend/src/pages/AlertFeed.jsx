// AlertFeed.jsx — Searchable alert table with clickable detail panel & AI policy drafting
// ========================================================================================
import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import {
  Search, Eye, X, ExternalLink, Shield, FileText,
  AlertTriangle, Users, Calendar, ArrowRight, Loader2,
  ChevronRight, Clock, CheckCircle2, XCircle, Link2,
} from "lucide-react";
import { sendMessage } from "../services/chatService.js";

const SEVERITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"];
const STATUS_FILTERS = ["All", "Action Required", "In Progress", "Resolved"];
const CATEGORY_FILTERS = ["All", "Corporate Governance", "AML/CFT", "Securities", "Data Privacy", "Banking & Finance"];

export default function AlertFeed() {
  const { filteredUpdates, loading } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Detail panel state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [activeTab, setActiveTab] = useState("details"); // "details" | "policy"

  // Policy draft state
  const [policyDraft, setPolicyDraft] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState(null);

  // Map API status to display status
  function getDisplayStatus(item) {
    const s = (item.status || "new").toLowerCase();
    if (s === "actioned" || s === "closed" || s === "resolved") return "Resolved";
    if (s === "in_review" || s === "in_progress" || s === "in progress") return "In Progress";
    return "Action Required";
  }

  // Apply filters
  const filtered = useMemo(() => {
    return filteredUpdates.filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !(item.title || "").toLowerCase().includes(q) &&
          !(item.summary || "").toLowerCase().includes(q) &&
          !(item.source || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (severityFilter !== "All" && (item.urgency || "").toLowerCase() !== severityFilter.toLowerCase())
        return false;
      if (statusFilter !== "All" && getDisplayStatus(item) !== statusFilter)
        return false;
      if (categoryFilter !== "All" && (item.regulatory_topic || "") !== categoryFilter)
        return false;
      return true;
    });
  }, [filteredUpdates, searchQuery, severityFilter, statusFilter, categoryFilter]);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  function getJurisdictionCode(j) {
    if (!j) return "";
    if (j.toLowerCase().includes("india")) return "IN";
    if (j.toLowerCase().includes("eu") || j.toLowerCase().includes("europe")) return "EU";
    if (j.toLowerCase().includes("us") || j.toLowerCase().includes("america")) return "US";
    return "🌐";
  }

  // Open detail panel
  function openDetail(item) {
    setSelectedAlert(item);
    setActiveTab("details");
    setPolicyDraft(null);
    setPolicyError(null);
  }

  // Close detail panel
  function closeDetail() {
    setSelectedAlert(null);
    setPolicyDraft(null);
    setPolicyError(null);
  }

  // Generate AI policy draft
  async function generatePolicyDraft(alert) {
    setActiveTab("policy");
    setPolicyLoading(true);
    setPolicyError(null);
    setPolicyDraft(null);

    const prompt = `Based on this regulatory change, draft an updated internal compliance policy.

REGULATORY CHANGE:
- Title: ${alert.title}
- Source: ${alert.source}
- Jurisdiction: ${alert.jurisdiction}
- Category: ${alert.regulatory_topic || "General"}
- Summary: ${alert.summary || "No summary available"}
- Key Obligations: ${(alert.obligations || []).join("; ") || "Not specified"}
- Affected Controls: ${(alert.affected_controls || []).map(c => c.control_name).join(", ") || "Not specified"}
- Control Gaps: ${(alert.control_gaps || []).join("; ") || "None identified"}

Please draft a structured internal policy document with:
1. Policy Title
2. Policy Effective Date (suggest today's date)
3. Policy Owner (suggest appropriate department)
4. Purpose & Scope
5. Key Policy Statements (specific rules/requirements)
6. Compliance Procedures (step-by-step)
7. Roles & Responsibilities
8. Monitoring & Reporting
9. Non-Compliance Consequences
10. Review & Update Schedule

Make it specific to the regulatory change described above, not generic.`;

    try {
      const response = await sendMessage(prompt);
      setPolicyDraft(response.answer || "Unable to generate policy draft.");
    } catch (err) {
      setPolicyError(err.message);
    } finally {
      setPolicyLoading(false);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton-card" style={{ height: 56 }}>
          <div className="skeleton skeleton-line skeleton-line--title" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-line skeleton-line--medium" />
            <div className="skeleton skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in alert-feed-layout">
      {/* Main content (shrinks when panel is open) */}
      <div className={`alert-feed-main ${selectedAlert ? "alert-feed-main--shrunk" : ""}`}>
        {/* Search Bar */}
        <div className="search-bar">
          <Search size={18} className="search-bar__icon" />
          <input
            type="text"
            className="search-bar__input"
            placeholder="Search regulations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="alert-search"
          />
        </div>

        {/* Filter Pills */}
        <div className="filter-groups">
          <div className="filter-group">
            {SEVERITY_FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${severityFilter === f ? "filter-pill--active" : ""}`}
                onClick={() => setSeverityFilter(f)}
              >{f}</button>
            ))}
          </div>
          <div className="filter-group">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${statusFilter === f ? "filter-pill--active" : ""}`}
                onClick={() => setStatusFilter(f)}
              >{f}</button>
            ))}
          </div>
          <div className="filter-group">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${categoryFilter === f ? "filter-pill--active" : ""}`}
                onClick={() => setCategoryFilter(f)}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Alert Table */}
        <div className="alert-table">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Regulation</th>
                <th>Jurisdiction</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state__title">No alerts match your filters</div>
                      <p className="empty-state__text">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const displayStatus = getDisplayStatus(item);
                  const statusClass = displayStatus.toLowerCase().replace(/\s+/g, "-");
                  const isSelected = selectedAlert?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => openDetail(item)}
                      className={`alert-table__row--clickable ${isSelected ? "alert-table__row--selected" : ""}`}
                    >
                      <td>
                        <span className={`severity-badge severity-badge--${item.urgency || "low"}`}>
                          {item.urgency === "critical" && <span className="severity-badge__dot" />}
                          {(item.urgency || "Low").charAt(0).toUpperCase() + (item.urgency || "low").slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="alert-table__regulation">{item.title}</div>
                        <div className="alert-table__source">{item.source}</div>
                      </td>
                      <td>
                        <span className="jurisdiction-tag">
                          <span className="jurisdiction-tag__code">{getJurisdictionCode(item.jurisdiction)}</span>
                          {item.jurisdiction}
                        </span>
                      </td>
                      <td>{item.regulatory_topic || "General"}</td>
                      <td>{formatDate(item.published_at)}</td>
                      <td>
                        <span className={`status-badge status-badge--${statusClass}`}>{displayStatus}</span>
                      </td>
                      <td>
                        <div className="alert-table__actions">
                          <button
                            className="alert-table__action-btn"
                            title="View Details"
                            onClick={(e) => { e.stopPropagation(); openDetail(item); }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="alert-table__action-btn"
                            title="Dismiss"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━ DETAIL PANEL (slide-in from right) ━━━ */}
      {selectedAlert && (
        <div className="detail-panel animate-fade-in" id="alert-detail-panel">
          {/* Panel Header */}
          <div className="detail-panel__header">
            <div className="detail-panel__tabs">
              <button
                className={`detail-panel__tab ${activeTab === "details" ? "detail-panel__tab--active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                <FileText size={14} /> Details
              </button>
              <button
                className={`detail-panel__tab ${activeTab === "policy" ? "detail-panel__tab--active" : ""}`}
                onClick={() => {
                  if (!policyDraft && !policyLoading) {
                    generatePolicyDraft(selectedAlert);
                  } else {
                    setActiveTab("policy");
                  }
                }}
              >
                <Shield size={14} /> Policy Draft
              </button>
            </div>
            <button className="detail-panel__close" onClick={closeDetail} title="Close">
              <X size={18} />
            </button>
          </div>

          {/* ── Details Tab ── */}
          {activeTab === "details" && (
            <div className="detail-panel__body">
              {/* Severity + Jurisdiction */}
              <div className="detail-panel__top-tags">
                <span className={`severity-badge severity-badge--${selectedAlert.urgency || "low"}`}>
                  {selectedAlert.urgency === "critical" && <span className="severity-badge__dot" />}
                  {(selectedAlert.urgency || "Low").charAt(0).toUpperCase() + (selectedAlert.urgency || "low").slice(1)}
                </span>
                <span className="jurisdiction-tag">
                  <span className="jurisdiction-tag__code">{getJurisdictionCode(selectedAlert.jurisdiction)}</span>
                  {selectedAlert.jurisdiction}
                </span>
                <span className={`status-badge status-badge--${getDisplayStatus(selectedAlert).toLowerCase().replace(/\s+/g, "-")}`}>
                  {getDisplayStatus(selectedAlert)}
                </span>
              </div>

              {/* Title */}
              <h3 className="detail-panel__title">{selectedAlert.title}</h3>

              {/* Meta row */}
              <div className="detail-panel__meta">
                <span><Calendar size={13} /> {formatDate(selectedAlert.published_at)}</span>
                <span><Shield size={13} /> {selectedAlert.source}</span>
                <span>{selectedAlert.regulatory_topic || "General"}</span>
              </div>

              {/* Source Link */}
              {selectedAlert.url && (
                <a href={selectedAlert.url} target="_blank" rel="noopener noreferrer" className="detail-panel__source-link">
                  <ExternalLink size={14} /> View Original Source
                </a>
              )}

              {/* Summary */}
              <div className="detail-panel__section">
                <h4 className="detail-panel__section-title">Summary</h4>
                <p className="detail-panel__text">{selectedAlert.summary || "No detailed summary available."}</p>
              </div>

              {/* Key Obligations */}
              {selectedAlert.obligations && selectedAlert.obligations.length > 0 && (
                <div className="detail-panel__section">
                  <h4 className="detail-panel__section-title">
                    <AlertTriangle size={14} /> Key Obligations
                  </h4>
                  <ul className="detail-panel__list">
                    {selectedAlert.obligations.map((ob, i) => (
                      <li key={i}>{ob}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Affected Controls */}
              {selectedAlert.affected_controls && selectedAlert.affected_controls.length > 0 && (
                <div className="detail-panel__section">
                  <h4 className="detail-panel__section-title">
                    <Link2 size={14} /> Affected Controls
                  </h4>
                  <div className="detail-panel__controls-grid">
                    {selectedAlert.affected_controls.map((ctrl, i) => (
                      <div key={i} className="detail-panel__control-chip">
                        <span className="detail-panel__control-id">{ctrl.control_id}</span>
                        <span className="detail-panel__control-name">{ctrl.control_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Control Gaps */}
              {selectedAlert.control_gaps && selectedAlert.control_gaps.length > 0 && (
                <div className="detail-panel__section">
                  <h4 className="detail-panel__section-title">
                    <XCircle size={14} style={{ color: "var(--severity-critical)" }} /> Control Gaps
                  </h4>
                  <ul className="detail-panel__list detail-panel__list--warning">
                    {selectedAlert.control_gaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {selectedAlert.recommended_actions && selectedAlert.recommended_actions.length > 0 && (
                <div className="detail-panel__section">
                  <h4 className="detail-panel__section-title">
                    <CheckCircle2 size={14} style={{ color: "var(--confidence-high)" }} /> Recommended Actions
                  </h4>
                  {selectedAlert.recommended_actions.map((action, i) => (
                    <div key={i} className="detail-panel__action-card">
                      <div className="detail-panel__action-header">
                        <span className={`priority-tag priority-tag--${(action.priority || "P2").toLowerCase()}`}>
                          {action.priority || "P2"}
                        </span>
                        <span className="detail-panel__action-owner">
                          <Users size={12} /> {action.suggested_owner || "Unassigned"}
                        </span>
                        <span className="detail-panel__action-deadline">
                          <Clock size={12} /> {action.suggested_deadline_days || 30} days
                        </span>
                      </div>
                      <p className="detail-panel__action-desc">{action.task_description}</p>
                      {action.evidence_required && (
                        <div className="detail-panel__action-evidence">
                          📎 Evidence: {action.evidence_required}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Prediction Signals */}
              {selectedAlert.prediction_signals && selectedAlert.prediction_signals.length > 0 && (
                <div className="detail-panel__section">
                  <h4 className="detail-panel__section-title">📈 Prediction Signals</h4>
                  <div className="detail-panel__signals">
                    {selectedAlert.prediction_signals.map((sig, i) => (
                      <div key={i} className="detail-panel__signal-chip">{sig}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevance Score */}
              {selectedAlert.relevance_score != null && (
                <div className="detail-panel__section">
                  <h4 className="detail-panel__section-title">Relevance Score</h4>
                  <div className="detail-panel__relevance">
                    <div className="detail-panel__relevance-bar">
                      <div
                        className="detail-panel__relevance-fill"
                        style={{ width: `${(selectedAlert.relevance_score || 0) * 100}%` }}
                      />
                    </div>
                    <span className="detail-panel__relevance-value">
                      {Math.round((selectedAlert.relevance_score || 0) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Generate Policy Button */}
              <button
                className="btn-analyze detail-panel__draft-btn"
                onClick={() => generatePolicyDraft(selectedAlert)}
                style={{ width: "100%", justifyContent: "center", marginTop: "var(--space-md)" }}
              >
                <Shield size={16} /> Draft Updated Policy
              </button>
            </div>
          )}

          {/* ── Policy Draft Tab ── */}
          {activeTab === "policy" && (
            <div className="detail-panel__body">
              {policyLoading && (
                <div className="detail-panel__policy-loading">
                  <Loader2 size={32} className="btn-analyze__spinner" style={{ color: "var(--color-primary)" }} />
                  <p>Generating policy draft based on regulatory change...</p>
                  <span className="detail-panel__policy-loading-sub">
                    This may take 15–30 seconds
                  </span>
                </div>
              )}

              {policyError && (
                <div className="inline-error">
                  <AlertTriangle size={16} />
                  <span>Failed to generate policy: {policyError}</span>
                </div>
              )}

              {policyDraft && !policyLoading && (
                <div className="detail-panel__policy-content">
                  <div className="detail-panel__policy-header">
                    <Shield size={18} style={{ color: "var(--color-primary)" }} />
                    <div>
                      <h4>AI-Generated Policy Draft</h4>
                      <span>Based on: {selectedAlert.title}</span>
                    </div>
                  </div>
                  <div className="detail-panel__policy-text">
                    {policyDraft.split("\n").map((line, i) => {
                      // Format markdown-like headings
                      if (line.startsWith("# ")) {
                        return <h3 key={i} className="dpol-h1">{line.replace("# ", "")}</h3>;
                      }
                      if (line.startsWith("## ")) {
                        return <h4 key={i} className="dpol-h2">{line.replace("## ", "")}</h4>;
                      }
                      if (line.startsWith("### ")) {
                        return <h5 key={i} className="dpol-h3">{line.replace("### ", "")}</h5>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return <li key={i} className="dpol-li">{line.replace(/^[-*] /, "")}</li>;
                      }
                      if (line.match(/^\d+\.\s/)) {
                        return <li key={i} className="dpol-li dpol-li--numbered">{line}</li>;
                      }
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return <p key={i} className="dpol-bold">{line.replace(/\*\*/g, "")}</p>;
                      }
                      if (line.trim() === "") {
                        return <br key={i} />;
                      }
                      return <p key={i} className="dpol-p">{line}</p>;
                    })}
                  </div>
                  <div className="detail-panel__policy-actions">
                    <button
                      className="btn-analyze"
                      onClick={() => {
                        navigator.clipboard.writeText(policyDraft);
                        alert("Policy draft copied to clipboard!");
                      }}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      📋 Copy to Clipboard
                    </button>
                    <button
                      className="btn-analyze"
                      onClick={() => generatePolicyDraft(selectedAlert)}
                      style={{ flex: 1, justifyContent: "center", background: "linear-gradient(135deg, #10B981, #059669)" }}
                    >
                      🔄 Regenerate
                    </button>
                  </div>
                </div>
              )}

              {!policyDraft && !policyLoading && !policyError && (
                <div className="detail-panel__policy-empty">
                  <Shield size={40} style={{ opacity: 0.3 }} />
                  <p>Click "Draft Updated Policy" to generate an AI policy draft based on this regulatory change.</p>
                  <button
                    className="btn-analyze"
                    onClick={() => generatePolicyDraft(selectedAlert)}
                    style={{ marginTop: "var(--space-md)" }}
                  >
                    <Shield size={16} /> Generate Policy Draft
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
