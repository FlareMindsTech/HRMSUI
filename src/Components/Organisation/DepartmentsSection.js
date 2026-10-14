import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Badge,
  Form,
  Row,
  Col,
  Spinner,
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
  FaUsers,
  FaGlobe,
  FaNetworkWired,
  FaCheckCircle,
  FaUserSlash,
  FaSearch,
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
import { useBranch } from '../../context/BranchContext';
import { useSearchParams } from 'react-router-dom';
import FeedbackAlert from "../Common/FeedbackAlert";
import EmptyState from "../Common/EmptyState";
import DataTable from "../Common/DataTable";
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
            <div className="org-tree-actions d-flex align-items-center gap-1">
              {canUpdate && (
                <button
                  type="button"
                  className="org-icon-btn edit"
                  title="Edit Department"
                  onClick={() => onEdit(node)}
                >
                  <FaEdit size={13} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="org-icon-btn delete"
                  title="Delete Department"
                  onClick={() => onDelete(node)}
                >
                  <FaTrash size={12} />
                </button>
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

function DepartmentsSection({
  lockedBranchId = null,
  onNavigateBranchTab = null,
  autoOpenCreate = false,
}) {
  const hasPermission = useHasPermission();
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const dispatch = useDispatch();
  const { selectedBranchId, accessLevel } = useBranch();
  const isBranchScoped = accessLevel === "BRANCH" || Boolean(lockedBranchId);
  const [searchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState("table"); // "table" | "tree"
  const [departments, setDepartments] = useState([]);
  const [treeDepartments, setTreeDepartments] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
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

  // Deactivate Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    departmentName: "",
    departmentCode: "",
    parentDepartmentId: "",
    departmentHeadId: "",
    branchId: lockedBranchId || (isBranchScoped ? (selectedBranchId || "") : ""),
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

  const loadAuxiliaryData = useCallback(async (scopedBranchId) => {
    try {
      const activeBranch = scopedBranchId !== undefined ? scopedBranchId : (lockedBranchId || (isBranchScoped ? selectedBranchId : ""));
      const [deptList, brList, ccList, empList] = await Promise.all([
        fetchDepartmentsDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
        fetchBranchesDropdown().catch(() => []),
        fetchCostCentersDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
        fetchEmployeesDropdown(activeBranch ? { branchId: activeBranch } : {}).catch(() => []),
      ]);
      setParentDepts(deptList);
      setBranches(brList);
      setCostCenters(ccList);
      setEmployees(empList);
    } catch (err) {
      console.warn("Error loading auxiliary dropdown data:", err);
    }
  }, [lockedBranchId, isBranchScoped, selectedBranchId]);

  const loadTreeDepartments = useCallback(async () => {
    try {
      setTreeLoading(true);
      const params = {
        page: 1,
        limit: 1000,
        status: filterStatus || undefined,
        branchId: lockedBranchId || filterBranch || undefined,
        search: search || undefined,
      };
      const res = await fetchDepartments(params);
      if (res && res.success) {
        setTreeDepartments(res.data || []);
      }
    } catch (err) {
      console.warn("Error loading tree departments:", err);
    } finally {
      setTreeLoading(false);
    }
  }, [lockedBranchId, filterBranch, filterStatus, search]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (viewMode === "tree") {
      loadTreeDepartments();
    }
  }, [viewMode, loadTreeDepartments]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [loadAuxiliaryData]);

  // When form branch selection changes, reload scoped dependents and clear
  // stale selections so an option from the previous scope cannot be submitted.
  const handleFormBranchChange = async (selectedBranchId) => {
    setFormData((prev) => ({
      ...prev,
      branchId: selectedBranchId,
      parentDepartmentId: "",
      departmentHeadId: "",
      costCenterId: "",
    }));
    try {
      const [deptList, ccList, empList] = await Promise.all([
        fetchDepartmentsDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
        fetchCostCentersDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
        fetchEmployeesDropdown(selectedBranchId ? { branchId: selectedBranchId } : {}).catch(() => []),
      ]);
      setParentDepts(deptList);
      setCostCenters(ccList);
      setEmployees(empList);
    } catch (err) {
      console.warn("Failed to reload branch-scoped data:", err);
    }
  };

  const handleOpenCreate = () => {
    setEditingDept(null);
    const defaultBranch = lockedBranchId || filterBranch || (isBranchScoped ? (selectedBranchId || "") : "");
    setFormData({ ...initialForm, branchId: defaultBranch });
    setModalError("");
    loadAuxiliaryData(defaultBranch);
    setShowModal(true);
  };

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new-dept" || action === "add-department" || autoOpenCreate) {
      handleOpenCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, autoOpenCreate]);

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    const targetBranch = dept.branchId?._id || dept.branchId || lockedBranchId || "";
    setFormData({
      departmentName: dept.departmentName || "",
      departmentCode: dept.departmentCode || "",
      parentDepartmentId: dept.parentDepartmentId?._id || dept.parentDepartmentId || "",
      departmentHeadId: dept.departmentHeadId?._id || dept.departmentHeadId || "",
      branchId: targetBranch,
      costCenterId: dept.costCenterId?._id || dept.costCenterId || "",
      description: dept.description || "",
      status: dept.status || "ACTIVE",
    });
    setModalError("");
    loadAuxiliaryData(targetBranch);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      if (isBranchScoped && !formData.branchId) {
        setModalError("Branch is required for branch-scoped users.");
        setModalLoading(false);
        return;
      }

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
      dispatch(invalidateOrgResource(["departments", "structure", "profile"]));
      loadDepartments();
      if (viewMode === "tree") {
        loadTreeDepartments();
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const errorMsg = err.mapped?.message || err.message || "Failed to save department";
      setModalError(errorMsg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteDepartment(deletingId);
      setSuccess(res.message || "Department deactivated successfully");
      setShowDeleteModal(false);
      dispatch(invalidateOrgResource(["departments", "structure", "profile"]));
      loadDepartments();
      if (viewMode === "tree") {
        loadTreeDepartments();
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const displayMsg = err.mapped?.message || err.message || "Failed to deactivate department";
      setError(displayMsg);
      setShowDeleteModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Build hierarchical department tree from department list
  const treeData = useMemo(() => {
    const list = treeDepartments.length > 0 ? treeDepartments : departments;
    if (!list || list.length === 0) return [];
    const map = {};
    list.forEach((d) => {
      map[d._id] = { ...d, children: [] };
    });
    const roots = [];
    list.forEach((d) => {
      const parentId = typeof d.parentDepartmentId === "object" && d.parentDepartmentId ? d.parentDepartmentId._id : d.parentDepartmentId;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[d._id]);
      } else {
        roots.push(map[d._id]);
      }
    });
    return roots;
  }, [treeDepartments, departments]);

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div className="d-flex align-items-center gap-3">
          <div className="branch-card-icon-badge branch-card-icon-gold">
            <FaSitemap />
          </div>
          <div>
            <h3 className="org-section-title mb-0">Department Directory</h3>
            <p className="org-section-sub mb-0 mt-0.5">
              Organize functional units, parent-child department hierarchies, and departmental leadership.
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="org-view-toggle">
            <button
              type="button"
              className={`org-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <FaList size={11} /> Table View
            </button>
            <button
              type="button"
              className={`org-view-toggle-btn ${viewMode === "tree" ? "active" : ""}`}
              onClick={() => setViewMode("tree")}
            >
              <FaSitemap size={11} /> Hierarchy Tree
            </button>
          </div>

          {canCreate && (
            <button type="button" className="branches-btn-add btn-sm" onClick={handleOpenCreate}>
              <FaPlus size={11} className="me-1" /> Add Department
            </button>
          )}
        </div>
      </div>

      <FeedbackAlert variant="danger" dismissible onClose={() => setError("")} message={error} />
      <FeedbackAlert variant="success" dismissible onClose={() => setSuccess("")} message={success} />

      {/* ── Branch-Scoped Notice Banner (when locked to a specific branch) ── */}
      {lockedBranchId && (
        <div className="p-3 mb-3 rounded-3 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderColor: "rgba(196, 154, 85, 0.3)" }}>
          <div className="d-flex align-items-center gap-2.5">
            <div className="branch-card-icon-badge branch-card-icon-gold" style={{ width: 34, height: 34, fontSize: 14 }}>
              <FaCodeBranch />
            </div>
            <div>
              <span className="fw-bold text-dark">Branch-Scoped Directory:</span>{" "}
              <span className="text-secondary">Viewing & managing departments exclusively for </span>
              <strong className="text-dark">{branches.find((b) => String(b._id) === String(lockedBranchId))?.branchName || "Current Branch"}</strong>
              {branches.find((b) => String(b._id) === String(lockedBranchId))?.branchCode
                ? ` (${branches.find((b) => String(b._id) === String(lockedBranchId))?.branchCode})`
                : ""}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {canCreate && (
              <button
                type="button"
                className="branches-btn-add btn-sm"
                onClick={handleOpenCreate}
              >
                <FaPlus size={11} className="me-1" /> Add Department to Branch
              </button>
            )}
            <span className="branch-dept-count-pill active" style={{ fontSize: "11px" }}>Branch Locked</span>
          </div>
        </div>
      )}

      {/* ── Track By Branch Pills (when not locked to a single branch) ── */}
      {!lockedBranchId && branches.length > 0 && (
        <div className="dept-branch-filter-bar mb-3">
          <div className="dept-branch-filter-label">
            <FaCodeBranch size={12} className="text-secondary" /> Track by Branch:
          </div>
          <div className="dept-branch-pills-wrap">
            <button
              type="button"
              className={`dept-branch-pill ${!filterBranch ? "active" : ""}`}
              onClick={() => {
                setFilterBranch("");
                setPage(1);
              }}
            >
              🏢 All Branches
              <span className="dept-branch-pill-count">{totalRecords}</span>
            </button>
            {branches.map((b) => (
              <button
                key={b._id}
                type="button"
                className={`dept-branch-pill ${filterBranch === b._id ? "active" : ""}`}
                onClick={() => {
                  setFilterBranch(b._id);
                  setPage(1);
                }}
              >
                {b.branchName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters & Search ── */}
      <div className="branches-toolbar-card mb-3">
        <div className="branches-toolbar-row">
          <div className="branches-search-wrap">
            <FaSearch className="branches-search-icon" />
            <input
              type="text"
              className="branches-search-input"
              placeholder="Search by department name or code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                type="button"
                className="btn btn-sm btn-link text-muted p-0 me-2"
                style={{ textDecoration: "none", fontSize: "11px" }}
                onClick={() => { setSearch(""); setPage(1); }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="branches-filter-group d-flex align-items-center gap-2 flex-wrap">
            <select
              className="branches-filter-select"
              value={lockedBranchId || filterBranch}
              disabled={Boolean(lockedBranchId)}
              onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }}
            >
              {!lockedBranchId && <option value="">All Branches</option>}
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.branchName}</option>
              ))}
            </select>

            <select
              className="branches-filter-select"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {(search || (!lockedBranchId && filterBranch) || filterStatus) && (
              <button
                type="button"
                className="btn btn-sm btn-link text-muted text-decoration-none px-2"
                style={{ fontSize: "12px" }}
                onClick={() => {
                  setSearch("");
                  if (!lockedBranchId) setFilterBranch("");
                  setFilterStatus("");
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            )}

            <div className="ms-auto text-muted extra-small fw-semibold">
              Total: <strong className="text-dark">{totalRecords}</strong> Departments
            </div>
          </div>
        </div>
      </div>

      {/* ── Main View (Table or Hierarchy Tree) ── */}
      {viewMode === "tree" ? (
        <Card className="org-table-card p-3">
          <div className="mb-3 d-flex justify-content-between align-items-center border-bottom pb-2">
            <div className="small text-muted">
              Visualizing parent &rarr; child department structure across organization
            </div>
            <Badge bg="light" className="text-dark border">
              {(treeDepartments.length || departments.length)} Departments Loaded
            </Badge>
          </div>

          {(treeLoading || (loading && treeDepartments.length === 0)) ? (
            <div className="text-center py-5 text-muted">
              <Spinner animation="border" size="sm" variant="success" className="me-2" />
              Loading complete department hierarchy...
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
                icon={FaSitemap}
                iconSize={26}
                iconClassName="text-muted opacity-50 mb-2"
                title={search || filterBranch || filterStatus ? "No departments match your filter criteria" : "No departments found"}
                description={
                  search || filterBranch || filterStatus
                    ? "Try adjusting or clearing your search filters."
                    : "No organizational departments have been registered yet."
                }
                actionLabel={canCreate && !search && !filterBranch && !filterStatus ? "Add Department" : undefined}
                onAction={canCreate ? handleOpenCreate : undefined}
                actionVariant="success"
                actionClassName="branches-btn-add mt-2"
                bodyClassName="py-5"
              />
            }
            columns={[
              {
                key: "department",
                header: "Department",
                render: (d) => (
                  <div className="min-w-0">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13.5px" }}>
                      {d.departmentName}
                    </div>
                    <div className="d-flex align-items-center gap-1 mt-0.5">
                      <span className="branch-code-badge font-monospace" style={{ fontSize: "10.5px", padding: "2px 7px" }}>
                        {d.departmentCode || "—"}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "parent",
                header: "Parent Department",
                render: (d) =>
                  d.parentDepartmentId ? (
                    <span className="dept-parent-pill">
                      <FaNetworkWired size={11} className="text-secondary opacity-75" />
                      {d.parentDepartmentId.departmentName}
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border px-2.5 py-1 fw-normal" style={{ fontSize: "11px" }}>
                      <FaCheckCircle size={9} className="me-1 text-success opacity-75" /> Root Dept
                    </span>
                  ),
              },
              {
                key: "head",
                header: "Department Head",
                render: (d) => {
                  if (!d.departmentHeadId) {
                    return (
                      <span className="text-muted extra-small d-inline-flex align-items-center gap-1">
                        <FaUserSlash size={10} className="opacity-50" /> Unassigned
                      </span>
                    );
                  }
                  const f = d.departmentHeadId.firstName || "";
                  const l = d.departmentHeadId.lastName || "";
                  const inits = ((f[0] || "") + (l[0] || "")).toUpperCase() || "HD";
                  return (
                    <div className="d-flex align-items-center gap-2">
                      <div className="dept-head-avatar">
                        {inits}
                      </div>
                      <div className="min-w-0">
                        <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "12.5px" }}>
                          {f} {l}
                        </div>
                        {d.departmentHeadId.email && (
                          <div className="extra-small text-muted text-truncate" style={{ maxWidth: 140 }}>
                            {d.departmentHeadId.email}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "branch",
                header: "Branch",
                render: (d) =>
                  d.branchId ? (
                    <div className="dept-branch-tag">
                      <FaCodeBranch className="text-secondary opacity-75" size={11} />
                      <span className="text-truncate" style={{ maxWidth: 140 }}>{d.branchId.branchName}</span>
                    </div>
                  ) : (
                    <span className="badge bg-light text-secondary border px-2 py-1 fw-normal" style={{ fontSize: "11px" }}>
                      <FaGlobe size={10} className="me-1 opacity-75" /> All Branches
                    </span>
                  ),
              },
              {
                key: "costCenter",
                header: "Cost Center",
                render: (d) =>
                  d.costCenterId ? (
                    <span className="dept-cost-center-badge">
                      <FaMoneyCheckAlt className="text-muted" size={11} />
                      {d.costCenterId.costCenterCode || d.costCenterId.costCenterName}
                    </span>
                  ) : (
                    <span className="text-muted extra-small">—</span>
                  ),
              },
              {
                key: "status",
                header: "Status",
                render: (d) => (
                  <span
                    className={`badge px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                      d.status === "ACTIVE"
                        ? "bg-success-subtle text-success border border-success-subtle"
                        : "bg-secondary-subtle text-secondary border border-secondary-subtle"
                    }`}
                    style={{ fontSize: "11.5px" }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: d.status === "ACTIVE" ? "#16a34a" : "#64748b",
                        display: "inline-block",
                      }}
                    />
                    {d.status}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                headerClassName: "text-end",
                cellClassName: "text-end",
                render: (d) => (
                  <div className="org-table-actions justify-content-end">
                    {canUpdate && (
                      <button
                        type="button"
                        className="org-icon-btn edit"
                        title="Edit Department"
                        onClick={() => handleOpenEdit(d)}
                      >
                        <FaEdit size={13} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="org-icon-btn delete"
                        title="Delete Department"
                        onClick={() => {
                          setDeletingId(d._id);
                          setDeletingName(d.departmentName);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
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
                    Associated Branch {isBranchScoped && <span className="badge bg-secondary ms-1">Required</span>}
                  </Form.Label>
                  <Form.Select
                    value={formData.branchId}
                    disabled={Boolean(lockedBranchId)}
                    onChange={(e) => handleFormBranchChange(e.target.value)}
                  >
                    {!isBranchScoped && <option value="">-- All Branches / Global --</option>}
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

      {/* ── Branch Workflow Progress & Next Step Card (when locked to a specific branch) ── */}
      {lockedBranchId && onNavigateBranchTab && (
        <div className="p-3.5 mt-4 rounded-3 border bg-white shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(196, 154, 85, 0.2) 0%, rgba(196, 154, 85, 0.08) 100%)",
                color: "var(--color-primary-dark, #9B7229)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                border: "1px solid rgba(196, 154, 85, 0.3)",
              }}
            >
              <FaUsers />
            </div>
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                Next Step in Branch Setup: Assign Staff & Members
              </div>
              <div className="text-muted small">
                Place employees into these departments and configure branch workforce placements.
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onNavigateBranchTab("overview")}
            >
              Branch Overview
            </button>
            <button
              type="button"
              className="btn btn-sm fw-bold shadow-sm"
              style={{
                background: "var(--org-gold-btn-gradient, linear-gradient(135deg, #E2C278 0%, #C49A55 100%))",
                color: "#1C1D1D",
                border: "none",
                padding: "7px 16px",
                borderRadius: 8,
              }}
              onClick={() => onNavigateBranchTab("members")}
            >
              Continue to Staff & Members &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirmation Modal ── */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={<><FaTrash /> Deactivate Department</>}
        message={
          <>
            Are you sure you want to deactivate department <strong>{deletingName}</strong>?
            <p className="text-muted small mt-2">
              Note: Backend guards will block deactivation if active employees, teams, designations, or child sub-departments are still linked.
            </p>
          </>
        }
        confirmLabel="Deactivate Department"
        onConfirm={handleDelete}
        loading={modalLoading}
      />
    </div>
  );
}

export default DepartmentsSection;
