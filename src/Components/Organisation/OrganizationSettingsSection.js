import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
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
} from "react-icons/fa";
import {
  fetchOrganizationSettings,
  updateOrganizationSettings,
  fetchWorkCalendarsDropdown,
  fetchShiftsDropdown,
  fetchHolidayCalendarsDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import ThemeCustomizationSection from "./ThemeCustomizationSection";

function OrganizationSettingsSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [workCalendars, setWorkCalendars] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [holidayCalendars, setHolidayCalendars] = useState([]);

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

    // Attendance & Shifts
    attendanceMode: "GEOFENCE",
    attendanceGracePeriod: 15,
    halfDayThresholdHours: 4.5,
    fullDayThresholdHours: 8,
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
    hasPermission("orgSettings.update") ||
    hasPermission("organizationSettings.update");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [sett, wcList, shList, holList] = await Promise.all([
        fetchOrganizationSettings().catch((err) => {
          console.warn("fetchOrganizationSettings error:", err);
          return null;
        }),
        fetchWorkCalendarsDropdown().catch(() => []),
        fetchShiftsDropdown().catch(() => []),
        fetchHolidayCalendarsDropdown().catch(() => []),
      ]);

      if (sett) {
        setFormData({
          dateFormat: sett.dateFormat || "YYYY-MM-DD",
          timeFormat: sett.timeFormat || "HH:mm",
          timeZone: sett.timeZone || "Asia/Kolkata",
          currency: sett.currency || "INR",
          currencySymbol: sett.currencySymbol || "₹",
          weekStartDay: sett.weekStartDay || "Monday",
          defaultWorkingHours: sett.defaultWorkingHours || 9,
          status: sett.status || "ACTIVE",

          attendanceMode: sett.attendanceMode || "GEOFENCE",
          attendanceGracePeriod: sett.attendanceGracePeriod !== undefined ? sett.attendanceGracePeriod : 15,
          halfDayThresholdHours: sett.halfDayThresholdHours !== undefined ? sett.halfDayThresholdHours : 4.5,
          fullDayThresholdHours: sett.fullDayThresholdHours !== undefined ? sett.fullDayThresholdHours : 8,
          autoClockOutEnabled: sett.autoClockOutEnabled || false,
          autoClockOutTime: sett.autoClockOutTime || "23:59",
          defaultWorkCalendarId: sett.defaultWorkCalendarId?._id || sett.defaultWorkCalendarId || "",
          defaultShiftId: sett.defaultShiftId?._id || sett.defaultShiftId || "",

          leaveApprovalMode: sett.leaveApprovalMode || "SINGLE_LEVEL",
          leaveNoticeDays: sett.leaveNoticeDays !== undefined ? sett.leaveNoticeDays : 2,
          carryForwardLimit: sett.carryForwardLimit !== undefined ? sett.carryForwardLimit : 15,
          allowNegativeLeaveBalance: sett.allowNegativeLeaveBalance || false,
          defaultHolidayCalendarId: sett.defaultHolidayCalendarId?._id || sett.defaultHolidayCalendarId || "",

          payrollCycle: sett.payrollCycle || "MONTHLY",
          payrollProcessingDay: sett.payrollProcessingDay || 28,
          payrollPayDay: sett.payrollPayDay || 1,
          salaryCalculationBasis: sett.salaryCalculationBasis || "CALENDAR_DAYS",
          allowOvertime: sett.allowOvertime || false,
          overtimeRateMultiplier: sett.overtimeRateMultiplier || 1.5,

          employeeCodePrefix: sett.employeeCodePrefix || "EMP",
          employeeCodeStartingNumber: sett.employeeCodeStartingNumber || 1,
          employeeCodeLength: sett.employeeCodeLength || 5,
          autoGenerateEmployeeCode: sett.autoGenerateEmployeeCode !== undefined ? sett.autoGenerateEmployeeCode : true,
          documentUploadMaxSize: sett.documentUploadMaxSize || 10,
          sessionTimeoutMinutes: sett.sessionTimeoutMinutes || 60,

          emailNotificationEnabled: sett.emailNotificationEnabled !== undefined ? sett.emailNotificationEnabled : true,
          smsNotificationEnabled: sett.smsNotificationEnabled || false,
          whatsappNotificationEnabled: sett.whatsappNotificationEnabled || false,
          inAppNotificationEnabled: sett.inAppNotificationEnabled !== undefined ? sett.inAppNotificationEnabled : true,
        });
      }
      setWorkCalendars(wcList);
      setShifts(shList);
      setHolidayCalendars(holList);
    } catch (err) {
      setError(err.message || "Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        ...formData,
        defaultWorkingHours: Number(formData.defaultWorkingHours) || 9,
        attendanceGracePeriod: Number(formData.attendanceGracePeriod) || 0,
        halfDayThresholdHours: Number(formData.halfDayThresholdHours) || 4.5,
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

      const res = await updateOrganizationSettings(payload);
      setSuccess(res?.message || "Organization settings updated successfully");
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

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

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

              {/* TAB 2: Attendance & Shifts */}
              {activeTab === "attendance" && (
                <div>
                  <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                    <FaCalendarCheck className="text-success" /> Attendance Verification & Shift Policies
                  </h5>
                  <p className="text-muted small mb-4">
                    Define default check-in mode, punch-in grace tolerances, half/full day work hours, and automatic clock-out.
                  </p>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Attendance Verification Mode</Form.Label>
                        <Form.Select
                          value={formData.attendanceMode}
                          onChange={(e) => setFormData({ ...formData, attendanceMode: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="GEOFENCE">Geofenced Radius (Office / Site Boundaries)</option>
                          <option value="GPS">GPS Coordinates</option>
                          <option value="MANUAL">Manual / Open Punch</option>
                          <option value="BIOMETRIC">Biometric Integration</option>
                          <option value="QR_CODE">QR Code Scan</option>
                          <option value="IP_RESTRICTED">IP-Restricted Network</option>
                          <option value="ANY">Any Method Allowed</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Punch-In Grace Period (Minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={formData.attendanceGracePeriod}
                          onChange={(e) => setFormData({ ...formData, attendanceGracePeriod: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Half-Day Threshold (Hours)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.5"
                          min="1"
                          max="12"
                          value={formData.halfDayThresholdHours}
                          onChange={(e) => setFormData({ ...formData, halfDayThresholdHours: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Full-Day Threshold (Hours)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.5"
                          min="2"
                          max="24"
                          value={formData.fullDayThresholdHours}
                          onChange={(e) => setFormData({ ...formData, fullDayThresholdHours: e.target.value })}
                          disabled={!canUpdate}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Default Shift</Form.Label>
                        <Form.Select
                          value={formData.defaultShiftId}
                          onChange={(e) => setFormData({ ...formData, defaultShiftId: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="">-- Select Shift --</option>
                          {shifts.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.shiftName} ({s.startTime} - {s.endTime})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Default Work Calendar</Form.Label>
                        <Form.Select
                          value={formData.defaultWorkCalendarId}
                          onChange={(e) => setFormData({ ...formData, defaultWorkCalendarId: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="">-- Select Calendar --</option>
                          {workCalendars.map((c) => (
                            <option key={c._id} value={c._id}>{c.calendarName}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <div className="p-3 bg-light rounded border">
                        <Form.Check
                          type="checkbox"
                          id="autoClockOutCheck"
                          label="Enable Automatic System Clock-Out for Inactive Shifts"
                          checked={formData.autoClockOutEnabled}
                          onChange={(e) => setFormData({ ...formData, autoClockOutEnabled: e.target.checked })}
                          disabled={!canUpdate}
                        />
                        {formData.autoClockOutEnabled && (
                          <div className="mt-2" style={{ maxWidth: "250px" }}>
                            <Form.Label className="small fw-semibold">Auto Clock-Out Time</Form.Label>
                            <Form.Control
                              type="time"
                              value={formData.autoClockOutTime}
                              onChange={(e) => setFormData({ ...formData, autoClockOutTime: e.target.value })}
                              disabled={!canUpdate}
                            />
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
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
