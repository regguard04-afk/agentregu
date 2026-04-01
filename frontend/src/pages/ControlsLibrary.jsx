// ControlsLibrary.jsx — Controls grid with search and filters
// =============================================================
import React, { useState, useEffect, useMemo } from "react";
import { getControls } from "../services/dataService.js";
import {
  ShieldCheck,
  Search,
  Filter,
  Link2,
  Calendar,
} from "lucide-react";

// Fallback data if API returns empty
const FALLBACK_CONTROLS = [
  {
    control_id: "CTRL-001",
    control_name: "Data Deletion Procedures",
    category: "Data Privacy",
    description: "Automated data deletion workflow with audit trail",
    status: "active",
    linked_regulations: ["GDPR", "DPDP Act"],
    last_reviewed: "2026-04-01",
  },
  {
    control_id: "CTRL-002",
    control_name: "Digital Lending Controls",
    category: "Banking & Finance",
    description: "Controls for digital lending operations including escrow management",
    status: "review",
    linked_regulations: ["RBI Guidelines"],
    last_reviewed: "2026-04-01",
  },
  {
    control_id: "CTRL-003",
    control_name: "Transaction Monitoring",
    category: "AML/CFT",
    description: "Real-time monitoring of financial transactions for AML compliance",
    status: "active",
    linked_regulations: ["FATF", "PMLA"],
    last_reviewed: "2026-04-01",
  },
  {
    control_id: "CTRL-004",
    control_name: "Margin Management",
    category: "Securities",
    description: "Automated margin calculation and collection procedures",
    status: "active",
    linked_regulations: ["SEBI Regulations"],
    last_reviewed: "2026-04-01",
  },
  {
    control_id: "CTRL-005",
    control_name: "KYC Procedures",
    category: "AML/CFT",
    description: "Customer identification and verification processes",
    status: "active",
    linked_regulations: ["RBI KYC", "FATF"],
    last_reviewed: "2026-04-01",
  },
  {
    control_id: "CTRL-006",
    control_name: "Data Retention Policy",
    category: "Data Privacy",
    description: "Policy defining data retention periods by category",
    status: "active",
    linked_regulations: ["GDPR", "DPDP Act", "IT Act"],
    last_reviewed: "2026-04-01",
  },
  {
    control_id: "CTRL-007",
    control_name: "Board Compliance Reporting",
    category: "Corporate Governance",
    description: "Quarterly board reporting on compliance metrics",
    status: "active",
    linked_regulations: ["Companies Act", "SEBI LODR"],
    last_reviewed: "2026-03-15",
  },
  {
    control_id: "CTRL-008",
    control_name: "Whistleblower Mechanism",
    category: "Corporate Governance",
    description: "Anonymous reporting channel for compliance violations",
    status: "review",
    linked_regulations: ["Companies Act"],
    last_reviewed: "2026-03-20",
  },
];

const CATEGORY_PILLS = ["All", "Data Privacy", "Banking & Finance", "AML/CFT", "Securities", "Corporate Governance"];
const STATUS_PILLS = ["All", "Active", "Under Review", "Deprecated"];

export default function ControlsLibrary() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function fetchControls() {
      try {
        const data = await getControls();
        const list = Array.isArray(data) ? data : data.controls || [];
        if (list.length > 0) {
          // Normalize API data
          const normalized = list.map((c, i) => ({
            control_id: c.control_id || `CTRL-${String(i + 1).padStart(3, "0")}`,
            control_name: c.control_name || c.name || `Control ${i + 1}`,
            category: c.category || c.regulatory_topic || "General",
            description: c.description || c.policy_name || "",
            status: (c.status || "active").toLowerCase().includes("review") ? "review" : "active",
            linked_regulations: c.linked_regulations || c.regulations || [],
            last_reviewed: c.last_reviewed || c.updated_at || new Date().toISOString(),
          }));
          setControls(normalized);
        } else {
          setControls(FALLBACK_CONTROLS);
        }
      } catch {
        setControls(FALLBACK_CONTROLS);
      } finally {
        setLoading(false);
      }
    }
    fetchControls();
  }, []);

  // Apply filters
  const filtered = useMemo(() => {
    return controls.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.control_name.toLowerCase().includes(q) &&
          !c.description.toLowerCase().includes(q) &&
          !c.category.toLowerCase().includes(q)
        )
          return false;
      }
      if (categoryFilter !== "All" && c.category !== categoryFilter) return false;
      if (statusFilter !== "All") {
        if (statusFilter === "Active" && c.status !== "active") return false;
        if (statusFilter === "Under Review" && c.status !== "review") return false;
        if (statusFilter === "Deprecated" && c.status !== "deprecated") return false;
      }
      return true;
    });
  }, [controls, searchQuery, categoryFilter, statusFilter]);

  // Stats
  const totalControls = controls.length;
  const activeCount = controls.filter((c) => c.status === "active").length;
  const reviewCount = controls.filter((c) => c.status === "review").length;
  const categories = [...new Set(controls.map((c) => c.category))].length;

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
        Your organization&apos;s compliance controls mapped to regulatory requirements.
      </p>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card stat-card--blue">
          <div>
            <div className="stat-card__value" style={{ color: "var(--color-primary)" }}>{totalControls}</div>
            <div className="stat-card__label">Total Controls</div>
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <div>
            <div className="stat-card__value" style={{ color: "var(--confidence-high)" }}>{activeCount}</div>
            <div className="stat-card__label">Active</div>
          </div>
        </div>
        <div className="stat-card stat-card--high">
          <div>
            <div className="stat-card__value" style={{ color: "var(--severity-high)" }}>{reviewCount}</div>
            <div className="stat-card__label">Under Review</div>
          </div>
        </div>
        <div className="stat-card stat-card--medium">
          <div>
            <div className="stat-card__value" style={{ color: "var(--severity-medium)" }}>{categories}</div>
            <div className="stat-card__label">Categories</div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-lg)", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <Search size={18} className="search-bar__icon" />
          <input
            type="text"
            className="search-bar__input"
            placeholder="Search controls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {CATEGORY_PILLS.map((f) => (
            <button
              key={f}
              className={`filter-pill ${categoryFilter === f ? "filter-pill--active" : ""}`}
              onClick={() => setCategoryFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="filter-group">
          {STATUS_PILLS.map((f) => (
            <button
              key={f}
              className={`filter-pill ${statusFilter === f ? "filter-pill--active" : ""}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="controls-grid">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <div className="empty-state__title">No controls match your search</div>
          </div>
        ) : (
          filtered.map((control) => (
            <div key={control.control_id} className="control-card">
              <div className="control-card__header">
                <div className="control-card__icon">
                  <ShieldCheck size={16} />
                </div>
                <span
                  className={`control-status-badge control-status-badge--${control.status === "review" ? "review" : "active"}`}
                >
                  <span className="control-status-badge__dot" />
                  {control.status === "review" ? "Under Review" : "Active"}
                </span>
              </div>

              <div className="control-card__name">{control.control_name}</div>
              <div className="control-card__category">{control.category}</div>
              <div className="control-card__description">{control.description}</div>

              {control.linked_regulations && control.linked_regulations.length > 0 && (
                <div className="control-card__linked">
                  <div className="control-card__linked-label">
                    <Link2 size={12} />
                    Linked Regulations
                  </div>
                  <div className="control-card__linked-tags">
                    {control.linked_regulations.map((reg, i) => (
                      <span key={i} className="linked-reg-tag">{reg}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="control-card__reviewed">
                <Calendar size={12} />
                Last reviewed: {formatDate(control.last_reviewed)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
