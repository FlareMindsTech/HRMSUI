import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaCog, FaCodeBranch, FaBuilding } from "react-icons/fa";
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
    isSystemAdmin ||
    isOwner ||
    (hasPermission && (
      hasPermission("orgSettings.view") ||
      hasPermission("organizationSettings.view") ||
      hasPermission("attendance.modify") ||
      hasPermission("leave.policy.manage") ||
      hasPermission("payroll.view") ||
      hasPermission("payroll.update")
    ));

  const canBranchSettings =
    isSystemAdmin ||
    isOwner ||
    (hasPermission && (hasPermission("branch.view") || hasPermission("branch.update")));

  // If user only has branch access (e.g. Branch Head), lock them to their assigned branch
  const userBranchId = user?.branchId?._id || user?.branchId || user?.assignedBranchIds?.[0] || null;
  const lockedBranchId = (!isOwner && !isSystemAdmin && !hasPermission?.("orgSettings.view") && !hasPermission?.("organizationSettings.view"))
    ? userBranchId
    : null;

  // Determine active tab from URL or query, respecting permission restrictions
  const queryTab = new URLSearchParams(location.search).get("tab");
  const rawSubtab = subtab || queryTab;

  let initialTab = "organization";
  if (!canOrgSettings && canBranchSettings) {
    initialTab = "branches";
  } else if (rawSubtab === "branches" || rawSubtab === "branch") {
    initialTab = canBranchSettings ? "branches" : "organization";
  } else {
    initialTab = canOrgSettings ? "organization" : "branches";
  }

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!canOrgSettings && canBranchSettings) {
      setActiveTab("branches");
    } else if (subtab === "branches" || subtab === "branch" || queryTab === "branches") {
      if (canBranchSettings) setActiveTab("branches");
    } else if (canOrgSettings) {
      setActiveTab("organization");
    }
  }, [subtab, queryTab, canOrgSettings, canBranchSettings]);

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
        {!canOrgSettings && !canBranchSettings ? (
          <div className="text-center py-5 bg-white rounded-3 border">
            <h5 className="text-secondary fw-bold mb-2">Access Restricted</h5>
            <p className="text-muted small mb-0">
              You do not have administrative permissions to view or modify Enterprise Settings.
            </p>
          </div>
        ) : activeTab === "branches" ? (
          <BranchSettingsSection
            lockedBranchId={lockedBranchId}
            onNavigateTab={handleNavigateOrgTab}
          />
        ) : (
          <OrganizationSettingsSection onNavigateTab={handleNavigateOrgTab} />
        )}
      </div>
    </div>
  );
}
