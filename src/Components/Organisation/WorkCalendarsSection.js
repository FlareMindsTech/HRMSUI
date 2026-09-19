import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  InputGroup,
  Pagination,
} from "react-bootstrap";
import {
  FaCalendarWeek,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaClock,
  FaCodeBranch,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  fetchWorkCalendars,
  createWorkCalendar,
  updateWorkCalendar,
  deleteWorkCalendar,
  fetchShiftsDropdown,
  fetchBranchesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function WorkCalendarsSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [calendars, setCalendars] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCal, setEditingCal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    calendarName: "",
    calendarCode: "",
    description: "",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    weeklyOffDays: ["Saturday", "Sunday"],
    defaultShiftId: "",
    branchId: "",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("workCalendar.create");
  const canUpdate = isSystemAdmin || hasPermission("workCalendar.update");
  const canDelete = isSystemAdmin || hasPermission("workCalendar.delete");

  const loadCalendars = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        status: filterStatus,
      };
      const res = await fetchWorkCalendars(params);
      if (res.success) {
        setCalendars(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load work calendars");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  const loadAuxiliaryData = async () => {
    try {
      const [shList, brList] = await Promise.all([
        fetchShiftsDropdown().catch(() => []),
        fetchBranchesDropdown().catch(() => []),
      ]);
      setShifts(shList);
      setBranches(brList);
    } catch (err) {
      console.warn("Failed to load auxiliary data:", err);
    }
  };

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  const handleOpenCreate = () => {
    setEditingCal(null);
    setFormData(initialForm);
    setModalError("");
    loadAuxiliaryData();
    setShowModal(true);
  };

  const handleOpenEdit = (cal) => {
    setEditingCal(cal);
    setFormData({
      calendarName: cal.calendarName || "",
      calendarCode: cal.calendarCode || "",
      description: cal.description || "",
      workingDays: Array.isArray(cal.workingDays) ? cal.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      weeklyOffDays: Array.isArray(cal.weeklyOffDays) ? cal.weeklyOffDays : ["Saturday", "Sunday"],
      defaultShiftId: cal.defaultShiftId?._id || cal.defaultShiftId || "",
      branchId: cal.branchId?._id || cal.branchId || "",
      status: cal.status || "ACTIVE",
    });
    setModalError("");
    loadAuxiliaryData();
    setShowModal(true);
  };

  const toggleDaySelection = (day) => {
    setFormData((prev) => {
      const isWorking = prev.workingDays.includes(day);
      if (isWorking) {
        // Move to weekly off
        return {
          ...prev,
          workingDays: prev.workingDays.filter((d) => d !== day),
          weeklyOffDays: Array.from(new Set([...prev.weeklyOffDays, day])),
        };
      } else {
        // Move to working days
        return {
          ...prev,
          workingDays: Array.from(new Set([...prev.workingDays, day])),
          weeklyOffDays: prev.weeklyOffDays.filter((d) => d !== day),
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        calendarName: formData.calendarName.trim(),
        calendarCode: formData.calendarCode.trim().toUpperCase(),
        description: formData.description,
        workingDays: formData.workingDays,
        weeklyOffDays: formData.weeklyOffDays,
        defaultShiftId: formData.defaultShiftId || null,
        branchId: formData.branchId || null,
        status: formData.status,
      };

      if (editingCal) {
        const res = await updateWorkCalendar(editingCal._id, payload);
        setSuccess(res.message || "Work calendar updated successfully");
      } else {
        const res = await createWorkCalendar(payload);
        setSuccess(res.message || "Work calendar created successfully");
      }
      setShowModal(false);
      loadCalendars();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save work calendar");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteWorkCalendar(deletingId);
      setSuccess(res.message || "Work calendar deleted successfully");
      setShowDeleteModal(false);
      loadCalendars();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete work calendar");
      setShowDeleteModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div>
          <h3 className="org-section-title">
            <FaCalendarWeek className="text-success me-2" /> Work Calendars & Weekly Schedules
          </h3>
          <p className="org-section-sub">
            Define standard working days, weekly weekend off days, and default shifts for attendance and leave calculation.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Work Calendar
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filters & Search ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={6}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search calendar name or code..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end text-muted small">
              Total: <strong>{totalRecords}</strong>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Table ── */}
      <Card className="org-table-card">
        <Table responsive hover className="org-table mb-0 align-middle">
          <thead>
            <tr>
              <th>Calendar Code & Name</th>
              <th>Working Days</th>
              <th>Weekly Off Days</th>
              <th>Default Shift</th>
              <th>Branch</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading work calendars...
                </td>
              </tr>
            ) : calendars.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No work calendars found.
                </td>
              </tr>
            ) : (
              calendars.map((cal) => (
                <tr key={cal._id}>
                  <td>
                    <div className="fw-semibold text-dark">{cal.calendarName}</div>
                    <div className="small font-monospace text-muted">{cal.calendarCode}</div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "240px" }}>
                      {(cal.workingDays || []).map((d) => (
                        <span key={d} className="badge bg-success-subtle text-success border" style={{ fontSize: "0.7rem" }}>
                          {d.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "200px" }}>
                      {(cal.weeklyOffDays || []).map((d) => (
                        <span key={d} className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: "0.7rem" }}>
                          {d.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {cal.defaultShiftId ? (
                      <div className="small">
                        <FaClock className="text-primary me-1" />
                        {cal.defaultShiftId.shiftName || cal.defaultShiftId.shiftCode}
                      </div>
                    ) : (
                      <span className="text-muted small">Standard Shift</span>
                    )}
                  </td>
                  <td>
                    {cal.branchId ? (
                      <div className="small">
                        <FaCodeBranch className="text-secondary me-1" />
                        {cal.branchId.branchName}
                      </div>
                    ) : (
                      <span className="text-muted small">Global / All</span>
                    )}
                  </td>
                  <td>
                    <Badge bg={cal.status === "ACTIVE" ? "success" : "secondary"}>
                      {cal.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Work Calendar"
                        onClick={() => handleOpenEdit(cal)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Work Calendar"
                        onClick={() => {
                          setDeletingId(cal._id);
                          setDeletingName(cal.calendarName);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-end p-3 border-top">
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))} />
              {[...Array(totalPages).keys()].map((n) => (
                <Pagination.Item key={n + 1} active={n + 1 === page} onClick={() => setPage(n + 1)}>
                  {n + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))} />
            </Pagination>
          </div>
        )}
      </Card>

      {/* ── Create / Edit Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaCalendarWeek className="text-success" />
              {editingCal ? "Edit Work Calendar" : "Add Work Calendar"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Calendar Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Standard 5-Day Work Week"
                    value={formData.calendarName}
                    onChange={(e) => setFormData({ ...formData, calendarName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Calendar Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. CAL-STD-5D"
                    value={formData.calendarCode}
                    onChange={(e) => setFormData({ ...formData, calendarCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Default Shift</Form.Label>
                  <Form.Select
                    value={formData.defaultShiftId}
                    onChange={(e) => setFormData({ ...formData, defaultShiftId: e.target.value })}
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
                  <Form.Label>Branch</Form.Label>
                  <Form.Select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  >
                    <option value="">-- All Branches / Global --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.branchName} ({b.branchCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Working Days Configurator */}
              <Col md={12}>
                <Form.Label className="d-block mb-1">
                  Weekly Schedule Configurator <span className="text-muted small">(Click day to toggle between Working Day and Weekly Off)</span>
                </Form.Label>
                <div className="d-flex flex-wrap gap-2 p-3 bg-light rounded border">
                  {ALL_DAYS.map((d) => {
                    const isWorking = formData.workingDays.includes(d);
                    return (
                      <Button
                        key={d}
                        size="sm"
                        type="button"
                        variant={isWorking ? "success" : "outline-secondary"}
                        onClick={() => toggleDaySelection(d)}
                      >
                        {isWorking ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                        {d} ({isWorking ? "Working" : "Weekly Off"})
                      </Button>
                    );
                  })}
                </div>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Work calendar details or regional schedule guidelines"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Calendar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Work Calendar
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete work calendar <strong>{deletingName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={modalLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={modalLoading}>
            {modalLoading ? <Spinner size="sm" animation="border" /> : "Yes, Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default WorkCalendarsSection;
