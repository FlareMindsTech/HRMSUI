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
  FaUserTag,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSitemap,
  FaLayerGroup,
} from "react-icons/fa";
import {
  fetchDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  fetchDepartmentsDropdown,
  fetchJobGradesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function DesignationsSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobGrades, setJobGrades] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDesig, setEditingDesig] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    designationName: "",
    designationCode: "",
    departmentId: "",
    jobGradeId: "",
    jobLevel: "",
    description: "",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("designation.create");
  const canUpdate = isSystemAdmin || hasPermission("designation.update");
  const canDelete = isSystemAdmin || hasPermission("designation.delete");

  const loadDesignations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        departmentId: filterDept,
        jobGradeId: filterGrade,
        status: filterStatus,
      };
      const res = await fetchDesignations(params);
      if (res.success) {
        setDesignations(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load designations");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterGrade, filterStatus]);

  const loadAuxiliaryData = async () => {
    try {
      const [deptList, gradeList] = await Promise.all([
        fetchDepartmentsDropdown().catch(() => []),
        fetchJobGradesDropdown().catch(() => []),
      ]);
      setDepartments(deptList);
      setJobGrades(gradeList);
    } catch (err) {
      console.warn("Error loading auxiliary dropdown data:", err);
    }
  };

  useEffect(() => {
    loadDesignations();
  }, [loadDesignations]);

  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  const handleOpenCreate = () => {
    setEditingDesig(null);
    setFormData(initialForm);
    setModalError("");
    loadAuxiliaryData();
    setShowModal(true);
  };

  const handleOpenEdit = (desig) => {
    setEditingDesig(desig);
    setFormData({
      designationName: desig.designationName || "",
      designationCode: desig.designationCode || "",
      departmentId: desig.departmentId?._id || desig.departmentId || "",
      jobGradeId: desig.jobGradeId?._id || desig.jobGradeId || "",
      jobLevel: desig.jobLevel || "",
      description: desig.description || "",
      status: desig.status || "ACTIVE",
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
        designationName: formData.designationName.trim(),
        designationCode: formData.designationCode.trim().toUpperCase(),
        departmentId: formData.departmentId || null,
        jobGradeId: formData.jobGradeId || null,
        jobLevel: formData.jobLevel,
        description: formData.description,
        status: formData.status,
      };

      if (editingDesig) {
        const res = await updateDesignation(editingDesig._id, payload);
        setSuccess(res.message || "Designation updated successfully");
      } else {
        const res = await createDesignation(payload);
        setSuccess(res.message || "Designation created successfully");
      }
      setShowModal(false);
      loadDesignations();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save designation");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteDesignation(deletingId);
      setSuccess(res.message || "Designation deleted successfully");
      setShowDeleteModal(false);
      loadDesignations();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete designation");
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
            <FaUserTag className="text-success me-2" /> Designation & Role Titles
          </h3>
          <p className="org-section-sub">
            Configure standardized job titles, departmental affiliations, and job grade levels.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Designation
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
                  placeholder="Search designation name or code..."
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
                value={filterGrade}
                onChange={(e) => { setFilterGrade(e.target.value); setPage(1); }}
              >
                <option value="">All Job Grades</option>
                {jobGrades.map((g) => (
                  <option key={g._id} value={g._id}>{g.gradeName} ({g.gradeCode})</option>
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
              <th>Designation Code & Title</th>
              <th>Department</th>
              <th>Job Grade</th>
              <th>Job Level</th>
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
                  Loading designations...
                </td>
              </tr>
            ) : designations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No designations found.
                </td>
              </tr>
            ) : (
              designations.map((desig) => (
                <tr key={desig._id}>
                  <td>
                    <div className="fw-semibold text-dark">{desig.designationName}</div>
                    <div className="small font-monospace text-muted">{desig.designationCode}</div>
                  </td>
                  <td>
                    {desig.departmentId ? (
                      <div className="small">
                        <FaSitemap className="text-success me-1" />
                        {desig.departmentId.departmentName}
                      </div>
                    ) : (
                      <span className="text-muted small">General / Global</span>
                    )}
                  </td>
                  <td>
                    {desig.jobGradeId ? (
                      <Badge bg="light" className="text-dark border">
                        <FaLayerGroup className="me-1 text-primary" />
                        {desig.jobGradeId.gradeName || desig.jobGradeId.gradeCode}
                      </Badge>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                  <td>
                    {desig.jobLevel ? (
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {desig.jobLevel}
                      </span>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                  <td>
                    <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: "240px" }}>
                      {desig.description || "N/A"}
                    </span>
                  </td>
                  <td>
                    <Badge bg={desig.status === "ACTIVE" ? "success" : "secondary"}>
                      {desig.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Designation"
                        onClick={() => handleOpenEdit(desig)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Designation"
                        onClick={() => {
                          setDeletingId(desig._id);
                          setDeletingName(desig.designationName);
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
              <FaUserTag className="text-success" />
              {editingDesig ? "Edit Designation" : "Add New Designation"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Designation Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.designationName}
                    onChange={(e) => setFormData({ ...formData, designationName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Designation Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. SR-SWE"
                    value={formData.designationCode}
                    onChange={(e) => setFormData({ ...formData, designationCode: e.target.value.toUpperCase() })}
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
                  <Form.Label>Job Grade</Form.Label>
                  <Form.Select
                    value={formData.jobGradeId}
                    onChange={(e) => setFormData({ ...formData, jobGradeId: e.target.value })}
                  >
                    <option value="">-- Select Job Grade --</option>
                    {jobGrades.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.gradeName} ({g.gradeCode}) - Level {g.level || 1}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Job Level / Rank</Form.Label>
                  <Form.Control
                    placeholder="e.g. L3, Senior, Principal"
                    value={formData.jobLevel}
                    onChange={(e) => setFormData({ ...formData, jobLevel: e.target.value })}
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

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Role Responsibilities & Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Key responsibilities and prerequisites for this job title"
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
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Designation"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Designation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete designation <strong>{deletingName}</strong>?
          <p className="text-muted small mt-2">
            Warning: Employees assigned this designation should be re-assigned to prevent onboarding issues.
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

export default DesignationsSection;
