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
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaStar,
} from "react-icons/fa";
import {
  fetchFinancialYears,
  createFinancialYear,
  updateFinancialYear,
  deleteFinancialYear,
  setCurrentFinancialYear,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function FinancialYearsSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [financialYears, setFinancialYears] = useState([]);
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
  const [editingFY, setEditingFY] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const currentYear = new Date().getFullYear();
  const initialForm = {
    name: `FY ${currentYear}-${currentYear + 1}`,
    code: `FY${String(currentYear).slice(2)}${String(currentYear + 1).slice(2)}`,
    startDate: `${currentYear}-04-01`,
    endDate: `${currentYear + 1}-03-31`,
    isCurrent: false,
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("financialYear.create");
  const canUpdate = isSystemAdmin || hasPermission("financialYear.update");
  const canDelete = isSystemAdmin || hasPermission("financialYear.delete");

  const loadFinancialYears = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        status: filterStatus,
      };
      const res = await fetchFinancialYears(params);
      if (res.success) {
        setFinancialYears(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load financial years");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => {
    loadFinancialYears();
  }, [loadFinancialYears]);

  const handleOpenCreate = () => {
    setEditingFY(null);
    setFormData(initialForm);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (fy) => {
    setEditingFY(fy);
    setFormData({
      name: fy.name || "",
      code: fy.code || "",
      startDate: fy.startDate ? new Date(fy.startDate).toISOString().split("T")[0] : "",
      endDate: fy.endDate ? new Date(fy.endDate).toISOString().split("T")[0] : "",
      isCurrent: fy.isCurrent || false,
      status: fy.status || "ACTIVE",
    });
    setModalError("");
    setShowModal(true);
  };

  const handleSetCurrent = async (id) => {
    try {
      setLoading(true);
      const res = await setCurrentFinancialYear(id);
      setSuccess(res.message || "Financial year marked as active current period");
      loadFinancialYears();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to set active financial year");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: formData.isCurrent,
        status: formData.status,
      };

      if (editingFY) {
        const res = await updateFinancialYear(editingFY._id, payload);
        setSuccess(res.message || "Financial year updated successfully");
      } else {
        const res = await createFinancialYear(payload);
        setSuccess(res.message || "Financial year created successfully");
      }
      setShowModal(false);
      loadFinancialYears();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save financial year");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteFinancialYear(deletingId);
      setSuccess(res.message || "Financial year deleted successfully");
      setShowDeleteModal(false);
      loadFinancialYears();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete financial year");
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
            <FaCalendarAlt className="text-success me-2" /> Financial Years & Accounting Periods
          </h3>
          <p className="org-section-sub">
            Establish annual fiscal periods, active accounting years, and tax cycle date boundaries.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Financial Year
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
                  placeholder="Search fiscal year name or code..."
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
              <th>Fiscal Code & Name</th>
              <th>Period Range</th>
              <th>Current Period Status</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading financial years...
                </td>
              </tr>
            ) : financialYears.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  No financial years found.
                </td>
              </tr>
            ) : (
              financialYears.map((fy) => (
                <tr key={fy._id}>
                  <td>
                    <div className="fw-semibold text-dark">{fy.name}</div>
                    <div className="small font-monospace text-muted">{fy.code}</div>
                  </td>
                  <td>
                    <div className="font-monospace small">
                      {fy.startDate ? new Date(fy.startDate).toLocaleDateString() : "N/A"} &rarr;{" "}
                      {fy.endDate ? new Date(fy.endDate).toLocaleDateString() : "N/A"}
                    </div>
                  </td>
                  <td>
                    {fy.isCurrent ? (
                      <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                        <FaStar /> Active Current FY
                      </Badge>
                    ) : (
                      canUpdate && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                          onClick={() => handleSetCurrent(fy._id)}
                        >
                          Set as Current
                        </Button>
                      )
                    )}
                  </td>
                  <td>
                    <Badge bg={fy.status === "ACTIVE" ? "success" : "secondary"}>
                      {fy.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Financial Year"
                        onClick={() => handleOpenEdit(fy)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && !fy.isCurrent && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Financial Year"
                        onClick={() => {
                          setDeletingId(fy._id);
                          setDeletingName(fy.name);
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
              <FaCalendarAlt className="text-success" />
              {editingFY ? "Edit Financial Year" : "Add Financial Year"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Financial Year Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. FY 2026-2027"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Financial Year Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. FY2627"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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

              <Col md={6} className="d-flex align-items-center pt-3">
                <Form.Check
                  type="checkbox"
                  id="isCurrentCheck"
                  label="Set as Active Current Financial Year"
                  checked={formData.isCurrent}
                  onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Financial Year"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Financial Year
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete financial year <strong>{deletingName}</strong>?
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

export default FinancialYearsSection;
