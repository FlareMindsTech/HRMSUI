import React, { useState, useEffect, useCallback, useRef } from "react";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import {
  FaCodeBranch,
  FaSave,
  FaClock,
  FaBuilding,
  FaShieldAlt,
  FaCheckCircle,
  FaUndo,
  FaPlus,
  FaExclamationTriangle,
  FaMapMarkerAlt,
} from "react-icons/fa";

import {
  fetchBranchesDropdown,
  fetchBranchById,
  updateBranch,
} from "../../services/organizationService";
import { useSelector, useDispatch } from "react-redux";
import { useHasPermission } from "../../redux/slices/authSlice";
import {
  fetchOrgResource,
  selectShiftsDropdown,
  selectWorkCalendarsDropdown,
  selectHolidayCalendarsDropdown,
  selectAttendancePolicy,
  selectOrgSettings,
} from "../../redux/slices/organizationSlice";
import FeedbackAlert from "../Common/FeedbackAlert";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useBranch } from "../../context/BranchContext";
import AttendanceVerificationMethodConfig from "../Attendance/AttendanceVerificationMethodConfig";
import { VERIFICATION_OPTIONS } from "./OrganizationSettingsSection";

export default function BranchSettingsSection({ lockedBranchId = null, onNavigateTab }) {
  const hasPermission = useHasPermission();
  const { branches: contextBranches, selectedBranchId, refreshBranches } = useBranch();
  const dispatch = useDispatch();

  // Shared shift/calendar dropdowns & org policy
  const cachedShifts = useSelector(selectShiftsDropdown);
  const cachedWorkCalendars = useSelector(selectWorkCalendarsDropdown);
  const cachedHolidayCalendars = useSelector(selectHolidayCalendarsDropdown);
  const cachedPolicyBody = useSelector(selectAttendancePolicy);
  const cachedOrgSettings = useSelector(selectOrgSettings);

  const dropdownCacheRef = useRef(null);
  dropdownCacheRef.current = {
    sh: cachedShifts,
    wc: cachedWorkCalendars,
    hol: cachedHolidayCalendars,
    pol: cachedPolicyBody,
    sett: cachedOrgSettings,
  };

  const [branches, setBranches] = useState([]);
  const [activeBranchId, setActiveBranchId] = useState(lockedBranchId || selectedBranchId || "");

  const [shifts, setShifts] = useState([]);
  const [workCalendars, setWorkCalendars] = useState([]);
  const [holidayCalendars, setHolidayCalendars] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("schedules");

  const canUpdate = Boolean(
    hasPermission &&
    (hasPermission("branch.update") || hasPermission("organization.update"))
  );

  const [formData, setFormData] = useState({
    timeZone: "Asia/Kolkata",
    defaultShiftId: "",
    defaultWorkCalendarId: "",
    defaultHolidayCalendarId: "",
    branchName: "",
    branchCode: "",
    branchType: "",
    city: "",
    state: "",
    // Attendance Override Fields
    attendanceMode: null,
    staticIp: { enabled: false, allowedIps: [] },
    isOverridden: false,
  });

  // Organization baseline defaults (from cached policy/settings)
  const orgDefaultAttendanceMode =
    (cachedPolicyBody?.data || cachedPolicyBody)?.attendanceMode ||
    cachedOrgSettings?.attendanceMode ||
    "GEOFENCE";
  const orgDefaultShiftId =
    cachedOrgSettings?.defaultShiftId?._id || cachedOrgSettings?.defaultShiftId || "";
  const orgDefaultWcId =
    cachedOrgSettings?.defaultWorkCalendarId?._id || cachedOrgSettings?.defaultWorkCalendarId || "";
  const orgDefaultHolId =
    cachedOrgSettings?.defaultHolidayCalendarId?._id || cachedOrgSettings?.defaultHolidayCalendarId || "";

  const orgDefaultShiftName = shifts.find((s) => s._id === orgDefaultShiftId)?.shiftName;
  const orgDefaultWcName = workCalendars.find((c) => c._id === orgDefaultWcId)?.calendarName;
  const orgDefaultHolName = holidayCalendars.find((h) => h._id === orgDefaultHolId)?.calendarName;

  const activeOrgOption =
    VERIFICATION_OPTIONS.find((opt) => opt.key === orgDefaultAttendanceMode) ||
    VERIFICATION_OPTIONS[0];
  const ActiveOrgIcon = activeOrgOption?.icon || FaMapMarkerAlt;

  // Load Dropdowns & Policy
  const loadDropdowns = useCallback(async () => {
    try {
      const [brList, shRes, wcRes, holRes] = await Promise.all([
        fetchBranchesDropdown().catch(() => []),
        dispatch(fetchOrgResource({ key: "shifts" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "workCalendars" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "holidayCalendars" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "attendancePolicy" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "settings" })).catch(() => null),
      ]);
      setBranches(brList.length > 0 ? brList : contextBranches || []);
      setShifts(shRes?.payload?.data ?? dropdownCacheRef.current?.sh ?? []);
      setWorkCalendars(wcRes?.payload?.data ?? dropdownCacheRef.current?.wc ?? []);
      setHolidayCalendars(holRes?.payload?.data ?? dropdownCacheRef.current?.hol ?? []);

      if (lockedBranchId) {
        setActiveBranchId(lockedBranchId);
      } else if (!activeBranchId && brList.length > 0) {
        setActiveBranchId(String(brList[0]._id || brList[0].id));
      }
    } catch (e) {
      console.warn("Dropdown loading notice:", e);
    }
  }, [contextBranches, activeBranchId, lockedBranchId, dispatch]);

  // Load Active Branch Details
  const loadBranchConfig = useCallback(async (bId) => {
    if (!bId) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchBranchById(bId);
      if (data) {
        const rawMode = data.attendanceMode || null;
        const isOverridden = Boolean(rawMode && rawMode !== "INHERIT");
        setFormData({
          timeZone: data.timeZone || "Asia/Kolkata",
          defaultShiftId: data.defaultShiftId?._id || data.defaultShiftId || "",
          defaultWorkCalendarId: data.defaultWorkCalendarId?._id || data.defaultWorkCalendarId || "",
          defaultHolidayCalendarId: data.defaultHolidayCalendarId?._id || data.defaultHolidayCalendarId || "",
          branchName: data.branchName || "",
          branchCode: data.branchCode || "",
          branchType: data.branchType || "",
          city: data.city || "",
          state: data.state || "",
          attendanceMode: isOverridden ? rawMode : null,
          staticIp: data.staticIp || { enabled: false, allowedIps: [] },
          isOverridden,
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

  const handleEnableOverride = () => {
    setFormData((prev) => ({
      ...prev,
      isOverridden: true,
      attendanceMode: prev.attendanceMode || orgDefaultAttendanceMode || "GEOFENCE",
      staticIp: prev.staticIp || { enabled: false, allowedIps: [] },
    }));
  };

  const handleRevertToOrgDefault = () => {
    setFormData((prev) => ({
      ...prev,
      isOverridden: false,
      attendanceMode: null,
      staticIp: { enabled: false, allowedIps: [] },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeBranchId) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        timeZone: formData.timeZone,
        defaultShiftId: formData.defaultShiftId || null,
        defaultWorkCalendarId: formData.defaultWorkCalendarId || null,
        defaultHolidayCalendarId: formData.defaultHolidayCalendarId || null,
        attendanceMode: formData.isOverridden ? (formData.attendanceMode || "GEOFENCE") : null,
        staticIp: formData.isOverridden
          ? (formData.staticIp || { enabled: false, allowedIps: [] })
          : { enabled: false, allowedIps: [] },
      };

      if (formData.isOverridden && (payload.attendanceMode === "STATIC_IP" || payload.attendanceMode === "BOTH")) {
        if (!payload.staticIp?.allowedIps || payload.staticIp.allowedIps.length === 0) {
          setError("At least one valid static public IP is required for Wi-Fi / Office Network or Both mode.");
          setSaving(false);
          return;
        }
      }

      const res = await updateBranch(activeBranchId, payload);
      setSuccess(res?.message || "Branch configuration and overrides saved successfully!");
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
            Configure default work shift schedules, work calendars, holiday catalogs, operational time zone, and attendance verification overrides.
          </p>
        </div>

        {/* Branch Selector */}
        {!lockedBranchId && branches.length > 0 ? (
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
        ) : lockedBranchId ? (
          <div className="d-flex align-items-center gap-2 px-3 py-1 bg-light rounded border">
            <span className="badge bg-secondary-subtle text-secondary border">Scoped Branch</span>
            <span className="small fw-bold text-dark">{formData.branchName || "Assigned Branch"}</span>
          </div>
        ) : null}
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
            <div className="d-flex border-bottom flex-wrap" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "schedules"}
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${
                  activeTab === "schedules"
                    ? "text-success border-bottom border-success border-2 bg-light"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab("schedules")}
              >
                <FaClock className="me-2" /> Schedules &amp; Calendars
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "attendance"}
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${
                  activeTab === "attendance"
                    ? "text-success border-bottom border-success border-2 bg-light"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab("attendance")}
              >
                <FaShieldAlt className="me-2" /> Attendance &amp; Verification Override
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "profile"}
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${
                  activeTab === "profile"
                    ? "text-success border-bottom border-success border-2 bg-light"
                    : "text-secondary"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <FaBuilding className="me-2" /> Branch Profile / Timezone
              </button>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            <Form onSubmit={handleSave}>
              {/* TAB 1: Schedules & Calendars */}
              {activeTab === "schedules" && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">Branch Schedules &amp; Default Catalogs</h6>
                  <p className="text-muted small mb-3">
                    Assign the default work shift and calendars for employees belonging to this branch. Empty selections inherit organization defaults.
                  </p>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Default Work Shift</Form.Label>
                        <Form.Select
                          value={formData.defaultShiftId}
                          onChange={(e) => setFormData({ ...formData, defaultShiftId: e.target.value })}
                          disabled={!canUpdate}
                        >
                          <option value="">-- Inherit Organization Default --</option>
                          {shifts.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.shiftName} ({s.startTime} - {s.endTime})
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted extra-small">
                          {formData.defaultShiftId
                            ? "Custom shift assigned for this branch."
                            : `Currently inheriting Organization Default: ${orgDefaultShiftName || "Standard General Shift"}.`}
                        </Form.Text>
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
                          <option value="">-- Inherit Organization Default --</option>
                          {workCalendars.map((c) => (
                            <option key={c._id} value={c._id}>{c.calendarName}</option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted extra-small">
                          {formData.defaultWorkCalendarId
                            ? "Custom work calendar assigned for this branch."
                            : `Currently inheriting Organization Default: ${orgDefaultWcName || "Standard Work Week"}.`}
                        </Form.Text>
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
                          <option value="">-- Inherit Organization Default --</option>
                          {holidayCalendars.map((h) => (
                            <option key={h._id} value={h._id}>{h.calendarName} ({h.year})</option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted extra-small">
                          {formData.defaultHolidayCalendarId
                            ? "Custom holiday calendar assigned for this branch."
                            : `Currently inheriting Organization Default: ${orgDefaultHolName || "Standard Holiday Calendar"}.`}
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 2: Attendance & Verification Override */}
              {activeTab === "attendance" && (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                        <FaShieldAlt className="text-success" /> Attendance Verification Mode &amp; Network Rules
                      </h6>
                      <p className="text-muted small mb-0">
                        Configure branch-level clock-in verification rules or inherit the organization baseline policy.
                      </p>
                    </div>

                    {formData.isOverridden ? (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleRevertToOrgDefault}
                        disabled={!canUpdate || saving}
                        className="d-flex align-items-center gap-1 fw-semibold"
                      >
                        <FaUndo /> Revert to Organization Default
                      </Button>
                    ) : (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleEnableOverride}
                        disabled={!canUpdate || saving}
                        className="d-flex align-items-center gap-1 fw-semibold"
                      >
                        <FaPlus /> Override for this Branch
                      </Button>
                    )}
                  </div>

                  {!formData.isOverridden ? (
                    <div className="p-4 bg-light rounded-3 border mb-3">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-semibold">
                          <FaCheckCircle className="me-1" /> Inheriting Organization Default Policy
                        </span>
                        <span className="text-muted small">No branch-specific override configured</span>
                      </div>
                      <p className="text-secondary small mb-3">
                        Employees assigned to <strong>{formData.branchName || "this branch"}</strong> verify clock-ins according to the active enterprise-wide organization attendance policy:
                      </p>

                      <div className="card p-3 border-0 bg-white rounded-3 shadow-xs">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`verification-card__icon ${activeOrgOption?.iconClass || "verification-icon--geofence"}`}>
                            <ActiveOrgIcon />
                          </div>
                          <div>
                            <div className="fw-bold text-dark fs-6">{activeOrgOption?.title || orgDefaultAttendanceMode}</div>
                            <p className="text-muted extra-small mb-0">{activeOrgOption?.desc}</p>
                          </div>
                          <span className="badge bg-secondary-subtle text-secondary ms-auto px-2 py-1">
                            {activeOrgOption?.badge || "Org Default"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-muted extra-small">
                        Need branch-specific Wi-Fi IPs or different enforcement for this office? Click <strong>Override for this Branch</strong> above.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="alert alert-warning py-2 px-3 small d-flex align-items-center justify-content-between mb-4 border">
                        <div className="d-flex align-items-center gap-2">
                          <FaExclamationTriangle className="text-warning flex-shrink-0" />
                          <span>
                            <strong>Branch Override Active:</strong> This branch enforces custom clock-in verification rules independent of the organization default. Click "Revert to Organization Default" at any time to clear this override.
                          </span>
                        </div>
                      </div>

                      <div className="verification-options-grid mb-4">
                        {VERIFICATION_OPTIONS.map((opt) => {
                          const IconComp = opt.icon;
                          const isSelected = formData.attendanceMode === opt.key;
                          return (
                            <div
                              key={opt.key}
                              className={`verification-card ${
                                isSelected ? "verification-card--selected" : ""
                              } ${!canUpdate ? "verification-card--disabled" : ""}`}
                              onClick={() => {
                                if (!canUpdate) return;
                                setFormData((prev) => ({
                                  ...prev,
                                  attendanceMode: opt.key,
                                  staticIp: {
                                    ...prev.staticIp,
                                    enabled: opt.key === "STATIC_IP" || opt.key === "BOTH",
                                  },
                                }));
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="verification-card-header">
                                <div className={`verification-card__icon ${opt.iconClass}`}>
                                  <IconComp />
                                </div>
                                <span
                                  className={`badge ${
                                    isSelected ? "bg-success" : "bg-light text-secondary border"
                                  }`}
                                >
                                  {opt.badge}
                                </span>
                              </div>
                              <h6 className="verification-card-title">{opt.title}</h6>
                              <p className="verification-card-desc">{opt.desc}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reusable contextual verification config (IP list, Geofence preview) */}
                      <AttendanceVerificationMethodConfig
                        value={formData.attendanceMode}
                        staticIp={formData.staticIp}
                        onChange={(newMode, updatedStaticIp) => {
                          setFormData((prev) => ({
                            ...prev,
                            attendanceMode: newMode,
                            staticIp: updatedStaticIp,
                          }));
                        }}
                        disabled={!canUpdate}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Branch Profile / Timezone */}
              {activeTab === "profile" && (
                <div>
                  <h6 className="fw-bold text-dark mb-1">Branch Profile &amp; Timezone Configuration</h6>
                  <p className="text-muted small mb-3">
                    View branch information and configure the operational time zone for schedule calculations.
                  </p>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Branch Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.branchName}
                          disabled
                          readOnly
                          className="bg-light"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Branch Code</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.branchCode}
                          disabled
                          readOnly
                          className="bg-light"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Branch Type</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.branchType}
                          disabled
                          readOnly
                          className="bg-light"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Location (City / State)</Form.Label>
                        <Form.Control
                          type="text"
                          value={[formData.city, formData.state].filter(Boolean).join(", ") || "N/A"}
                          disabled
                          readOnly
                          className="bg-light"
                        />
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
                          <option value="America/Chicago">America/Chicago (CST)</option>
                          <option value="America/Denver">America/Denver (MST)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                          <option value="UTC">UTC (+00:00)</option>
                        </Form.Select>
                        <Form.Text className="text-muted extra-small">
                          Shift schedules and attendance punch timestamps are evaluated in this branch time zone.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Action Footer */}
              {canUpdate ? (
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
              ) : (
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border mt-4">
                  <div className="text-muted small d-flex align-items-center gap-2">
                    <FaShieldAlt className="text-secondary" />
                    <span>You have read-only access to branch settings. Modifications require branch administrative authority.</span>
                  </div>
                  <span className="badge bg-secondary-subtle text-secondary border px-3 py-1">View Only</span>
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
