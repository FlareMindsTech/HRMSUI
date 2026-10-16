import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import {
  FaBuilding,
  FaCodeBranch,
  FaUserShield,
  FaCheckCircle,
  FaUndo,
  FaSave,
  FaInfoCircle,
  FaCalendarAlt,
  FaUserCheck,
  FaUsers,
  FaSitemap,
  FaEye,
  FaCheckDouble
} from "react-icons/fa";
import LoadingSpinner from "../../Components/Common/LoadingSpinner";
import FeedbackAlert from "../../Components/Common/FeedbackAlert";
import ConfirmModal from "../../Components/Common/ConfirmModal";
import {
  fetchLeaveViewConfigApi,
  saveLeaveViewConfigApi,
  deleteLeaveViewConfigApi
} from "../../Api/leave/leave";
import { fetchAllRoles, fetchAssignableRoles } from "../../services/rbacService";
import { fetchAccessibleBranches } from "../../services/accessService";

const AVAILABLE_TABS = [
  { id: "my-leave", label: "My Leave Requests", icon: FaCalendarAlt, desc: "Personal balances, apply form, and personal history table" },
  { id: "approvals", label: "Pending Approvals", icon: FaUserCheck, desc: "Pending requests awaiting review and sign-off" },
  { id: "team", label: "Team Requests", icon: FaUsers, desc: "Direct and indirect reporting line team leaves" },
  { id: "all", label: "All Company Leaves", icon: FaUsers, desc: "Organization-wide or branch-wide leave records" },
  { id: "calendar", label: "Leave Schedule", icon: FaCalendarAlt, desc: "Consolidated team and company leave calendar" },
  { id: "workflow", label: "Workflow & Approvals", icon: FaSitemap, desc: "Branch and organization approval workflow builder" },
];

const AVAILABLE_ACTIONS = [
  { id: "apply_leave", label: "Apply for Leave", desc: "Submit new leave applications" },
  { id: "cancel_leave", label: "Cancel Leave", desc: "Cancel own applied or approved leave requests" },
  { id: "approve_leave", label: "Approve Requests", desc: "Grant approval at assigned stages" },
  { id: "reject_leave", label: "Reject Requests", desc: "Decline leave requests with mandatory reason" },
  { id: "view_audit", label: "View Audit Trail", desc: "Inspect detailed step-by-step approval history" },
  { id: "manage_workflow", label: "Configure Workflows", desc: "Create, reorder, and update approval workflows" },
];

const STANDARD_ROLES = [
  { code: "OWNER", name: "Organization Owner" },
  { code: "ADMIN", name: "System Administrator" },
  { code: "HR", name: "Human Resources (HR)" },
  { code: "BRANCH_HEAD", name: "Branch Head" },
  { code: "EMPLOYEE", name: "Employee" },
];

