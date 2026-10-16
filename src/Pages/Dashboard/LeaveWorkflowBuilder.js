import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import {
  FaCodeBranch,
  FaBuilding,
  FaPlus,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaUndo,
  FaShieldAlt,
  FaSave,
  FaInfoCircle,
  FaLayerGroup,
  FaEye,
  FaSitemap
} from "react-icons/fa";
import LoadingSpinner from "../../Components/Common/LoadingSpinner";
import FeedbackAlert from "../../Components/Common/FeedbackAlert";
import ConfirmModal from "../../Components/Common/ConfirmModal";
import LeaveViewCustomizer from "./LeaveViewCustomizer";
import {
  getWorkflows,
  configureWorkflow,
  deleteWorkflow
} from "../../services/approvalWorkflowService";
import { fetchAllRoles, fetchAssignableRoles } from "../../services/rbacService";
import { fetchAccessibleBranches } from "../../services/accessService";

const DEFAULT_LEVELS = [
  { level: 1, name: "Team Lead Approval", requiredRole: "", minimumPriority: 4, approvalType: "ANY", requiredApprovals: 1 },
  { level: 2, name: "HR Approval", requiredRole: "", minimumPriority: 3, approvalType: "ANY", requiredApprovals: 1 },
  { level: 3, name: "Admin Final Approval", requiredRole: "", minimumPriority: 2, approvalType: "ANY", requiredApprovals: 1 },
];

