import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Spinner,
  Modal,
} from "react-bootstrap";
import {
  FaProjectDiagram,
  FaPlus,
  FaTrash,
  FaUserTie,
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaLink,
  FaUsers,
  FaCrown,
  FaSearch,
  FaTimes,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaBuilding,
  FaArrowRight,
  FaCheckCircle,
  FaLayerGroup,
  FaList,
} from "react-icons/fa";
import {
  fetchReportingHierarchies,
  fetchReportingTree,
  assignReportingManager,
  removeReportingManager,
  fetchEmployeesDropdown,
} from "../../services/organizationService";
import { useSelector } from 'react-redux';
import { useHasPermission, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import FeedbackAlert from "../Common/FeedbackAlert";
import EmptyState from "../Common/EmptyState";
import DataTable from "../Common/DataTable";
import ConfirmModal from "../Common/ConfirmModal";
import "./ReportingHierarchySection.css";

// ── Smart Tree Synthesis Engine ──
// Merges /organization/reporting-tree, /reporting-hierarchy, and employee profiles
function buildComprehensiveTree(treeData, hierarchies = [], employees = []) {
  // If backend returned a populated tree with nodes, use it
  const rawTree = Array.isArray(treeData) ? treeData : treeData?.tree;
  if (rawTree && rawTree.length > 0) {
    return rawTree;
  }

  if (!employees.length && !hierarchies.length) return [];

  // Index all employees in lookup map
  const nodeMap = new Map();
  employees.forEach((emp) => {
    const id = String(emp._id || emp.id || "");
    if (!id) return;

    const firstName = emp.firstName || "";
    const lastName = emp.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || emp.name || "Employee";
    const code = emp.employeeCode || emp.code || "EMP";
    const dept =
      emp.department?.departmentName ||
      (typeof emp.department === "string" ? emp.department : "") ||
      "";
    const desig =
      emp.designation?.designationName ||
      (typeof emp.designation === "string" ? emp.designation : "") ||
      "";
    const roleName =
      emp.role?.roleName ||
      emp.roleName ||
      (typeof emp.role === "string" ? emp.role : "") ||
      "";

    const directMgrId =
      emp.reportingManager?._id ||
      emp.reportingManager ||
      emp.reportedTo?._id ||
      emp.reportedTo ||
      null;

    nodeMap.set(id, {
      _id: id,
      name: fullName,
      firstName,
      lastName,
      employeeCode: code,
      email: emp.email || "",
      department: dept,
      designation: desig,
      role: { roleName },
      managerId: directMgrId ? String(directMgrId) : null,
      reportingType: "PRIMARY_MANAGER",
      isPrimary: true,
      children: [],
    });
  });

  // Apply explicit overrides from hierarchies records
  hierarchies.forEach((h) => {
    const empId = String(h.employeeId?._id || h.employeeId || "");
    const mgrId = String(h.managerId?._id || h.managerId || "");
    if (!empId || !mgrId) return;

    if (!nodeMap.has(empId)) {
      const eObj = h.employeeId || {};
      nodeMap.set(empId, {
        _id: empId,
        name: `${eObj.firstName || ""} ${eObj.lastName || ""}`.trim() || "Employee",
        firstName: eObj.firstName || "",
        lastName: eObj.lastName || "",
        employeeCode: eObj.employeeCode || "EMP",
        email: eObj.email || "",
        department: eObj.department || "",
        designation: eObj.designation || "",
        role: { roleName: "" },
        managerId: mgrId,
        reportingType: h.reportingType || "PRIMARY_MANAGER",
        isPrimary: h.isPrimary !== false,
        children: [],
      });
    } else {
      const existing = nodeMap.get(empId);
      existing.managerId = mgrId;
      existing.reportingType = h.reportingType || "PRIMARY_MANAGER";
      existing.isPrimary = h.isPrimary !== false;
    }

    if (!nodeMap.has(mgrId)) {
      const mObj = h.managerId || {};
      nodeMap.set(mgrId, {
        _id: mgrId,
        name: `${mObj.firstName || ""} ${mObj.lastName || ""}`.trim() || "Manager",
        firstName: mObj.firstName || "",
        lastName: mObj.lastName || "",
        employeeCode: mObj.employeeCode || "MGR",
        email: mObj.email || "",
        department: mObj.department || "",
        designation: mObj.designation || "",
        role: { roleName: "Manager" },
        managerId: null,
        children: [],
      });
    }
  });

  // Link children to parent managers
  const childIds = new Set();
  nodeMap.forEach((node) => {
    if (node.managerId && nodeMap.has(node.managerId) && node.managerId !== node._id) {
      const parent = nodeMap.get(node.managerId);
      if (!parent.children.some((c) => String(c._id) === String(node._id))) {
        parent.children.push(node);
      }
      childIds.add(node._id);
    }
  });

  // Identify root leaders: nodes without parent managers
  const roots = [];
  nodeMap.forEach((node) => {
    if (!childIds.has(node._id)) {
      roots.push(node);
    }
  });

  // Prioritize executive roles (Owner / Admin / Director / FMT001) first
  roots.sort((a, b) => {
    const aIsExec =
      /owner|admin|director|ceo|head|lead/i.test(a.role?.roleName || "") ||
      /001/i.test(a.employeeCode || "");
    const bIsExec =
      /owner|admin|director|ceo|head|lead/i.test(b.role?.roleName || "") ||
      /001/i.test(b.employeeCode || "");
    if (aIsExec && !bIsExec) return -1;
    if (!aIsExec && bIsExec) return 1;
    return (a.employeeCode || "").localeCompare(b.employeeCode || "");
  });

  return roots;
}

// Helper to collect all node IDs in tree
function collectAllNodeIds(nodes = []) {
  const ids = new Set();
  function traverse(list) {
    list.forEach((n) => {
      const id = String(n._id || n.employeeCode || "");
      if (id) ids.add(id);
      if (n.children && n.children.length) traverse(n.children);
    });
  }
  traverse(nodes);
  return ids;
}

// ── Recursive Structured Tree Node with Left Guide Rails ──
function HierarchyTreeNode({
  node,
  level = 0,
  searchQuery = "",
  expandedIds,
  onToggleExpand,
  onAddDirectReport,
  matchedIdSet,
}) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const nodeId = String(node._id || node.employeeCode || "");
  const isExpanded = expandedIds.has(nodeId);

  const query = (searchQuery || "").trim().toLowerCase();
  const isMatched = matchedIdSet ? matchedIdSet.has(nodeId) : false;
  const isDimmed = query.length > 0 && !isMatched;

  // Initials
  const initials =
    node.firstName && node.lastName
      ? `${node.firstName[0]}${node.lastName[0]}`.toUpperCase()
      : node.name
      ? node.name.slice(0, 2).toUpperCase()
      : "EM";

  const isExecutive = level === 0;
  const isManager = hasChildren;
  const cardType = isExecutive ? "executive" : isManager ? "manager" : "contributor";

  return (
    <div className="rep-tree-node-block">
      {/* Node Card */}
      <div
        className={`rep-node-card ${cardType} ${isMatched ? "highlighted" : ""} ${isDimmed ? "dimmed" : ""}`}
      >
        {/* Top Badges & Actions */}
        <div className="d-flex align-items-center justify-content-between mb-1.5">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {isExecutive ? (
              <span className="rep-card-top-tag rep-tag-crown">
                <FaCrown size={9} /> Root Leader / Executive
              </span>
            ) : isManager ? (
              <span className="rep-card-top-tag rep-tag-manager">
                <FaUserTie size={9} /> Line Manager
              </span>
            ) : (
              <span className="rep-card-top-tag rep-tag-direct">
                <FaUser size={9} /> Team Member
              </span>
            )}

            {node.isPrimary === false && (
              <span className="rep-card-top-tag rep-tag-functional">
                Functional Lead
              </span>
            )}
          </div>

          <div className="rep-card-actions">
            {hasChildren && (
              <button
                type="button"
                className={`rep-reports-toggle-btn ${isExpanded ? "expanded" : ""}`}
                onClick={() => onToggleExpand(nodeId)}
                title={isExpanded ? "Collapse Direct Reports" : "Expand Direct Reports"}
              >
                {isExpanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                <span>
                  {node.children.length} {node.children.length === 1 ? "Report" : "Reports"}
                </span>
              </button>
            )}

            {onAddDirectReport && (
              <button
                type="button"
                className="rep-card-action-btn"
                title={`Assign a direct report under ${node.name || node.firstName}`}
                onClick={() => onAddDirectReport(node)}
              >
                <FaPlus size={9} /> Add Report
              </button>
            )}
          </div>
        </div>

        {/* Card Main Info */}
        <div className="rep-card-main">
          <div className={`rep-card-avatar ${isExecutive ? "rep-avatar-dark" : "rep-avatar-light"}`}>
            {initials}
            <span className="rep-avatar-status-dot" title="Active Member" />
          </div>

          <div className="rep-card-details">
            <div
              className="rep-card-name"
              title={node.name || `${node.firstName || ""} ${node.lastName || ""}`}
            >
              {node.name || `${node.firstName || ""} ${node.lastName || ""}`.trim() || "Employee"}
            </div>
            <div
              className="rep-card-role"
              title={node.designation || node.role?.roleName || "Team Member"}
            >
              {node.designation || node.role?.roleName || "Team Member"}
            </div>
          </div>
        </div>

        {/* Meta Row: Employee Code + Department */}
        <div className="rep-card-meta-row">
          <span className="rep-code-chip">{node.employeeCode || "EMP"}</span>
          {node.department && (
            <span className="rep-dept-chip" title={node.department}>
              <FaBuilding size={9} className="me-1 opacity-75" />
              {node.department}
            </span>
          )}
        </div>
      </div>

      {/* Recursive Children with Guide Rails */}
      {hasChildren && isExpanded && (
        <div className="rep-branch-nest">
          {node.children.map((child) => (
            <div key={child._id || child.employeeCode} className="rep-branch-item">
              <span className="rep-branch-feeder-arm" />
              <HierarchyTreeNode
                node={child}
                level={level + 1}
                searchQuery={searchQuery}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onAddDirectReport={onAddDirectReport}
                matchedIdSet={matchedIdSet}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportingHierarchySection({ lockedBranchId }) {
  const hasPermission = useHasPermission();
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const [viewMode, setViewMode] = useState("tree"); // "tree" | "table"

  const [treeData, setTreeData] = useState(null);
  const [hierarchies, setHierarchies] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Expand State
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

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

  const canManage =
    isSystemAdmin ||
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

  // Build Comprehensive Tree
  const rootNodes = useMemo(() => {
    return buildComprehensiveTree(treeData, hierarchies, employees);
  }, [treeData, hierarchies, employees]);

  // Auto-expand all nodes when tree loads
  useEffect(() => {
    if (rootNodes && rootNodes.length > 0) {
      const allIds = collectAllNodeIds(rootNodes);
      setExpandedIds(allIds);
    }
  }, [rootNodes]);

  // KPI Metrics
  const { totalMembers, rootLeaders, lineManagers, avgTeamSize } = useMemo(() => {
    let members = 0;
    let managersCount = 0;
    let totalChildren = 0;

    function countNodes(list) {
      list.forEach((node) => {
        members += 1;
        if (node.children && node.children.length > 0) {
          managersCount += 1;
          totalChildren += node.children.length;
          countNodes(node.children);
        }
      });
    }

    countNodes(rootNodes);
    const avg = managersCount > 0 ? (totalChildren / managersCount).toFixed(1) : "0.0";
    return {
      totalMembers: treeData?.totalEmployees || members || employees.length,
      rootLeaders: rootNodes.length,
      lineManagers: managersCount,
      avgTeamSize: avg,
    };
  }, [rootNodes, treeData, employees]);

  // Search Matching & Ancestor Path
  const { matchedIdSet, ancestorIdSet } = useMemo(() => {
    const matched = new Set();
    const ancestors = new Set();
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return { matchedIdSet: matched, ancestorIdSet: ancestors };

    function searchTree(node, path = []) {
      const nodeId = String(node._id || node.employeeCode || "");
      const nameStr = (node.name || `${node.firstName || ""} ${node.lastName || ""}`).toLowerCase();
      const codeStr = (node.employeeCode || "").toLowerCase();
      const deptStr = (node.department || "").toLowerCase();
      const desigStr = (node.designation || "").toLowerCase();

      const isHit =
        nameStr.includes(q) ||
        codeStr.includes(q) ||
        deptStr.includes(q) ||
        desigStr.includes(q);

      if (isHit) {
        matched.add(nodeId);
        path.forEach((pId) => ancestors.add(pId));
      }

      if (node.children && node.children.length) {
        node.children.forEach((child) => searchTree(child, [...path, nodeId]));
      }
    }

    rootNodes.forEach((r) => searchTree(r, []));
    return { matchedIdSet: matched, ancestorIdSet: ancestors };
  }, [rootNodes, searchQuery]);

  // Auto-expand ancestors of matching items when searching
  useEffect(() => {
    if (ancestorIdSet.size > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        ancestorIdSet.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [ancestorIdSet]);

  const handleToggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    const all = collectAllNodeIds(rootNodes);
    setExpandedIds(all);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleOpenAssign = (prefilledManager = null) => {
    setFormData({
      ...initialForm,
      managerId: prefilledManager ? String(prefilledManager._id) : "",
    });
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

  const selectedEmployeeObj = employees.find((e) => String(e._id) === String(formData.employeeId));
  const selectedManagerObj = employees.find((e) => String(e._id) === String(formData.managerId));

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div className="d-flex align-items-center gap-3">
          <div className="branch-card-icon-badge branch-card-icon-gold">
            <FaProjectDiagram />
          </div>
          <div>
            <h3 className="org-section-title mb-0">Reporting Hierarchy & Line Management</h3>
            <p className="org-section-sub mb-0 mt-0.5">
              Visualize the executive organizational tree, approval line chains, and reporting manager relationships.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Segmented View Toggle */}
          <div className="org-view-toggle">
            <button
              type="button"
              className={`org-view-toggle-btn ${viewMode === "tree" ? "active" : ""}`}
              onClick={() => setViewMode("tree")}
            >
              <FaProjectDiagram size={11} /> Hierarchy Tree
            </button>
            <button
              type="button"
              className={`org-view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <FaList size={11} /> Line Assignments
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              className="branches-btn-add btn-sm"
              onClick={() => handleOpenAssign(null)}
            >
              <FaPlus size={11} className="me-1" /> Assign Manager
            </button>
          )}
        </div>
      </div>

      <FeedbackAlert variant="danger" dismissible onClose={() => setError("")} message={error} />
      <FeedbackAlert variant="success" dismissible onClose={() => setSuccess("")} message={success} />

      {/* ── KPI Summary Cards ── */}
      <div className="rep-kpi-grid">
        <div className="rep-kpi-card">
          <div>
            <div className="rep-kpi-value">{totalMembers}</div>
            <div className="rep-kpi-label">Tree Personnel</div>
          </div>
          <div className="rep-kpi-icon-badge rep-kpi-icon-gold">
            <FaUsers />
          </div>
        </div>

        <div className="rep-kpi-card">
          <div>
            <div className="rep-kpi-value">{rootLeaders}</div>
            <div className="rep-kpi-label">Executive Roots</div>
          </div>
          <div className="rep-kpi-icon-badge rep-kpi-icon-charcoal">
            <FaCrown />
          </div>
        </div>

        <div className="rep-kpi-card">
          <div>
            <div className="rep-kpi-value">{lineManagers}</div>
            <div className="rep-kpi-label">Line Managers</div>
          </div>
          <div className="rep-kpi-icon-badge rep-kpi-icon-emerald">
            <FaUserTie />
          </div>
        </div>

        <div className="rep-kpi-card">
          <div>
            <div className="rep-kpi-value">{avgTeamSize}</div>
            <div className="rep-kpi-label">Avg Span of Control</div>
          </div>
          <div className="rep-kpi-icon-badge rep-kpi-icon-blue">
            <FaLayerGroup />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="org-loader-container py-5 text-center">
          <Spinner animation="border" style={{ color: "#C49A55" }} />
          <p className="mt-3 text-muted fw-semibold">Rendering organizational reporting tree...</p>
        </div>
      ) : viewMode === "tree" ? (
        /* ── Structured Hierarchy Tree Mode ── */
        <div>
          {/* Interactive Toolbar */}
          <div className="rep-toolbar">
            <div className="rep-search-box">
              <FaSearch className="rep-search-icon" />
              <input
                type="text"
                className="rep-search-input"
                placeholder="Search by name, employee code, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="rep-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {searchQuery && (
                <span className="badge bg-light text-dark border px-2.5 py-1.5" style={{ fontSize: "11px" }}>
                  <FaCheckCircle className="text-success me-1" />
                  Found <strong>{matchedIdSet.size}</strong> in hierarchy
                </span>
              )}

              <button
                type="button"
                className="rep-btn-ghost"
                onClick={handleExpandAll}
                title="Expand all tree branches"
              >
                <FaExpandArrowsAlt size={11} /> Expand All
              </button>

              <button
                type="button"
                className="rep-btn-ghost"
                onClick={handleCollapseAll}
                title="Collapse all branches to root leaders"
              >
                <FaCompressArrowsAlt size={11} /> Collapse All
              </button>
            </div>
          </div>

          {/* Visual Canvas */}
          <div className="rep-tree-canvas">
            {rootNodes.length === 0 ? (
              <EmptyState
                icon={FaProjectDiagram}
                title="No Reporting Hierarchy Configured"
                description="Assign reporting managers to employees to build your interactive organizational hierarchy tree."
                actionLabel="Assign First Manager"
                onAction={canManage ? () => handleOpenAssign(null) : undefined}
                actionVariant="success"
                actionClassName="branches-btn-add mt-2"
                bodyClassName="py-5"
              />
            ) : (
              <div className="rep-tree-flow-container">
                {rootNodes.map((rootNode, idx) => (
                  <div key={rootNode._id || rootNode.employeeCode || idx} className="rep-tree-flow-root">
                    <div className="rep-level-header">
                      <span className="rep-level-badge exec">
                        <FaCrown size={10} /> Executive Root #{idx + 1}
                      </span>
                      <span className="small text-muted">
                        {rootNode.children?.length > 0 ? (
                          <>Head of <strong>{rootNode.children.length}</strong> Direct Reporting Branch{rootNode.children.length > 1 ? "es" : ""}</>
                        ) : (
                          "Independent Executive Lead"
                        )}
                      </span>
                    </div>

                    <HierarchyTreeNode
                      node={rootNode}
                      level={0}
                      searchQuery={searchQuery}
                      expandedIds={expandedIds}
                      onToggleExpand={handleToggleExpand}
                      onAddDirectReport={canManage ? handleOpenAssign : null}
                      matchedIdSet={matchedIdSet}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Assignment Table Mode ── */
        <Card className="org-table-card border-0 shadow-sm" style={{ borderRadius: "14px", overflow: "hidden" }}>
          <DataTable
            responsive
            hover
            className="org-table mb-0 align-middle"
            rows={hierarchies}
            emptyComponent={
              <EmptyState
                variant="table"
                colSpan={7}
                className="text-center py-5 text-muted"
                title="No active reporting relationships recorded."
              />
            }
            columns={[
              {
                key: "employee",
                header: "Employee",
                render: (h) => (
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="branch-member-avatar"
                      style={{ width: 34, height: 34, fontSize: 12, borderRadius: 10 }}
                    >
                      {h.employeeId?.firstName?.[0] || "E"}
                      {h.employeeId?.lastName?.[0] || ""}
                    </div>
                    <div className="min-w-0">
                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
                        {h.employeeId?.firstName} {h.employeeId?.lastName}
                      </div>
                      <span className="branch-code-badge font-monospace" style={{ fontSize: "10px", padding: "1px 6px" }}>
                        {h.employeeId?.employeeCode || "—"}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "manager",
                header: "Reporting Manager",
                render: (h) => (
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="branch-member-avatar"
                      style={{
                        width: 34,
                        height: 34,
                        fontSize: 12,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #C49A55 0%, #926D2E 100%)",
                        color: "#FFFFFF",
                      }}
                    >
                      {h.managerId?.firstName?.[0] || "M"}
                      {h.managerId?.lastName?.[0] || ""}
                    </div>
                    <div className="min-w-0">
                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
                        {h.managerId?.firstName} {h.managerId?.lastName}
                      </div>
                      <span className="branch-code-badge font-monospace" style={{ fontSize: "10px", padding: "1px 6px" }}>
                        {h.managerId?.employeeCode || "—"}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "type",
                header: "Line Relationship",
                render: (h) => (
                  <span className="badge bg-light text-dark border px-2.5 py-1 fw-semibold" style={{ fontSize: "11px" }}>
                    {h.reportingType ? h.reportingType.replace(/_/g, " ") : "PRIMARY"}
                  </span>
                ),
              },
              {
                key: "primary",
                header: "Approval Line",
                render: (h) =>
                  h.isPrimary ? (
                    <span
                      className="badge px-2.5 py-1 fw-semibold"
                      style={{
                        background: "#ECFDF5",
                        color: "#059669",
                        border: "1px solid rgba(5,150,105,0.25)",
                        fontSize: "11px",
                      }}
                    >
                      <FaCheckCircle size={9} className="me-1" /> Primary Line
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border px-2 py-1 fw-normal" style={{ fontSize: "11px" }}>
                      Secondary
                    </span>
                  ),
              },
              {
                key: "effective",
                header: "Effective Date",
                render: (h) => (
                  <span className="text-secondary font-monospace" style={{ fontSize: "12px" }}>
                    {h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleDateString() : "Immediate"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (h) => (
                  <span
                    className="badge px-2.5 py-1 fw-semibold"
                    style={{
                      background: h.status === "ACTIVE" ? "#ECFDF5" : "#F1F5F9",
                      color: h.status === "ACTIVE" ? "#059669" : "#64748B",
                      fontSize: "11px",
                    }}
                  >
                    {h.status || "ACTIVE"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                headerClassName: "text-end",
                cellClassName: "text-end",
                render: (h) => (
                  <>
                    {canManage && (
                      <button
                        type="button"
                        className="org-icon-btn org-icon-btn-danger"
                        title="Remove Reporting Relationship"
                        onClick={() => {
                          setDeletingId(h._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* ── Luxury Assign Reporting Manager Modal ── */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        dialogClassName="rep-luxury-modal"
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <div className="d-flex align-items-center gap-3">
              <div
                className="branch-card-icon-badge branch-card-icon-gold"
                style={{ width: 40, height: 40, fontSize: 16 }}
              >
                <FaLink />
              </div>
              <div>
                <Modal.Title className="modal-title mb-0">Assign Reporting Manager</Modal.Title>
                <div className="modal-subtitle">
                  Configure direct line hierarchy, approval chains, and functional reporting relationships.
                </div>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="modal-body">
            <FeedbackAlert variant="danger" message={modalError} />

            {/* Relationship Mapping Preview Box */}
            <div className="rep-modal-preview-box">
              <div className="d-flex align-items-center justify-content-between">
                <span className="fw-bold text-dark small">
                  <FaProjectDiagram className="me-1.5 text-muted" /> Relationship Mapping Preview
                </span>
                <span
                  className="badge px-2.5 py-1"
                  style={{
                    background: "#FDF8EE",
                    color: "#926D2E",
                    border: "1px solid rgba(196, 154, 85, 0.35)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {formData.reportingType.replace(/_/g, " ")}
                </span>
              </div>

              <div className="rep-preview-flow">
                <div className="rep-preview-card">
                  <div className="branch-member-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                    {selectedEmployeeObj?.firstName?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
                      {selectedEmployeeObj
                        ? `${selectedEmployeeObj.firstName} ${selectedEmployeeObj.lastName}`
                        : "Select Target Employee"}
                    </div>
                    <div className="text-muted font-monospace small" style={{ fontSize: "10.5px" }}>
                      {selectedEmployeeObj?.employeeCode || "—"}
                    </div>
                  </div>
                </div>

                <div className="rep-preview-connector">
                  <span>reports to</span>
                  <FaArrowRight className="rep-preview-arrow" />
                </div>

                <div className="rep-preview-card">
                  <div
                    className="branch-member-avatar"
                    style={{
                      width: 34,
                      height: 34,
                      fontSize: 12,
                      background: "linear-gradient(135deg, #C49A55 0%, #926D2E 100%)",
                      color: "#FFFFFF",
                    }}
                  >
                    {selectedManagerObj?.firstName?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: "13px" }}>
                      {selectedManagerObj
                        ? `${selectedManagerObj.firstName} ${selectedManagerObj.lastName}`
                        : "Select Reporting Manager"}
                    </div>
                    <div className="text-muted font-monospace small" style={{ fontSize: "10.5px" }}>
                      {selectedManagerObj?.employeeCode || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Row className="g-3">
              <Col md={6}>
                <div>
                  <label className="rep-modal-label">
                    Target Employee <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    className="rep-modal-select"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </Col>

              <Col md={6}>
                <div>
                  <label className="rep-modal-label">
                    Reporting Manager <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    className="rep-modal-select"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">-- Choose Manager --</option>
                    {employees
                      .filter((emp) => emp._id !== formData.employeeId)
                      .map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </option>
                      ))}
                  </select>
                </div>
              </Col>

              <Col md={6}>
                <div>
                  <label className="rep-modal-label">Line Relationship Type</label>
                  <select
                    className="rep-modal-select"
                    value={formData.reportingType}
                    onChange={(e) => setFormData({ ...formData, reportingType: e.target.value })}
                  >
                    <option value="PRIMARY_MANAGER">Primary Direct Line Manager</option>
                    <option value="FUNCTIONAL_MANAGER">Functional / Department Lead</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="DOTTED_LINE_MANAGER">Dotted-Line Secondary Manager</option>
                    <option value="HR_MANAGER">Assigned HR Business Partner</option>
                  </select>
                </div>
              </Col>

              <Col md={6}>
                <div>
                  <label className="rep-modal-label">Effective Date</label>
                  <input
                    type="date"
                    className="rep-modal-input"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  />
                </div>
              </Col>

              <Col md={12}>
                <label className="rep-modal-checkbox-card">
                  <input
                    type="checkbox"
                    className="rep-modal-checkbox-input"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  />
                  <div>
                    <div className="fw-bold text-dark small">
                      Designate as Primary Line Manager
                    </div>
                    <div className="text-muted extra-small" style={{ fontSize: "11px" }}>
                      Designates approval authority for leave, attendance regularization, and performance reviews.
                    </div>
                  </div>
                </label>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className="modal-footer">
            <button
              type="button"
              className="rep-modal-btn-cancel"
              onClick={() => setShowModal(false)}
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rep-modal-btn-save"
              disabled={modalLoading}
            >
              {modalLoading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Saving...
                </>
              ) : (
                <>
                  <FaCheckCircle size={13} /> Save Line Assignment
                </>
              )}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={
          <div className="d-flex align-items-center gap-2 text-danger">
            <FaTrash /> Remove Reporting Relationship
          </div>
        }
        message="Are you sure you want to remove this reporting relationship? The direct report will become unassigned until a new manager is assigned."
        onConfirm={handleDelete}
        confirmLabel="Yes, Remove Relationship"
        loading={modalLoading}
      />
    </div>
  );
}

export default ReportingHierarchySection;
