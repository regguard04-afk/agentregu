// UpdatesFeed.jsx — Left panel showing the list of regulatory update cards
// ========================================================================
// Features:
//   • Fetches updates from GET /api/updates
//   • Search filter (keyword on title/summary)
//   • Dropdown filters: jurisdiction, urgency, topic
//   • Auto-refresh every 30 seconds
//   • Loading skeletons while fetching
//   • Click a card to select it (notifies parent via onSelectUpdate)

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, RefreshCw, Inbox } from "lucide-react";
import { getUpdates } from "../services/dataService.js";
import UrgencyBadge from "./UrgencyBadge.jsx";

export default function UpdatesFeed({ selectedId, onSelectUpdate, refreshKey }) {
  // ── State ──────────────────────────────────────────────
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJurisdiction, setFilterJurisdiction] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [filterTopic, setFilterTopic] = useState("");

  const intervalRef = useRef(null);

  // ── Fetch updates ──────────────────────────────────────
  async function fetchUpdates() {
    try {
      const data = await getUpdates();
      // API may return an array directly or inside a wrapper object
      const list = Array.isArray(data) ? data : data.updates || data.data || [];
      setUpdates(list);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount + auto-refresh every 30 seconds
  useEffect(() => {
    fetchUpdates();
    intervalRef.current = setInterval(fetchUpdates, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Re-fetch when parent triggers a refresh (e.g., after Run Analysis)
  useEffect(() => {
    if (refreshKey > 0) {
      setLoading(true);
      fetchUpdates();
    }
  }, [refreshKey]);

  // ── Extract unique filter options from data ────────────
  const jurisdictions = useMemo(
    () => [...new Set(updates.map((u) => u.jurisdiction).filter(Boolean))].sort(),
    [updates]
  );
  const urgencies = ["critical", "high", "medium", "low"];
  const topics = useMemo(
    () => [...new Set(updates.map((u) => u.regulatory_topic).filter(Boolean))].sort(),
    [updates]
  );

  // ── Apply filters ──────────────────────────────────────
  const filtered = useMemo(() => {
    return updates.filter((item) => {
      // Search filter (checks title + summary)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const summaryMatch = (item.summary || "").toLowerCase().includes(q);
        if (!titleMatch && !summaryMatch) return false;
      }
      // Jurisdiction filter
      if (filterJurisdiction && item.jurisdiction !== filterJurisdiction) return false;
      // Urgency filter
      if (filterUrgency && item.urgency !== filterUrgency) return false;
      // Topic filter
      if (filterTopic && item.regulatory_topic !== filterTopic) return false;

      return true;
    });
  }, [updates, searchQuery, filterJurisdiction, filterUrgency, filterTopic]);

  // ── Format date helper ─────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // ── Loading skeleton ───────────────────────────────────
  if (loading) {
    return (
      <aside className="updates-panel" id="updates-panel">
        <div className="updates-panel__header">
          <div className="updates-panel__title">Regulatory Updates</div>
        </div>
        <div className="updates-list">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-line skeleton-line--title" />
              <div className="skeleton skeleton-line skeleton-line--medium" />
              <div className="skeleton skeleton-line skeleton-line--short" />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // ── Error state ────────────────────────────────────────
  if (error) {
    return (
      <aside className="updates-panel" id="updates-panel">
        <div className="updates-panel__header">
          <div className="updates-panel__title">Regulatory Updates</div>
        </div>
        <div style={{ padding: "var(--space-md)" }}>
          <div className="inline-error">
            <span className="inline-error__icon">⚠</span>
            {error}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="updates-panel" id="updates-panel">
      {/* ── Panel Header + Filters ── */}
      <div className="updates-panel__header">
        <div className="updates-panel__title">
          <RefreshCw size={16} style={{ opacity: 0.5 }} />
          Regulatory Updates
          <span className="updates-panel__count">{filtered.length}</span>
        </div>

        {/* Filter controls */}
        <div className="filter-bar">
          {/* Search box */}
          <div className="filter-bar__search">
            <Search size={15} className="filter-bar__search-icon" />
            <input
              type="text"
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="updates-search"
            />
          </div>

          {/* Dropdown filters */}
          <div className="filter-bar__selects">
            <select
              value={filterJurisdiction}
              onChange={(e) => setFilterJurisdiction(e.target.value)}
              id="filter-jurisdiction"
            >
              <option value="">All Jurisdictions</option>
              {jurisdictions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>

            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              id="filter-urgency"
            >
              <option value="">All Urgency</option>
              {urgencies.map((u) => (
                <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
              ))}
            </select>

            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              id="filter-topic"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Updates List ── */}
      <div className="updates-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Inbox size={40} />
            </div>
            <div className="empty-state__title">No updates found</div>
            <p className="empty-state__text">
              {updates.length === 0
                ? 'Click "Run Analysis" to fetch regulatory updates.'
                : "Try adjusting your filters or search query."}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`update-card${selectedId === item.id ? " update-card--selected" : ""}`}
              onClick={() => onSelectUpdate(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectUpdate(item)}
            >
              <div className="update-card__top">
                <span className="update-card__title">{item.title}</span>
                <UrgencyBadge level={item.urgency} />
              </div>
              <div className="update-card__meta">
                <span className="update-card__source">{item.source}</span>
                <span className="update-card__dot" />
                <span>{item.jurisdiction}</span>
                <span className="update-card__dot" />
                <span>{formatDate(item.published_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
