import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Form, Button, Spinner, Alert, Badge } from "react-bootstrap";
import {
  FaCodeBranch,
  FaSave,
  FaCalendarCheck,
  FaClock,
  FaBell,
  FaIdCard,
  FaMapMarkerAlt,
  FaWifi,
  FaShieldAlt,
  FaPlus,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";

import {
  fetchBranchesDropdown,
  fetchBranchById,
  updateBranch,
  fetchWorkCalendarsDropdown,
  fetchShiftsDropdown,
  fetchHolidayCalendarsDropdown,
} from "../../services/organizationService";
import { useSelector } from "react-redux";
import { useHasPermission, selectIsSystemAdmin } from "../../redux/slices/authSlice";
import FeedbackAlert from "../Common/FeedbackAlert";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useBranch } from "../../context/BranchContext";

const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export default function BranchSettingsSection({ lockedBranchId = null }) {
  const hasPermission = useHasPermission();
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const { branches: contextBranches, selectedBranchId, refreshBranches } = useBranch();

  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(lockedBranchId || selectedBranchId || "");
  const [branchDetails, setBranchDetails] = useState(null);

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

  const [newIpInput, setNewIpInput] = useState("");
  const [ipError, setIpError] = useState("");

  const handleAddIp = (e) => {
    if (e) e.preventDefault();
    setIpError("");
    const trimmed = (newIpInput || "").trim();
    if (!trimmed) {
      setIpError("Please enter a valid IPv4 address.");
      return;
    }
    if (!IPV4_REGEX.test(trimmed)) {
      setIpError(`"${trimmed}" is not a valid IPv4 address. Example: 203.0.113.195`);
      return;
    }
    const currentIps = formData.staticIp?.allowedIps || [];
    if (currentIps.includes(trimmed)) {
      setIpError(`IP address "${trimmed}" is already added.`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      staticIp: {
        ...prev.staticIp,
        enabled: true,
        allowedIps: [...currentIps, trimmed],
      },
    }));
    setNewIpInput("");
  };

  const handleRemoveIp = (ipToRemove) => {
    setFormData((prev) => {
      const remaining = (prev.staticIp?.allowedIps || []).filter((ip) => ip !== ipToRemove);
      return {
        ...prev,
        staticIp: {
          ...prev.staticIp,
          allowedIps: remaining,
        },
      };
    });
  };

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
        setBranchDetails(data);
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
              {/* TAB 1: Attendance & Geofence */}
              {activeTab === "attendance" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                        <FaShieldAlt className="text-primary" /> Branch Attendance Verification & Office Boundaries
                      </h6>
                      <p className="text-muted extra-small mb-0">
                        Configure branch-specific attendance verification rules, physical geofence coordinates, and authorized office public IP networks.
                      </p>
                    </div>
                  </div>

                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Attendance Verification Mode</Form.Label>
                        <Form.Select
                          value={formData.attendanceMode}
                          onChange={(e) => {
                            const newMode = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              attendanceMode: newMode,
                              staticIp: {
                                ...prev.staticIp,
                                enabled: newMode === "STATIC_IP" || newMode === "BOTH",
                              },
                            }));
                          }}
                          disabled={!canUpdate}
                        >
                          <option value="GEOFENCE">Geofence (Location Radius)</option>
                          <option value="GPS">GPS (Coordinates Only)</option>
                          <option value="STATIC_IP">Wi-Fi / Office Network</option>
                          <option value="BOTH">Both (Geofence + Wi-Fi)</option>
                          <option value="MANUAL">Manual Override Only</option>
                          <option value="BIOMETRIC">Biometric Machine Integration</option>
                          <option value="ANY">Any (Unrestricted)</option>
                        </Form.Select>
                        <Form.Text className="extra-small text-muted">
                          Select the verification method enforced when employees assigned to this branch punch in.
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    {/* Geofence Configuration (Visible when GEOFENCE or BOTH) */}
                    {(formData.attendanceMode === "GEOFENCE" || formData.attendanceMode === "BOTH") && (
                      <Col md={12}>
                        <div className="p-3 bg-light rounded border">
                          <h6 className="small fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                            <FaMapMarkerAlt className="text-danger" /> Office Geofence Coordinates & Perimeter
                          </h6>
                          <p className="extra-small text-muted mb-3">
                            Set the physical center coordinates and allowable perimeter radius for this branch office.
                          </p>
                          <Row className="g-3">
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-semibold">Office Latitude</Form.Label>
                                <Form.Control
                                  type="number"
                                  step="0.000001"
                                  placeholder="e.g. 11.016844"
                                  value={formData.latitude}
                                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                  disabled={!canUpdate}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-semibold">Office Longitude</Form.Label>
                                <Form.Control
                                  type="number"
                                  step="0.000001"
                                  placeholder="e.g. 76.955832"
                                  value={formData.longitude}
                                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                  disabled={!canUpdate}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="extra-small fw-semibold">Geofence Radius (Meters)</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="20"
                                  max="5000"
                                  value={formData.officeRadiusMeters}
                                  onChange={(e) => setFormData({ ...formData, officeRadiusMeters: e.target.value })}
                                  disabled={!canUpdate}
                                />
                                <Form.Text className="extra-small text-muted">Allowable radius (default: 200m)</Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>
                        </div>
                      </Col>
                    )}

                    {/* Static Public IP Configuration (Visible when STATIC_IP or BOTH) */}
                    {(formData.attendanceMode === "STATIC_IP" || formData.attendanceMode === "BOTH") && (
                      <Col md={12}>
                        <div className="p-3 bg-light rounded border">
                          <h6 className="small fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                            <FaWifi className="text-info" /> Office Static Public IP Configuration
                          </h6>
                          <p className="extra-small text-muted mb-3">
                            Configure the authorized public static IP address(es) for this branch office network. Check-ins from this branch will verify the connection's public IP against this list.
                          </p>

                          <div className="d-flex gap-2 mb-2" style={{ maxWidth: "500px" }}>
                            <Form.Control
                              type="text"
                              size="sm"
                              placeholder="Enter static public IPv4 (e.g. 203.0.113.195)"
                              value={newIpInput}
                              onChange={(e) => {
                                setNewIpInput(e.target.value);
                                if (ipError) setIpError("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddIp();
                                }
                              }}
                              disabled={!canUpdate}
                            />
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={handleAddIp}
                              disabled={!canUpdate || !newIpInput.trim()}
                              className="d-flex align-items-center gap-1"
                            >
                              <FaPlus size={10} /> Add IP
                            </Button>
                          </div>

                          {ipError && (
                            <Alert variant="danger" className="py-1 px-2 extra-small mb-2" dismissible onClose={() => setIpError("")}>
                              {ipError}
                            </Alert>
                          )}

                          <div className="mt-2">
                            <Form.Label className="extra-small fw-semibold text-muted d-block mb-1">
                              Allowed Public IP Addresses:
                            </Form.Label>
                            {(!formData.staticIp?.allowedIps || formData.staticIp.allowedIps.length === 0) ? (
                              <div className="extra-small text-muted fst-italic">
                                No static IPs added yet. At least one static public IP is required for verification.
                              </div>
                            ) : (
                              <div className="d-flex flex-wrap gap-2">
                                {formData.staticIp.allowedIps.map((ip) => (
                                  <Badge
                                    key={ip}
                                    bg="white"
                                    text="dark"
                                    className="border px-2 py-1.5 d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                                  >
                                    <FaWifi className="text-primary me-1" size={10} />
                                    <span>{ip}</span>
                                    {canUpdate && (
                                      <button
                                        type="button"
                                        className="btn btn-sm p-0 ms-1 text-danger border-0 bg-transparent lh-1"
                                        onClick={() => handleRemoveIp(ip)}
                                        title={`Remove ${ip}`}
                                      >
                                        <FaTimes size={10} />
                                      </button>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Contextual Info for other modes */}
                    {formData.attendanceMode === "GPS" && (
                      <Col md={12}>
                        <Alert variant="info" className="extra-small mb-0">
                          <FaInfoCircle className="me-2" />
                          <strong>GPS (Coordinates Only):</strong> Captures geolocation coordinates upon check-in without enforcing distance boundary restrictions.
                        </Alert>
                      </Col>
                    )}

                    {formData.attendanceMode === "MANUAL" && (
                      <Col md={12}>
                        <Alert variant="warning" className="extra-small mb-0">
                          <FaInfoCircle className="me-2" />
                          <strong>Manual Override Only:</strong> Direct self punch-in is restricted. Attendance records require manual entry or administrative regularization.
                        </Alert>
                      </Col>
                    )}

                    {formData.attendanceMode === "BIOMETRIC" && (
                      <Col md={12}>
                        <Alert variant="secondary" className="extra-small mb-0">
                          <FaInfoCircle className="me-2" />
                          <strong>Biometric Machine Integration:</strong> Check-in logs synchronize directly from physical biometric hardware assigned to this branch.
                        </Alert>
                      </Col>
                    )}

                    {formData.attendanceMode === "ANY" && (
                      <Col md={12}>
                        <Alert variant="success" className="extra-small mb-0">
                          <FaCheckCircle className="me-2" />
                          <strong>Any (Unrestricted):</strong> Employees assigned to this branch can punch in from any location or device without network restrictions.
                        </Alert>
                      </Col>
                    )}
                  </Row>
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
