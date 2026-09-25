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
  FaMoneyCheckAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserTie,
  FaSitemap,
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
  fetchDepartmentsDropdown,
  fetchBranchesDropdown,
  fetchEmployeesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function CostCentersSection({ lockedBranchId }) {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [costCenters, setCostCenters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterBranch, setFilterBranch] = useState(lockedBranchId || "");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCC, setEditingCC] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    costCenterName: "",
    costCenterCode: "",
    departmentId: "",
    branchId: lockedBranchId || "",
    managerId: "",
    description: "",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (lockedBranchId) {
      setFilterBranch(lockedBranchId);
      setFormData((prev) => ({ ...prev, branchId: lockedBranchId }));
    }
  }, [lockedBranchId]);

  const canCreate = isSystemAdmin || hasPermission("costCenter.create");
  const canUpdate = isSystemAdmin || hasPermission("costCenter.update");
  const canDelete = isSystemAdmin || hasPermission("costCenter.delete");

  const loadCostCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        departmentId: filterDept,
        branchId: lockedBranchId || filterBranch,
        status: filterStatus,
      };
      const res = await fetchCostCenters(params);
      if (res.success) {
        setCostCenters(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load cost centers");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterBranch, filterStatus, lockedBranchId]);

  const loadAuxiliaryData = async () => {
    try {
      const activeBranch = lockedBranchId || filterBranch;
      const [deptList, brList, empList] = await Promise.all([
        fetchDepartmentsDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
        fetchBranchesDropdown().catch(() => []),
        fetchEmployeesDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
      ]);
      setDepartments(deptList);
      setBranches(brList);
      setEmployees(empList);
    } catch (err) {
      console.warn("Error loading auxiliary dropdown data:", err);
    }
  };

  useEffect(() => {
    loadCostCenters();
  }, [loadCostCenters]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [lockedBranchId, filterBranch]);

  const handleOpenCreate = () => {
    setEditingCC(null);
    setFormData({ ...initialForm, branchId: lockedBranchId || "" });
    setModalError("");
    loadAuxiliaryData();
    setShowModal(true);
  };

  const handleOpenEdit = (cc) => {
    setEditingCC(cc);
    setFormData({
      costCenterName: cc.costCenterName || "",
      costCenterCode: cc.costCenterCode || "",
      departmentId: cc.departmentId?._id || cc.departmentId || "",
      branchId: cc.branchId?._id || cc.branchId || "",
      managerId: cc.managerId?._id || cc.managerId || "",
      description: cc.description || "",
      status: cc.status || "ACTIVE",
    });
    setModalError("");
    loadAuxiliaryData();
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        costCenterName: formData.costCenterName.trim(),
        costCenterCode: formData.costCenterCode.trim().toUpperCase(),
        departmentId: formData.departmentId || null,
        branchId: formData.branchId || null,
        managerId: formData.managerId || null,
        description: formData.description,
        status: formData.status,
      };

      if (editingCC) {
        const res = await updateCostCenter(editingCC._id, payload);
        setSuccess(res.message || "Cost center updated successfully");
      } else {
        const res = await createCostCenter(payload);
        setSuccess(res.message || "Cost center created successfully");
      }
      setShowModal(false);
      loadCostCenters();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save cost center");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteCostCenter(deletingId);
      setSuccess(res.message || "Cost center deleted successfully");
      setShowDeleteModal(false);
      loadCostCenters();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete cost center");
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
            <FaMoneyCheckAlt className="text-success me-2" /> Cost Centers & Budgets
          </h3>
          <p className="org-section-sub">
            Track operational spending units, budget allocations, and accounting ledger center tags.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Cost Center
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filters & Search ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search cost center name or code..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filterDept}
                onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.departmentName}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
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
            <Col md={1} className="text-end text-muted small">
              <strong>{totalRecords}</strong>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Table ── */}
      <Card className="org-table-card">
        <Table responsive hover className="org-table mb-0 align-middle">
          <thead>
            <tr>
              <th>Cost Center Code & Name</th>
              <th>Department</th>
              <th>Branch</th>
              <th>Budget Manager</th>
              <th>Description</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading cost centers...
                </td>
              </tr>
            ) : costCenters.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No cost centers found.
                </td>
              </tr>
            ) : (
              costCenters.map((cc) => (
                <tr key={cc._id}>
                  <td>
                    <div className="fw-semibold text-dark">{cc.costCenterName}</div>
                    <div className="small font-monospace text-muted">{cc.costCenterCode}</div>
                  </td>
                  <td>
                    {cc.departmentId ? (
                      <div className="small">
                        <FaSitemap className="text-success me-1" />
                        {cc.departmentId.departmentName}
                      </div>
                    ) : (
                      <span className="text-muted small">Global</span>
                    )}
                  </td>
                  <td>
                    {cc.branchId ? (
                      <div className="small">
                        <FaCodeBranch className="text-secondary me-1" />
                        {cc.branchId.branchName}
                      </div>
                    ) : (
                      <span className="text-muted small">All Branches</span>
                    )}
                  </td>
                  <td>
                    {cc.managerId ? (
                      <div className="d-flex align-items-center gap-1">
                        <FaUserTie className="text-primary small" />
                        <span className="small">{cc.managerId.firstName} {cc.managerId.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-muted small">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: "200px" }}>
                      {cc.description || "-"}
                    </span>
                  </td>
                  <td>
                    <Badge bg={cc.status === "ACTIVE" ? "success" : "secondary"}>
                      {cc.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Cost Center"
                        onClick={() => handleOpenEdit(cc)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Cost Center"
                        onClick={() => {
                          setDeletingId(cc._id);
                          setDeletingName(cc.costCenterName);
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
              <FaMoneyCheckAlt className="text-success" />
              {editingCC ? "Edit Cost Center" : "Add Cost Center"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cost Center Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Research & Development"
                    value={formData.costCenterName}
                    onChange={(e) => setFormData({ ...formData, costCenterName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cost Center Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. CC-RND-01"
                    value={formData.costCenterCode}
                    onChange={(e) => setFormData({ ...formData, costCenterCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">-- All Departments / Global --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.departmentName} ({d.departmentCode})
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
                    <option value="">-- All Branches --</option>
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
                  <Form.Label>Budget / Approving Manager</Form.Label>
                  <Form.Select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">-- Select Budget Manager --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
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
                <Form.Group>
                  <Form.Label>Cost Center Description / Purpose</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="General ledger mapping or project budget classification notes"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Cost Center"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Cost Center
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete cost center <strong>{deletingName}</strong>?
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

export default CostCentersSection;
