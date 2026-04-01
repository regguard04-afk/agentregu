// Settings.jsx — Settings page with company info and notification toggles
// =========================================================================
import React, { useState, useEffect } from "react";

// Load settings from localStorage or use defaults
function loadSettings() {
  try {
    const saved = localStorage.getItem("regguard_settings");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    companyName: "Acme Financial Services",
    jurisdictions: ["India", "EU"],
    emailAlerts: true,
    criticalAlerts: true,
    weeklyDigest: false,
    slackIntegration: false,
    autoAssign: true,
  };
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("regguard_settings", JSON.stringify(settings));
  }, [settings]);

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700 }}>
      {/* Company Settings */}
      <div className="settings-section">
        <h3 className="settings-section__title">Company Settings</h3>

        <div className="settings-field">
          <label className="settings-field__label">Company Name</label>
          <input
            className="settings-field__input"
            type="text"
            value={settings.companyName}
            onChange={(e) => updateSetting("companyName", e.target.value)}
          />
        </div>

        <div className="settings-field">
          <label className="settings-field__label">Jurisdiction Focus</label>
          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            {["India", "EU", "US", "Global", "Singapore", "UK"].map((j) => {
              const isSelected = settings.jurisdictions.includes(j);
              return (
                <button
                  key={j}
                  className={`filter-pill ${isSelected ? "filter-pill--active" : ""}`}
                  style={{ borderRadius: "var(--radius-full)" }}
                  onClick={() => {
                    if (isSelected) {
                      updateSetting(
                        "jurisdictions",
                        settings.jurisdictions.filter((x) => x !== j)
                      );
                    } else {
                      updateSetting("jurisdictions", [...settings.jurisdictions, j]);
                    }
                  }}
                >
                  {j}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="settings-section">
        <h3 className="settings-section__title">Notification Preferences</h3>

        <div className="toggle-row">
          <div className="toggle-row__info">
            <div className="toggle-row__label">Email Alerts</div>
            <div className="toggle-row__desc">
              Receive email notifications for new regulatory updates
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) => updateSetting("emailAlerts", e.target.checked)}
            />
            <span className="toggle-switch__slider" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-row__info">
            <div className="toggle-row__label">Critical Alert Push</div>
            <div className="toggle-row__desc">
              Get instant push notifications for critical severity updates
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.criticalAlerts}
              onChange={(e) => updateSetting("criticalAlerts", e.target.checked)}
            />
            <span className="toggle-switch__slider" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-row__info">
            <div className="toggle-row__label">Weekly Digest</div>
            <div className="toggle-row__desc">
              Receive a weekly summary of all regulatory changes
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.weeklyDigest}
              onChange={(e) => updateSetting("weeklyDigest", e.target.checked)}
            />
            <span className="toggle-switch__slider" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-row__info">
            <div className="toggle-row__label">Slack Integration</div>
            <div className="toggle-row__desc">
              Send alerts to your team's Slack channel
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.slackIntegration}
              onChange={(e) => updateSetting("slackIntegration", e.target.checked)}
            />
            <span className="toggle-switch__slider" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-row__info">
            <div className="toggle-row__label">Auto-Assign Tasks</div>
            <div className="toggle-row__desc">
              Automatically assign action plan tasks to team members
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.autoAssign}
              onChange={(e) => updateSetting("autoAssign", e.target.checked)}
            />
            <span className="toggle-switch__slider" />
          </label>
        </div>
      </div>
    </div>
  );
}
