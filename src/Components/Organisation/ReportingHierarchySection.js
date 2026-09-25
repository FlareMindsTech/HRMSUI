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
  Nav,
} from "react-bootstrap";
import {
  FaSitemap,
  FaPlus,
  FaTrash,
  FaUserTie,
  FaUser,
  FaChevronDown,
  FaChevronRight,
  FaLink,
  FaUsers,
} from "react-icons/fa";
import {
  fetchReportingHierarchies,
  fetchReportingTree,
  assignReportingManager,
  removeReportingManager,
  fetchEmployeesDropdown,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

// Recursive Visual Hierarchy Tree Node Component
function TreeNode({ node, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="org-tree-node-wrapper" style={{ marginLeft: level > 0 ? "24px" : "0px" }}>
      <div className="org-tree-node-card">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                className="org-tree-toggle-btn"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <FaChevronDown /> : <FaChevronRight />}
              </button>
            ) : (
              <span className="org-tree-leaf-dot" />
            )}

            <div className="org-tree-avatar">
              {node.firstName ? node.firstName.charAt(0).toUpperCase() : "E"}
            </div>

            <div>
              <div className="org-tree-name">
                {node.name || `${node.firstName} ${node.lastName}`}
              </div>
              <div className="org-tree-meta">
                <span className="text-muted small font-monospace">{node.employeeCode}</span>
                {node.role?.roleName && (
                  <Badge bg="primary" className="ms-2 font-weight-normal" style={{ fontSize: "0.68rem" }}>
                    {node.role.roleName}
                  </Badge>
                )}
                {node.department && (
                  <span className="text-secondary small ms-2">&bull; {node.department}</span>
                )}
                {node.designation && (
                  <span className="text-secondary small ms-2">&bull; {node.designation}</span>
                )}
              </div>
            </div>
          </div>

          {hasChildren && (
            <Badge bg="light" className="text-dark border ms-2">
              <FaUsers className="me-1 text-primary" /> {node.children.length} Direct Reports
            </Badge>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="org-tree-children-container">
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportingHierarchySection({ lockedBranchId }) {
  const { hasPermission, isSystemAdmin } = useAuth();
  const [viewMode, setViewMode] = useState("tree"); // "tree" | "table"

  const [treeData, setTreeData] = useState(null);
  const [hierarchies, setHierarchies] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const initialForm = {
    employeeId: "",
    managerId: "",
    reportingType: "PRIMARY_MANAGER",
    isPrimary: true,
    effectiveFrom: new Date().toISOString().split("T")[0],
  };
  const [formData, setFormData] = useState(initialForm);

  const canManage = isSystemAdmin ||
    hasPermission("reportingHierarchy.manage") ||
    hasPermission("reportingHierarchy.create") ||
    hasPermission("reportingHierarchy.update");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = lockedBranchId ? { branchId: lockedBranchId } : {};
      const [treeRes, hierRes, empList] = await Promise.all([
        fetchReportingTree(params).catch((err) => {
          console.warn("fetchReportingTree failed:", err);
          return null;
        }),
        fetchReportingHierarchies({ limit: 100, ...params }).catch((err) => {
          console.warn("fetchReportingHierarchies failed:", err);
          return { data: [] };
        }),
        fetchEmployeesDropdown(params).catch(() => []),
      ]);

      if (treeRes) setTreeData(treeRes);
      if (hierRes) setHierarchies(hierRes.data || []);
      setEmployees(empList);
    } catch (err) {
      setError(err.message || "Failed to load reporting hierarchy");
    } finally {
      setLoading(false);
    }
  }, [lockedBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssign = () => {
    setFormData(initialForm);
    setModalError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      if (!formData.employeeId || !formData.managerId) {
        setModalError("Both Employee and Manager must be selected");
        setModalLoading(false);
        return;
      }

      if (formData.employeeId === formData.managerId) {
        setModalError("An employee cannot be their own reporting manager");
        setModalLoading(false);
        return;
      }

      const res = await assignReportingManager(formData);
      setSuccess(res.message || "Reporting manager assigned successfully");
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to assign manager");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await removeReportingManager(deletingId);
      setSuccess(res.message || "Reporting relationship removed successfully");
      setShowDeleteModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to remove reporting relationship");
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
            <FaSitemap className="text-success me-2" /> Reporting Hierarchy & Line Management
          </h3>
          <p className="org-section-sub">
            Visualize the executive tree, configure primary & functional managers, and establish approval chains.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Nav variant="pills" activeKey={viewMode} onSelect={(k) => setViewMode(k)}>
            <Nav.Item>
              <Nav.Link eventKey="tree" className="py-1 px-3">Visual Tree</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="table" className="py-1 px-3">Assignments List</Nav.Link>
            </Nav.Item>
          </Nav>
          {canManage && (
            <Button variant="success" className="org-action-btn ms-2" onClick={handleOpenAssign}>
              <FaPlus className="me-2" /> Assign Manager
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {loading ? (
        <div className="org-loader-container">
          <Spinner animation="border" variant="success" />
          <p className="mt-3 text-muted">Building organizational reporting hierarchy...</p>
        </div>
      ) : viewMode === "tree" ? (
        /* ── Visual Tree View ── */
        <Card className="org-tree-card">
          <Card.Header className="d-flex align-items-center justify-content-between py-2">
            <span className="fw-semibold text-secondary small">
              Total Active Employees: <strong>{treeData?.totalEmployees || 0}</strong>
            </span>
            <span className="text-muted small">
              Click chevrons to expand/collapse organizational branches
            </span>
          </Card.Header>
          <Card.Body className="p-4">
            {(!treeData?.tree || treeData.tree.length === 0) ? (
              <div className="text-center py-5 text-muted">
                No active employee reporting tree found.
              </div>
            ) : (
              <div className="org-tree-root-container">
                {treeData.tree.map((rootNode) => (
                  <TreeNode key={rootNode._id} node={rootNode} level={0} />
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      ) : (
        /* ── Assignment Table View ── */
        <Card className="org-table-card">
          <Table responsive hover className="org-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Reporting Manager</th>
                <th>Relationship Type</th>
                <th>Primary?</th>
                <th>Effective Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hierarchies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No explicit reporting relationship records found.
                  </td>
                </tr>
              ) : (
                hierarchies.map((h) => (
                  <tr key={h._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FaUser className="text-muted small" />
                        <div>
                          <div className="fw-semibold text-dark">
                            {h.employeeId?.firstName} {h.employeeId?.lastName}
                          </div>
                          <div className="small text-muted font-monospace">{h.employeeId?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FaUserTie className="text-primary small" />
                        <div>
                          <div className="fw-semibold text-dark">
                            {h.managerId?.firstName} {h.managerId?.lastName}
                          </div>
                          <div className="small text-muted font-monospace">{h.managerId?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" className="text-dark border">
                        {h.reportingType ? h.reportingType.replace("_", " ") : "PRIMARY"}
                      </Badge>
                    </td>
                    <td>
                      {h.isPrimary ? (
                        <Badge bg="success">Yes</Badge>
                      ) : (
                        <span className="text-muted small">Secondary</span>
                      )}
                    </td>
                    <td>
                      <span className="small font-monospace">
                        {h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleDateString() : "Immediate"}
                      </span>
                    </td>
                    <td>
                      <Badge bg={h.status === "ACTIVE" ? "success" : "secondary"}>
                        {h.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      {canManage && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-1"
                          title="Remove Manager Relationship"
                          onClick={() => {
                            setDeletingId(h._id);
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
        </Card>
      )}

      {/* ── Assign Manager Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaLink className="text-success" /> Assign Reporting Manager
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Target Employee <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                    <option value="">-- Select Employee --</option>
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
                  <Form.Label>Reporting Manager <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    required
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">-- Select Manager --</option>
                    {employees
                      .filter((emp) => emp._id !== formData.employeeId)
                      .map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Relationship Type</Form.Label>
                  <Form.Select
                    value={formData.reportingType}
                    onChange={(e) => setFormData({ ...formData, reportingType: e.target.value })}
                  >
                    <option value="PRIMARY_MANAGER">Primary Direct Line Manager</option>
                    <option value="FUNCTIONAL_MANAGER">Functional / Department Lead</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="DOTTED_LINE_MANAGER">Dotted-Line Secondary Manager</option>
                    <option value="HR_MANAGER">Assigned HR Business Partner</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Effective Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  id="isPrimaryCheck"
                  label="Set as Primary Manager (Used for primary leave and attendance approval workflows)"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Confirm Assignment"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Remove Reporting Relationship
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove this reporting relationship?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={modalLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={modalLoading}>
            {modalLoading ? <Spinner size="sm" animation="border" /> : "Yes, Remove"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ReportingHierarchySection;
