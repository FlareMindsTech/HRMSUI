import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaCalendarCheck,
  FaBuilding,
  FaGlobe,
  FaMapMarkerAlt,
  FaWifi,
  FaClock,
  FaSave,
  FaUndo,
  FaCheckCircle,
  FaLayerGroup,
  FaFingerprint,
  FaUserEdit,
  FaInfoCircle,
  FaShieldAlt,
  FaNetworkWired,
} from "react-icons/fa";
import {
  fetchOrganizationSettings,
  updateOrganizationSettings,
  fetchBranchesDropdown,
  fetchBranchById,
  updateBranch,
  fetchWorkCalendarsDropdown,
  fetchShiftsDropdown,
  fetchHolidayCalendarsDropdown,
} from "../../services/organizationService";
import {
  fetchAttendanceSettings,
  updateAttendanceSettings,
} from "../../Api/Attendance/attendance";
import { useBranch } from "../../context/BranchContext";
import { useSelector } from "react-redux";
import { useHasPermission, selectAuthUser } from "../../redux/slices/authSlice";
import FeedbackAlert from "../Common/FeedbackAlert";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +5:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST +4:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +8:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "UTC", label: "UTC" },
];

/**
 * Professional HRMS Display Cards for Verification Modes
 * Preserves exact backend enum values ("GEOFENCE", "STATIC_IP", "BOTH", "MANUAL", "BIOMETRIC", "ANY")
 * with transparent backward compatibility for ("GPS_RADIUS", "OFFICE_WIFI", "HYBRID", "FLEXIBLE", "GPS")
 */
const VERIFICATION_OPTIONS = [
  {
    key: "GEOFENCE",
    aliases: ["GPS_RADIUS", "GPS"],
    title: "Location / Geofence",
    badgeText: "Location Radius",
    icon: FaMapMarkerAlt,
    description: "Uses the registered office location and allowed perimeter radius for mobile/desktop punches.",
    category: "location",
  },
  {
    key: "STATIC_IP",
    aliases: ["OFFICE_WIFI", "STRICT_STATIC_IP"],
    title: "Wi-Fi / Office Network",
    badgeText: "Static IP Only",
    icon: FaWifi,
    description: "Restricts clock-ins to the organization or branch's registered office network IP gateway.",
    category: "network",
  },
  {
    key: "BOTH",
    aliases: ["HYBRID"],
    title: "Both (Geofence + Wi-Fi)",
    badgeText: "Dual Verification",
    icon: FaNetworkWired,
    description: "Requires employee to be within the geofence perimeter AND connected to the office network.",
    category: "both",
  },
  {
    key: "MANUAL",
    aliases: [],
    title: "Manual Override Only",
    badgeText: "Admin Regularized",
    icon: FaUserEdit,
    description: "Self punch-in and punch-out are disabled. Attendance records require manual entry or regularization by HR/Admin.",
    category: "manual",
  },
  {
    key: "BIOMETRIC",
    aliases: [],
    title: "Biometric Integration",
    badgeText: "Hardware Machine",
    icon: FaFingerprint,
    description: "Seamless synchronization from physical biometric fingerprint/facial scan terminals.",
    category: "biometric",
  },
];

const PRIMARY_VERIFICATION_OPTIONS = VERIFICATION_OPTIONS.filter(
  (opt) => opt.key !== "BIOMETRIC"
);
const BIOMETRIC_OPTION = VERIFICATION_OPTIONS.find(
  (opt) => opt.key === "BIOMETRIC"
);

// Helper to normalize any incoming backend/legacy value to our canonical options
const getCanonicalMode = (val) => {
  if (!val) return "GEOFENCE";
  const upper = String(val).toUpperCase();
  for (const opt of VERIFICATION_OPTIONS) {
    if (opt.key === upper || opt.aliases.includes(upper)) {
      return opt.key;
    }
  }
  if (upper === "FLEXIBLE" || upper === "ANY") return "GEOFENCE";
  return upper;
};

// Helper to normalize any incoming staticIp value (string, object, array, null/undefined) to a display string
export const normalizeStaticIpDisplay = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val)) {
    return val.map((s) => String(s || "").trim()).filter(Boolean).join(", ");
  }
  if (typeof val === "object") {
    if (Array.isArray(val.allowedIps)) {
      return val.allowedIps.map((s) => String(s || "").trim()).filter(Boolean).join(", ");
    }
    if (typeof val.staticIp === "string") {
      return val.staticIp.trim();
    }
    if (typeof val.ip === "string") {
      return val.ip.trim();
    }
  }
  return "";
};

// Helper to convert any staticIp input (string, object, array, null/undefined) to clean array of unique IP strings
export const normalizeAllowedIpsArray = (val) => {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) {
    return Array.from(new Set(val.map((s) => String(s || "").trim()).filter(Boolean)));
  }
  let strToProcess = "";
  if (typeof val === "string") {
    strToProcess = val;
  } else if (typeof val === "object") {
    if (Array.isArray(val.allowedIps)) {
      return Array.from(new Set(val.allowedIps.map((s) => String(s || "").trim()).filter(Boolean)));
    }
    if (typeof val.staticIp === "string") {
      strToProcess = val.staticIp;
    } else if (typeof val.ip === "string") {
      strToProcess = val.ip;
    } else {
      return [];
    }
  } else {
    strToProcess = String(val || "");
  }

  return Array.from(
    new Set(
      strToProcess
        .split(",")
        .map((s) => String(s || "").trim())
        .filter(Boolean)
    )
  );
};