function LeaveWorkflowBuilder({ currentUser, isOwner }) {
  const userRole = (currentUser?.roleCode || currentUser?.role?.roleCode || "").toUpperCase();
  const userPriority = currentUser?.priority ?? (isOwner ? 1 : 99);
  const isAdmin = isOwner || userPriority === 2 || userRole === "ADMIN";

  // Branch & Scope States
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [selectedScope, setSelectedScope] = useState(isAdmin ? "default" : "");
  const [workflows, setWorkflows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeSection, setActiveSection] = useState("workflows"); // "workflows" | "views"

  // Revert / Delete Confirmation Modal
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [reverting, setReverting] = useState(false);

  // Workflow Form State
  const [workflowForm, setWorkflowForm] = useState({
    title: "Standard Leave Approval Flow",
    description: "",
    allowSelfApproval: false,
    isActive: true,
    approvalLevels: DEFAULT_LEVELS,
  });

  // User's assigned branch IDs for authority scoping
  const userAssignedBranchIds = useMemo(() => [
    ...(currentUser?.branchId ? [currentUser.branchId.toString()] : []),
    ...(Array.isArray(currentUser?.assignedBranchIds)
      ? currentUser.assignedBranchIds.map((b) => (b?._id ? b._id.toString() : b.toString()))
      : []),
  ], [currentUser?.branchId, currentUser?.assignedBranchIds]);

  // Load initial branches and roles
  useEffect(() => {
    let isMounted = true;

    async function initializeMetadata() {
      try {
        const [branchList, roleList] = await Promise.all([
          fetchAccessibleBranches().catch(() => []),
          fetchAllRoles().catch(async () => {
            try {
              return await fetchAssignableRoles();
            } catch {
              return [];
            }
          }),
        ]);

        if (!isMounted) return;

        const rawBranches = Array.isArray(branchList) ? branchList : branchList?.data || [];
        // Scope branches based on user authorization
        let scopedBranches = rawBranches;
        if (!isOwner && !isAdmin) {
          scopedBranches = rawBranches.filter((b) =>
            userAssignedBranchIds.includes(String(b._id || b.id))
          );
        }
        setAccessibleBranches(scopedBranches);

        const rawRoles = Array.isArray(roleList) ? roleList : roleList?.data || [];
        setRoles(rawRoles);

        // Set default selected scope
        if (!isAdmin && scopedBranches.length > 0) {
          const defaultBranchId = currentUser?.branchId
            ? String(currentUser.branchId)
            : String(scopedBranches[0]._id || scopedBranches[0].id);
          setSelectedScope(defaultBranchId);
        } else if (isAdmin) {
          setSelectedScope("default");
        }
      } catch (err) {
        if (isMounted) {
          setAlert({ type: "danger", message: "Failed to initialize workflow options." });
        }
      }
    }

    initializeMetadata();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, isOwner, userAssignedBranchIds, currentUser?.branchId]);

  // Resolve level role value to matching role ID in current roles catalog
  const resolveLevelRoleId = useCallback((roleVal, lvl, roleList) => {
    if (!roleList || roleList.length === 0) return "";

    // 1. Direct ID match
    if (roleVal) {
      const byId = roleList.find((r) => String(r._id || r.id) === String(roleVal));
      if (byId) return String(byId._id || byId.id);

      // Direct code match (e.g. "TEAM_LEAD", "HR", "ADMIN")
      const byCode = roleList.find(
        (r) => (r.roleCode || "").toUpperCase() === String(roleVal).toUpperCase()
      );
      if (byCode) return String(byCode._id || byCode.id);
    }

    // 2. Intelligent resolution based on level name heuristics
    const lvlName = (lvl?.name || "").toLowerCase();
    if (lvlName.includes("lead")) {
      const leadRole = roleList.find(
        (r) =>
          (r.roleCode || "").toUpperCase() === "TEAM_LEAD" ||
          r.priority === 4 ||
          /lead/i.test(r.roleName)
      );
      if (leadRole) return String(leadRole._id || leadRole.id);
    }
    if (lvlName.includes("hr")) {
      const hrRole = roleList.find(
        (r) =>
          (r.roleCode || "").toUpperCase() === "HR" ||
          r.priority === 3 ||
          /hr/i.test(r.roleName)
      );
      if (hrRole) return String(hrRole._id || hrRole.id);
    }
    if (lvlName.includes("admin")) {
      const adminRole = roleList.find(
        (r) =>
          (r.roleCode || "").toUpperCase() === "ADMIN" ||
          r.priority === 2 ||
          /admin/i.test(r.roleName)
      );
      if (adminRole) return String(adminRole._id || adminRole.id);
    }

    // 3. Match by minimumPriority
    if (lvl?.minimumPriority) {
      const byPri = roleList.find((r) => r.priority === Number(lvl.minimumPriority));
      if (byPri) return String(byPri._id || byPri.id);
    }

    return "";
  }, []);

  // Fetch all LEAVE workflows
  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWorkflows({ module: "LEAVE" });
      const wfList = Array.isArray(res) ? res : res.data || [];
      setWorkflows(wfList);
    } catch (err) {
      setAlert({ type: "danger", message: err.message || "Failed to load approval workflows." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Identify current scope workflow & inheritance status
  const orgDefaultWorkflow = workflows.find((w) => !w.branchId);
  const currentBranchOverride =
    selectedScope !== "default" && selectedScope
      ? workflows.find((w) => {
          const bId = w.branchId?._id ? String(w.branchId._id) : String(w.branchId);
          return bId === String(selectedScope);
        })
      : null;

  const isScopeBranch = selectedScope !== "default" && Boolean(selectedScope);
  const hasBranchOverride = Boolean(currentBranchOverride);
  const activeWorkflowDoc = isScopeBranch
    ? currentBranchOverride || orgDefaultWorkflow
    : orgDefaultWorkflow;

  // Sync workflowForm whenever selectedScope or activeWorkflowDoc changes
  useEffect(() => {
    if (activeWorkflowDoc) {
      const levels = (activeWorkflowDoc.approvalLevels || []).map((lvl, idx) => {
        const rawRole = lvl.requiredRole?._id
          ? String(lvl.requiredRole._id)
          : lvl.requiredRole
          ? (lvl.requiredRole.roleCode || String(lvl.requiredRole))
          : lvl.roleId || "";

        const resolvedRoleId = resolveLevelRoleId(rawRole, lvl, roles);

        return {
          level: lvl.level || idx + 1,
          name: lvl.name || `Level ${idx + 1}`,
          requiredRole: resolvedRoleId,
          minimumPriority: lvl.minimumPriority ?? 3,
          approvalType: lvl.approvalType === "ALL" ? "ALL" : "ANY",
          requiredApprovals: Number(lvl.requiredApprovals) || 1,
        };
      });

      setWorkflowForm({
        title: isScopeBranch && !hasBranchOverride
          ? `${accessibleBranches.find(b => String(b._id || b.id) === String(selectedScope))?.branchName || "Branch"} Leave Approval Flow`
          : activeWorkflowDoc.title || "Standard Leave Approval Flow",
        description: activeWorkflowDoc.description || "",
        allowSelfApproval: Boolean(activeWorkflowDoc.allowSelfApproval),
        isActive: activeWorkflowDoc.isActive !== undefined ? Boolean(activeWorkflowDoc.isActive) : true,
        approvalLevels: levels.length > 0 ? levels : DEFAULT_LEVELS,
      });
    } else {
      const defaultLevelsWithRoles = DEFAULT_LEVELS.map((lvl) => ({
        ...lvl,
        requiredRole: resolveLevelRoleId("", lvl, roles),
      }));

      setWorkflowForm({
        title: isScopeBranch
          ? `${accessibleBranches.find(b => String(b._id || b.id) === String(selectedScope))?.branchName || "Branch"} Leave Approval Flow`
          : "Standard Leave Approval Flow",
        description: "",
        allowSelfApproval: false,
        isActive: true,
        approvalLevels: defaultLevelsWithRoles,
      });
    }
  }, [selectedScope, activeWorkflowDoc, hasBranchOverride, isScopeBranch, accessibleBranches, roles, resolveLevelRoleId]);

  // Auto-bind approval stage roles once roles list becomes available
  useEffect(() => {
    if (!roles || roles.length === 0) return;
    setWorkflowForm((prev) => {
      let changed = false;
      const updatedLevels = (prev.approvalLevels || []).map((lvl) => {
        if (!lvl.requiredRole) {
          const resolved = resolveLevelRoleId("", lvl, roles);
          if (resolved) {
            changed = true;
            const matchedRole = roles.find((r) => String(r._id || r.id) === String(resolved));
            return {
              ...lvl,
              requiredRole: resolved,
              minimumPriority: matchedRole?.priority ? Math.max(lvl.minimumPriority || 1, matchedRole.priority) : lvl.minimumPriority,
            };
          }
        }
        return lvl;
      });
      return changed ? { ...prev, approvalLevels: updatedLevels } : prev;
    });
  }, [roles, resolveLevelRoleId]);

  // Form Field Change Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWorkflowForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Approval Level Manipulation Handlers
  const handleLevelChange = (index, field, value) => {
    setWorkflowForm((prev) => {
      const updated = [...(prev.approvalLevels || [])];
      const target = { ...updated[index], [field]: value };

      // If required role changed, automatically synchronize default minimum priority
      if (field === "requiredRole") {
        const matched = roles.find((r) => String(r._id || r.id) === String(value));
        if (matched && matched.priority !== undefined) {
          if (!target.minimumPriority || target.minimumPriority < matched.priority) {
            target.minimumPriority = matched.priority;
          }
        }
      }

      updated[index] = target;
      return { ...prev, approvalLevels: updated };
    });
  };

  const handleAddLevel = () => {
    setWorkflowForm((prev) => {
      const nextLvlNum = (prev.approvalLevels?.length || 0) + 1;
      const defaultRole = roles.find(
        (r) =>
          (r.roleCode || "").toUpperCase() !== "EMPLOYEE" &&
          (r.priority === 3 || (r.roleCode || "").toUpperCase() === "HR")
      ) || roles.find((r) => (r.roleCode || "").toUpperCase() !== "EMPLOYEE" && (r.priority ?? 5) <= 4);

      const newLvl = {
        level: nextLvlNum,
        name: `Stage ${nextLvlNum} Review`,
        requiredRole: defaultRole ? String(defaultRole._id || defaultRole.id) : "",
        minimumPriority: defaultRole?.priority ?? 3,
        approvalType: "ANY",
        requiredApprovals: 1,
      };
      return {
        ...prev,
        approvalLevels: [...(prev.approvalLevels || []), newLvl],
      };
    });
  };

  const handleRemoveLevel = (index) => {
    if (workflowForm.approvalLevels.length <= 1) {
      setAlert({ type: "warning", message: "At least one approval level is required in the workflow." });
      return;
    }
    setWorkflowForm((prev) => {
      const filtered = prev.approvalLevels
        .filter((_, idx) => idx !== index)
        .map((lvl, idx) => ({
          ...lvl,
          level: idx + 1,
        }));
      return { ...prev, approvalLevels: filtered };
    });
  };

  const handleMoveLevelUp = (index) => {
    if (index === 0) return;
    setWorkflowForm((prev) => {
      const list = [...prev.approvalLevels];
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
      const renumbered = list.map((lvl, idx) => ({ ...lvl, level: idx + 1 }));
      return { ...prev, approvalLevels: renumbered };
    });
  };

  const handleMoveLevelDown = (index) => {
    if (index >= workflowForm.approvalLevels.length - 1) return;
    setWorkflowForm((prev) => {
      const list = [...prev.approvalLevels];
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
      const renumbered = list.map((lvl, idx) => ({ ...lvl, level: idx + 1 }));
      return { ...prev, approvalLevels: renumbered };
    });
  };

  // Save Workflow Configuration
  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    setAlert(null);

    // Validation
    if (!workflowForm.title || !workflowForm.title.trim()) {
      setAlert({ type: "warning", message: "Workflow title is required." });
      return;
    }

    if (!workflowForm.approvalLevels || workflowForm.approvalLevels.length === 0) {
      setAlert({ type: "warning", message: "At least one approval level is required." });
      return;
    }

    // Role selection & priority validation
    for (let i = 0; i < workflowForm.approvalLevels.length; i++) {
      const lvl = workflowForm.approvalLevels[i];
      const stageNum = i + 1;

      if (!lvl.name || !lvl.name.trim()) {
        setAlert({
          type: "warning",
          message: `Stage name is required for Stage ${stageNum}.`,
        });
        return;
      }

      if (!lvl.requiredRole) {
        setAlert({
          type: "warning",
          message: `Please select a required approver role for Stage ${stageNum} ("${lvl.name.trim()}").`,
        });
        return;
      }

      // Check inappropriate approver configuration (e.g. Employee role cannot be an approval authority)
      const matchedRole = roles.find((r) => String(r._id || r.id) === String(lvl.requiredRole));
      if (matchedRole) {
        const rName = String(matchedRole.roleName || matchedRole.roleCode || "").toUpperCase();
        if (rName === "EMPLOYEE" || matchedRole.priority > 4) {
          setAlert({
            type: "warning",
            message: `Role "${matchedRole.roleName}" cannot be an approval authority for Stage ${stageNum}. Approvers must have managerial or administrative authority (e.g., Team Lead, HR, Admin).`,
          });
          return;
        }
      }

      const minPri = Number(lvl.minimumPriority);
      if (isNaN(minPri) || minPri < 1 || minPri > 10) {
        setAlert({
          type: "warning",
          message: `Valid minimum priority (between 1 and 10) is required for Stage ${stageNum}.`,
        });
        return;
      }

      if (lvl.approvalType === "ALL" && (!lvl.requiredApprovals || Number(lvl.requiredApprovals) < 1)) {
        setAlert({
          type: "warning",
          message: `Required approvals must be at least 1 for ALL mode at Stage ${stageNum}.`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const targetBranchId = selectedScope === "default" ? null : selectedScope;

      const sanitizedLevels = workflowForm.approvalLevels.map((lvl, idx) => ({
        level: idx + 1,
        name: lvl.name.trim() || `Level ${idx + 1}`,
        requiredRole: lvl.requiredRole,
        minimumPriority: Number(lvl.minimumPriority),
        approvalType: lvl.approvalType === "ALL" ? "ALL" : "ANY",
        requiredApprovals: Number(lvl.requiredApprovals) || 1,
      }));

      const payload = {
        module: "LEAVE",
        branchId: targetBranchId,
        title: workflowForm.title.trim(),
        description: workflowForm.description.trim(),
        allowSelfApproval: Boolean(workflowForm.allowSelfApproval),
        isActive: Boolean(workflowForm.isActive),
        approvalLevels: sanitizedLevels,
      };

      await configureWorkflow(payload);

      setAlert({
        type: "success",
        message: targetBranchId
          ? "Branch-specific leave approval workflow saved successfully."
          : "Organization-default leave approval workflow saved successfully.",
      });

      await loadWorkflows();
    } catch (err) {
      setAlert({
        type: "danger",
        message: err.message || "Failed to save approval workflow configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Revert / Remove Branch Override
  const handleConfirmRevert = async () => {
    if (!currentBranchOverride?._id) return;
    setReverting(true);
    setAlert(null);
    try {
      await deleteWorkflow(currentBranchOverride._id);
      setShowRevertModal(false);
      setAlert({
        type: "success",
        message: "Branch override removed. This branch now inherits the organization-default workflow.",
      });
      await loadWorkflows();
    } catch (err) {
      setAlert({
        type: "danger",
        message: err.message || "Failed to remove branch workflow override.",
      });
    } finally {
      setReverting(false);
    }
  };

  const selectedBranchName =
    selectedScope === "default"
      ? "Organization Default"
      : accessibleBranches.find((b) => String(b._id || b.id) === String(selectedScope))?.branchName || "Selected Branch";

  const canEditOrgDefault = isOwner || isAdmin;
  const isEditingAllowed = selectedScope === "default" ? canEditOrgDefault : true;

  return (
    <div className="leave-workflow-container">
      {/* Sub-section Switcher */}
      <div className="d-flex align-items-center justify-content-between mb-3 p-2 bg-light rounded-pill border shadow-xs">
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold ${
              activeSection === "workflows" ? "btn-dark text-gold shadow-xs" : "btn-light text-muted border-0"
            }`}
            onClick={() => setActiveSection("workflows")}
          >
            <FaSitemap className="me-2" /> Approval Stages & Hierarchy
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold ${
              activeSection === "views" ? "btn-dark text-gold shadow-xs" : "btn-light text-muted border-0"
            }`}
            onClick={() => setActiveSection("views")}
          >
            <FaEye className="me-2" /> Role View & Actions Customizer
          </button>
        </div>
      </div>

      {activeSection === "views" ? (
        <LeaveViewCustomizer currentUser={currentUser} isOwner={isOwner} />
      ) : (
        <>
          {/* Alert Notification */}
          {alert && (
            <FeedbackAlert
              variant={alert.type}
              message={alert.message}
              dismissible
              onClose={() => setAlert(null)}
              className="mb-3"
            />
          )}

          {/* Scope / Branch Selection Bar */}
          <div className="leave-workflow-scope-bar">
        <Row className="align-items-center g-3">
          <Col md={6}>
            <div className="d-flex align-items-center gap-2">
              <FaBuilding className="text-secondary" size={18} />
              <div>
                <span className="small text-muted text-uppercase fw-bold d-block" style={{ fontSize: "0.68rem" }}>
                  Workflow Target Scope
                </span>
                <Form.Select
                  size="sm"
                  className="leave-workflow-scope-select shadow-none"
                  value={selectedScope}
                  onChange={(e) => {
                    setSelectedScope(e.target.value);
                    setAlert(null);
                  }}
                  disabled={loading || saving}
                >
                  {canEditOrgDefault && (
                    <option value="default">
                      🏢 Organization Default (Org-wide Baseline)
                    </option>
                  )}
                  {accessibleBranches.map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      🌿 Branch: {b.branchName} ({b.branchCode || "Standard"})
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </Col>

          <Col md={6} className="d-flex justify-content-md-end align-items-center gap-2">
            {selectedScope === "default" ? (
              <span className="leave-workflow-override-badge default">
                <FaShieldAlt /> Organization-Wide Baseline
              </span>
            ) : hasBranchOverride ? (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="leave-workflow-override-badge">
                  <FaCheckCircle /> Custom Branch Override Active
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="p-1 px-2 extra-small rounded-pill"
                  onClick={() => setShowRevertModal(true)}
                  disabled={saving || loading}
                >
                  <FaUndo className="me-1" /> Revert to Org Default
                </Button>
              </div>
            ) : (
              <span className="badge bg-light text-secondary border p-2">
                <FaCodeBranch className="me-1 text-primary" /> Inheriting Organization Default Flow
              </span>
            )}
          </Col>
        </Row>
      </div>

      {/* Inheritance Notice Banner for Branches inheriting Default */}
      {isScopeBranch && !hasBranchOverride && (
        <div className="p-3 mb-3 bg-light border rounded-3 small d-flex align-items-start gap-2">
          <FaInfoCircle className="text-primary mt-1 flex-shrink-0" size={16} />
          <div>
            <strong>Inheriting Organization Baseline:</strong> This branch currently inherits the organization's default approval flow.
            Customizing and clicking <em>Save Workflow Configuration</em> below will create an isolated, branch-specific override. Existing in-progress leave requests will preserve their active snapshot history.
          </div>
        </div>
      )}

      {/* Main Workflow Builder Form */}
      <Card className="leave-workflow-card">
        <Card.Body className="p-3">
          <Form onSubmit={handleSaveWorkflow}>
            {/* Header Settings */}
            <Row className="g-3 mb-3 pb-3 border-bottom">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark mb-1">
                    Workflow Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    name="title"
                    value={workflowForm.title}
                    onChange={handleInputChange}
                    placeholder="e.g. London Branch Leave Workflow"
                    required
                    disabled={!isEditingAllowed || saving}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-dark mb-1">
                    Description / Scope Notes
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    name="description"
                    value={workflowForm.description}
                    onChange={handleInputChange}
                    placeholder="e.g. Strict 2-tier approval workflow for branch employees"
                    disabled={!isEditingAllowed || saving}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  id="allowSelfApproval"
                  name="allowSelfApproval"
                  label="Allow Self-Approval (if approver holds eligible role)"
                  checked={workflowForm.allowSelfApproval}
                  onChange={handleInputChange}
                  className="small fw-semibold text-dark"
                  disabled={!isEditingAllowed || saving}
                />
                <small className="text-muted extra-small d-block mt-1">
                  When unchecked, approvers cannot approve their own submitted leave requests.
                </small>
              </Col>

              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="isActive"
                  name="isActive"
                  label="Workflow Status: Active & Operational"
                  checked={workflowForm.isActive}
                  onChange={handleInputChange}
                  className="small fw-semibold text-success"
                  disabled={!isEditingAllowed || saving}
                />
                <small className="text-muted extra-small d-block mt-1">
                  Deactivated workflows will pause new leave applications until an active flow is restored.
                </small>
              </Col>
            </Row>

            {/* Approval Hierarchy Stages */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaLayerGroup className="text-primary" /> Approval Hierarchy & Sequence ({workflowForm.approvalLevels.length} Stages)
                </h6>
                <small className="text-muted extra-small">
                  Requests progress sequentially from Stage 1 to Stage {workflowForm.approvalLevels.length}.
                </small>
              </div>

              {loading ? (
                <div className="py-4 text-center">
                  <LoadingSpinner size="md" color="success" />
                </div>
              ) : (
                workflowForm.approvalLevels.map((lvl, index) => {
                  const isFirst = index === 0;
                  const isLast = index === workflowForm.approvalLevels.length - 1;

                  return (
                    <div key={lvl.level || index} className="leave-workflow-stage-card">
                      <Row className="g-2 align-items-center">
                        {/* Stage Number & Reorder */}
                        <Col xs="auto" className="d-flex align-items-center gap-1">
                          <span className="leave-workflow-stage-num">{lvl.level}</span>
                          <div className="d-flex flex-column gap-1">
                            <button
                              type="button"
                              className="leave-workflow-reorder-btn"
                              title="Move Level Up"
                              onClick={() => handleMoveLevelUp(index)}
                              disabled={isFirst || !isEditingAllowed || saving}
                            >
                              <FaArrowUp size={10} />
                            </button>
                            <button
                              type="button"
                              className="leave-workflow-reorder-btn"
                              title="Move Level Down"
                              onClick={() => handleMoveLevelDown(index)}
                              disabled={isLast || !isEditingAllowed || saving}
                            >
                              <FaArrowDown size={10} />
                            </button>
                          </div>
                        </Col>

                        {/* Stage Name */}
                        <Col md={3} sm={6}>
                          <Form.Group>
                            <Form.Label className="extra-small fw-bold text-muted mb-1 text-uppercase">
                              Stage Name
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              value={lvl.name}
                              onChange={(e) => handleLevelChange(index, "name", e.target.value)}
                              placeholder={`Level ${lvl.level} Name`}
                              required
                              disabled={!isEditingAllowed || saving}
                            />
                          </Form.Group>
                        </Col>

                        {/* Required Approver Role */}
                        <Col md={3} sm={6}>
                          <Form.Group>
                            <Form.Label className="extra-small fw-bold text-muted mb-1 text-uppercase">
                              Required Role <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              size="sm"
                              value={lvl.requiredRole || ""}
                              onChange={(e) => handleLevelChange(index, "requiredRole", e.target.value)}
                              required
                              disabled={!isEditingAllowed || saving}
                            >
                              <option value="">-- Select Approver Role --</option>
                              {roles
                                .filter((r) => {
                                  const isSelected = String(r._id || r.id) === String(lvl.requiredRole);
                                  const code = String(r.roleCode || r.roleName || "").toUpperCase();
                                  return isSelected || (code !== "EMPLOYEE" && (r.priority === undefined || r.priority <= 4));
                                })
                                .map((r) => (
                                  <option key={r._id || r.id} value={String(r._id || r.id)}>
                                    {r.roleName} (P≤{r.priority ?? 3})
                                  </option>
                                ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        {/* Minimum Priority */}
                        <Col md={2} sm={4}>
                          <Form.Group>
                            <Form.Label className="extra-small fw-bold text-muted mb-1 text-uppercase" title="Lower number = higher authority e.g. 1=Owner, 2=Admin, 3=HR, 4=Lead">
                              Min Priority (≤)
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="number"
                              min="1"
                              max="10"
                              value={lvl.minimumPriority}
                              onChange={(e) => handleLevelChange(index, "minimumPriority", e.target.value)}
                              required
                              disabled={!isEditingAllowed || saving}
                            />
                          </Form.Group>
                        </Col>

                        {/* Approval Type */}
                        <Col md={2} sm={4}>
                          <Form.Group>
                            <Form.Label className="extra-small fw-bold text-muted mb-1 text-uppercase">
                              Approval Mode
                            </Form.Label>
                            <Form.Select
                              size="sm"
                              value={lvl.approvalType}
                              onChange={(e) => handleLevelChange(index, "approvalType", e.target.value)}
                              disabled={!isEditingAllowed || saving}
                            >
                              <option value="ANY">ANY (Single Approver)</option>
                              <option value="ALL">ALL (Multiple Approvers)</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        {/* Delete Stage */}
                        <Col xs="auto" className="d-flex align-items-end">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="p-1 px-2 border-0"
                            title="Remove Stage"
                            onClick={() => handleRemoveLevel(index)}
                            disabled={workflowForm.approvalLevels.length <= 1 || !isEditingAllowed || saving}
                          >
                            <FaTrash size={13} />
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  );
                })
              )}

              {/* Add Level Button */}
              {isEditingAllowed && (
                <button
                  type="button"
                  className="leave-workflow-add-btn mt-2"
                  onClick={handleAddLevel}
                  disabled={saving}
                >
                  <FaPlus /> Add Approval Stage
                </button>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-3">
              <small className="text-muted extra-small">
                Target Scope: <strong>{selectedBranchName}</strong> | Auto-saves with snapshot preservation for in-flight requests.
              </small>

              {isEditingAllowed && (
                <button
                  type="submit"
                  className="leave-workflow-save-btn"
                  disabled={saving || loading}
                >
                  {saving ? (
                    <LoadingSpinner variant="button" size="sm" />
                  ) : (
                    <>
                      <FaSave /> Save Workflow Configuration
                    </>
                  )}
                </button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

        {/* Confirmation Modal to Revert Branch Override */}
        <ConfirmModal
          show={showRevertModal}
          title="Revert to Organization Default Workflow?"
          message={`Are you sure you want to remove the custom workflow override for "${selectedBranchName}"? This branch will immediately inherit the organization-wide baseline. Existing pending leave requests will safely preserve their captured approval snapshot.`}
          confirmText="Remove Override & Revert"
          confirmVariant="danger"
          isLoading={reverting}
          onConfirm={handleConfirmRevert}
          onCancel={() => setShowRevertModal(false)}
        />
      </>
      )}
    </div>
  );
}

export default LeaveWorkflowBuilder;
