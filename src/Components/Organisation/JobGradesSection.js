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
  FaLayerGroup,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaMoneyBillWave,
  FaBriefcase,
} from "react-icons/fa";
import {
  fetchJobGrades,
  createJobGrade,
  updateJobGrade,
  deleteJobGrade,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function JobGradesSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [grades, setGrades] = useState([]);
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
  const [editingGrade, setEditingGrade] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    gradeName: "",
    gradeCode: "",
    level: 1,
    description: "",
    minimumExperience: 0,
    maximumExperience: 3,
    minimumSalary: 0,
    maximumSalary: 0,
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("jobGrade.create");
  const canUpdate = isSystemAdmin || hasPermission("jobGrade.update");
  const canDelete = isSystemAdmin || hasPermission("jobGrade.delete");

  const loadGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        status: filterStatus,
      };
      const res = await fetchJobGrades(params);
      if (res.success) {
        setGrades(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load job grades");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const handleOpenCreate = () => {
    setEditingGrade(null);
    setFormData(initialForm);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (g) => {
    setEditingGrade(g);
    setFormData({
      gradeName: g.gradeName || "",
      gradeCode: g.gradeCode || "",
      level: g.level !== undefined ? g.level : 1,
      description: g.description || "",
      minimumExperience: g.minimumExperience || 0,
      maximumExperience: g.maximumExperience || 0,
      minimumSalary: g.minimumSalary || 0,
      maximumSalary: g.maximumSalary || 0,
      status: g.status || "ACTIVE",
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
        gradeName: formData.gradeName.trim(),
        gradeCode: formData.gradeCode.trim().toUpperCase(),
        level: Number(formData.level) || 1,
        description: formData.description,
        minimumExperience: Number(formData.minimumExperience) || 0,
        maximumExperience: Number(formData.maximumExperience) || 0,
        minimumSalary: Number(formData.minimumSalary) || 0,
        maximumSalary: Number(formData.maximumSalary) || 0,
        status: formData.status,
      };

      if (editingGrade) {
        const res = await updateJobGrade(editingGrade._id, payload);
        setSuccess(res.message || "Job grade updated successfully");
      } else {
        const res = await createJobGrade(payload);
        setSuccess(res.message || "Job grade created successfully");
      }
      setShowModal(false);
      loadGrades();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save job grade");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteJobGrade(deletingId);
      setSuccess(res.message || "Job grade deleted successfully");
      setShowDeleteModal(false);
      loadGrades();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete job grade");
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
            <FaLayerGroup className="text-success me-2" /> Job Grades & Compensation Bands
          </h3>
          <p className="org-section-sub">
            Establish corporate career levels, experience thresholds, and salary pay-scale brackets.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Job Grade
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
                  placeholder="Search grade name or code..."
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
              <th>Grade Code & Name</th>
              <th>Hierarchy Level</th>
              <th>Experience Band</th>
              <th>Salary Range</th>
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
                  Loading job grades...
                </td>
              </tr>
            ) : grades.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No job grades found.
                </td>
              </tr>
            ) : (
              grades.map((g) => (
                <tr key={g._id}>
                  <td>
                    <div className="fw-semibold text-dark">{g.gradeName}</div>
                    <div className="small font-monospace text-muted">{g.gradeCode}</div>
                  </td>
                  <td>
                    <Badge bg="light" className="text-primary border font-monospace">
                      Level {g.level || 1}
                    </Badge>
                  </td>
                  <td>
                    <div className="small text-muted">
                      <FaBriefcase className="me-1" />
                      {g.minimumExperience} - {g.maximumExperience} Years
                    </div>
                  </td>
                  <td>
                    <div className="small font-monospace text-dark">
                      <FaMoneyBillWave className="text-success me-1" />
                      {g.minimumSalary > 0 || g.maximumSalary > 0
                        ? `${g.minimumSalary.toLocaleString()} - ${g.maximumSalary.toLocaleString()}`
                        : "Not specified"}
                    </div>
                  </td>
                  <td>
                    <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: "200px" }}>
                      {g.description || "-"}
                    </span>
                  </td>
                  <td>
                    <Badge bg={g.status === "ACTIVE" ? "success" : "secondary"}>
                      {g.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Job Grade"
                        onClick={() => handleOpenEdit(g)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Job Grade"
                        onClick={() => {
                          setDeletingId(g._id);
                          setDeletingName(g.gradeName);
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
              <FaLayerGroup className="text-success" />
              {editingGrade ? "Edit Job Grade" : "Add Job Grade"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Grade Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Grade 4 - Senior Professional"
                    value={formData.gradeName}
                    onChange={(e) => setFormData({ ...formData, gradeName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Grade Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. GR-04"
                    value={formData.gradeCode}
                    onChange={(e) => setFormData({ ...formData, gradeCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Level (Rank Number)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Min Experience (Years)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.minimumExperience}
                    onChange={(e) => setFormData({ ...formData, minimumExperience: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Max Experience (Years)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.maximumExperience}
                    onChange={(e) => setFormData({ ...formData, maximumExperience: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Min Salary Band (Annual)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="e.g. 800000"
                    value={formData.minimumSalary}
                    onChange={(e) => setFormData({ ...formData, minimumSalary: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Max Salary Band (Annual)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="e.g. 1500000"
                    value={formData.maximumSalary}
                    onChange={(e) => setFormData({ ...formData, maximumSalary: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
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
                  <Form.Label>Grade Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Criteria, competency benchmarks, and role expectations"
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
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Grade"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Job Grade
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete job grade <strong>{deletingName}</strong>?
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

export default JobGradesSection;
