import React, { useState, useEffect, useCallback, useRef } from "react";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import {
  FaCodeBranch,
  FaSave,
  FaClock,
  FaBuilding,
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
} from "../../redux/slices/organizationSlice";
import FeedbackAlert from "../Common/FeedbackAlert";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useBranch } from "../../context/BranchContext";

export default function BranchSettingsSection({ lockedBranchId = null, onNavigateTab }) {
  const hasPermission = useHasPermission();
  const { branches: contextBranches, selectedBranchId, refreshBranches } = useBranch();
  const dispatch = useDispatch();

  // Shared shift/calendar dropdowns (single guarded fetches); branch data
  // stays Context-owned and the settings form stays local.
  const cachedShifts = useSelector(selectShiftsDropdown);
  const cachedWorkCalendars = useSelector(selectWorkCalendarsDropdown);
  const cachedHolidayCalendars = useSelector(selectHolidayCalendarsDropdown);
  const dropdownCacheRef = useRef(null);
  dropdownCacheRef.current = {
    sh: cachedShifts,
    wc: cachedWorkCalendars,
    hol: cachedHolidayCalendars,
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
  });

  // Load Dropdowns
  const loadDropdowns = useCallback(async () => {
    try {
      const [brList, shRes, wcRes, holRes] = await Promise.all([
        fetchBranchesDropdown().catch(() => []),
        dispatch(fetchOrgResource({ key: "shifts" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "workCalendars" })).catch(() => null),
        dispatch(fetchOrgResource({ key: "holidayCalendars" })).catch(() => null),
      ]);
      setBranches(brList.length > 0 ? brList : contextBranches || []);
      setShifts(shRes?.payload?.data ?? dropdownCacheRef.current?.sh ?? []);
      setWorkCalendars(wcRes?.payload?.data ?? dropdownCacheRef.current?.wc ?? []);
      setHolidayCalendars(holRes?.payload?.data ?? dropdownCacheRef.current?.hol ?? []);

      if (!activeBranchId && brList.length > 0) {
        setActiveBranchId(String(brList[0]._id || brList[0].id));
      }
    } catch (e) {
      console.warn("Dropdown loading notice:", e);
    }
  }, [contextBranches, activeBranchId, dispatch]);

  // Load Active Branch Details
  const loadBranchConfig = useCallback(async (bId) => {
    if (!bId) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchBranchById(bId);
      if (data) {
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

      const payload = {
        timeZone: formData.timeZone,
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
            Configure default work shift schedules, work calendars, holiday catalogs, and operational time zone.
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
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${activeTab === "schedules" ? "text-success border-bottom border-success border-2 bg-light" : "text-secondary"}`}
                onClick={() => setActiveTab("schedules")}
              >
                <FaClock className="me-2" /> Schedules &amp; Calendars
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none py-3 px-4 border-0 rounded-0 fw-semibold ${activeTab === "profile" ? "text-success border-bottom border-success border-2 bg-light" : "text-secondary"}`}
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
                    Assign the default work shift and calendars for employees belonging to this branch.
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
                  </Row>
                </div>
              )}

              {/* TAB 2: Branch Profile / Timezone */}
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
                        <Form.Text className="text-muted">
                          Shift schedules and attendance punch time stamps are evaluated in this branch time zone.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
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
