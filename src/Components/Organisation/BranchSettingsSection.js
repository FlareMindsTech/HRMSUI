import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import {
  FaCodeBranch,
  FaSave,
  FaCalendarCheck,
  FaClock,
  FaBell,
  FaIdCard,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";

import {
  fetchBranchesDropdown,
  fetchBranchById,
  updateBranch,
  fetchWorkCalendarsDropdown,
  fetchShiftsDropdown,
  fetchHolidayCalendarsDropdown,
} from "../../services/organizationService";
import { useHasPermission } from "../../redux/slices/authSlice";
import FeedbackAlert from "../Common/FeedbackAlert";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useBranch } from "../../context/BranchContext";

export default function BranchSettingsSection({ lockedBranchId = null, onNavigateTab }) {
  const hasPermission = useHasPermission();
  const { branches: contextBranches, selectedBranchId, refreshBranches } = useBranch();

  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(lockedBranchId || selectedBranchId || "");

  const [shifts, setShifts] = useState([]);
  const [workCalendars, setWorkCalendars] = useState([]);
  const [holidayCalendars, setHolidayCalendars] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");

  const canUpdate = Boolean(
    hasPermission &&
    (hasPermission("branch.update") || hasPermission("organization.update"))
  );

  const [formData, setFormData] = useState({
    attendanceMode: "GEOFENCE",
    staticIp: {
      enabled: false,
      allowedIps: [],
    },
    officeRadiusMeters: 200,
    latitude: "",
    longitude: "",
    timeZone: "Asia/Kolkata",
    defaultShiftId: "",
    defaultWorkCalendarId: "",
    defaultHolidayCalendarId: "",
    allowOvertime: false,
    overtimeRateMultiplier: 1.5,
    emailNotificationEnabled: true,
    smsNotificationEnabled: false,
    status: "ACTIVE",
  });

  // Load Dropdowns
  const loadDropdowns = useCallback(async () => {
    try {
      const [brList, shList, wcList, holList] = await Promise.all([
        fetchBranchesDropdown().catch(() => []),
        fetchShiftsDropdown().catch(() => []),
        fetchWorkCalendarsDropdown().catch(() => []),
        fetchHolidayCalendarsDropdown().catch(() => []),
      ]);
      setBranches(brList.length > 0 ? brList : contextBranches || []);
      setShifts(shList);
      setWorkCalendars(wcList);
      setHolidayCalendars(holList);

      if (!activeBranchId && brList.length > 0) {
        setActiveBranchId(String(brList[0]._id || brList[0].id));
      }
    } catch (e) {
      console.warn("Dropdown loading notice:", e);
    }
  }, [contextBranches, activeBranchId]);

  // Load Active Branch Details
  const loadBranchConfig = useCallback(async (bId) => {
    if (!bId) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchBranchById(bId);
      if (data) {
        setFormData({
          attendanceMode: data.attendanceMode || "GEOFENCE",
          staticIp: data.staticIp || { enabled: false, allowedIps: [] },
          officeRadiusMeters: data.officeRadiusMeters || 200,
          latitude: data.latitude !== undefined && data.latitude !== null ? data.latitude : "",
          longitude: data.longitude !== undefined && data.longitude !== null ? data.longitude : "",
          timeZone: data.timeZone || "Asia/Kolkata",
          defaultShiftId: data.defaultShiftId?._id || data.defaultShiftId || "",
          defaultWorkCalendarId: data.defaultWorkCalendarId?._id || data.defaultWorkCalendarId || "",
          defaultHolidayCalendarId: data.defaultHolidayCalendarId?._id || data.defaultHolidayCalendarId || "",
          allowOvertime: data.allowOvertime || false,
          overtimeRateMultiplier: data.overtimeRateMultiplier || 1.5,
          emailNotificationEnabled: data.emailNotificationEnabled !== undefined ? data.emailNotificationEnabled : true,
          smsNotificationEnabled: data.smsNotificationEnabled || false,
          status: data.status || "ACTIVE",
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load branch configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  useEffect(() => {
    if (activeBranchId) {
      loadBranchConfig(activeBranchId);
    }
  }, [activeBranchId, loadBranchConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeBranchId) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Validation: If STATIC_IP or BOTH, require at least one static public IP
      if (formData.attendanceMode === "STATIC_IP" || formData.attendanceMode === "BOTH") {
        const ips = formData.staticIp?.allowedIps || [];
        if (!Array.isArray(ips) || ips.length === 0) {
          setError("At least one valid static public IP is required for Wi-Fi / Office Network or Both mode.");
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...formData,
        officeRadiusMeters: Number(formData.officeRadiusMeters) || 200,
        latitude: formData.latitude !== "" && formData.latitude !== null ? Number(formData.latitude) : null,
        longitude: formData.longitude !== "" && formData.longitude !== null ? Number(formData.longitude) : null,
        staticIp: {
          enabled: formData.attendanceMode === "STATIC_IP" || formData.attendanceMode === "BOTH",
          allowedIps: formData.staticIp?.allowedIps || [],
        },
        overtimeRateMultiplier: Number(formData.overtimeRateMultiplier) || 1.5,
        defaultShiftId: formData.defaultShiftId || null,
        defaultWorkCalendarId: formData.defaultWorkCalendarId || null,
        defaultHolidayCalendarId: formData.defaultHolidayCalendarId || null,
      };

      const res = await updateBranch(activeBranchId, payload);
      setSuccess(res?.message || "Branch configuration saved successfully!");
      if (refreshBranches) refreshBranches();
      await loadBranchConfig(activeBranchId);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save branch settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="branch-settings-section">
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <FaCodeBranch className="text-success" /> Branch Settings
          </h3>
          <p className="text-muted small mb-0">
            Configure branch-specific rules, attendance geofence radius, default shift schedules, and notification preferences.
          </p>
        </div>

        {/* Branch Selector (Hidden if locked in branch detail view) */}
        {!lockedBranchId && branches.length > 0 && (
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-semibold text-secondary">Branch:</span>
            <Form.Select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              style={{ width: "240px" }}
              className="form-select-sm fw-semibold"
            >
              {branches.map((b) => (
                <option key={b._id || b.id} value={b._id || b.id}>
                  {b.branchName} ({b.branchCode || b.city})
                </option>
              ))}
            </Form.Select>
          </div>
        )}
      </div>

      <FeedbackAlert variant="danger" dismissible onClose={() => setError("")} message={error} />
      <FeedbackAlert variant="success" dismissible onClose={() => setSuccess("")} message={success} />

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Loading branch configuration...</p>
        </div>
      ) : (
        <Card className="border shadow-sm bg-white">
          <Card.Header className="bg-white border-bottom p-0">
            <div className="d-flex border-bottom flex-wrap">
              <button
                type="button"
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${activeTab === "attendance" ? "text-success border-bottom border-success border-2 bg-light" : "text-secondary"}`}
                onClick={() => setActiveTab("attendance")}
              >
                <FaCalendarCheck className="me-2" /> Attendance & Geofence
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${activeTab === "schedules" ? "text-success border-bottom border-success border-2 bg-light" : "text-secondary"}`}
                onClick={() => setActiveTab("schedules")}
              >
                <FaClock className="me-2" /> Schedules & Calendars
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${activeTab === "payroll" ? "text-success border-bottom border-success border-2 bg-light" : "text-secondary"}`}
                onClick={() => setActiveTab("payroll")}
              >
                <FaIdCard className="me-2" /> Payroll & Overtime
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${activeTab === "notifications" ? "text-success border-bottom border-success border-2 bg-light" : "text-secondary"}`}
                onClick={() => setActiveTab("notifications")}
              >
                <FaBell className="me-2" /> Notifications
              </button>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            <Form onSubmit={handleSave}>
              {/* TAB 1: Attendance & Geofence (Redirect to Dedicated Attendance Workspace) */}
              {activeTab === "attendance" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                        <FaShieldAlt className="text-primary" /> Branch Attendance &amp; Geofence Management
                      </h6>
                      <p className="text-muted extra-small mb-0">
                        Branch-specific attendance overrides have moved to the dedicated Workplace Attendance workspace.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#FDFBF7",
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
                      <FaMapMarkerAlt />
                    </div>
                    <h4 style={{ fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
                      Branch Attendance &amp; Geofencing
                    </h4>
                    <p style={{ color: "#6B7280", maxWidth: "560px", margin: "0 auto 24px auto", fontSize: "14px", lineHeight: "1.6" }}>
                      Branch verification modes, GPS geofence coordinates, perimeter radius, and static office IP allowlists are now managed centrally in the <strong>Workplace &rarr; Attendance &rarr; Branch Configuration</strong> tab.
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
                          background: "#C49A55",
                          borderColor: "#C49A55",
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
                        <FaCalendarCheck /> Manage Branch Attendance <FaArrowRight size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Schedules & Calendars */}
              {activeTab === "schedules" && (
                <div>
                  <h6 className="fw-bold text-dark mb-3">Branch Schedules & Default Catalogs</h6>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Default Work Shift</Form.Label>
                        <Form.Select
                          value={formData.defaultShiftId}
                          onChange={(e) => setFormData({ ...formData, defaultShiftId: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="">-- Select Default Shift --</option>
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
                          <option value="">-- Select Work Calendar --</option>
                          {workCalendars.map((c) => (
                            <option key={c._id} value={c._id}>{c.calendarName}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Holiday Calendar Catalog</Form.Label>
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

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Branch Time Zone</Form.Label>
                        <Form.Select
                          value={formData.timeZone}
                          onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                          <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 3: Payroll & Overtime */}
              {activeTab === "payroll" && (
                <div>
                  <h6 className="fw-bold text-dark mb-3">Branch Payroll & Overtime Overrides</h6>
                  <Row className="g-3">
                    <Col md={12}>
                      <div className="p-3 bg-light rounded border">
                        <Form.Check
                          type="checkbox"
                          id="branchOtCheck"
                          label="Enable Overtime (OT) Rate Calculation for this Branch"
                          checked={formData.allowOvertime}
                          onChange={(e) => setFormData({ ...formData, allowOvertime: e.target.checked })}
                          disabled={!canUpdate}
                        />
                        {formData.allowOvertime && (
                          <div className="mt-3" style={{ maxWidth: "250px" }}>
                            <Form.Label className="small fw-semibold">Branch OT Multiplier</Form.Label>
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

              {/* TAB 4: Notifications */}
              {activeTab === "notifications" && (
                <div>
                  <h6 className="fw-bold text-dark mb-3">Automated Communications for Branch Staff</h6>
                  <div className="p-3 bg-light rounded border d-flex flex-column gap-3">
                    <Form.Check
                      type="switch"
                      id="branchEmailCheck"
                      label="Dispatch Email Notifications (Leave approvals, Attendance irregularities)"
                      checked={formData.emailNotificationEnabled}
                      onChange={(e) => setFormData({ ...formData, emailNotificationEnabled: e.target.checked })}
                      disabled={!canUpdate}
                    />
                    <Form.Check
                      type="switch"
                      id="branchSmsCheck"
                      label="Dispatch SMS Alerts for Emergency & Security Shifts"
                      checked={formData.smsNotificationEnabled}
                      onChange={(e) => setFormData({ ...formData, smsNotificationEnabled: e.target.checked })}
                      disabled={!canUpdate}
                    />
                  </div>
                </div>
              )}

              {/* Action Footer */}
              {canUpdate && (
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => loadBranchConfig(activeBranchId)}
                    disabled={saving}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    type="submit"
                    className="d-flex align-items-center gap-1 fw-semibold px-3"
                    disabled={saving}
                  >
                    {saving ? <LoadingSpinner variant="button" size="sm" /> : <FaSave />} Save Branch Settings
                  </Button>
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
