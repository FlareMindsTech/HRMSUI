import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import {
  FaCog,
  FaSave,
  FaClock,
  FaCalendarCheck,
  FaShieldAlt,
  FaBell,
  FaIdCard,
  FaPalette,
  FaFileAlt,
  FaArrowRight,
} from "react-icons/fa";
import {
  updateOrganizationSettings,
} from "../../services/organizationService";
import {
  updateAttendanceSettings,
} from "../../Api/Attendance/attendance";
import { useSelector, useDispatch } from 'react-redux';
import { useHasPermission, selectIsSystemAdmin, selectAuthUser } from '../../redux/slices/authSlice';
import {
  fetchOrgResource,
  invalidateOrgResource,
  selectOrgSettings,
  selectAttendancePolicy,
  selectShiftsDropdown,
  selectWorkCalendarsDropdown,
  selectHolidayCalendarsDropdown,
} from '../../redux/slices/organizationSlice';
import FeedbackAlert from "../Common/FeedbackAlert";
import ThemeCustomizationSection from "./ThemeCustomizationSection";

function OrganizationSettingsSection({ onNavigateTab }) {
  const authUser = useSelector(selectAuthUser);
  const isOwner = authUser?.priority === 1 || (authUser?.roleCode || authUser?.roleName || "").toUpperCase() === "OWNER";
  const hasPermission = useHasPermission();
  const isSystemAdmin = useSelector(selectIsSystemAdmin);

  const [holidayCalendars, setHolidayCalendars] = useState([]);
  const dispatch = useDispatch();
  // Shared settings/policy/dropdowns (single guarded fetches each). The
  // values below seed the local edit form on load only — later cache
  // refreshes never touch in-progress edits.
  const cachedSettings = useSelector(selectOrgSettings);
  const cachedPolicyBody = useSelector(selectAttendancePolicy);
  const cachedWorkCalendars = useSelector(selectWorkCalendarsDropdown);
  const cachedShifts = useSelector(selectShiftsDropdown);
  const cachedHolidayCalendars = useSelector(selectHolidayCalendarsDropdown);
  // Ref mirror of the cached values so loadData (stable identity, runs on
  // mount and after saves) can fall back to them when the TTL guard skips
  // the network — without subscribing the callback to cache updates.
  const cacheRef = useRef(null);
  cacheRef.current = {
    sett: cachedSettings,
    pol: cachedPolicyBody,
    wc: cachedWorkCalendars,
    sh: cachedShifts,
    hol: cachedHolidayCalendars,
  };

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    // General & Localization
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    timeZone: "Asia/Kolkata",
    currency: "INR",
    currencySymbol: "₹",
    weekStartDay: "Monday",
    defaultWorkingHours: 9,
    status: "ACTIVE",

    // Organization-Level Attendance Policy & Shifts (Single Source of Truth)
    attendanceMode: "GEOFENCE",
    staticIp: {
      enabled: false,
      allowedIps: [],
    },
    standardWorkingMinutes: 540,
    halfDayMinutes: 270,
    lateCutoff: "09:15 AM",
    gracePeriodMinutes: 15,
    attendanceGracePeriod: 15,
    halfDayThresholdHours: 4.5,
    fullDayThresholdHours: 8,
    overtimeEnabled: true,
    overtimeStartAfterMinutes: 540,
    minimumOvertimeMinutes: 30,
    maximumOvertimeMinutes: 240,
    autoCloseEnabled: true,
    autoCloseCutoffHours: 12,
    autoClockOutEnabled: false,
    autoClockOutTime: "23:59",
    defaultWorkCalendarId: "",
    defaultShiftId: "",

    // Leave & Approvals
    leaveApprovalMode: "SINGLE_LEVEL",
    leaveNoticeDays: 2,
    carryForwardLimit: 15,
    allowNegativeLeaveBalance: false,
    defaultHolidayCalendarId: "",

    // Payroll Defaults
    payrollCycle: "MONTHLY",
    payrollProcessingDay: 28,
    payrollPayDay: 1,
    salaryCalculationBasis: "CALENDAR_DAYS",
    allowOvertime: false,
    overtimeRateMultiplier: 1.5,

    // Employee Code & System ID
    employeeCodePrefix: "EMP",
    employeeCodeStartingNumber: 1,
    employeeCodeLength: 5,
    autoGenerateEmployeeCode: true,
    documentUploadMaxSize: 10,
    sessionTimeoutMinutes: 60,

    // Notifications
    emailNotificationEnabled: true,
    smsNotificationEnabled: false,
    whatsappNotificationEnabled: false,
    inAppNotificationEnabled: true,
  });

  const canUpdate =
    isSystemAdmin ||
    isOwner ||
    hasPermission("orgSettings.update") ||
    hasPermission("organizationSettings.update");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // Guarded shared fetches; each result falls back to the cached slice
      // value when the TTL guard skips the network (same values a fresh
      // fetch would resolve with while the cache is valid).
      const [settRes, polRes, wcRes, shRes, holRes] = await Promise.all([
        dispatch(fetchOrgResource({ key: "settings" })).catch((err) => {
          console.warn("fetchOrganizationSettings error:", err);
          return null;
        }),
        dispatch(fetchOrgResource({ key: "attendancePolicy" })).catch((err) => {
          console.warn("fetchAttendanceSettings error:", err);
          return null;
        }),
        dispatch(fetchOrgResource({ key: "workCalendars" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "shifts" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "holidayCalendars" })).catch(() => null),
      ]);

      const sett = settRes?.payload?.data ?? cacheRef.current?.sett ?? null;
      const pol = (polRes?.payload?.data ?? cacheRef.current?.pol)?.data || null;
      const wcList = wcRes?.payload?.data ?? cacheRef.current?.wc ?? [];
      const shList = shRes?.payload?.data ?? cacheRef.current?.sh ?? [];
      const holList = holRes?.payload?.data ?? cacheRef.current?.hol ?? [];

      if (sett || pol) {
        const standardMins = pol?.standardWorkingMinutes !== undefined
          ? pol.standardWorkingMinutes
          : (sett?.defaultWorkingHours ? Math.round(sett.defaultWorkingHours * 60) : 540);
        const halfDayMins = pol?.halfDayMinutes !== undefined
          ? pol.halfDayMinutes
          : (sett?.halfDayThresholdHours ? Math.round(sett.halfDayThresholdHours * 60) : 270);
        const graceMins = pol?.gracePeriodMinutes !== undefined
          ? pol.gracePeriodMinutes
          : (sett?.attendanceGracePeriod !== undefined ? sett.attendanceGracePeriod : 15);

        setFormData({
          dateFormat: sett?.dateFormat || "YYYY-MM-DD",
          timeFormat: sett?.timeFormat || "HH:mm",
          timeZone: pol?.timeZone || sett?.timeZone || "Asia/Kolkata",
          currency: sett?.currency || "INR",
          currencySymbol: sett?.currencySymbol || "₹",
          weekStartDay: pol?.weekStartDay || sett?.weekStartDay || "Monday",
          defaultWorkingHours: sett?.defaultWorkingHours || (standardMins ? standardMins / 60 : 9),
          status: sett?.status || "ACTIVE",

          // Attendance Policy fields preserved from single source of truth
          attendanceMode: pol?.attendanceMode || sett?.attendanceMode || "GEOFENCE",
          staticIp: pol?.staticIp || { enabled: false, allowedIps: [] },
          standardWorkingMinutes: standardMins,
          halfDayMinutes: halfDayMins,
          lateCutoff: pol?.lateCutoff || "09:15 AM",
          gracePeriodMinutes: graceMins,
          attendanceGracePeriod: graceMins,
          halfDayThresholdHours: sett?.halfDayThresholdHours !== undefined
            ? sett.halfDayThresholdHours
            : (halfDayMins ? halfDayMins / 60 : 4.5),
          fullDayThresholdHours: sett?.fullDayThresholdHours !== undefined ? sett.fullDayThresholdHours : 8,
          overtimeEnabled: pol?.overtimeEnabled !== undefined ? pol.overtimeEnabled : true,
          overtimeStartAfterMinutes: pol?.overtimeStartAfterMinutes !== undefined
            ? pol.overtimeStartAfterMinutes
            : standardMins,
          minimumOvertimeMinutes: pol?.minimumOvertimeMinutes !== undefined ? pol.minimumOvertimeMinutes : 30,
          maximumOvertimeMinutes: pol?.maximumOvertimeMinutes !== undefined ? pol.maximumOvertimeMinutes : 240,
          autoCloseEnabled: pol?.autoCloseEnabled !== undefined ? pol.autoCloseEnabled : true,
          autoCloseCutoffHours: pol?.autoCloseCutoffHours !== undefined ? pol.autoCloseCutoffHours : 12,
          autoClockOutEnabled: sett?.autoClockOutEnabled || false,
          autoClockOutTime: sett?.autoClockOutTime || "23:59",
          defaultWorkCalendarId: sett?.defaultWorkCalendarId?._id || sett?.defaultWorkCalendarId || "",
          defaultShiftId: sett?.defaultShiftId?._id || sett?.defaultShiftId || "",

          leaveApprovalMode: sett?.leaveApprovalMode || "SINGLE_LEVEL",
          leaveNoticeDays: sett?.leaveNoticeDays !== undefined ? sett.leaveNoticeDays : 2,
          carryForwardLimit: sett?.carryForwardLimit !== undefined ? sett.carryForwardLimit : 15,
          allowNegativeLeaveBalance: sett?.allowNegativeLeaveBalance || false,
          defaultHolidayCalendarId: sett?.defaultHolidayCalendarId?._id || sett?.defaultHolidayCalendarId || "",

          payrollCycle: sett?.payrollCycle || "MONTHLY",
          payrollProcessingDay: sett?.payrollProcessingDay || 28,
          payrollPayDay: sett?.payrollPayDay || 1,
          salaryCalculationBasis: sett?.salaryCalculationBasis || "CALENDAR_DAYS",
          allowOvertime: sett?.allowOvertime || false,
          overtimeRateMultiplier: sett?.overtimeRateMultiplier || 1.5,

          employeeCodePrefix: sett?.employeeCodePrefix || "EMP",
          employeeCodeStartingNumber: sett?.employeeCodeStartingNumber || 1,
          employeeCodeLength: sett?.employeeCodeLength || 5,
          autoGenerateEmployeeCode: sett?.autoGenerateEmployeeCode !== undefined ? sett.autoGenerateEmployeeCode : true,
          documentUploadMaxSize: sett?.documentUploadMaxSize || 10,
          sessionTimeoutMinutes: sett?.sessionTimeoutMinutes || 60,

          emailNotificationEnabled: sett?.emailNotificationEnabled !== undefined ? sett.emailNotificationEnabled : true,
          smsNotificationEnabled: sett?.smsNotificationEnabled || false,
          whatsappNotificationEnabled: sett?.whatsappNotificationEnabled || false,
          inAppNotificationEnabled: sett?.inAppNotificationEnabled !== undefined ? sett.inAppNotificationEnabled : true,
        });
      }
      setHolidayCalendars(holList);
    } catch (err) {
      setError(err.message || "Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setError("");
      setSuccess("");

      const standardMins = Number(formData.standardWorkingMinutes) || (Number(formData.defaultWorkingHours) * 60) || 540;
      const halfDayMins = Number(formData.halfDayMinutes) || (Number(formData.halfDayThresholdHours) * 60) || 270;
      const graceMins = Number(formData.gracePeriodMinutes ?? formData.attendanceGracePeriod) || 0;

      const orgPayload = {
        ...formData,
        defaultWorkingHours: Math.round((standardMins / 60) * 10) / 10,
        attendanceGracePeriod: graceMins,
        halfDayThresholdHours: Math.round((halfDayMins / 60) * 10) / 10,
        fullDayThresholdHours: Number(formData.fullDayThresholdHours) || 8,
        leaveNoticeDays: Number(formData.leaveNoticeDays) || 0,
        carryForwardLimit: Number(formData.carryForwardLimit) || 0,
        payrollProcessingDay: Number(formData.payrollProcessingDay) || 28,
        payrollPayDay: Number(formData.payrollPayDay) || 1,
        overtimeRateMultiplier: Number(formData.overtimeRateMultiplier) || 1.5,
        documentUploadMaxSize: Number(formData.documentUploadMaxSize) || 10,
        employeeCodeStartingNumber: Number(formData.employeeCodeStartingNumber) || 1,
        employeeCodeLength: Number(formData.employeeCodeLength) || 5,
        sessionTimeoutMinutes: Number(formData.sessionTimeoutMinutes) || 60,
        defaultWorkCalendarId: formData.defaultWorkCalendarId || null,
        defaultShiftId: formData.defaultShiftId || null,
        defaultHolidayCalendarId: formData.defaultHolidayCalendarId || null,
      };

      const attendancePayload = {
        timeZone: formData.timeZone || "Asia/Kolkata",
        standardWorkingMinutes: standardMins,
        halfDayMinutes: halfDayMins,
        lateCutoff: formData.lateCutoff || "09:15 AM",
        gracePeriodMinutes: graceMins,
        overtimeEnabled: Boolean(formData.overtimeEnabled),
        overtimeStartAfterMinutes: Number(formData.overtimeStartAfterMinutes) || standardMins,
        minimumOvertimeMinutes: Number(formData.minimumOvertimeMinutes) || 30,
        maximumOvertimeMinutes: Number(formData.maximumOvertimeMinutes) || 240,
        autoCloseEnabled: Boolean(formData.autoCloseEnabled),
        autoCloseCutoffHours: Number(formData.autoCloseCutoffHours) || 12,
        attendanceMode: formData.attendanceMode || "GEOFENCE",
        staticIp: formData.staticIp || { enabled: false, allowedIps: [] },
        weekStartDay: formData.weekStartDay || "Monday",
      };

      const [orgRes] = await Promise.all([
        updateOrganizationSettings(orgPayload),
        updateAttendanceSettings(attendancePayload).catch((err) => {
          console.warn("Attendance policy update warning:", err);
          return null;
        }),
      ]);

      setSuccess(orgRes?.message || "Organization settings and Attendance Policy updated successfully");
      // The saved settings/policy changed shared data: invalidate so the
      // reload below (and other consumers) fetch fresh instead of TTL cache.
      dispatch(invalidateOrgResource(["settings", "attendancePolicy"]));
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaveLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState("general");

  if (loading) {
    return (
      <div className="org-loader-container">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Loading organization configuration settings...</p>
      </div>
    );
  }

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div>
          <h3 className="org-section-title">
            <FaCog className="text-success me-2" /> Global Organization Settings
          </h3>
          <p className="org-section-sub">
            Configure enterprise rules, time formats, appearance theme, attendance enforcement, approval workflows, payroll cycle defaults, and employee code generation.
          </p>
        </div>
      </div>

      <FeedbackAlert variant="danger" dismissible onClose={() => setError("")} message={error} />
      <FeedbackAlert variant="success" dismissible onClose={() => setSuccess("")} message={success} />

      <div className="org-settings-layout">
        {/* ── Sidebar Navigation Tabs ── */}
        <div className="org-settings-sidebar">
          <button
            type="button"
            className={`org-settings-nav-item w-100 border-0 text-start ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <FaClock className="me-2 text-primary" />
            <span>General & Localization</span>
          </button>
          <button
            type="button"
            className={`org-settings-nav-item w-100 border-0 text-start ${activeTab === "appearance" ? "active" : ""}`}
            onClick={() => setActiveTab("appearance")}
          >
            <FaPalette className="me-2 text-warning" />
            <span>Appearance & Theme</span>
          </button>
          <button
            type="button"
            className={`org-settings-nav-item w-100 border-0 text-start ${activeTab === "attendance" ? "active" : ""}`}
            onClick={() => setActiveTab("attendance")}
          >
            <FaCalendarCheck className="me-2 text-success" />
            <span>Attendance & Shifts</span>
          </button>
          <button
            type="button"
            className={`org-settings-nav-item w-100 border-0 text-start ${activeTab === "leave" ? "active" : ""}`}
            onClick={() => setActiveTab("leave")}
          >
            <FaShieldAlt className="me-2 text-warning" />
            <span>Leave & Approvals</span>
          </button>
          <button
            type="button"
            className={`org-settings-nav-item w-100 border-0 text-start ${activeTab === "payroll" ? "active" : ""}`}
            onClick={() => setActiveTab("payroll")}
          >
            <FaIdCard className="me-2 text-info" />
            <span>Payroll Defaults</span>
          </button>
          <button
            type="button"
            className={`org-settings-nav-item w-100 border-0 text-start ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setActiveTab("system")}
          >
            <FaFileAlt className="me-2 text-primary" />
            <span>ID Codes & Standards</span>
          </button>
          <button
            type="button"
            className={`org-settings-nav-item w-100 border-0 text-start ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <FaBell className="me-2 text-secondary" />
            <span>Notification Alerts</span>
          </button>
        </div>

        {/* ── Settings Form Viewport ── */}
        <div className="org-settings-content">
          {activeTab === "appearance" ? (
            <ThemeCustomizationSection />
          ) : (
            <Form onSubmit={handleSubmit}>
              {/* TAB 1: General & Localization */}
              {activeTab === "general" && (
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FaClock className="text-primary" /> Regional & Localization Defaults
                  </h5>
                  <p className="text-muted small mb-4">
                    Standardize global timezone, default currency symbols, date/time formatting, and weekly work hours.
                  </p>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Date Format</Form.Label>
                        <Form.Select
                          value={formData.dateFormat}
                          onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-25)</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY (25/09/2026)</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY (09/25/2026)</option>
                          <option value="DD-MMM-YYYY">DD-MMM-YYYY (25-Sep-2026)</option>
                          <option value="YYYY/MM/DD">YYYY/MM/DD (2026/09/25)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Time Format</Form.Label>
                        <Form.Select
                          value={formData.timeFormat}
                          onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="HH:mm">24-Hour (14:30)</option>
                          <option value="hh:mm A">12-Hour AM/PM (02:30 PM)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Default Currency</Form.Label>
                        <Form.Select
                          value={formData.currency}
                          onChange={(e) => {
                            const val = e.target.value;
                            const sym = val === "INR" ? "₹" : val === "USD" ? "$" : val === "EUR" ? "€" : val === "GBP" ? "£" : val === "AED" ? "د.إ" : val === "SGD" ? "S$" : "$";
                            setFormData({ ...formData, currency: val, currencySymbol: sym });
                          }}
                          disabled={!canUpdate}
                        >
                          <option value="INR">INR (₹ - Indian Rupee)</option>
                          <option value="USD">USD ($ - US Dollar)</option>
                          <option value="EUR">EUR (€ - Euro)</option>
                          <option value="GBP">GBP (£ - British Pound)</option>
                          <option value="AED">AED (د.إ - UAE Dirham)</option>
                          <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                          <option value="CAD">CAD (CA$ - Canadian Dollar)</option>
                          <option value="AUD">AUD (A$ - Australian Dollar)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Default Timezone</Form.Label>
                        <Form.Select
                          value={formData.timeZone}
                          onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                          <option value="America/New_York">America/New_York (EST/EDT)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                          <option value="Europe/London">Europe/London (GMT/BST)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                          <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Week Starts On</Form.Label>
                        <Form.Select
                          value={formData.weekStartDay}
                          onChange={(e) => setFormData({ ...formData, weekStartDay: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="Monday">Monday</option>
                          <option value="Sunday">Sunday</option>
                          <option value="Saturday">Saturday</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Standard Work Hours / Day</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="24"
                          value={formData.defaultWorkingHours}
                          onChange={(e) => setFormData({ ...formData, defaultWorkingHours: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 2: Attendance & Shifts (Redirect to Dedicated Attendance Workspace) */}
              {activeTab === "attendance" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                        <FaCalendarCheck className="text-success" /> Attendance Management
                      </h5>
                      <p className="text-muted small mb-0">
                        Attendance configurations have moved to the dedicated Workplace Attendance workspace.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--color-background, #FDFBF7)",
                      border: "1px solid #EAE0D0",
                      borderRadius: "12px",
                      padding: "32px 24px",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "#FEF3C7",
                        color: "#92400E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "26px",
                        margin: "0 auto 16px auto",
                      }}
                    >
                      <FaCalendarCheck />
                    </div>
                    <h4 style={{ fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
                      Dedicated Attendance Workspace
                    </h4>
                    <p style={{ color: "#6B7280", maxWidth: "560px", margin: "0 auto 24px auto", fontSize: "14px", lineHeight: "1.6" }}>
                      Organization baseline policies (verification methods, shifts, overtime, cutoff thresholds) and branch-specific geofencing &amp; network overrides are now managed centrally in the <strong>Workplace &rarr; Attendance</strong> workspace.
                    </p>
                    <div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (onNavigateTab) {
                            onNavigateTab("attendance");
                          } else {
                            window.location.href = "/organisation/attendance";
                          }
                        }}
                        style={{
                          background: "var(--color-primary, #C49A55)",
                          borderColor: "var(--color-primary, #C49A55)",
                          color: "#FFFFFF",
                          fontWeight: "600",
                          padding: "10px 24px",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 2px 4px rgba(196,154,85,0.25)",
                        }}
                      >
                        <FaCalendarCheck /> Manage Attendance <FaArrowRight size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Leave & Approvals */}
              {activeTab === "leave" && (
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FaShieldAlt className="text-warning" /> Leave Policies & Approval Hierarchy
                  </h5>
                  <p className="text-muted small mb-4">
                    Set up approval authority hierarchy for employee leave requests, notice periods, and link default holiday catalogs.
                  </p>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Leave Approval Workflow</Form.Label>
                        <Form.Select
                          value={formData.leaveApprovalMode}
                          onChange={(e) => setFormData({ ...formData, leaveApprovalMode: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="SINGLE_LEVEL">Single-Level (Direct Reporting Manager Only)</option>
                          <option value="MULTI_LEVEL">Multi-Level (Reporting Manager + HR / HOD)</option>
                          <option value="AUTO_APPROVE">Auto Approve (Instant Validation)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Minimum Notice Period (Days)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={formData.leaveNoticeDays}
                          onChange={(e) => setFormData({ ...formData, leaveNoticeDays: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Annual Carry-Forward Limit (Days)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={formData.carryForwardLimit}
                          onChange={(e) => setFormData({ ...formData, carryForwardLimit: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Default Holiday Catalog</Form.Label>
                        <Form.Select
                          value={formData.defaultHolidayCalendarId}
                          onChange={(e) => setFormData({ ...formData, defaultHolidayCalendarId: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="">-- Select Holiday Catalog --</option>
                          {holidayCalendars.map((h) => (
                            <option key={h._id} value={h._id}>{h.calendarName} ({h.year})</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <div className="p-3 bg-light rounded border">
                        <Form.Check
                          type="checkbox"
                          id="allowNegBalanceCheck"
                          label="Allow Negative Leave Balance (Advance Leave Booking)"
                          checked={formData.allowNegativeLeaveBalance}
                          onChange={(e) => setFormData({ ...formData, allowNegativeLeaveBalance: e.target.checked })}
                          disabled={!canUpdate}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 4: Payroll Defaults */}
              {activeTab === "payroll" && (
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FaIdCard className="text-info" /> Payroll Cycles & Processing Dates
                  </h5>
                  <p className="text-muted small mb-4">
                    Configure recurring payroll frequencies, processing cutoffs, payout disbursement dates, and overtime policies.
                  </p>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Payroll Cycle Frequency</Form.Label>
                        <Form.Select
                          value={formData.payrollCycle}
                          onChange={(e) => setFormData({ ...formData, payrollCycle: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="BI_WEEKLY">Bi-Weekly</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="SEMI_MONTHLY">Semi-Monthly (Twice a Month)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Salary Calculation Basis</Form.Label>
                        <Form.Select
                          value={formData.salaryCalculationBasis}
                          onChange={(e) => setFormData({ ...formData, salaryCalculationBasis: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="CALENDAR_DAYS">Actual Calendar Days in Month (28-31 Days)</option>
                          <option value="WORKING_DAYS">Actual Working Days (Excluding Weekends/Holidays)</option>
                          <option value="FIXED_30_DAYS">Fixed 30-Day Base</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Payroll Cutoff / Processing Day of Month (1-31)</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="31"
                          value={formData.payrollProcessingDay}
                          onChange={(e) => setFormData({ ...formData, payrollProcessingDay: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Salary Payout Day of Month (1-31)</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="31"
                          value={formData.payrollPayDay}
                          onChange={(e) => setFormData({ ...formData, payrollPayDay: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <div className="p-3 bg-light rounded border">
                        <Form.Check
                          type="checkbox"
                          id="allowOvertimeCheck"
                          label="Enable Overtime (OT) Compensation Calculation"
                          checked={formData.allowOvertime}
                          onChange={(e) => setFormData({ ...formData, allowOvertime: e.target.checked })}
                          disabled={!canUpdate}
                        />
                        {formData.allowOvertime && (
                          <div className="mt-2" style={{ maxWidth: "250px" }}>
                            <Form.Label className="small fw-semibold">Overtime Rate Multiplier (e.g. 1.5x)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              min="1"
                              max="3"
                              value={formData.overtimeRateMultiplier}
                              onChange={(e) => setFormData({ ...formData, overtimeRateMultiplier: e.target.value })}
                              disabled={!canUpdate}
                            />
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 5: ID Codes & System Standards */}
              {activeTab === "system" && (
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FaFileAlt className="text-primary" /> Employee Code Format & Security Standards
                  </h5>
                  <p className="text-muted small mb-4">
                    Control automatic employee code generation sequence, file upload thresholds, and session timeout policies.
                  </p>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Employee Code Prefix</Form.Label>
                        <Form.Control
                          placeholder="e.g. EMP, FLMT"
                          value={formData.employeeCodePrefix}
                          onChange={(e) => setFormData({ ...formData, employeeCodePrefix: e.target.value.toUpperCase() })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Starting Sequence Number</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={formData.employeeCodeStartingNumber}
                          onChange={(e) => setFormData({ ...formData, employeeCodeStartingNumber: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Code Number Length (Digits)</Form.Label>
                        <Form.Control
                          type="number"
                          min="3"
                          max="8"
                          value={formData.employeeCodeLength}
                          onChange={(e) => setFormData({ ...formData, employeeCodeLength: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Max Document Upload Size (MB)</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="50"
                          value={formData.documentUploadMaxSize}
                          onChange={(e) => setFormData({ ...formData, documentUploadMaxSize: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Session Timeout (Minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          min="15"
                          max="480"
                          value={formData.sessionTimeoutMinutes}
                          onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <div className="p-3 bg-light rounded border">
                        <Form.Check
                          type="checkbox"
                          id="autoGenEmpCodeCheck"
                          label="Auto-generate Employee Code on New User Creation"
                          checked={formData.autoGenerateEmployeeCode}
                          onChange={(e) => setFormData({ ...formData, autoGenerateEmployeeCode: e.target.checked })}
                          disabled={!canUpdate}
                        />
                        <div className="small text-muted mt-1">
                          Example generated code preview: <strong>{formData.employeeCodePrefix || "EMP"}{String(formData.employeeCodeStartingNumber || 1).padStart(Number(formData.employeeCodeLength) || 5, "0")}</strong>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 6: Notification Alerts */}
              {activeTab === "alerts" && (
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FaBell className="text-secondary" /> Automated Communications & Alerts
                  </h5>
                  <p className="text-muted small mb-4">
                    Toggle automatic dispatch channels for leave request approvals, attendance alerts, and payroll notices.
                  </p>

                  <Row className="g-3">
                    <Col md={12}>
                      <div className="p-4 bg-light rounded border">
                        <div className="fw-semibold text-dark mb-3">Communication Channels</div>
                        <div className="d-flex flex-column gap-3">
                          <Form.Check
                            type="switch"
                            id="emailNotifCheck"
                            label="Email Notifications (Attendance, Leave Approvals, Salary Slips)"
                            checked={formData.emailNotificationEnabled}
                            onChange={(e) => setFormData({ ...formData, emailNotificationEnabled: e.target.checked })}
                            disabled={!canUpdate}
                          />
                          <Form.Check
                            type="switch"
                            id="inAppNotifCheck"
                            label="In-App Real-time Bell Notifications"
                            checked={formData.inAppNotificationEnabled}
                            onChange={(e) => setFormData({ ...formData, inAppNotificationEnabled: e.target.checked })}
                            disabled={!canUpdate}
                          />
                          <Form.Check
                            type="switch"
                            id="smsNotifCheck"
                            label="SMS Alerts (Critical Security, OTP, and Emergency Updates)"
                            checked={formData.smsNotificationEnabled}
                            onChange={(e) => setFormData({ ...formData, smsNotificationEnabled: e.target.checked })}
                            disabled={!canUpdate}
                          />
                          <Form.Check
                            type="switch"
                            id="whatsappNotifCheck"
                            label="WhatsApp Business Notifications"
                            checked={formData.whatsappNotificationEnabled}
                            onChange={(e) => setFormData({ ...formData, whatsappNotificationEnabled: e.target.checked })}
                            disabled={!canUpdate}
                          />
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ── Sticky Save Actions Footer ── */}
              {canUpdate && (
                <div className="org-settings-footer mt-4">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={loadData}
                    disabled={saveLoading}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    variant="success"
                    className="org-action-btn"
                    type="submit"
                    disabled={saveLoading}
                  >
                    <FaSave className="me-2" />
                    {saveLoading ? "Saving Settings..." : "Save Settings"}
                  </Button>
                </div>
              )}
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizationSettingsSection;
