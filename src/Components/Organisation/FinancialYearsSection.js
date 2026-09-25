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
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchFinancialYears,
  createFinancialYear,
  updateFinancialYear,
  deleteFinancialYear,
  setCurrentFinancialYear,
  fetchBranchesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function FinancialYearsSection({ lockedBranchId }) {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [financialYears, setFinancialYears] = useState([]);
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
    branchId: lockedBranchId || "",
    startDate: `${currentYear}-04-01`,
    endDate: `${currentYear + 1}-03-31`,
    isCurrent: false,
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (lockedBranchId) {
      setFilterBranch(lockedBranchId);
      setFormData((prev) => ({ ...prev, branchId: lockedBranchId }));
    }
  }, [lockedBranchId]);

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
        branchId: lockedBranchId || filterBranch,
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
  }, [page, search, filterBranch, filterStatus, lockedBranchId]);

  useEffect(() => {
    loadFinancialYears();
  }, [loadFinancialYears]);

  useEffect(() => {
    fetchBranchesDropdown()
      .then((brList) => setBranches(brList))
      .catch((e) => console.warn("Failed to load branches dropdown:", e));
  }, []);

  const handleOpenCreate = () => {
    setEditingFY(null);
    setFormData({ ...initialForm, branchId: lockedBranchId || "" });
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (fy) => {
    setEditingFY(fy);
    setFormData({
      name: fy.name || "",
      code: fy.code || "",
      branchId: fy.branchId?._id || fy.branchId || lockedBranchId || "",
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
        branchId: formData.branchId || null,
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
    <div className="org-sub-section">
      {/* ── Section Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FaCalendarAlt className="text-success" />
            Financial Years (Branch Scoped)
          </h4>
          <p className="text-muted small mb-0">
            Configure fiscal calendar periods, accounting cycles, and branch-specific active financial years.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" size="sm" className="d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenCreate}>
            <FaPlus size={11} /> Add Financial Year
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filters & Search ── */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-2">
          <Row className="g-2 align-items-center">
            <Col md={lockedBranchId ? 6 : 4}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search fiscal year name or code..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            {!lockedBranchId && (
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
            )}
            <Col md={lockedBranchId ? 4 : 3}>
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
            <Col md={lockedBranchId ? 2 : 2} className="text-end text-muted small">
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
              <th>Branch</th>
              <th>Period Range</th>
              <th>Current Period Status</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading financial years...
                </td>
              </tr>
            ) : financialYears.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  <div className="p-3">
                    <p className="mb-2">No financial years found.</p>
                    {canCreate && (
                      <Button variant="outline-success" size="sm" onClick={handleOpenCreate}>
                        <FaPlus className="me-1" /> Add First Financial Year
                      </Button>
                    )}
                  </div>
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
                    {fy.branchId ? (
                      <div className="small">
                        <FaCodeBranch className="text-secondary me-1" />
                        {fy.branchId.branchName || "Branch"}
                      </div>
                    ) : (
                      <span className="text-muted small">All Branches / Global</span>
                    )}
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
                  <Form.Label>
                    Associated Branch {lockedBranchId && <span className="badge bg-secondary ms-1">Locked</span>}
                  </Form.Label>
                  <Form.Select
                    value={formData.branchId}
                    disabled={Boolean(lockedBranchId)}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  >
                    {!lockedBranchId && <option value="">-- All Branches / Global --</option>}
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.branchName} ({b.branchCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
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
              <Col md={3}>
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
