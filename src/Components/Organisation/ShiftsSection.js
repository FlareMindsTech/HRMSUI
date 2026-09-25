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
  FaClock,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaMoon,
  FaSun,
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchShifts,
  createShift,
  updateShift,
  deleteShift,
  fetchBranchesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function ShiftsSection({ lockedBranchId }) {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState(lockedBranchId || "");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    shiftName: "",
    shiftCode: "",
    branchId: lockedBranchId || "",
    startTime: "09:00",
    endTime: "18:00",
    breakDurationMinutes: 60,
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 30,
    earlyCheckoutThresholdMinutes: 30,
    overtimeAllowed: true,
    isNightShift: false,
    crossesMidnight: false,
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (lockedBranchId) {
      setFilterBranch(lockedBranchId);
      setFormData((prev) => ({ ...prev, branchId: lockedBranchId }));
    }
  }, [lockedBranchId]);

  const canCreate = isSystemAdmin || hasPermission("shift.create");
  const canUpdate = isSystemAdmin || hasPermission("shift.update");
  const canDelete = isSystemAdmin || hasPermission("shift.delete");

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        branchId: lockedBranchId || filterBranch,
        status: filterStatus,
      };
      const res = await fetchShifts(params);
      if (res.success) {
        setShifts(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBranch, filterStatus, lockedBranchId]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  useEffect(() => {
    fetchBranchesDropdown()
      .then((brList) => setBranches(brList))
      .catch((e) => console.warn("Failed to load branches:", e));
  }, []);

  const handleOpenCreate = () => {
    setEditingShift(null);
    setFormData({ ...initialForm, branchId: lockedBranchId || "" });
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingShift(s);
    setFormData({
      shiftName: s.shiftName || "",
      shiftCode: s.shiftCode || "",
      branchId: s.branchId?._id || s.branchId || "",
      startTime: s.startTime || "09:00",
      endTime: s.endTime || "18:00",
      breakDurationMinutes: s.breakDurationMinutes || 60,
      gracePeriodMinutes: s.gracePeriodMinutes || 15,
      lateThresholdMinutes: s.lateThresholdMinutes || 30,
      earlyCheckoutThresholdMinutes: s.earlyCheckoutThresholdMinutes || 30,
      overtimeAllowed: s.overtimeAllowed !== undefined ? s.overtimeAllowed : true,
      isNightShift: s.isNightShift || false,
      crossesMidnight: s.crossesMidnight || false,
      status: s.status || "ACTIVE",
    });
    setModalError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        shiftName: formData.shiftName.trim(),
        shiftCode: formData.shiftCode.trim().toUpperCase(),
        branchId: formData.branchId || null,
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakDurationMinutes: Number(formData.breakDurationMinutes) || 0,
        gracePeriodMinutes: Number(formData.gracePeriodMinutes) || 0,
        lateThresholdMinutes: Number(formData.lateThresholdMinutes) || 0,
        earlyCheckoutThresholdMinutes: Number(formData.earlyCheckoutThresholdMinutes) || 0,
        overtimeAllowed: formData.overtimeAllowed,
        isNightShift: formData.isNightShift,
        crossesMidnight: formData.crossesMidnight,
        status: formData.status,
      };

      if (editingShift) {
        const res = await updateShift(editingShift._id, payload);
        setSuccess(res.message || "Shift updated successfully");
      } else {
        const res = await createShift(payload);
        setSuccess(res.message || "Shift created successfully");
      }
      setShowModal(false);
      loadShifts();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save shift");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteShift(deletingId);
      setSuccess(res.message || "Shift deleted successfully");
      setShowDeleteModal(false);
      loadShifts();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete shift");
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
            <FaClock className="text-success me-2" /> Shift Timings & Policies
          </h3>
          <p className="org-section-sub">
            Configure work timings, punch-in grace periods, lunch breaks, and late calculation thresholds for attendance tracking.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Shift
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filters & Search ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search shift name or code..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filterBranch}
                onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.branchName}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
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
            <Col md={2} className="text-end text-muted small">
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
              <th>Shift Code & Name</th>
              <th>Working Hours</th>
              <th>Break Duration</th>
              <th>Grace Period</th>
              <th>Late Threshold</th>
              <th>Type / Branch</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading shifts...
                </td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">
                  No shifts configured.
                </td>
              </tr>
            ) : (
              shifts.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="fw-semibold text-dark">{s.shiftName}</div>
                    <div className="small font-monospace text-muted">{s.shiftCode}</div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1 font-monospace">
                      {s.isNightShift ? <FaMoon className="text-indigo me-1" /> : <FaSun className="text-warning me-1" />}
                      <span>{s.startTime} - {s.endTime}</span>
                    </div>
                    {s.crossesMidnight && (
                      <span className="badge bg-dark-subtle text-dark border" style={{ fontSize: "0.68rem" }}>
                        Overnight
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="small text-muted">{s.breakDurationMinutes || 60} mins</span>
                  </td>
                  <td>
                    <span className="small text-success fw-semibold">+{s.gracePeriodMinutes || 15} mins</span>
                  </td>
                  <td>
                    <span className="small text-danger fw-semibold">{s.lateThresholdMinutes || 30} mins</span>
                  </td>
                  <td>
                    <div className="small">
                      <FaCodeBranch className="text-secondary me-1" />
                      {s.branchId?.branchName || "Global / All"}
                    </div>
                  </td>
                  <td>
                    <Badge bg={s.status === "ACTIVE" ? "success" : "secondary"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Shift"
                        onClick={() => handleOpenEdit(s)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Shift"
                        onClick={() => {
                          setDeletingId(s._id);
                          setDeletingName(s.shiftName);
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
              <FaClock className="text-success" />
              {editingShift ? "Edit Shift" : "Add Shift"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Shift Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Morning General Shift"
                    value={formData.shiftName}
                    onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Shift Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. SHIFT-GEN-01"
                    value={formData.shiftCode}
                    onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Shift Start Time <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Shift End Time <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Break Duration (Mins)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.breakDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, breakDurationMinutes: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Grace Period (Mins)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.gracePeriodMinutes}
                    onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Late Threshold (Mins)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.lateThresholdMinutes}
                    onChange={(e) => setFormData({ ...formData, lateThresholdMinutes: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Early Checkout (Mins)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.earlyCheckoutThresholdMinutes}
                    onChange={(e) => setFormData({ ...formData, earlyCheckoutThresholdMinutes: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Associated Branch</Form.Label>
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

              <Col md={12}>
                <div className="p-3 bg-light rounded border d-flex flex-wrap gap-4">
                  <Form.Check
                    type="checkbox"
                    id="nightShiftCheck"
                    label="Is Night Shift"
                    checked={formData.isNightShift}
                    onChange={(e) => setFormData({ ...formData, isNightShift: e.target.checked })}
                  />
                  <Form.Check
                    type="checkbox"
                    id="crossMidnightCheck"
                    label="Crosses Midnight (Next Day End Time)"
                    checked={formData.crossesMidnight}
                    onChange={(e) => setFormData({ ...formData, crossesMidnight: e.target.checked })}
                  />
                  <Form.Check
                    type="checkbox"
                    id="otAllowedCheck"
                    label="Overtime Calculation Allowed"
                    checked={formData.overtimeAllowed}
                    onChange={(e) => setFormData({ ...formData, overtimeAllowed: e.target.checked })}
                  />
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Shift"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Shift
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete shift <strong>{deletingName}</strong>?
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

export default ShiftsSection;
