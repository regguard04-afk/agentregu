// Sidebar.jsx — Left navigation sidebar matching reference UI
// ===========================================================
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bell,
  ClipboardList,
  Radio,
  ShieldCheck,
  Search,
  Settings,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/alerts", label: "Alert Feed", icon: Bell, badge: true },
  { path: "/predictions", label: "Predictions", icon: Radio },
  { path: "/query", label: "Query Engine", icon: Search },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ alertCount = 0 }) {
  const location = useLocation();

  // Calculate posture score circumference for SVG ring
  const score = 73;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Shield size={20} />
        </div>
        <div className="sidebar__brand-text">
          <h1>RegGuard</h1>
          <span>Regulatory Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <li key={item.path} className="sidebar__nav-item">
                <NavLink
                  to={item.path}
                  className={`sidebar__nav-link ${isActive ? "sidebar__nav-link--active" : ""}`}
                >
                  <Icon size={20} className="nav-icon" />
                  {item.label}
                  {item.badge && alertCount > 0 && (
                    <span className="sidebar__badge">{alertCount}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Posture Score Widget */}
      <div className="sidebar__posture">
        <div className="posture-ring">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              className="posture-ring__bg"
              cx="50"
              cy="50"
              r={radius}
            />
            <circle
              className="posture-ring__fill"
              cx="50"
              cy="50"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="posture-ring__value">{score}</div>
        </div>
        <div className="posture-ring__label">Posture Score</div>
      </div>
    </aside>
  );
}
