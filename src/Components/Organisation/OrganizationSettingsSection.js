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
} from "react-icons/fa";
import {
  fetchOrganizationSettings,
  updateOrganizationSettings,
  fetchWorkCalendarsDropdown,
  fetchShiftsDropdown,
  fetchHolidayCalendarsDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

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
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    timeZone: "Asia/Kolkata",
    currency: "INR",
    currencySymbol: "₹",
    weekStartDay: "Monday",
    defaultWorkingHours: 9,
    defaultWorkCalendarId: "",
    defaultShiftId: "",
    defaultHolidayCalendarId: "",
    attendanceMode: "GEOFENCE",
    attendanceGracePeriod: 15,
    leaveApprovalMode: "SINGLE_LEVEL",
    payrollCycle: "MONTHLY",
    payrollProcessingDay: 28,
    emailNotificationEnabled: true,
    smsNotificationEnabled: false,
    documentUploadMaxSize: 10,
    employeeCodePrefix: "EMP",
    employeeCodeStartingNumber: 1,
    status: "ACTIVE",
  });

  const canUpdate = isSystemAdmin ||
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
          defaultWorkCalendarId: sett.defaultWorkCalendarId?._id || sett.defaultWorkCalendarId || "",
          defaultShiftId: sett.defaultShiftId?._id || sett.defaultShiftId || "",
          defaultHolidayCalendarId: sett.defaultHolidayCalendarId?._id || sett.defaultHolidayCalendarId || "",
          attendanceMode: sett.attendanceMode || "GEOFENCE",
          attendanceGracePeriod: sett.attendanceGracePeriod !== undefined ? sett.attendanceGracePeriod : 15,
          leaveApprovalMode: sett.leaveApprovalMode || "SINGLE_LEVEL",
          payrollCycle: sett.payrollCycle || "MONTHLY",
          payrollProcessingDay: sett.payrollProcessingDay || 28,
          emailNotificationEnabled: sett.emailNotificationEnabled !== undefined ? sett.emailNotificationEnabled : true,
          smsNotificationEnabled: sett.smsNotificationEnabled || false,
          documentUploadMaxSize: sett.documentUploadMaxSize || 10,
          employeeCodePrefix: sett.employeeCodePrefix || "EMP",
          employeeCodeStartingNumber: sett.employeeCodeStartingNumber || 1,
          status: sett.status || "ACTIVE",
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
        payrollProcessingDay: Number(formData.payrollProcessingDay) || 28,
        documentUploadMaxSize: Number(formData.documentUploadMaxSize) || 10,
        employeeCodeStartingNumber: Number(formData.employeeCodeStartingNumber) || 1,
        defaultWorkCalendarId: formData.defaultWorkCalendarId || null,
        defaultShiftId: formData.defaultShiftId || null,
        defaultHolidayCalendarId: formData.defaultHolidayCalendarId || null,
      };

      const res = await updateOrganizationSettings(payload);
      setSuccess(res.message || "Organization settings updated successfully");
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
            Configure enterprise rules, time formats, attendance enforcement, approval workflows, and employee ID patterns.
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
            <FaBell className="me-2 text-secondary" />
            <span>ID Codes & Alerts</span>
          </button>
        </div>

        {/* ── Settings Form Viewport ── */}
        <div className="org-settings-content">
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
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-19)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (19/09/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (09/19/2026)</option>
                        <option value="DD-MMM-YYYY">DD-MMM-YYYY (19-Sep-2026)</option>
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
                        onChange={(e) => setFormData({
                          ...formData,
                          currency: e.target.value,
                          currencySymbol: e.target.value === "INR" ? "₹" : e.target.value === "USD" ? "$" : e.target.value === "EUR" ? "€" : "£",
                        })}
                        disabled={!canUpdate}
                      >
                        <option value="INR">INR (₹ - Indian Rupee)</option>
                        <option value="USD">USD ($ - US Dollar)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                        <option value="GBP">GBP (£ - British Pound)</option>
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
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
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
                  Define default check-in mode, punch-in grace tolerances, standard work calendar, and shift schedules.
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
                </Row>
              </div>
            )}

            {/* TAB 3: Leave & Approvals */}
            {activeTab === "leave" && (
              <div>
                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <FaShieldAlt className="text-warning" /> Leave Policies & Holiday Catalogs
                </h5>
                <p className="text-muted small mb-4">
                  Set up approval authority hierarchy for employee leave requests and link default holiday catalogs.
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
                        <option value="SINGLE_LEVEL">Single-Level (Direct Manager Only)</option>
                        <option value="MULTI_LEVEL">Multi-Level (Manager + HR/HOD)</option>
                        <option value="AUTO_APPROVE">Auto Approve</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Default Holiday Calendar</Form.Label>
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
                  Configure recurring payroll frequencies and monthly disbursement cutoff schedules.
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
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Payroll Cutoff / Processing Day (1-31)</Form.Label>
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
                </Row>
              </div>
            )}

            {/* TAB 5: System Standards & Alerts */}
            {activeTab === "system" && (
              <div>
                <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <FaBell className="text-secondary" /> ID Numbering & Notification Alerts
                </h5>
                <p className="text-muted small mb-4">
                  Control automatic employee code generation prefixes, sequence start numbers, and file upload limits.
                </p>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Employee Code Prefix</Form.Label>
                      <Form.Control
                        placeholder="e.g. EMP, TMH"
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
                  <Col md={12}>
                    <div className="p-3 bg-light rounded border mt-2">
                      <div className="small fw-semibold text-secondary mb-2">
                        <FaBell className="me-1" /> Automated System Notifications
                      </div>
                      <div className="d-flex flex-wrap gap-4">
                        <Form.Check
                          type="checkbox"
                          id="emailNotifCheck"
                          label="Enable Email Notifications (Leave & Attendance)"
                          checked={formData.emailNotificationEnabled}
                          onChange={(e) => setFormData({ ...formData, emailNotificationEnabled: e.target.checked })}
                          disabled={!canUpdate}
                        />
                        <Form.Check
                          type="checkbox"
                          id="smsNotifCheck"
                          label="Enable SMS Alerts"
                          checked={formData.smsNotificationEnabled}
                          onChange={(e) => setFormData({ ...formData, smsNotificationEnabled: e.target.checked })}
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
              <div className="org-settings-footer">
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
        </div>
      </div>
    </div>
  );
}

export default OrganizationSettingsSection;
