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
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserTie,
  FaSitemap,
  FaCodeBranch,
} from "react-icons/fa";
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchDepartmentsDropdown,
  fetchBranchesDropdown,
  fetchEmployeesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function TeamsSection({ lockedBranchId }) {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
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
  const [editingTeam, setEditingTeam] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    teamName: "",
    teamCode: "",
    departmentId: "",
    branchId: lockedBranchId || "",
    teamLeadId: "",
    teamManagerId: "",
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

  const canCreate = isSystemAdmin || hasPermission("team.create");
  const canUpdate = isSystemAdmin || hasPermission("team.update");
  const canDelete = isSystemAdmin || hasPermission("team.delete");

  const loadTeams = useCallback(async () => {
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
      const res = await fetchTeams(params);
      if (res.success) {
        setTeams(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterBranch, filterStatus, lockedBranchId]);

  const loadAuxiliaryData = async (branchForScope) => {
    try {
      const activeBranch = branchForScope || lockedBranchId || filterBranch;
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
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [lockedBranchId, filterBranch]);

  const handleFormBranchChange = async (selectedBranchId) => {
    setFormData((prev) => ({
      ...prev,
      branchId: selectedBranchId,
      departmentId: "", // reset selected department when branch changes
      teamLeadId: "",
      teamManagerId: "",
    }));
    try {
      const [deptList, empList] = await Promise.all([
        fetchDepartmentsDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
        fetchEmployeesDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
      ]);
      setDepartments(deptList);
      setEmployees(empList);
    } catch (err) {
      console.warn("Failed to reload branch-scoped data:", err);
    }
  };

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({ ...initialForm, branchId: lockedBranchId || "" });
    setModalError("");
    loadAuxiliaryData(lockedBranchId || "");
    setShowModal(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    const bId = team.branchId?._id || team.branchId || lockedBranchId || "";
    setFormData({
      teamName: team.teamName || "",
      teamCode: team.teamCode || "",
      departmentId: team.departmentId?._id || team.departmentId || "",
      branchId: bId,
      teamLeadId: team.teamLeadId?._id || team.teamLeadId || "",
      teamManagerId: team.teamManagerId?._id || team.teamManagerId || "",
      description: team.description || "",
      status: team.status || "ACTIVE",
    });
    setModalError("");
    loadAuxiliaryData(bId);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        teamName: formData.teamName.trim(),
        teamCode: formData.teamCode.trim().toUpperCase(),
        departmentId: formData.departmentId || null,
        branchId: formData.branchId || null,
        teamLeadId: formData.teamLeadId || null,
        teamManagerId: formData.teamManagerId || null,
        description: formData.description ? formData.description.trim() : "",
        status: formData.status,
      };

      if (editingTeam) {
        const res = await updateTeam(editingTeam._id, payload);
        setSuccess(res.message || "Team updated successfully");
      } else {
        const res = await createTeam(payload);
        setSuccess(res.message || "Team created successfully");
      }
      setShowModal(false);
      loadTeams();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save team");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteTeam(deletingId);
      setSuccess(res.message || "Team deleted successfully");
      setShowDeleteModal(false);
      loadTeams();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete team");
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
            <FaUsers className="text-success" />
            Teams & Working Groups
          </h4>
          <p className="text-muted small mb-0">
            Organize functional units, cross-department squads, and project pods under branches.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" size="sm" className="d-flex align-items-center gap-1 shadow-sm" onClick={handleOpenCreate}>
            <FaPlus size={11} /> Add Team
          </Button>
        )}
      </div>

      {/* ── Alerts ── */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* ── Filters Toolbar ── */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-2">
          <Row className="g-2 align-items-center">
            <Col md={lockedBranchId ? 4 : 3}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search team name or code..."
                  className="border-start-0 bg-light"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </InputGroup>
            </Col>
            {!lockedBranchId && (
              <Col md={3}>
                <Form.Select
                  size="sm"
                  value={filterBranch}
                  onChange={(e) => {
                    setFilterBranch(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.branchName}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}
            <Col md={lockedBranchId ? 4 : 3}>
              <Form.Select
                size="sm"
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.departmentName}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={lockedBranchId ? 4 : 3}>
              <Form.Select
                size="sm"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Teams Table ── */}
      <Card className="org-table-card">
        <Table responsive hover className="org-table mb-0 align-middle">
          <thead>
            <tr>
              <th>Team Code & Name</th>
              <th>Branch</th>
              <th>Department</th>
              <th>Team Lead</th>
              <th>Manager</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading teams...
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <div className="p-3">
                    <p className="mb-2">No teams found.</p>
                    {canCreate && (
                      <Button variant="outline-success" size="sm" onClick={handleOpenCreate}>
                        <FaPlus className="me-1" /> Add First Team
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              teams.map((t) => (
                <tr key={t._id}>
                  <td>
                    <div className="fw-semibold text-dark">{t.teamName}</div>
                    <div className="small font-monospace text-muted">{t.teamCode}</div>
                  </td>
                  <td>
                    {t.branchId ? (
                      <div className="small">
                        <FaCodeBranch className="text-secondary me-1" />
                        {t.branchId.branchName || "Branch"}
                      </div>
                    ) : (
                      <span className="text-muted small">Global / Virtual</span>
                    )}
                  </td>
                  <td>
                    {t.departmentId ? (
                      <div className="small">
                        <FaSitemap className="text-success me-1" />
                        {t.departmentId.departmentName}
                      </div>
                    ) : (
                      <span className="text-muted small">Cross-Department</span>
                    )}
                  </td>
                  <td>
                    {t.teamLeadId ? (
                      <div className="d-flex align-items-center gap-1">
                        <FaUserTie className="text-primary small" />
                        <span className="small">{t.teamLeadId.firstName} {t.teamLeadId.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-muted small">Unassigned</span>
                    )}
                  </td>
                  <td>
                    {t.teamManagerId ? (
                      <div className="d-flex align-items-center gap-1">
                        <FaUserTie className="text-dark small" />
                        <span className="small">{t.teamManagerId.firstName} {t.teamManagerId.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-muted small">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <Badge bg={t.status === "ACTIVE" ? "success" : "secondary"}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Team"
                        onClick={() => handleOpenEdit(t)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Team"
                        onClick={() => {
                          setDeletingId(t._id);
                          setDeletingName(t.teamName);
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
              <FaUsers className="text-success" />
              {editingTeam ? "Edit Team" : "Add New Team"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Team Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Core Platform Team"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Team Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. CORE-PLAT"
                    value={formData.teamCode}
                    onChange={(e) => setFormData({ ...formData, teamCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Branch {lockedBranchId && <span className="badge bg-secondary ms-1">Locked</span>}
                  </Form.Label>
                  <Form.Select
                    value={formData.branchId}
                    disabled={Boolean(lockedBranchId)}
                    onChange={(e) => handleFormBranchChange(e.target.value)}
                  >
                    {!lockedBranchId && <option value="">-- All Branches / Virtual --</option>}
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
                  <Form.Label>Department (Filtered by Branch)</Form.Label>
                  <Form.Select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">-- Cross-Department / None --</option>
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
                  <Form.Label>Team Lead (Filtered by Branch)</Form.Label>
                  <Form.Select
                    value={formData.teamLeadId}
                    onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                  >
                    <option value="">-- Select Team Lead --</option>
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
                  <Form.Label>Team Manager</Form.Label>
                  <Form.Select
                    value={formData.teamManagerId}
                    onChange={(e) => setFormData({ ...formData, teamManagerId: e.target.value })}
                  >
                    <option value="">-- Select Team Manager --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Team purpose and domain"
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
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Team"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Team
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete team <strong>{deletingName}</strong>?
          <p className="text-muted small mt-2">
            Team assignments for members will be cleared.
          </p>
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

export default TeamsSection;