function LeaveViewCustomizer({ currentUser, isOwner, onConfigSaved }) {
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [selectedScope, setSelectedScope] = useState("default"); // "default" or branchId
  const [roles, setRoles] = useState([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState("EMPLOYEE");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [showRevertModal, setShowRevertModal] = useState(false);

  // Map of roleCode -> { visibleTabs, permittedActions, defaultTab }
  const [roleConfigsMap, setRoleConfigsMap] = useState({});
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  const userPriority = currentUser?.priority ?? 99;
  const userRole = (currentUser?.roleCode || currentUser?.role?.roleCode || "").toUpperCase();
  const isAdmin = isOwner || userPriority === 1 || userPriority === 2 || userRole === "ADMIN";

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
        let scopedBranches = rawBranches;
        if (!isOwner && !isAdmin) {
          scopedBranches = rawBranches.filter((b) =>
            userAssignedBranchIds.includes(String(b._id || b.id))
          );
        }
        setAccessibleBranches(scopedBranches);

        const rawRoles = Array.isArray(roleList) ? roleList : roleList?.data || [];
        setRoles(rawRoles);

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
          setAlert({ type: "danger", message: "Failed to initialize branches and roles." });
        }
      }
    }

    initializeMetadata();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, isOwner, userAssignedBranchIds, currentUser?.branchId]);

  // Fetch view config for selected scope
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setAlert({ type: "", message: "" });
    try {
      const branchIdParam = selectedScope === "default" ? null : selectedScope;
      const res = await fetchLeaveViewConfigApi({ branchId: branchIdParam });
      const data = res?.data || res || {};

      const activeConfigDoc = data.branchOverride || data.organizationDefault || null;
      setIsOverrideActive(Boolean(data.branchOverride));

      // Construct map from activeConfigDoc or fallback to systemDefaults
      const sourceList = activeConfigDoc?.roleConfigs?.length > 0
        ? activeConfigDoc.roleConfigs
        : (data.systemDefaults || []);

      const newMap = {};
      sourceList.forEach((rc) => {
        newMap[rc.roleCode.toUpperCase()] = {
          visibleTabs: rc.visibleTabs || ["my-leave"],
          permittedActions: rc.permittedActions || ["apply_leave", "cancel_leave"],
          defaultTab: rc.defaultTab || rc.visibleTabs?.[0] || "my-leave",
        };
      });

      // Ensure standard roles have at least baseline defaults in the map
      STANDARD_ROLES.forEach((sr) => {
        if (!newMap[sr.code]) {
          const defaultTabs = sr.code === "OWNER"
            ? ["approvals", "team", "all", "calendar", "workflow"]
            : sr.code === "EMPLOYEE"
            ? ["my-leave"]
            : ["my-leave", "approvals", "team", "all", "calendar", "workflow"];

          const defaultActions = sr.code === "OWNER"
            ? ["approve_leave", "reject_leave", "view_audit", "manage_workflow"]
            : sr.code === "EMPLOYEE"
            ? ["apply_leave", "cancel_leave"]
            : ["apply_leave", "cancel_leave", "approve_leave", "reject_leave", "view_audit", "manage_workflow"];

          newMap[sr.code] = {
            visibleTabs: defaultTabs,
            permittedActions: defaultActions,
            defaultTab: defaultTabs[0] || "my-leave",
          };
        }
      });

      setRoleConfigsMap(newMap);
    } catch (err) {
      setAlert({ type: "danger", message: err.message || "Failed to load leave view configuration." });
    } finally {
      setLoading(false);
    }
  }, [selectedScope]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Current selected role config
  const currentRoleConfig = useMemo(() => {
    return roleConfigsMap[selectedRoleCode] || {
      visibleTabs: ["my-leave"],
      permittedActions: ["apply_leave", "cancel_leave"],
      defaultTab: "my-leave",
    };
  }, [roleConfigsMap, selectedRoleCode]);

  // Toggle Tab
  const handleToggleTab = (tabId) => {
    if (selectedRoleCode === "EMPLOYEE" && tabId === "workflow") {
      setAlert({
        type: "warning",
        message: "Employee role cannot access Workflow & Approvals configuration.",
      });
      return;
    }

    setRoleConfigsMap((prev) => {
      const current = prev[selectedRoleCode] || { visibleTabs: [], permittedActions: [], defaultTab: null };
      const exists = current.visibleTabs.includes(tabId);
      const newTabs = exists
        ? current.visibleTabs.filter((t) => t !== tabId)
        : [...current.visibleTabs, tabId];

      let newDef = current.defaultTab;
      if (!newTabs.includes(newDef)) {
        newDef = newTabs[0] || null;
      }

      return {
        ...prev,
        [selectedRoleCode]: {
          ...current,
          visibleTabs: newTabs,
          defaultTab: newDef,
        },
      };
    });
  };

  // Toggle Action
  const handleToggleAction = (actionId) => {
    if (selectedRoleCode === "EMPLOYEE" && actionId === "manage_workflow") {
      setAlert({
        type: "warning",
        message: "Employee role cannot configure approval workflows.",
      });
      return;
    }

    setRoleConfigsMap((prev) => {
      const current = prev[selectedRoleCode] || { visibleTabs: [], permittedActions: [], defaultTab: null };
      const exists = current.permittedActions.includes(actionId);
      const newActions = exists
        ? current.permittedActions.filter((a) => a !== actionId)
        : [...current.permittedActions, actionId];

      return {
        ...prev,
        [selectedRoleCode]: {
          ...current,
          permittedActions: newActions,
        },
      };
    });
  };

  // Change Default Tab
  const handleChangeDefaultTab = (tabId) => {
    setRoleConfigsMap((prev) => ({
      ...prev,
      [selectedRoleCode]: {
        ...(prev[selectedRoleCode] || {}),
        defaultTab: tabId,
      },
    }));
  };

  // Save configuration
  const handleSave = async () => {
    setSaving(true);
    setAlert({ type: "", message: "" });
    try {
      const branchIdParam = (!selectedScope || selectedScope === "default" || selectedScope === "undefined" || selectedScope === "null")
        ? null
        : selectedScope;

      const roleConfigsPayload = Object.entries(roleConfigsMap).map(([code, cfg]) => {
        let visibleTabs = cfg.visibleTabs || [];
        let permittedActions = cfg.permittedActions || [];
        if (code === "EMPLOYEE") {
          visibleTabs = visibleTabs.filter((t) => t !== "workflow");
          permittedActions = permittedActions.filter((a) => a !== "manage_workflow");
        }
        return {
          roleCode: code,
          visibleTabs,
          permittedActions,
          defaultTab: cfg.defaultTab === "workflow" && code === "EMPLOYEE" ? (visibleTabs[0] || "my-leave") : cfg.defaultTab,
        };
      });

      await saveLeaveViewConfigApi({
        branchId: branchIdParam,
        roleConfigs: roleConfigsPayload,
      });

      setAlert({
        type: "success",
        message: selectedScope === "default"
          ? "Organization-default leave view configuration saved successfully."
          : "Branch-specific leave view override saved successfully.",
      });

      await loadConfig();
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      setAlert({ type: "danger", message: err.message || "Failed to save leave view configuration." });
    } finally {
      setSaving(false);
    }
  };

  // Revert Branch Override
  const handleConfirmRevert = async () => {
    if (!selectedScope || selectedScope === "default" || selectedScope === "undefined" || selectedScope === "null") return;
    setReverting(true);
    setAlert({ type: "", message: "" });
    try {
      await deleteLeaveViewConfigApi(selectedScope);
      setShowRevertModal(false);
      setAlert({
        type: "success",
        message: "Branch override removed. Branch now inherits Organization Default view configuration.",
      });
      await loadConfig();
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      setAlert({ type: "danger", message: err.message || "Failed to revert branch override." });
    } finally {
      setReverting(false);
    }
  };

  // Combined selectable roles list (Standard + Custom)
  const allSelectableRoles = useMemo(() => {
    const list = [...STANDARD_ROLES];
    (roles || []).forEach((r) => {
      const code = (r.roleCode || "").toUpperCase();
      if (code && !list.some((item) => item.code === code)) {
        list.push({ code, name: r.roleName || code });
      }
    });
    return list;
  }, [roles]);

  return (
    <div className="leave-view-customizer">
      {/* Scope Selector Bar */}
      <div className="leave-workflow-scope-bar mb-3 p-3 rounded-3 shadow-xs">
        <Row className="align-items-center g-3">
          <Col md={6} xs={12}>
            <div className="d-flex align-items-center gap-2">
              <FaBuilding className="text-gold fs-5" />
              <div>
                <label className="fw-semibold text-dark small mb-0 d-block">
                  Configuration Scope
                </label>
                <span className="extra-small text-muted">
                  Select whether to configure org-wide baseline or branch-specific views
                </span>
              </div>
            </div>
          </Col>
          <Col md={6} xs={12}>
            <div className="d-flex align-items-center gap-2 justify-content-md-end">
              <Form.Select
                value={selectedScope}
                onChange={(e) => setSelectedScope(e.target.value)}
                className="form-select-sm border-gold rounded-pill bg-white px-3 shadow-xs"
                style={{ maxWidth: "340px" }}
              >
                {isAdmin && (
                  <option value="default">🏢 Organization Default (Org-wide Baseline)</option>
                )}
                {accessibleBranches.map((b) => (
                  <option key={b._id || b.id} value={String(b._id || b.id)}>
                    🌿 Branch: {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </Form.Select>
            </div>
          </Col>
        </Row>
      </div>

      {/* Override Status Banner */}
      {selectedScope !== "default" && (
        <div className="d-flex align-items-center justify-content-between p-2 px-3 mb-3 rounded-2 border bg-light shadow-xs">
          <div className="d-flex align-items-center gap-2 small">
            {isOverrideActive ? (
              <>
                <span className="leave-workflow-override-badge active">
                  <FaCheckCircle className="me-1" /> Custom Branch Override Active
                </span>
                <span className="text-muted extra-small">
                  This branch has dedicated role views overriding the organization baseline.
                </span>
              </>
            ) : (
              <>
                <span className="leave-workflow-override-badge inheriting">
                  <FaCodeBranch className="me-1" /> Inheriting Organization Default
                </span>
                <span className="text-muted extra-small">
                  No custom override saved. Currently displaying inherited organization baseline.
                </span>
              </>
            )}
          </div>
          {isOverrideActive && (
            <Button
              variant="outline-danger"
              size="sm"
              className="py-1 px-2 extra-small rounded-pill"
              onClick={() => setShowRevertModal(true)}
            >
              <FaUndo className="me-1" /> Revert to Org Default
            </Button>
          )}
        </div>
      )}

      {/* Feedback Alerts */}
      {alert.message && (
        <FeedbackAlert
          variant={alert.type}
          dismissible
          onClose={() => setAlert({ type: "", message: "" })}
          className="mb-3 py-2 px-3 small rounded-3"
          message={alert.message}
        />
      )}

      {loading ? (
        <div className="text-center py-5">
          <LoadingSpinner variant="inline" size="md" color="gold" message="Loading view configurations..." />
        </div>
      ) : (
        <>
          {/* Role Navigation Pills */}
          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <span className="text-muted extra-small fw-semibold text-uppercase me-2">
              <FaUserShield className="me-1" /> Target Role:
            </span>
            {allSelectableRoles.map((r) => (
              <button
                key={r.code}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1 ${
                  selectedRoleCode === r.code
                    ? "btn-dark text-gold fw-semibold shadow-xs"
                    : "btn-outline-secondary bg-white text-dark"
                }`}
                onClick={() => setSelectedRoleCode(r.code)}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Defense in Depth Info Alert */}
          <div className="alert alert-info py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2 border-0 bg-info-subtle">
            <FaInfoCircle className="text-info fs-5 flex-shrink-0" />
            <div className="extra-small text-dark">
              <strong>Defense in Depth:</strong> Configured tabs and actions will only appear if the user possessing the role also holds the requisite backend RBAC permissions. View customization tailors navigation and streamlines UI workflows without compromising backend authorization.
            </div>
          </div>

          <Row className="g-3">
            {/* Visible Tabs Card */}
            <Col lg={7} md={12}>
              <Card className="leave-workflow-card shadow-xs h-100">
                <Card.Header className="bg-white border-bottom py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-0 fw-semibold text-dark">
                        <FaEye className="me-2 text-gold" /> Visible Tabs for {allSelectableRoles.find((r) => r.code === selectedRoleCode)?.name}
                      </h6>
                      <span className="extra-small text-muted">
                        Select which navigation tabs are accessible for this role
                      </span>
                    </div>
                    <span className="badge bg-gold-subtle text-gold-dark rounded-pill px-2 py-1 extra-small">
                      {currentRoleConfig.visibleTabs?.length || 0} Tabs Selected
                    </span>
                  </div>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="d-flex flex-column gap-2">
                    {AVAILABLE_TABS.map((tab) => {
                      const isRestrictedForRole = selectedRoleCode === "EMPLOYEE" && tab.id === "workflow";
                      const isChecked = !isRestrictedForRole && currentRoleConfig.visibleTabs?.includes(tab.id);
                      const IconComp = tab.icon;
                      return (
                        <div
                          key={tab.id}
                          className={`p-3 rounded-3 border transition-all d-flex align-items-center justify-content-between ${
                            isRestrictedForRole
                              ? "bg-light-subtle text-muted border-light opacity-50 cursor-not-allowed"
                              : isChecked
                              ? "bg-light border-gold-light cursor-pointer"
                              : "bg-white border-light text-muted cursor-pointer"
                          }`}
                          onClick={() => {
                            if (!isRestrictedForRole) handleToggleTab(tab.id);
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <Form.Check
                              type="checkbox"
                              id={`tab-${tab.id}`}
                              checked={isChecked}
                              disabled={isRestrictedForRole}
                              onChange={() => {}}
                              className="mb-0"
                            />
                            <div>
                              <div className="fw-semibold text-dark small d-flex align-items-center gap-2">
                                <IconComp className={isChecked ? "text-gold" : "text-muted"} />
                                {tab.label}
                                {currentRoleConfig.defaultTab === tab.id && (
                                  <span className="badge bg-dark text-gold extra-small rounded-pill px-2">
                                    Default Landing
                                  </span>
                                )}
                                {isRestrictedForRole && (
                                  <span className="badge bg-danger-subtle text-danger extra-small rounded-pill px-2">
                                    Forbidden for Employee
                                  </span>
                                )}
                              </div>
                              <span className="extra-small text-muted d-block">
                                {isRestrictedForRole
                                  ? "Protected administrative feature — employees cannot configure approval workflows."
                                  : tab.desc}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Permitted Actions & Default Tab Card */}
            <Col lg={5} md={12}>
              <div className="d-flex flex-column gap-3 h-100">
                {/* Default Landing Tab Selection */}
                <Card className="leave-workflow-card shadow-xs">
                  <Card.Header className="bg-white border-bottom py-2 px-3">
                    <span className="fw-semibold text-dark small">
                      <FaCalendarAlt className="me-2 text-gold" /> Default Landing Tab
                    </span>
                  </Card.Header>
                  <Card.Body className="p-3">
                    <label className="extra-small text-muted mb-1 d-block">
                      Initial active tab when entering Leave Management:
                    </label>
                    <Form.Select
                      size="sm"
                      value={currentRoleConfig.defaultTab || ""}
                      onChange={(e) => handleChangeDefaultTab(e.target.value)}
                      className="border-gold rounded-pill bg-white shadow-xs"
                      disabled={currentRoleConfig.visibleTabs?.length === 0}
                    >
                      {currentRoleConfig.visibleTabs?.map((tId) => {
                        const tabObj = AVAILABLE_TABS.find((t) => t.id === tId);
                        return (
                          <option key={tId} value={tId}>
                            {tabObj?.label || tId}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Card.Body>
                </Card>

                {/* Permitted Actions */}
                <Card className="leave-workflow-card shadow-xs flex-grow-1">
                  <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="mb-0 fw-semibold text-dark">
                          <FaCheckDouble className="me-2 text-gold" /> Permitted Actions
                        </h6>
                        <span className="extra-small text-muted">
                          Interactive controls enabled on screen
                        </span>
                      </div>
                      <span className="badge bg-gold-subtle text-gold-dark rounded-pill px-2 py-1 extra-small">
                        {currentRoleConfig.permittedActions?.length || 0} Actions Selected
                      </span>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-3">
                    <div className="d-flex flex-column gap-2">
                      {AVAILABLE_ACTIONS.map((action) => {
                        const isRestrictedForRole = selectedRoleCode === "EMPLOYEE" && action.id === "manage_workflow";
                        const isChecked = !isRestrictedForRole && currentRoleConfig.permittedActions?.includes(action.id);
                        return (
                          <div
                            key={action.id}
                            className={`p-2 px-3 rounded-3 border transition-all d-flex align-items-center justify-content-between ${
                              isRestrictedForRole
                                ? "bg-light-subtle text-muted border-light opacity-50 cursor-not-allowed"
                                : isChecked
                                ? "bg-light border-gold-light cursor-pointer"
                                : "bg-white border-light text-muted cursor-pointer"
                            }`}
                            onClick={() => {
                              if (!isRestrictedForRole) handleToggleAction(action.id);
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <Form.Check
                                type="checkbox"
                                id={`action-${action.id}`}
                                checked={isChecked}
                                disabled={isRestrictedForRole}
                                onChange={() => {}}
                                className="mb-0"
                              />
                              <div>
                                <span className="fw-semibold text-dark extra-small d-block">
                                  {action.label}
                                  {isRestrictedForRole && (
                                    <span className="badge bg-danger-subtle text-danger extra-small rounded-pill ms-2 px-2">
                                      Forbidden
                                    </span>
                                  )}
                                </span>
                                <span className="extra-small text-muted d-block" style={{ fontSize: "0.75rem" }}>
                                  {isRestrictedForRole
                                    ? "Protected administrative feature — employees cannot configure approval workflows."
                                    : action.desc}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>

          {/* Save Bar */}
          <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
            <Button
              variant="dark"
              size="sm"
              className="leave-workflow-save-btn px-4 py-2 rounded-pill shadow-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <LoadingSpinner variant="inline" size="sm" color="gold" message="Saving view configuration..." />
              ) : (
                <>
                  <FaSave className="me-2" /> Save View Configuration
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Confirm Revert Modal */}
      <ConfirmModal
        show={showRevertModal}
        onHide={() => setShowRevertModal(false)}
        onConfirm={handleConfirmRevert}
        title="Revert Branch View Override?"
        message="Are you sure you want to remove the custom leave view override for this branch? The branch will immediately inherit the organization default view configuration."
        confirmText="Yes, Revert to Org Default"
        confirmVariant="danger"
        isLoading={reverting}
      />
    </div>
  );
}

export default LeaveViewCustomizer;
