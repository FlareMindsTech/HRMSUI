import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Badge,
  Form,
  Row,
  Col,
  Spinner,
  ButtonGroup,
} from "react-bootstrap";
import {
  FaSitemap,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaCodeBranch,
  FaMoneyCheckAlt,
  FaList,
  FaChevronDown,
  FaChevronRight,
  FaFolder,
  FaFolderOpen,
} from "react-icons/fa";
import {
  fetchDepartments,
  fetchDepartmentsDropdown,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  fetchBranchesDropdown,
  fetchCostCentersDropdown,
  fetchEmployeesDropdown,
} from "../../services/organizationService";
import { useSelector, useDispatch } from 'react-redux';
import { invalidateOrgResource } from '../../redux/slices/organizationSlice';
import { useHasPermission, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import FeedbackAlert from "../Common/FeedbackAlert";
import EmptyState from "../Common/EmptyState";
import DataTable from "../Common/DataTable";
import SearchInput from "../Common/SearchInput";
import ConfirmModal from "../Common/ConfirmModal";
import PaginationBar from "../Common/PaginationBar";
import CrudModal from "../Common/CrudModal";

// Recursive Department Tree Node Component
function DeptTreeNode({ node, level = 0, onEdit, onDelete, canUpdate, canDelete }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="org-tree-node-wrapper" style={{ marginLeft: level > 0 ? "24px" : "0px" }}>
      <div className="org-tree-node-card">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                className="org-tree-toggle-btn"
                onClick={() => setExpanded(!expanded)}
                title={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
              </button>
            ) : (
              <span className="org-tree-leaf-dot" />
            )}

            <div className="org-tree-avatar" style={{ background: hasChildren ? "var(--primary-gradient)" : "var(--color-primary-light)", color: hasChildren ? "#fff" : "var(--color-secondary-text)" }}>
              {expanded && hasChildren ? <FaFolderOpen size={14} /> : <FaFolder size={14} />}
            </div>

            <div>
              <div className="org-tree-name d-flex align-items-center gap-2">
                <span>{node.departmentName}</span>
                <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: "0.72rem" }}>
                  {node.departmentCode}
                </span>
                <Badge bg={node.status === "ACTIVE" ? "success" : "secondary"} style={{ fontSize: "0.68rem" }}>
                  {node.status}
                </Badge>
              </div>
              <div className="org-tree-meta text-muted small d-flex align-items-center gap-3 mt-1 flex-wrap">
                {node.departmentHeadId && (
                  <span className="d-flex align-items-center gap-1 text-secondary">
                    <FaUserTie className="text-primary small" />
                    Head: {node.departmentHeadId.firstName} {node.departmentHeadId.lastName}
                  </span>
                )}
                {node.branchId && (
                  <span className="d-flex align-items-center gap-1 text-secondary">
                    <FaCodeBranch className="text-secondary small" />
                    {node.branchId.branchName || "Branch"}
                  </span>
                )}
                {node.costCenterId && (
                  <span className="d-flex align-items-center gap-1 text-secondary">
                    <FaMoneyCheckAlt className="text-success small" />
                    CC: {node.costCenterId.costCenterCode || node.costCenterId.costCenterName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {hasChildren && (
              <Badge bg="light" className="text-success border border-success-subtle px-2 py-1">
                {node.children.length} Sub-department{node.children.length > 1 ? "s" : ""}
              </Badge>
            )}
            <div className="org-tree-actions">
              {canUpdate && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary p-1"
                  title="Edit Department"
                  onClick={() => onEdit(node)}
                >
                  <FaEdit />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-danger p-1"
                  title="Delete Department"
                  onClick={() => onDelete(node)}
                >
                  <FaTrash />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="org-tree-children-container">
          {node.children.map((child) => (
            <DeptTreeNode
              key={child._id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentsSection({ lockedBranchId }) {
  const hasPermission = useHasPermission(); const isSystemAdmin = useSelector(selectIsSystemAdmin); const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState("table"); // "table" | "tree"
  const [departments, setDepartments] = useState([]);
  const [parentDepts, setParentDepts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [employees, setEmployees] = useState([]);

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
  const [editingDept, setEditingDept] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    departmentName: "",
    departmentCode: "",
    parentDepartmentId: "",
    departmentHeadId: "",
    branchId: lockedBranchId || "",
    costCenterId: "",
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

  const canCreate = isSystemAdmin || hasPermission("department.create");
  const canUpdate = isSystemAdmin || hasPermission("department.update");
  const canDelete = isSystemAdmin || hasPermission("department.delete");

  const loadDepartments = useCallback(async () => {
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
      const res = await fetchDepartments(params);
      if (res.success) {
        setDepartments(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBranch, filterStatus, lockedBranchId]);

  const loadAuxiliaryData = async () => {
    try {
      const [deptList, brList, ccList, empList] = await Promise.all([
        fetchDepartmentsDropdown(lockedBranchId ? { branchId: lockedBranchId } : {}).catch(() => []),
        fetchBranchesDropdown().catch(() => []),
        fetchCostCentersDropdown(lockedBranchId ? { branchId: lockedBranchId } : {}).catch(() => []),
        fetchEmployeesDropdown(lockedBranchId ? { branchId: lockedBranchId } : {}).catch(() => []),
      ]);
      setParentDepts(deptList);
      setBranches(brList);
      setCostCenters(ccList);
      setEmployees(empList);
    } catch (err) {
      console.warn("Error loading auxiliary dropdown data:", err);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [lockedBranchId]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({ ...initialForm, branchId: lockedBranchId || "" });
    setModalError("");
    loadAuxiliaryData();
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      departmentName: dept.departmentName || "",
      departmentCode: dept.departmentCode || "",
      parentDepartmentId: dept.parentDepartmentId?._id || dept.parentDepartmentId || "",
      departmentHeadId: dept.departmentHeadId?._id || dept.departmentHeadId || "",
      branchId: dept.branchId?._id || dept.branchId || "",
      costCenterId: dept.costCenterId?._id || dept.costCenterId || "",
      description: dept.description || "",
      status: dept.status || "ACTIVE",
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
        departmentName: formData.departmentName.trim(),
        departmentCode: formData.departmentCode.trim().toUpperCase(),
        parentDepartmentId: formData.parentDepartmentId || null,
        departmentHeadId: formData.departmentHeadId || null,
        branchId: formData.branchId || null,
        costCenterId: formData.costCenterId || null,
        description: formData.description,
        status: formData.status,
      };

      if (editingDept) {
        const res = await updateDepartment(editingDept._id, payload);
        setSuccess(res.message || "Department updated successfully");
      } else {
        const res = await createDepartment(payload);
        setSuccess(res.message || "Department created successfully");
      }
      setShowModal(false);
      dispatch(invalidateOrgResource("departments"));
      loadDepartments();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save department");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteDepartment(deletingId);
      setSuccess(res.message || "Department deleted successfully");
      setShowDeleteModal(false);
      dispatch(invalidateOrgResource("departments"));
      loadDepartments();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete department");
      setShowDeleteModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Build hierarchical department tree from department list
  const treeData = useMemo(() => {
    if (!departments || departments.length === 0) return [];
    const map = {};
    departments.forEach((d) => {
      map[d._id] = { ...d, children: [] };
    });
    const roots = [];
    departments.forEach((d) => {
      const parentId = typeof d.parentDepartmentId === "object" && d.parentDepartmentId ? d.parentDepartmentId._id : d.parentDepartmentId;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[d._id]);
      } else {
        roots.push(map[d._id]);
      }
    });
    return roots;
  }, [departments]);

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div>
          <h3 className="org-section-title">
            <FaSitemap className="text-success me-2" /> Department Directory
          </h3>
          <p className="org-section-sub">
            Organize functional units, parent-child department hierarchies, and departmental leadership.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ButtonGroup size="sm" className="org-view-toggle">
            <Button
              variant={viewMode === "table" ? "success" : "outline-secondary"}
              onClick={() => setViewMode("table")}
              className="d-flex align-items-center gap-1"
            >
              <FaList size={12} /> Table View
            </Button>
            <Button
              variant={viewMode === "tree" ? "success" : "outline-secondary"}
              onClick={() => setViewMode("tree")}
              className="d-flex align-items-center gap-1"
            >
              <FaSitemap size={12} /> Hierarchy Tree
            </Button>
          </ButtonGroup>

          {canCreate && (
            <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
              <FaPlus className="me-2" /> Add Department
            </Button>
          )}
        </div>
      </div>

      <FeedbackAlert variant="danger" dismissible onClose={() => setError("")} message={error} />
      <FeedbackAlert variant="success" dismissible onClose={() => setSuccess("")} message={success} />

      {/* ── Filters & Search ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <SearchInput
                size="sm"
                inputGroupTextClassName=""
                inputClassName=""
                iconClassName="text-muted"
                placeholder="Search by department name or code..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
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

      {/* ── Main View (Table or Hierarchy Tree) ── */}
      {viewMode === "tree" ? (
        <Card className="org-table-card p-3">
          <div className="mb-3 d-flex justify-content-between align-items-center border-bottom pb-2">
            <div className="small text-muted">
              Visualizing parent &rarr; child department structure across organization
            </div>
            <Badge bg="light" className="text-dark border">
              {departments.length} Departments Loaded
            </Badge>
          </div>

          {loading ? (
            <div className="text-center py-5 text-muted">
              <Spinner animation="border" size="sm" variant="success" className="me-2" />
              Loading department hierarchy...
            </div>
          ) : treeData.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No departments found to display.
            </div>
          ) : (
            <div className="org-tree-wrapper">
              {treeData.map((node) => (
                <DeptTreeNode
                  key={node._id}
                  node={node}
                  level={0}
                  onEdit={handleOpenEdit}
                  onDelete={(dept) => {
                    setDeletingId(dept._id);
                    setDeletingName(dept.departmentName);
                    setShowDeleteModal(true);
                  }}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="org-table-card">
          <DataTable
            responsive
            hover
            className="org-table mb-0 align-middle"
            rows={departments}
            loading={loading}
            loadingComponent={
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading departments...
                </td>
              </tr>
            }
            emptyComponent={
              <EmptyState
                variant="table"
                colSpan={7}
                className="text-center py-5 text-muted"
                title="No departments found."
              />
            }
            columns={[
              {
                key: "department",
                header: "Department Code & Name",
                render: (d) => (
                  <>
                    <div className="fw-semibold text-dark">{d.departmentName}</div>
                    <div className="small font-monospace text-muted">{d.departmentCode}</div>
                  </>
                ),
              },
              {
                key: "parent",
                header: "Parent Department",
                render: (d) =>
                  d.parentDepartmentId ? (
                    <Badge bg="light" className="text-secondary border">
                      <FaSitemap className="me-1" />
                      {d.parentDepartmentId.departmentName}
                    </Badge>
                  ) : (
                    <span className="text-muted small">Top Level</span>
                  ),
              },
              {
                key: "head",
                header: "Department Head",
                render: (d) =>
                  d.departmentHeadId ? (
                    <div className="d-flex align-items-center gap-1">
                      <FaUserTie className="text-primary small" />
                      <span className="small">{d.departmentHeadId.firstName} {d.departmentHeadId.lastName}</span>
                    </div>
                  ) : (
                    <span className="text-muted small">Unassigned</span>
                  ),
              },
              {
                key: "branch",
                header: "Branch",
                render: (d) =>
                  d.branchId ? (
                    <div className="small">
                      <FaCodeBranch className="text-secondary me-1" />
                      {d.branchId.branchName}
                    </div>
                  ) : (
                    <span className="text-muted small">All Branches</span>
                  ),
              },
              {
                key: "costCenter",
                header: "Cost Center",
                render: (d) =>
                  d.costCenterId ? (
                    <Badge bg="light" className="text-dark border">
                      <FaMoneyCheckAlt className="me-1 text-success" />
                      {d.costCenterId.costCenterCode || d.costCenterId.costCenterName}
                    </Badge>
                  ) : (
                    <span className="text-muted small">-</span>
                  ),
              },
              {
                key: "status",
                header: "Status",
                render: (d) => (
                  <Badge bg={d.status === "ACTIVE" ? "success" : "secondary"}>
                    {d.status}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                headerClassName: "text-end",
                cellClassName: "text-end",
                render: (d) => (
                  <>
                    {canUpdate && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary p-1"
                        title="Edit Department"
                        onClick={() => handleOpenEdit(d)}
                      >
                        <FaEdit />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        title="Delete Department"
                        onClick={() => {
                          setDeletingId(d._id);
                          setDeletingName(d.departmentName);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </>
                ),
              },
            ]}
          />

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationBar
            size="sm"
            page={page}
            totalPages={totalPages}
            onPageChange={(pg) => setPage(pg)}
            wrapperClassName="d-flex justify-content-end p-3 border-top"
            paginationClassName="mb-0"
          />
        )}
      </Card>
      )}

      {/* ── Create / Edit Modal ── */}
      <CrudModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={<><FaSitemap className="text-success" />{editingDept ? "Edit Department" : "Add New Department"}</>}
        onSubmit={handleSubmit}
        saving={modalLoading}
        saveLabel="Save Department"
        modalError={modalError}
      >
        <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Engineering & Product"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. ENG-PROD"
                    value={formData.departmentCode}
                    onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Parent Department</Form.Label>
                  <Form.Select
                    value={formData.parentDepartmentId}
                    onChange={(e) => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                  >
                    <option value="">-- None (Top Level Department) --</option>
                    {parentDepts
                      .filter((pd) => !editingDept || pd._id !== editingDept._id)
                      .map((pd) => (
                        <option key={pd._id} value={pd._id}>
                          {pd.departmentName} ({pd.departmentCode})
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department Head / HOD</Form.Label>
                  <Form.Select
                    value={formData.departmentHeadId}
                    onChange={(e) => setFormData({ ...formData, departmentHeadId: e.target.value })}
                  >
                    <option value="">-- Select Department Head --</option>
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
                  <Form.Label>
                    Associated Branch {lockedBranchId && <span className="badge bg-secondary ms-1">Locked to current branch</span>}
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
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Cost Center</Form.Label>
                  <Form.Select
                    value={formData.costCenterId}
                    onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                  >
                    <option value="">-- Select Cost Center --</option>
                    {costCenters.map((cc) => (
                      <option key={cc._id} value={cc._id}>
                        {cc.costCenterName} ({cc.costCenterCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description / Charter</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Department mission, functional boundaries, and responsibilities"
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
      </CrudModal>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={<><FaTrash /> Delete Department</>}
        message={<>Are you sure you want to delete department <strong>{deletingName}</strong>?<p className="text-muted small mt-2">Warning: Sub-departments and designations assigned to this department should be re-mapped first.</p></>}
        onConfirm={handleDelete}
        loading={modalLoading}
      />
    </div>
  );
}

export default DepartmentsSection;
