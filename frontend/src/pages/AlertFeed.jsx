// AlertFeed.jsx — Searchable alert table with filter pills
// ===========================================================
import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { Search, Eye, X } from "lucide-react";

const SEVERITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"];
const STATUS_FILTERS = ["All", "Action Required", "In Progress", "Resolved"];
const CATEGORY_FILTERS = ["All", "Corporate Governance", "AML/CFT", "Securities", "Data Privacy", "Banking & Finance"];

export default function AlertFeed() {
  const { filteredUpdates, loading } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

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
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !(item.title || "").toLowerCase().includes(q) &&
          !(item.summary || "").toLowerCase().includes(q) &&
          !(item.source || "").toLowerCase().includes(q)
        )
          return false;
      }
      // Severity
      if (severityFilter !== "All" && (item.urgency || "").toLowerCase() !== severityFilter.toLowerCase())
        return false;
      // Status
      if (statusFilter !== "All" && getDisplayStatus(item) !== statusFilter)
        return false;
      // Category
      if (categoryFilter !== "All" && (item.regulatory_topic || "") !== categoryFilter)
        return false;

      return true;
    });
  }, [filteredUpdates, searchQuery, severityFilter, statusFilter, categoryFilter]);

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

  // Loading
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
    <div className="animate-fade-in">
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
        {/* Severity */}
        <div className="filter-group">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill ${severityFilter === f ? "filter-pill--active" : ""}`}
              onClick={() => setSeverityFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="filter-group">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill ${statusFilter === f ? "filter-pill--active" : ""}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="filter-group">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill ${categoryFilter === f ? "filter-pill--active" : ""}`}
              onClick={() => setCategoryFilter(f)}
            >
              {f}
            </button>
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
                return (
                  <tr key={item.id}>
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
                        <span className="jurisdiction-tag__code">
                          {getJurisdictionCode(item.jurisdiction)}
                        </span>
                        {item.jurisdiction}
                      </span>
                    </td>
                    <td>{item.regulatory_topic || "General"}</td>
                    <td>{formatDate(item.published_at)}</td>
                    <td>
                      <span className={`status-badge status-badge--${statusClass}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td>
                      <div className="alert-table__actions">
                        <button className="alert-table__action-btn" title="View">
                          <Eye size={16} />
                        </button>
                        <button className="alert-table__action-btn" title="Dismiss">
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
  );
}