export default function AttendanceWorkspaceSection({ onNavigateTab }) {
  const hasPermission = useHasPermission();
  const authUser = useSelector(selectAuthUser);
  const isOwner =
    authUser?.priority === 1 ||
    (authUser?.roleCode || authUser?.roleName || "").toUpperCase() === "OWNER";

  const {
    branches: contextBranches,
    selectedBranchId,
    lockedBranchId,
    refreshBranches,
  } = useBranch();

  const canEditOrg = isOwner || Boolean(hasPermission && hasPermission("organization.update"));
  const canEditBranch = isOwner || Boolean(hasPermission && hasPermission("branch.update"));

  // Unified Configuration Scope: "ORG_DEFAULTS" or a specific branch._id
  const [configScope, setConfigScope] = useState("ORG_DEFAULTS");

  // Feedback notifications
  const [orgAlert, setOrgAlert] = useState({ type: "", message: "" });
  const [branchAlert, setBranchAlert] = useState({ type: "", message: "" });

  // Common Dropdowns
  const [shifts, setShifts] = useState([]);
  const [workCalendars, setWorkCalendars] = useState([]);
  const [holidayCalendars, setHolidayCalendars] = useState([]);
  const [branchesList, setBranchesList] = useState([]);

  // ==========================================
  // Tab 1: Organization Defaults State
  // ==========================================
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgAttendanceMode, setOrgAttendanceMode] = useState("GEOFENCE");
  const [orgStaticIp, setOrgStaticIp] = useState("");
  const [standardWorkingMinutes, setStandardWorkingMinutes] = useState(480);
  const [halfDayMinutes, setHalfDayMinutes] = useState(240);
  const [lateCutoff, setLateCutoff] = useState("");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(15);
  const [orgTimeZone, setOrgTimeZone] = useState("Asia/Kolkata");
  const [orgDefaultShiftId, setOrgDefaultShiftId] = useState("");
  const [orgDefaultWorkCalendarId, setOrgDefaultWorkCalendarId] = useState("");
  const [overtimeEnabled, setOvertimeEnabled] = useState(false);
  const [overtimeStartAfterMinutes, setOvertimeStartAfterMinutes] = useState(30);
  const [minimumOvertimeMinutes, setMinimumOvertimeMinutes] = useState(30);
  const [maximumOvertimeMinutes, setMaximumOvertimeMinutes] = useState(240);
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);
  const [autoCloseCutoffHours, setAutoCloseCutoffHours] = useState(16);
  const [orgDirty, setOrgDirty] = useState(false);

  // ==========================================
  // Tab 2: Branch Configuration State
  // ==========================================
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchSaving, setBranchSaving] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState("");
  const [currentBranchName, setCurrentBranchName] = useState("");
  const [branchAttendanceMode, setBranchAttendanceMode] = useState("GEOFENCE");
  const [branchLatitude, setBranchLatitude] = useState("");
  const [branchLongitude, setBranchLongitude] = useState("");
  const [branchRadiusMeters, setBranchRadiusMeters] = useState(100);
  const [branchAllowedIps, setBranchAllowedIps] = useState("");
  const [branchTimeZone, setBranchTimeZone] = useState("");
  const [branchShiftId, setBranchShiftId] = useState("");
  const [branchCalendarId, setBranchCalendarId] = useState("");
  const [branchHolidayId, setBranchHolidayId] = useState("");
  const [branchDirty, setBranchDirty] = useState(false);

  // Load common dropdowns
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [shiftRes, calRes, holRes] = await Promise.allSettled([
          fetchShiftsDropdown(),
          fetchWorkCalendarsDropdown(),
          fetchHolidayCalendarsDropdown(),
        ]);
        if (shiftRes.status === "fulfilled" && shiftRes.value?.success) {
          setShifts(shiftRes.value.data || []);
        }
        if (calRes.status === "fulfilled" && calRes.value?.success) {
          setWorkCalendars(calRes.value.data || []);
        }
        if (holRes.status === "fulfilled" && holRes.value?.success) {
          setHolidayCalendars(holRes.value.data || []);
        }
      } catch {
        // silent fallback
      }
    }
    loadDropdowns();
  }, []);

  // Load branches list
  useEffect(() => {
    async function loadBranches() {
      if (contextBranches && contextBranches.length > 0) {
        setBranchesList(contextBranches);
      } else {
        try {
          const res = await fetchBranchesDropdown();
          if (res?.success) {
            setBranchesList(res.data || []);
          }
        } catch {
          // silent fallback
        }
      }
    }
    loadBranches();
  }, [contextBranches]);

  // If locked to a branch, enforce branch scope
  useEffect(() => {
    if (lockedBranchId) {
      setConfigScope(lockedBranchId);
      setCurrentBranchId(lockedBranchId);
    }
  }, [lockedBranchId]);

  // Set default selected branch
  useEffect(() => {
    if (!currentBranchId) {
      const targetId =
        lockedBranchId ||
        selectedBranchId ||
        (branchesList.length > 0 ? branchesList[0]._id : "");
      if (targetId) {
        setCurrentBranchId(targetId);
      }
    }
  }, [branchesList, selectedBranchId, lockedBranchId, currentBranchId]);

  const handleScopeChange = (newScope) => {
    setConfigScope(newScope);
    if (newScope !== "ORG_DEFAULTS") {
      setCurrentBranchId(newScope);
      loadBranchConfig(newScope);
    }
  };

  const isOrgScope = configScope === "ORG_DEFAULTS";

  const getBranchDisplayName = (b) => {
    const name = b.branchName || b.name || "Branch";
    const isHq = Boolean(b.isHeadOffice || b.branchType === "HEAD_OFFICE");
    const hasHqLabel =
      name.toUpperCase().includes("HQ") ||
      name.toUpperCase().includes("HEAD OFFICE");
    return isHq && !hasHqLabel ? `${name} (HQ)` : name;
  };

  const branchIpsList = useMemo(() => {
    if (!branchAllowedIps) return [];
    const safeStr = typeof branchAllowedIps === "string" ? branchAllowedIps : normalizeStaticIpDisplay(branchAllowedIps);
    return safeStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [branchAllowedIps]);

  const handleRemoveBranchIp = (ipToRemove) => {
    const updated = branchIpsList.filter((ip) => ip !== ipToRemove).join(", ");
    setBranchAllowedIps(updated);
    setBranchDirty(true);
  };

  // Load Organization Defaults
  const loadOrgDefaults = useCallback(async () => {
    setOrgLoading(true);
    setOrgAlert({ type: "", message: "" });
    try {
      const [orgRes, attRes] = await Promise.allSettled([
        fetchOrganizationSettings(),
        fetchAttendanceSettings(),
      ]);

      if (orgRes.status === "fulfilled" && orgRes.value?.success) {
        const d = orgRes.value.data || {};
        const att = d.attendance || {};
        const pol = d.policies || {};

        setOrgAttendanceMode(getCanonicalMode(att.attendanceMode || "GEOFENCE"));
        const rawOrgIp = att.staticIp !== undefined ? att.staticIp : (att.allowedIps !== undefined ? att.allowedIps : d.staticIp);
        setOrgStaticIp(normalizeStaticIpDisplay(rawOrgIp));
        setStandardWorkingMinutes(att.standardWorkingMinutes ?? 480);
        setHalfDayMinutes(att.halfDayMinutes ?? 240);
        setLateCutoff(att.lateCutoff || "");
        setGracePeriodMinutes(att.gracePeriodMinutes ?? 15);
        setOrgTimeZone(att.timeZone || "Asia/Kolkata");
        setOrgDefaultShiftId(att.defaultShiftId?._id || att.defaultShiftId || "");
        setOrgDefaultWorkCalendarId(
          att.defaultWorkCalendarId?._id || att.defaultWorkCalendarId || ""
        );

        const ot = pol.overtime || {};
        setOvertimeEnabled(Boolean(ot.enabled));
        setOvertimeStartAfterMinutes(ot.startAfterMinutes ?? 30);
        setMinimumOvertimeMinutes(ot.minimumMinutes ?? 30);
        setMaximumOvertimeMinutes(ot.maximumMinutes ?? 240);

        const ac = pol.autoClose || {};
        setAutoCloseEnabled(Boolean(ac.enabled));
        setAutoCloseCutoffHours(ac.cutoffHours ?? 16);
      }

      if (attRes.status === "fulfilled" && attRes.value?.success) {
        const attSettings = attRes.value.data || {};
        if (attSettings.attendanceMode) {
          setOrgAttendanceMode(getCanonicalMode(attSettings.attendanceMode));
        }
        if (attSettings.staticIp !== undefined) {
          setOrgStaticIp(normalizeStaticIpDisplay(attSettings.staticIp));
        } else if (attSettings.allowedIps !== undefined) {
          setOrgStaticIp(normalizeStaticIpDisplay(attSettings.allowedIps));
        }
      }
      setOrgDirty(false);
    } catch {
      setOrgAlert({
        type: "danger",
        message: "Failed to load organization attendance defaults.",
      });
    } finally {
      setOrgLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgDefaults();
  }, [loadOrgDefaults]);

  // Save Organization Defaults
  const handleSaveOrgDefaults = async (e) => {
    e.preventDefault();
    if (!canEditOrg) return;

    setOrgSaving(true);
    setOrgAlert({ type: "", message: "" });
    try {
      // Guarantee string before calling .trim() or parsing to array
      const safeIpInput = typeof orgStaticIp === "string" 
        ? orgStaticIp.trim() 
        : normalizeStaticIpDisplay(orgStaticIp);
      const allowedIpsArray = normalizeAllowedIpsArray(safeIpInput);

      const orgPayload = {
        attendance: {
          attendanceMode: orgAttendanceMode,
          staticIp: allowedIpsArray[0] || "",
          allowedIps: allowedIpsArray,
          standardWorkingMinutes: Number(standardWorkingMinutes) || 480,
          halfDayMinutes: Number(halfDayMinutes) || 240,
          lateCutoff: lateCutoff || undefined,
          gracePeriodMinutes: Number(gracePeriodMinutes) || 0,
          timeZone: orgTimeZone,
          defaultShiftId: orgDefaultShiftId || null,
          defaultWorkCalendarId: orgDefaultWorkCalendarId || null,
        },
        policies: {
          overtime: {
            enabled: overtimeEnabled,
            startAfterMinutes: Number(overtimeStartAfterMinutes) || 0,
            minimumMinutes: Number(minimumOvertimeMinutes) || 0,
            maximumMinutes: Number(maximumOvertimeMinutes) || 0,
          },
          autoClose: {
            enabled: autoCloseEnabled,
            cutoffHours: Number(autoCloseCutoffHours) || 16,
          },
        },
      };

      const attendancePayload = {
        attendanceMode: orgAttendanceMode,
        staticIp: {
          enabled: allowedIpsArray.length > 0,
          allowedIps: allowedIpsArray,
        },
      };

      const [resOrg, resAtt] = await Promise.all([
        updateOrganizationSettings(orgPayload),
        updateAttendanceSettings(attendancePayload),
      ]);

      if (resOrg?.success || resAtt?.success) {
        setOrgAlert({
          type: "success",
          message: "Organization attendance defaults saved successfully.",
        });
        setOrgDirty(false);
        setOrgStaticIp(allowedIpsArray.join(", "));
        setTimeout(() => setOrgAlert({ type: "", message: "" }), 4000);
      } else {
        throw new Error(resOrg?.message || resAtt?.message || "Update failed");
      }
    } catch (err) {
      setOrgAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to save organization attendance settings.",
      });
    } finally {
      setOrgSaving(false);
    }
  };

  // Load Branch Configuration
  const loadBranchConfig = useCallback(
    async (branchId) => {
      if (!branchId) return;
      setBranchLoading(true);
      setBranchAlert({ type: "", message: "" });
      try {
        const res = await fetchBranchById(branchId);
        if (res?.success) {
          const b = res.data || {};
          setCurrentBranchName(b.branchName || b.name || "");
          setBranchAttendanceMode(getCanonicalMode(b.attendanceMode || "GEOFENCE"));
          setBranchRadiusMeters(b.officeRadiusMeters ?? 100);
          setBranchLatitude(b.latitude ?? "");
          setBranchLongitude(b.longitude ?? "");
          setBranchAllowedIps(
            normalizeStaticIpDisplay(b.allowedIps || b.staticIp)
          );
          setBranchTimeZone(b.timeZone || "");
          setBranchShiftId(b.defaultShiftId?._id || b.defaultShiftId || "");
          setBranchCalendarId(
            b.defaultWorkCalendarId?._id || b.defaultWorkCalendarId || ""
          );
          setBranchHolidayId(
            b.defaultHolidayCalendarId?._id || b.defaultHolidayCalendarId || ""
          );
          setBranchDirty(false);
        }
      } catch {
        setBranchAlert({
          type: "danger",
          message: "Failed to load branch attendance settings.",
        });
      } finally {
        setBranchLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (currentBranchId) {
      loadBranchConfig(currentBranchId);
    }
  }, [currentBranchId, loadBranchConfig]);

  // Save Branch Configuration
  const handleSaveBranchConfig = async (e) => {
    e.preventDefault();
    if (!canEditBranch || !currentBranchId) return;

    setBranchSaving(true);
    setBranchAlert({ type: "", message: "" });
    try {
      const safeBranchIpInput = typeof branchAllowedIps === "string" 
        ? branchAllowedIps.trim() 
        : normalizeStaticIpDisplay(branchAllowedIps);
      const allowedIpsArray = normalizeAllowedIpsArray(safeBranchIpInput);

      const payload = {
        attendanceMode: branchAttendanceMode,
        officeRadiusMeters: Number(branchRadiusMeters) || 100,
        latitude: branchLatitude !== "" ? Number(branchLatitude) : null,
        longitude: branchLongitude !== "" ? Number(branchLongitude) : null,
        allowedIps: allowedIpsArray,
        staticIp: {
          enabled: allowedIpsArray.length > 0,
          allowedIps: allowedIpsArray,
        },
        ...(branchTimeZone ? { timeZone: branchTimeZone } : {}),
        ...(branchShiftId ? { defaultShiftId: branchShiftId } : {}),
        ...(branchCalendarId ? { defaultWorkCalendarId: branchCalendarId } : {}),
        ...(branchHolidayId ? { defaultHolidayCalendarId: branchHolidayId } : {}),
      };

      const res = await updateBranch(currentBranchId, payload);
      if (res?.success) {
        setBranchAlert({
          type: "success",
          message: `Branch attendance configuration saved for "${currentBranchName || "Selected Branch"}".`,
        });
        setBranchDirty(false);
        if (refreshBranches) refreshBranches();
        setTimeout(() => setBranchAlert({ type: "", message: "" }), 4000);
      } else {
        throw new Error(res?.message || "Failed to update branch");
      }
    } catch (err) {
      setBranchAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to save branch attendance settings.",
      });
    } finally {
      setBranchSaving(false);
    }
  };

  const selectedBranchObj = useMemo(() => {
    return branchesList.find((b) => b._id === currentBranchId);
  }, [branchesList, currentBranchId]);

  return (
    <div className="org-modern-attendance-workspace">
      {/* ── 1. Page Header ── */}
      <div className="org-page-header-row mb-4">
        <div>
          <div className="org-header-badge mb-1">
            <FaCalendarCheck /> Organization &bull; Workplace &bull; Attendance
          </div>
          <h1 className="org-page-title" style={{ fontSize: "1.65rem", fontWeight: "800", color: "#111827", margin: 0 }}>
            Attendance Workspace
          </h1>
          <p className="org-page-subtitle" style={{ color: "#6B7280", marginTop: "4px", fontSize: "0.92rem" }}>
            Configure how employees verify attendance, working-time rules, and branch-specific office requirements.
          </p>
        </div>
      </div>

      {/* ── 2. Unified Configuration Scope Selector ── */}
      <div className="attendance-scope-card">
        <div className="attendance-scope-header">
          <label htmlFor="attendance-scope-select" className="attendance-scope-label">
            Configuration Scope
          </label>
          <div className="attendance-scope-status">
            {isOrgScope ? (
              <span className="attendance-scope-pill org-pill">
                <FaGlobe className="me-1" /> Organization Defaults
              </span>
            ) : (
              <span className="attendance-scope-pill branch-pill">
                <FaBuilding className="me-1" /> Branch Specific Overrides
              </span>
            )}
            {((isOrgScope && orgDirty) || (!isOrgScope && branchDirty)) && (
              <span className="attendance-scope-pill dirty-pill">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>

        <div className="attendance-scope-control-row">
          <div className="attendance-scope-select-wrapper">
            <select
              id="attendance-scope-select"
              className="attendance-scope-select"
              value={configScope}
              onChange={(e) => handleScopeChange(e.target.value)}
              disabled={Boolean(lockedBranchId)}
            >
              {!lockedBranchId && (
                <option value="ORG_DEFAULTS">Organization Defaults</option>
              )}
              {branchesList.map((b) => (
                <option key={b._id} value={b._id}>
                  {getBranchDisplayName(b)}
                </option>
              ))}
            </select>
          </div>
          <div className="attendance-scope-description">
            {isOrgScope ? (
              <span>
                Baseline organizational rules. Applied across all branches unless overridden at a specific branch.
              </span>
            ) : (
              <span>
                Configuring verification, geofencing, network, and schedule overrides for <strong>{currentBranchName || (selectedBranchObj ? getBranchDisplayName(selectedBranchObj) : "Selected Branch")}</strong>.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONFIGURATION CONTENT: ORGANIZATION DEFAULTS OR BRANCH OVERRIDES          */}
      {/* ========================================================================= */}
      {isOrgScope ? (
        <div className="org-tab-pane">
          {orgAlert.message && (
            <div className="mb-3">
              <FeedbackAlert
                variant={orgAlert.type}
                message={orgAlert.message}
                dismissible
                onClose={() => setOrgAlert({ type: "", message: "" })}
              />
            </div>
          )}

          {/* Context banner */}
          <div
            style={{
              background: "var(--color-background, #FDFBF7)",
              border: "1px solid #EAE0D0",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#FEF3C7",
                  color: "#92400E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                <FaGlobe />
              </div>
              <div>
                <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>
                  Global Attendance Policy (All Branches Baseline)
                </div>
                <div style={{ color: "#6B7280", fontSize: "12.5px" }}>
                  These rules establish the baseline across your organization. Individual branch locations can define specific geofences and overrides by selecting the branch in the <strong>Configuration Scope</strong> selector above.
                </div>
              </div>
            </div>
            {orgDirty && (
              <span style={{ fontSize: "12px", color: "#B45309", background: "#FEF3C7", padding: "4px 10px", borderRadius: "4px", fontWeight: "600", flexShrink: 0 }}>
                Unsaved Changes
              </span>
            )}
          </div>

          {orgLoading ? (
            <div className="org-loading-skeleton" style={{ minHeight: "220px" }}>
              <div className="org-spinner" />
              <span>Loading organization attendance defaults...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveOrgDefaults}>
              {/* ── 1. Full-Width: Verification & Timezone ── */}
              <div className="org-settings-section-card" style={{ marginBottom: "16px" }}>
                <h3 className="org-settings-section-heading">
                  <FaShieldAlt className="text-warning" /> Verification &amp; Timezone
                </h3>
                <p className="org-settings-section-sub">
                  How should employees verify attendance across mobile and web applications?
                </p>

                {/* Compact Verification Cards */}
                <div className="attendance-grid-4col">
                  {PRIMARY_VERIFICATION_OPTIONS.map((opt) => {
                    const isSelected = orgAttendanceMode === opt.key;
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.key}
                        className={`attendance-verify-card-compact ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          if (!canEditOrg) return;
                          setOrgAttendanceMode(opt.key);
                          setOrgDirty(true);
                        }}
                      >
                        <div className="attendance-verify-card-compact-header">
                          <div className="attendance-verify-card-compact-icon">
                            <Icon />
                          </div>
                          <div className="attendance-verify-card-compact-title">{opt.title}</div>
                          {isSelected ? (
                            <FaCheckCircle className="attendance-verify-card-compact-check" />
                          ) : (
                            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #D1D5DB" }} />
                          )}
                        </div>
                        <div className="attendance-verify-card-compact-footer">
                          <span className="attendance-verify-card-compact-badge">{opt.badgeText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Biometric Integration (Fifth card / hardware option — disabled until hardware integration exists) */}
                {BIOMETRIC_OPTION && (
                  <div
                    className="attendance-biometric-tile"
                    style={{ opacity: 0.65, cursor: "not-allowed", borderStyle: "dashed" }}
                    title="Biometric terminal hardware synchronization is not configured. Direct activation is unavailable."
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FaFingerprint style={{ color: "#9CA3AF", fontSize: "16px" }} />
                      <div>
                        <span style={{ fontWeight: "700", fontSize: "0.82rem", color: "#6B7280" }}>
                          Biometric Integration
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#9CA3AF", marginLeft: "8px" }}>
                          Hardware machine synchronization (integration not configured)
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: "700", background: "#FEE2E2", color: "#DC2626", padding: "2px 7px", borderRadius: "4px" }}>
                        Hardware Unavailable
                      </span>
                    </div>
                  </div>
                )}

                {/* Explanatory callouts */}
                {orgAttendanceMode === "MANUAL" && (
                  <div className="attendance-mode-explainer" style={{ marginTop: "12px", padding: "8px 12px" }}>
                    <FaInfoCircle className="me-2 text-warning" />
                    <strong>Manual Override Active:</strong> Direct employee attendance punch is disabled. Attendance records are created, regularized, or logged manually by authorized HR managers.
                  </div>
                )}
                {orgAttendanceMode === "BIOMETRIC" && (
                  <div className="attendance-mode-explainer" style={{ marginTop: "12px", padding: "8px 12px" }}>
                    <FaFingerprint className="me-2 text-info" />
                    <strong>Biometric Hardware Integration:</strong> Attendance records synchronize automatically from physical biometric devices registered at branch locations.
                  </div>
                )}

                {/* Timezone and Optional Network IP Row */}
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #F3F4F6", display: "grid", gridTemplateColumns: orgAttendanceMode === "STATIC_IP" || orgAttendanceMode === "BOTH" ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr", gap: "14px" }}>
                  <div className="attendance-field" style={{ maxWidth: orgAttendanceMode === "STATIC_IP" || orgAttendanceMode === "BOTH" ? "none" : "420px" }}>
                    <label className="attendance-form-label">
                      <FaGlobe className="me-1" style={{ color: "var(--color-primary, #C49A55)" }} /> Organization Timezone
                    </label>
                    <select
                      className="attendance-form-control"
                      value={orgTimeZone}
                      onChange={(e) => {
                        setOrgTimeZone(e.target.value);
                        setOrgDirty(true);
                      }}
                      disabled={!canEditOrg}
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <span className="attendance-form-hint">Operating timezone for baseline attendance calculation.</span>
                  </div>

                  {(orgAttendanceMode === "STATIC_IP" || orgAttendanceMode === "BOTH") && (
                    <div className="attendance-field">
                      <label className="attendance-form-label">
                        <FaWifi className="me-1" style={{ color: "var(--color-primary, #C49A55)" }} /> Organization Network IP Allowlist
                      </label>
                      <input
                        type="text"
                        className="attendance-form-control"
                        placeholder="e.g. 203.0.113.195"
                        value={typeof orgStaticIp === "string" ? orgStaticIp : normalizeStaticIpDisplay(orgStaticIp)}
                        onChange={(e) => {
                          setOrgStaticIp(String(e.target.value ?? ""));
                          setOrgDirty(true);
                        }}
                        disabled={!canEditOrg}
                      />
                      <span className="attendance-form-hint">Public gateway IP allowlist (branches can override).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 2. Responsive 2-Column Row: Working Hours (Left) & Default Schedule (Right) ── */}
              <div className="attendance-grid-2col">
                {/* LEFT: Working Hours & Thresholds */}
                <div className="org-settings-section-card" style={{ marginBottom: 0 }}>
                  <h3 className="org-settings-section-heading">
                    <FaClock className="text-warning" /> Working Hours &amp; Thresholds
                  </h3>
                  <p className="org-settings-section-sub">
                    Daily shift requirements, late arrival cutoffs, and half-day thresholds.
                  </p>

                  <div className="attendance-form-grid-2x2">
                    <div className="attendance-field">
                      <label className="attendance-form-label">Standard Working Minutes</label>
                      <div className="attendance-input-wrap">
                        <input
                          type="number"
                          min="60"
                          step="30"
                          className="attendance-form-control has-unit"
                          value={standardWorkingMinutes}
                          onChange={(e) => {
                            setStandardWorkingMinutes(e.target.value);
                            setOrgDirty(true);
                          }}
                          disabled={!canEditOrg}
                        />
                        <span className="attendance-input-unit">min</span>
                      </div>
                      <span className="attendance-form-hint">Full-day requirement (e.g. 480 min = 8 hrs).</span>
                    </div>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Half-Day Threshold</label>
                      <div className="attendance-input-wrap">
                        <input
                          type="number"
                          min="30"
                          step="15"
                          className="attendance-form-control has-unit"
                          value={halfDayMinutes}
                          onChange={(e) => {
                            setHalfDayMinutes(e.target.value);
                            setOrgDirty(true);
                          }}
                          disabled={!canEditOrg}
                        />
                        <span className="attendance-input-unit">min</span>
                      </div>
                      <span className="attendance-form-hint">Minimum minutes for half-day credit (240 min = 4 hrs).</span>
                    </div>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Late Cutoff Time</label>
                      <input
                        type="time"
                        className="attendance-form-control"
                        value={lateCutoff}
                        onChange={(e) => {
                          setLateCutoff(e.target.value);
                          setOrgDirty(true);
                        }}
                        disabled={!canEditOrg}
                      />
                      <span className="attendance-form-hint">Punch-ins after this time mark as late arrival.</span>
                    </div>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Punch-In Grace Period</label>
                      <div className="attendance-input-wrap">
                        <input
                          type="number"
                          min="0"
                          max="120"
                          className="attendance-form-control has-unit"
                          value={gracePeriodMinutes}
                          onChange={(e) => {
                            setGracePeriodMinutes(e.target.value);
                            setOrgDirty(true);
                          }}
                          disabled={!canEditOrg}
                        />
                        <span className="attendance-input-unit">min</span>
                      </div>
                      <span className="attendance-form-hint">Leeway past shift start before penalty applies.</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Default Schedule */}
                <div className="org-settings-section-card" style={{ marginBottom: 0 }}>
                  <h3 className="org-settings-section-heading">
                    <FaLayerGroup className="text-secondary" /> Default Schedule
                  </h3>
                  <p className="org-settings-section-sub">
                    Baseline work calendar and shift template assigned across the organization.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className="attendance-field">
                      <label className="attendance-form-label">Default Shift</label>
                      <select
                        className="attendance-form-control"
                        value={orgDefaultShiftId}
                        onChange={(e) => {
                          setOrgDefaultShiftId(e.target.value);
                          setOrgDirty(true);
                        }}
                        disabled={!canEditOrg}
                      >
                        <option value="">-- No Default Shift Selected --</option>
                        {shifts.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.shiftName || s.name} ({s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : s.code || "Standard"})
                          </option>
                        ))}
                      </select>
                      <span className="attendance-form-hint">Applied to new staff unless branch or team specifies otherwise.</span>
                    </div>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Default Work Calendar</label>
                      <select
                        className="attendance-form-control"
                        value={orgDefaultWorkCalendarId}
                        onChange={(e) => {
                          setOrgDefaultWorkCalendarId(e.target.value);
                          setOrgDirty(true);
                        }}
                        disabled={!canEditOrg}
                      >
                        <option value="">-- No Default Calendar Selected --</option>
                        {workCalendars.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.calendarName || c.name}
                          </option>
                        ))}
                      </select>
                      <span className="attendance-form-hint">Defines official workdays, weekends, and standard schedules.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3. Full-Width: Overtime & Session Auto-Close ── */}
              <div className="org-settings-section-card" style={{ marginTop: "16px", marginBottom: "20px" }}>
                <h3 className="org-settings-section-heading">
                  <FaClock className="text-warning" /> Overtime &amp; Session Auto-Close
                </h3>
                <p className="org-settings-section-sub">
                  Configure extra working hours tracking and automatic session termination for unclosed punches.
                </p>

                <div className="attendance-toggles-row">
                  {/* Overtime Toggle Card */}
                  <div className={`attendance-toggle-card ${overtimeEnabled ? "active" : ""}`}>
                    <div className="attendance-toggle-content">
                      <span className="attendance-toggle-title">Enable Overtime (OT) Tracking</span>
                      <span className="attendance-toggle-desc">Calculate and track hours worked past shift schedule</span>
                    </div>
                    <label className="attendance-switch">
                      <input
                        type="checkbox"
                        checked={overtimeEnabled}
                        onChange={(e) => {
                          setOvertimeEnabled(e.target.checked);
                          setOrgDirty(true);
                        }}
                        disabled={!canEditOrg}
                      />
                      <span className="attendance-slider" />
                    </label>
                  </div>

                  {/* Auto-Close Toggle Card */}
                  <div className={`attendance-toggle-card ${autoCloseEnabled ? "active" : ""}`}>
                    <div className="attendance-toggle-content">
                      <span className="attendance-toggle-title">Automatic Session Auto-Close</span>
                      <span className="attendance-toggle-desc">Auto-terminate forgotten punches after designated hours</span>
                    </div>
                    <label className="attendance-switch">
                      <input
                        type="checkbox"
                        checked={autoCloseEnabled}
                        onChange={(e) => {
                          setAutoCloseEnabled(e.target.checked);
                          setOrgDirty(true);
                        }}
                        disabled={!canEditOrg}
                      />
                      <span className="attendance-slider" />
                    </label>
                  </div>
                </div>

                {/* Conditional Sub-settings for Overtime */}
                {overtimeEnabled && (
                  <div className="attendance-toggle-subpanel">
                    <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#92400E", marginBottom: "8px" }}>
                      Overtime Thresholds &amp; Caps
                    </div>
                    <div className="attendance-grid-3col">
                      <div className="attendance-field">
                        <label className="attendance-form-label">OT Starts After</label>
                        <div className="attendance-input-wrap">
                          <input
                            type="number"
                            min="0"
                            className="attendance-form-control has-unit"
                            value={overtimeStartAfterMinutes}
                            onChange={(e) => {
                              setOvertimeStartAfterMinutes(e.target.value);
                              setOrgDirty(true);
                            }}
                            disabled={!canEditOrg}
                          />
                          <span className="attendance-input-unit">min</span>
                        </div>
                        <span className="attendance-form-hint">Buffer after shift end before OT accrues.</span>
                      </div>

                      <div className="attendance-field">
                        <label className="attendance-form-label">Minimum OT Window</label>
                        <div className="attendance-input-wrap">
                          <input
                            type="number"
                            min="0"
                            className="attendance-form-control has-unit"
                            value={minimumOvertimeMinutes}
                            onChange={(e) => {
                              setMinimumOvertimeMinutes(e.target.value);
                              setOrgDirty(true);
                            }}
                            disabled={!canEditOrg}
                          />
                          <span className="attendance-input-unit">min</span>
                        </div>
                        <span className="attendance-form-hint">Minimum threshold required to log OT.</span>
                      </div>

                      <div className="attendance-field">
                        <label className="attendance-form-label">Maximum Daily OT Cap</label>
                        <div className="attendance-input-wrap">
                          <input
                            type="number"
                            min="0"
                            className="attendance-form-control has-unit"
                            value={maximumOvertimeMinutes}
                            onChange={(e) => {
                              setMaximumOvertimeMinutes(e.target.value);
                              setOrgDirty(true);
                            }}
                            disabled={!canEditOrg}
                          />
                          <span className="attendance-input-unit">min</span>
                        </div>
                        <span className="attendance-form-hint">Upper limit for overtime logged per day.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Sub-settings for Auto-Close */}
                {autoCloseEnabled && (
                  <div className="attendance-toggle-subpanel">
                    <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#92400E", marginBottom: "8px" }}>
                      Session Auto-Close Window
                    </div>
                    <div style={{ maxWidth: "340px" }} className="attendance-field">
                      <label className="attendance-form-label">Cutoff Window</label>
                      <div className="attendance-input-wrap">
                        <input
                          type="number"
                          min="1"
                          max="48"
                          className="attendance-form-control has-unit"
                          value={autoCloseCutoffHours}
                          onChange={(e) => {
                            setAutoCloseCutoffHours(e.target.value);
                            setOrgDirty(true);
                          }}
                          disabled={!canEditOrg}
                        />
                        <span className="attendance-input-unit">hrs</span>
                      </div>
                      <span className="attendance-form-hint">Session force-closed if no checkout occurs within this window.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              {canEditOrg && (
                <div className="org-actions-bar" style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    className="org-btn org-btn-secondary"
                    onClick={loadOrgDefaults}
                    disabled={orgSaving || !orgDirty}
                  >
                    <FaUndo /> Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="org-btn org-btn-primary"
                    disabled={orgSaving || !orgDirty}
                    style={{ background: "var(--color-primary, #C49A55)", color: "#FFFFFF", borderColor: "var(--color-primary, #C49A55)" }}
                  >
                    {orgSaving ? (
                      <>
                        <div className="org-spinner" style={{ width: "16px", height: "16px" }} />
                        Saving Defaults...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Organization Defaults
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      ) : (
        <div className="org-tab-pane">
          {branchAlert.message && (
            <div className="mb-3">
              <FeedbackAlert
                variant={branchAlert.type}
                message={branchAlert.message}
                dismissible
                onClose={() => setBranchAlert({ type: "", message: "" })}
              />
            </div>
          )}

          {/* Branch Context Banner */}
          <div
            style={{
              background: "var(--color-background, #FDFBF7)",
              border: "1px solid #EAE0D0",
              borderRadius: "10px",
              padding: "12px 18px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "#FEF3C7",
                  color: "#92400E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                <FaBuilding />
              </div>
              <div>
                <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Branch Scope: {currentBranchName || (selectedBranchObj ? getBranchDisplayName(selectedBranchObj) : "Selected Branch")}</span>
                  {(selectedBranchObj?.isHeadOffice || selectedBranchObj?.branchType === "HEAD_OFFICE") && (
                    <span style={{ fontSize: "11px", background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                      ★ Head Office (HQ)
                    </span>
                  )}
                </div>
                <div style={{ color: "#6B7280", fontSize: "12.5px" }}>
                  Verification, geofence, and schedule settings configured here override the organization baseline for employees assigned to this branch.
                </div>
              </div>
            </div>
            {branchDirty && (
              <span style={{ fontSize: "12px", color: "#B45309", background: "#FEF3C7", padding: "4px 10px", borderRadius: "4px", fontWeight: "600", flexShrink: 0 }}>
                Unsaved Changes
              </span>
            )}
          </div>

          {branchLoading ? (
            <div className="org-loading-skeleton" style={{ minHeight: "220px" }}>
              <div className="org-spinner" />
              <span>Loading branch attendance configuration...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveBranchConfig}>
              {/* ── 1. Full-Width: Branch Verification ── */}
              <div className="org-settings-section-card" style={{ marginBottom: "16px" }}>
                <h3 className="org-settings-section-heading">
                  <FaShieldAlt className="text-warning" /> Branch Verification
                </h3>
                <p className="org-settings-section-sub">
                  How should employees assigned to <strong>{currentBranchName || "this branch"}</strong> verify their punches?
                </p>

                {/* Compact Verification Cards */}
                <div className="attendance-grid-4col">
                  {PRIMARY_VERIFICATION_OPTIONS.map((opt) => {
                    const isSelected = branchAttendanceMode === opt.key;
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.key}
                        className={`attendance-verify-card-compact ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          if (!canEditBranch) return;
                          setBranchAttendanceMode(opt.key);
                          setBranchDirty(true);
                        }}
                      >
                        <div className="attendance-verify-card-compact-header">
                          <div className="attendance-verify-card-compact-icon">
                            <Icon />
                          </div>
                          <div className="attendance-verify-card-compact-title">{opt.title}</div>
                          {isSelected ? (
                            <FaCheckCircle className="attendance-verify-card-compact-check" />
                          ) : (
                            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #D1D5DB" }} />
                          )}
                        </div>
                        <div className="attendance-verify-card-compact-footer">
                          <span className="attendance-verify-card-compact-badge">{opt.badgeText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Biometric Integration (Fifth card / future integration option — disabled until hardware integration exists) */}
                {BIOMETRIC_OPTION && (
                  <div
                    className="attendance-biometric-tile"
                    style={{ opacity: 0.65, cursor: "not-allowed", borderStyle: "dashed" }}
                    title="Biometric terminal hardware synchronization is not configured for this branch."
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FaFingerprint style={{ color: "#9CA3AF", fontSize: "16px" }} />
                      <div>
                        <span style={{ fontWeight: "700", fontSize: "0.82rem", color: "#6B7280" }}>
                          Biometric Integration
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#9CA3AF", marginLeft: "8px" }}>
                          Hardware machine sync registered for this branch (integration not configured)
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: "700", background: "#FEE2E2", color: "#DC2626", padding: "2px 7px", borderRadius: "4px" }}>
                        Hardware Unavailable
                      </span>
                    </div>
                  </div>
                )}

                {branchAttendanceMode === "MANUAL" && (
                  <div className="attendance-mode-explainer" style={{ marginTop: "12px", padding: "8px 12px" }}>
                    <FaInfoCircle className="me-2 text-warning" />
                    <strong>Manual Attendance Configured:</strong> Direct employee self-service punches are disabled for this branch. Attendance is managed manually by authorized HR managers.
                  </div>
                )}

                {branchAttendanceMode === "BIOMETRIC" && (
                  <div className="attendance-mode-explainer" style={{ marginTop: "12px", padding: "8px 12px" }}>
                    <FaFingerprint className="me-2 text-info" />
                    <strong>Biometric Integration:</strong> Punches will synchronize automatically from configured attendance hardware registered at this branch.
                  </div>
                )}
              </div>

              {/* ── 2. Location & Network Cards ── */}
              {/* When mode is BOTH: Render in 2 columns side-by-side */}
              {branchAttendanceMode === "BOTH" && (
                <div className="attendance-grid-2col">
                  {/* Office Location / Geofence */}
                  <div className="org-settings-section-card" style={{ marginBottom: 0 }}>
                    <h3 className="org-settings-section-heading">
                      <FaMapMarkerAlt className="text-danger" /> Office Location / Geofence
                    </h3>
                    <p className="org-settings-section-sub">
                      Latitude/longitude coordinates and punch perimeter for {currentBranchName || "this branch"}.
                    </p>

                    <div className="attendance-form-grid-2x2">
                      <div className="attendance-field">
                        <label className="attendance-form-label">Office Latitude</label>
                        <input
                          type="number"
                          step="any"
                          className="attendance-form-control"
                          placeholder="e.g. 12.971598"
                          value={branchLatitude}
                          onChange={(e) => {
                            setBranchLatitude(e.target.value);
                            setBranchDirty(true);
                          }}
                          disabled={!canEditBranch}
                        />
                        <span className="attendance-form-hint">Physical latitude coordinate.</span>
                      </div>

                      <div className="attendance-field">
                        <label className="attendance-form-label">Office Longitude</label>
                        <input
                          type="number"
                          step="any"
                          className="attendance-form-control"
                          placeholder="e.g. 77.594566"
                          value={branchLongitude}
                          onChange={(e) => {
                            setBranchLongitude(e.target.value);
                            setBranchDirty(true);
                          }}
                          disabled={!canEditBranch}
                        />
                        <span className="attendance-form-hint">Physical longitude coordinate.</span>
                      </div>

                      <div className="attendance-field">
                        <label className="attendance-form-label">Geofence Radius</label>
                        <div className="attendance-input-wrap">
                          <input
                            type="number"
                            min="10"
                            max="10000"
                            className="attendance-form-control has-unit"
                            value={branchRadiusMeters}
                            onChange={(e) => {
                              setBranchRadiusMeters(e.target.value);
                              setBranchDirty(true);
                            }}
                            disabled={!canEditBranch}
                          />
                          <span className="attendance-input-unit">m</span>
                        </div>
                        <span className="attendance-form-hint">Check-in perimeter (default: 100m).</span>
                      </div>

                      <div className="attendance-field">
                        <label className="attendance-form-label">Branch Timezone</label>
                        <select
                          className="attendance-form-control"
                          value={branchTimeZone}
                          onChange={(e) => {
                            setBranchTimeZone(e.target.value);
                            setBranchDirty(true);
                          }}
                          disabled={!canEditBranch}
                        >
                          <option value="">-- Inherit Org Timezone --</option>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                        <span className="attendance-form-hint">Optional branch timezone override.</span>
                      </div>
                    </div>
                  </div>

                  {/* Office Network */}
                  <div className="org-settings-section-card" style={{ marginBottom: 0 }}>
                    <h3 className="org-settings-section-heading">
                      <FaWifi className="text-primary" /> Office Network
                    </h3>
                    <p className="org-settings-section-sub">
                      Register public IP addresses allowed for this branch office.
                    </p>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Allowed Public IPs</label>
                      {branchIpsList.length > 0 && (
                        <div className="attendance-ip-chips-wrap">
                          {branchIpsList.map((ip, i) => (
                            <span key={i} className="attendance-ip-chip">
                              <FaWifi className="me-1 text-warning" style={{ fontSize: "10px" }} />
                              {ip}
                              {canEditBranch && (
                                <button
                                  type="button"
                                  className="attendance-ip-chip-remove"
                                  onClick={() => handleRemoveBranchIp(ip)}
                                  title={`Remove ${ip}`}
                                >
                                  &times;
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        className="attendance-form-control"
                        placeholder="e.g. 103.21.244.2, 103.21.244.3"
                        value={typeof branchAllowedIps === "string" ? branchAllowedIps : normalizeStaticIpDisplay(branchAllowedIps)}
                        onChange={(e) => {
                          setBranchAllowedIps(String(e.target.value ?? ""));
                          setBranchDirty(true);
                        }}
                        disabled={!canEditBranch}
                      />
                      <span className="attendance-form-hint">
                        Comma-separated public IPv4 gateway addresses for office Wi-Fi routers.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* When mode is ONLY GEOFENCE */}
              {branchAttendanceMode === "GEOFENCE" && (
                <div className="org-settings-section-card" style={{ marginBottom: "16px" }}>
                  <h3 className="org-settings-section-heading">
                    <FaMapMarkerAlt className="text-danger" /> Office Location / Geofence
                  </h3>
                  <p className="org-settings-section-sub">
                    Configure the physical latitude/longitude coordinates and allowable radius for {currentBranchName || "this branch"}.
                  </p>

                  <div className="attendance-grid-4col" style={{ marginTop: "12px" }}>
                    <div className="attendance-field">
                      <label className="attendance-form-label">Office Latitude</label>
                      <input
                        type="number"
                        step="any"
                        className="attendance-form-control"
                        placeholder="e.g. 12.971598"
                        value={branchLatitude}
                        onChange={(e) => {
                          setBranchLatitude(e.target.value);
                          setBranchDirty(true);
                        }}
                        disabled={!canEditBranch}
                      />
                      <span className="attendance-form-hint">Latitude coordinate.</span>
                    </div>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Office Longitude</label>
                      <input
                        type="number"
                        step="any"
                        className="attendance-form-control"
                        placeholder="e.g. 77.594566"
                        value={branchLongitude}
                        onChange={(e) => {
                          setBranchLongitude(e.target.value);
                          setBranchDirty(true);
                        }}
                        disabled={!canEditBranch}
                      />
                      <span className="attendance-form-hint">Longitude coordinate.</span>
                    </div>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Geofence Radius</label>
                      <div className="attendance-input-wrap">
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          className="attendance-form-control has-unit"
                          value={branchRadiusMeters}
                          onChange={(e) => {
                            setBranchRadiusMeters(e.target.value);
                            setBranchDirty(true);
                          }}
                          disabled={!canEditBranch}
                        />
                        <span className="attendance-input-unit">m</span>
                      </div>
                      <span className="attendance-form-hint">Check-in perimeter (default: 100m).</span>
                    </div>

                    <div className="attendance-field">
                      <label className="attendance-form-label">Branch Timezone</label>
                      <select
                        className="attendance-form-control"
                        value={branchTimeZone}
                        onChange={(e) => {
                          setBranchTimeZone(e.target.value);
                          setBranchDirty(true);
                        }}
                        disabled={!canEditBranch}
                      >
                        <option value="">-- Inherit Org Timezone --</option>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <span className="attendance-form-hint">Local timezone override.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* When mode is ONLY STATIC_IP */}
              {branchAttendanceMode === "STATIC_IP" && (
                <div className="org-settings-section-card" style={{ marginBottom: "16px" }}>
                  <h3 className="org-settings-section-heading">
                    <FaWifi className="text-primary" /> Office Network
                  </h3>
                  <p className="org-settings-section-sub">
                    Register public static IP addresses for {currentBranchName || "this branch"} office router.
                  </p>

                  <div className="attendance-field" style={{ maxWidth: "560px" }}>
                    <label className="attendance-form-label">Allowed Public IPs</label>
                    {branchIpsList.length > 0 && (
                      <div className="attendance-ip-chips-wrap">
                        {branchIpsList.map((ip, i) => (
                          <span key={i} className="attendance-ip-chip">
                            <FaWifi className="me-1 text-warning" style={{ fontSize: "10px" }} />
                            {ip}
                            {canEditBranch && (
                              <button
                                type="button"
                                className="attendance-ip-chip-remove"
                                onClick={() => handleRemoveBranchIp(ip)}
                                title={`Remove ${ip}`}
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      className="attendance-form-control"
                      placeholder="e.g. 103.21.244.2, 103.21.244.3"
                      value={typeof branchAllowedIps === "string" ? branchAllowedIps : normalizeStaticIpDisplay(branchAllowedIps)}
                      onChange={(e) => {
                        setBranchAllowedIps(String(e.target.value ?? ""));
                        setBranchDirty(true);
                      }}
                      disabled={!canEditBranch}
                    />
                    <span className="attendance-form-hint">
                      Comma-separated public IPv4 gateway addresses for office Wi-Fi routers.
                    </span>
                  </div>
                </div>
              )}

              {/* ── 3. Schedule Overrides: 3 Columns on Desktop ── */}
              <div className="org-settings-section-card" style={{ marginTop: "16px", marginBottom: "20px" }}>
                <h3 className="org-settings-section-heading">
                  <FaClock className="text-secondary" /> Schedule Overrides
                </h3>
                <p className="org-settings-section-sub">
                  Optionally override default shifts, work calendars, or holiday lists for {currentBranchName || "this branch"}.
                </p>

                <div className="attendance-grid-3col" style={{ marginTop: "12px" }}>
                  <div className="attendance-field">
                    <label className="attendance-form-label">Branch Default Shift</label>
                    <select
                      className="attendance-form-control"
                      value={branchShiftId}
                      onChange={(e) => {
                        setBranchShiftId(e.target.value);
                        setBranchDirty(true);
                      }}
                      disabled={!canEditBranch}
                    >
                      <option value="">-- Inherit Org Default Shift --</option>
                      {shifts.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.shiftName || s.name} ({s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : s.code || "Standard"})
                        </option>
                      ))}
                    </select>
                    <span className="attendance-form-hint">Shift template for branch employees.</span>
                  </div>

                  <div className="attendance-field">
                    <label className="attendance-form-label">Branch Work Calendar</label>
                    <select
                      className="attendance-form-control"
                      value={branchCalendarId}
                      onChange={(e) => {
                        setBranchCalendarId(e.target.value);
                        setBranchDirty(true);
                      }}
                      disabled={!canEditBranch}
                    >
                      <option value="">-- Inherit Org Default Calendar --</option>
                      {workCalendars.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.calendarName || c.name}
                        </option>
                      ))}
                    </select>
                    <span className="attendance-form-hint">Working days and weekly offs.</span>
                  </div>

                  <div className="attendance-field">
                    <label className="attendance-form-label">Branch Holiday Calendar</label>
                    <select
                      className="attendance-form-control"
                      value={branchHolidayId}
                      onChange={(e) => {
                        setBranchHolidayId(e.target.value);
                        setBranchDirty(true);
                      }}
                      disabled={!canEditBranch}
                    >
                      <option value="">-- Inherit Global Holiday List --</option>
                      {holidayCalendars.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.calendarName || h.name}
                        </option>
                      ))}
                    </select>
                    <span className="attendance-form-hint">Regional / local branch holidays.</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              {canEditBranch && (
                <div className="org-actions-bar" style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    className="org-btn org-btn-secondary"
                    onClick={() => loadBranchConfig(currentBranchId)}
                    disabled={branchSaving || !branchDirty}
                  >
                    <FaUndo /> Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="org-btn org-btn-primary"
                    disabled={branchSaving || !branchDirty}
                    style={{ background: "var(--color-primary, #C49A55)", color: "#FFFFFF", borderColor: "var(--color-primary, #C49A55)" }}
                  >
                    {branchSaving ? (
                      <>
                        <div className="org-spinner" style={{ width: "16px", height: "16px" }} />
                        Saving Branch Settings...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Branch Configuration
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

