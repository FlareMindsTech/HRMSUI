import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaCog, FaCodeBranch, FaSlidersH, FaBuilding } from "react-icons/fa";
import {
  selectAuthUser,
  selectIsSystemAdmin,
  useHasPermission,
} from "../../redux/slices/authSlice";
import OrganizationSettingsSection from "../../Components/Organisation/OrganizationSettingsSection";
import BranchSettingsSection from "../../Components/Organisation/BranchSettingsSection";
import "./SettingsPage.css";

/**
 * Dedicated Enterprise Settings Page (/settings, /settings/organization, /settings/branches)
 * Decoupled entirely from the inside of Organisation module.
 */
export default function SettingsPage() {
  const { subtab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const hasPermission = useHasPermission();

  const isOwner =
    user?.roleCode === "OWNER" ||
    user?.priority === 1 ||
    user?.role === "OWNER" ||
    user?.permissions?.includes("*");

  const canOrgSettings =
    isSystemAdmin || isOwner || (hasPermission && hasPermission("orgSettings.view"));
  const canBranchSettings =
    isSystemAdmin || isOwner || (hasPermission && (hasPermission("branch.view") || hasPermission("branch.update")));

  // Determine active tab from URL or query
  const queryTab = new URLSearchParams(location.search).get("tab");
  const resolvedSubtab = subtab || queryTab || "organization";

  const [activeTab, setActiveTab] = useState(
    resolvedSubtab === "branches" || resolvedSubtab === "branch" ? "branches" : "organization"
  );

  useEffect(() => {
    if (subtab === "branches" || subtab === "branch" || queryTab === "branches") {
      setActiveTab("branches");
    } else {
      setActiveTab("organization");
    }
  }, [subtab, queryTab]);

  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);
      navigate(newTab === "branches" ? "/settings/branches" : "/settings/organization");
    },
    [navigate]
  );

  const handleNavigateOrgTab = useCallback(
    (tabKey) => {
      navigate(`/organisation/${tabKey}`);
    },
    [navigate]
  );

  return (
    <div className="settings-page-container">
      {/* ── 1. Top Executive Header Bar ── */}
      <div className="settings-header-bar">
        <div>
          <div className="settings-breadcrumb">
            <span
              className="settings-breadcrumb-root"
              onClick={() => navigate("/dashboard")}
              role="button"
              tabIndex={0}
            >
              Dashboard
            </span>
            <span>/</span>
            <span className="settings-breadcrumb-current">Settings</span>
            <span>/</span>
            <span className="settings-breadcrumb-current">
              {activeTab === "branches" ? "Branch Settings" : "Organization Settings"}
            </span>
          </div>

          <div className="settings-title-row">
            <div className="settings-icon-badge">
              <FaCog />
            </div>
            <div>
              <h2 className="settings-title">Enterprise Settings</h2>
              <p className="settings-subtitle">
                Configure organizational rules, appearance theme, attendance enforcement, and branch-level settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Segment Navigation Tabs Bar ── */}
      <div className="settings-tabs-bar" role="tablist">
        {canOrgSettings && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "organization"}
            className={`settings-tab-btn ${activeTab === "organization" ? "active" : ""}`}
            onClick={() => handleTabChange("organization")}
          >
            <FaBuilding className="settings-tab-icon" />
            <span>Organization Settings</span>
          </button>
        )}

        {canBranchSettings && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "branches"}
            className={`settings-tab-btn ${activeTab === "branches" ? "active" : ""}`}
            onClick={() => handleTabChange("branches")}
          >
            <FaCodeBranch className="settings-tab-icon" />
            <span>Branch Settings</span>
          </button>
        )}
      </div>

      {/* ── 3. Active Settings Workspace Viewport ── */}
      <div className="settings-content-viewport">
        {activeTab === "branches" ? (
          <BranchSettingsSection onNavigateTab={handleNavigateOrgTab} />
        ) : (
          <OrganizationSettingsSection onNavigateTab={handleNavigateOrgTab} />
        )}
      </div>
    </div>
  );
}
