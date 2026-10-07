import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Form,
  Row,
  Col,
  Nav,
} from "react-bootstrap";
import {
  FaCalendarCheck,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSlidersH,
  FaLayerGroup,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  fetchLeaveTypesApi,
  createLeaveTypeApi,
  updateLeaveTypeApi,
  deleteLeaveTypeApi,
  fetchLeavePoliciesApi,
  createOrUpdateLeavePolicyApi,
  deleteLeavePolicyApi,
} from "../../Api/leave/leave";
import { fetchBranchesDropdown } from "../../services/organizationService";
import { useSelector } from "react-redux";
import { useHasPermission, selectIsSystemAdmin } from "../../redux/slices/authSlice";
import FeedbackAlert from "../Common/FeedbackAlert";
import EmptyState from "../Common/EmptyState";
import DataTable from "../Common/DataTable";
import SearchInput from "../Common/SearchInput";
import ConfirmModal from "../Common/ConfirmModal";
import CrudModal from "../Common/CrudModal";

function LeaveSettingsSection({ lockedBranchId }) {
  const hasPermission = useHasPermission();
  const isSystemAdmin = useSelector(selectIsSystemAdmin);

  const canManage = isSystemAdmin || hasPermission("leave.policy.manage") || hasPermission("*");
  const canRead = canManage || hasPermission("leave.policy.read") || hasPermission("leave.read.own");

  const [activeSubTab, setActiveSubTab] = useState("types"); // "types" | "policies"

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterBranchId, setFilterBranchId] = useState(lockedBranchId || "");
  const [filterLeaveTypeId, setFilterLeaveTypeId] = useState("");

  // ── Leave Type Modal State ──
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "CASUAL",
    isPaid: true,
    isActive: true,
    color: "#3B82F6",
    branchId: lockedBranchId || "",
  });

  // ── Leave Policy Modal State ──
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyFormData, setPolicyFormData] = useState({
    leaveTypeId: "",
    branchId: lockedBranchId || "",
    entitlement: 12,
    accrualFrequency: "Yearly",
    accrualAmount: 0,
    maximumBalance: 30,
    carryForwardEnabled: false,
    carryForwardLimit: 0,
    allowNegativeBalance: false,
    maxNegativeBalance: 0,
    allowHalfDay: true,
    allowBackdatedDays: 0,
    minimumNoticeDays: 0,
    maximumConsecutiveDays: 0,
    probationRestriction: false,
    probationDays: 0,
    effectiveFrom: "",
    effectiveTo: "",
    isActive: true,
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItemType, setDeletingItemType] = useState(""); // "type" | "policy"
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  useEffect(() => {
    if (lockedBranchId) {
      setFilterBranchId(lockedBranchId);
      setTypeFormData((prev) => ({ ...prev, branchId: lockedBranchId }));
      setPolicyFormData((prev) => ({ ...prev, branchId: lockedBranchId }));
    }
  }, [lockedBranchId]);

  // Load Branches
  useEffect(() => {
    fetchBranchesDropdown()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setBranches(list);
      })
      .catch(() => setBranches([]));
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeSubTab === "types") {
        const params = { includeInactive: "true" };
        if (filterBranchId) params.branchId = filterBranchId;
        const res = await fetchLeaveTypesApi(params);
        setLeaveTypes(Array.isArray(res) ? res : res?.data || []);
      } else {
        const params = {};
        if (filterBranchId) params.branchId = filterBranchId;
        if (filterLeaveTypeId) params.leaveTypeId = filterLeaveTypeId;
        const res = await fetchLeavePoliciesApi(params);
        setLeavePolicies(Array.isArray(res) ? res : res?.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load leave settings");
    } finally {
      setLoading(false);
    }
  }, [activeSubTab, filterBranchId, filterLeaveTypeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Open Type Modal ──
  const handleOpenTypeModal = (type = null) => {
    setModalError("");
    if (type) {
      setEditingType(type);
      setTypeFormData({
        code: type.code || "",
        name: type.name || "",
        description: type.description || "",
        category: type.category || "CASUAL",
        isPaid: type.isPaid !== undefined ? type.isPaid : true,
        isActive: type.isActive !== undefined ? type.isActive : true,
        color: type.color || "#3B82F6",
        branchId: type.branchId?._id || type.branchId || lockedBranchId || "",
      });
    } else {
      setEditingType(null);
      setTypeFormData({
        code: "",
        name: "",
        description: "",
        category: "CASUAL",
        isPaid: true,
        isActive: true,
        color: "#3B82F6",
        branchId: lockedBranchId || "",
      });
    }
    setShowTypeModal(true);
  };

  // ── Submit Type Form ──
  const handleSaveType = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    try {
      const payload = {
        ...typeFormData,
        branchId: typeFormData.branchId || null,
      };

      if (editingType) {
        await updateLeaveTypeApi(editingType._id, payload);
        setSuccess("Leave type updated successfully.");
      } else {
        await createLeaveTypeApi(payload);
        setSuccess("Leave type created successfully.");
      }

      setShowTypeModal(false);
      loadData();
    } catch (err) {
      setModalError(err.message || "Failed to save leave type.");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Open Policy Modal ──
  const handleOpenPolicyModal = (policy = null) => {
    setModalError("");
    if (policy) {
      setEditingPolicy(policy);
      setPolicyFormData({
        leaveTypeId: policy.leaveTypeId?._id || policy.leaveTypeId || "",
        branchId: policy.branchId?._id || policy.branchId || lockedBranchId || "",
        entitlement: policy.entitlement || 0,
        accrualFrequency: policy.accrualFrequency || "Yearly",
        accrualAmount: policy.accrualAmount || 0,
        maximumBalance: policy.maximumBalance || 0,
        carryForwardEnabled: policy.carryForwardEnabled || false,
        carryForwardLimit: policy.carryForwardLimit || 0,
        allowNegativeBalance: policy.allowNegativeBalance || false,
        maxNegativeBalance: policy.maxNegativeBalance || 0,
        allowHalfDay: policy.allowHalfDay !== undefined ? policy.allowHalfDay : true,
        allowBackdatedDays: policy.allowBackdatedDays || 0,
        minimumNoticeDays: policy.minimumNoticeDays || 0,
        maximumConsecutiveDays: policy.maximumConsecutiveDays || 0,
        probationRestriction: policy.probationRestriction || false,
        probationDays: policy.probationDays || 0,
        effectiveFrom: policy.effectiveFrom ? new Date(policy.effectiveFrom).toISOString().split("T")[0] : "",
        effectiveTo: policy.effectiveTo ? new Date(policy.effectiveTo).toISOString().split("T")[0] : "",
        isActive: policy.isActive !== undefined ? policy.isActive : true,
      });
    } else {
      setEditingPolicy(null);
      setPolicyFormData({
        leaveTypeId: leaveTypes.length > 0 ? leaveTypes[0]._id : "",
        branchId: lockedBranchId || "",
        entitlement: 12,
        accrualFrequency: "Yearly",
        accrualAmount: 0,
        maximumBalance: 30,
        carryForwardEnabled: false,
        carryForwardLimit: 0,
        allowNegativeBalance: false,
        maxNegativeBalance: 0,
        allowHalfDay: true,
        allowBackdatedDays: 0,
        minimumNoticeDays: 0,
        maximumConsecutiveDays: 0,
        probationRestriction: false,
        probationDays: 0,
        effectiveFrom: "",
        effectiveTo: "",
        isActive: true,
      });
    }
    setShowPolicyModal(true);
  };

  // ── Submit Policy Form ──
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");
    try {
      const payload = {
        ...policyFormData,
        branchId: policyFormData.branchId || null,
      };

      await createOrUpdateLeavePolicyApi(payload);
      setSuccess("Leave policy saved successfully.");
      setShowPolicyModal(false);
      loadData();
    } catch (err) {
      setModalError(err.message || "Failed to save leave policy.");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Delete Actions ──
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      if (deletingItemType === "type") {
        await deleteLeaveTypeApi(deletingId);
        setSuccess("Leave type deleted / deactivated successfully.");
      } else {
        await deleteLeavePolicyApi(deletingId);
        setSuccess("Leave policy deleted successfully.");
      }
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      setError(err.message || "Deletion failed.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered Leave Types
  const filteredTypes = leaveTypes.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(term) ||
      t.code?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term)
    );
  });

  // Filtered Policies
  const filteredPolicies = leavePolicies.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const ltName = p.leaveTypeId?.name || "";
    const ltCode = p.leaveTypeId?.code || "";
    return ltName.toLowerCase().includes(term) || ltCode.toLowerCase().includes(term);
  });

  return (
    <div className="leave-settings-container p-3">
      {/* ── Sub Navigation Tabs ── */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <Nav variant="pills" className="custom-nav-pills">
              <Nav.Item>
                <Nav.Link
                  active={activeSubTab === "types"}
                  onClick={() => {
                    setActiveSubTab("types");
                    setSearch("");
                  }}
                  className="d-flex align-items-center gap-2"
                >
                  <FaLayerGroup /> Leave Types
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeSubTab === "policies"}
                  onClick={() => {
                    setActiveSubTab("policies");
                    setSearch("");
                  }}
                  className="d-flex align-items-center gap-2"
                >
                  <FaSlidersH /> Leave Policies
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {canManage && (
              <div>
                {activeSubTab === "types" ? (
                  <Button
                    variant="primary"
                    onClick={() => handleOpenTypeModal()}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaPlus /> Add Leave Type
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => handleOpenPolicyModal()}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaPlus /> Configure Policy
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ── Alerts ── */}
      {error && <FeedbackAlert variant="danger" message={error} onClose={() => setError("")} />}
      {success && <FeedbackAlert variant="success" message={success} onClose={() => setSuccess("")} />}

      {/* ── Filter & Search Toolbar ── */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={activeSubTab === "types" ? "Search leave types by name or code..." : "Search policies by leave type..."}
              />
            </Col>
            {!lockedBranchId && (
              <Col md={3}>
                <Form.Select
                  value={filterBranchId}
                  onChange={(e) => setFilterBranchId(e.target.value)}
                >
                  <option value="">All Scopes (Org & Branches)</option>
                  <option value="org">Organization-Wide Only</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.branchName || b.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}
            {activeSubTab === "policies" && (
              <Col md={3}>
                <Form.Select
                  value={filterLeaveTypeId}
                  onChange={(e) => setFilterLeaveTypeId(e.target.value)}
                >
                  <option value="">All Leave Types</option>
                  {leaveTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* ── SUBTAB 1: LEAVE TYPES ── */}
      {activeSubTab === "types" && (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            {filteredTypes.length === 0 && !loading ? (
              <EmptyState
                icon={FaLayerGroup}
                title="No Leave Types Found"
                description="Create customized organization and branch leave types."
                actionLabel={canManage ? "Create Leave Type" : null}
                onAction={canManage ? () => handleOpenTypeModal() : null}
              />
            ) : (
              <DataTable
                headers={[
                  "Code",
                  "Name",
                  "Category",
                  "Paid / Unpaid",
                  "Scope",
                  "Status",
                  "Actions",
                ]}
                loading={loading}
              >
                {filteredTypes.map((lt) => (
                  <tr key={lt._id}>
                    <td>
                      <span
                        className="badge px-2 py-1"
                        style={{
                          backgroundColor: lt.color || "#3B82F6",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {lt.code}
                      </span>
                    </td>
                    <td className="fw-semibold">{lt.name}</td>
                    <td>
                      <Badge bg="secondary">{lt.category}</Badge>
                    </td>
                    <td>
                      {lt.isPaid ? (
                        <Badge bg="success">Paid</Badge>
                      ) : (
                        <Badge bg="warning" text="dark">Unpaid</Badge>
                      )}
                    </td>
                    <td>
                      {lt.branchId ? (
                        <span className="text-primary small d-flex align-items-center gap-1">
                          <FaBuilding /> {lt.branchId?.name || "Branch Specific"}
                        </span>
                      ) : (
                        <span className="text-muted small">Organization Default</span>
                      )}
                    </td>
                    <td>
                      {lt.isActive ? (
                        <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                          <FaCheckCircle /> Active
                        </Badge>
                      ) : (
                        <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
                          <FaTimesCircle /> Inactive
                        </Badge>
                      )}
                    </td>
                    <td>
                      {canManage && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenTypeModal(lt)}
                            title="Edit Leave Type"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setDeletingItemType("type");
                              setDeletingId(lt._id);
                              setDeletingName(`${lt.name} (${lt.code})`);
                              setShowDeleteModal(true);
                            }}
                            title="Delete / Deactivate"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ── SUBTAB 2: LEAVE POLICIES ── */}
      {activeSubTab === "policies" && (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            {filteredPolicies.length === 0 && !loading ? (
              <EmptyState
                icon={FaSlidersH}
                title="No Leave Policies Configured"
                description="Configure annual entitlement, accrual rules, and carry forward policies."
                actionLabel={canManage ? "Configure Policy" : null}
                onAction={canManage ? () => handleOpenPolicyModal() : null}
              />
            ) : (
              <DataTable
                headers={[
                  "Leave Type",
                  "Scope",
                  "Entitlement",
                  "Accrual",
                  "Carry Forward",
                  "Half-Day",
                  "Advance Notice",
                  "Status",
                  "Actions",
                ]}
                loading={loading}
              >
                {filteredPolicies.map((pol) => (
                  <tr key={pol._id}>
                    <td>
                      <div className="fw-semibold">
                        {pol.leaveTypeId?.name || "Unknown"}
                      </div>
                      <small className="text-muted">{pol.leaveTypeId?.code}</small>
                    </td>
                    <td>
                      {pol.branchId ? (
                        <Badge bg="info">Branch Override ({pol.branchId?.name || "Branch"})</Badge>
                      ) : (
                        <Badge bg="dark">Org Default</Badge>
                      )}
                    </td>
                    <td className="fw-bold">{pol.entitlement} day(s)</td>
                    <td>{pol.accrualFrequency || "Yearly"}</td>
                    <td>
                      {pol.carryForwardEnabled ? (
                        <Badge bg="success">Max {pol.carryForwardLimit}d</Badge>
                      ) : (
                        <span className="text-muted small">Disabled</span>
                      )}
                    </td>
                    <td>
                      {pol.allowHalfDay ? (
                        <span className="text-success small fw-semibold">Yes</span>
                      ) : (
                        <span className="text-danger small fw-semibold">No</span>
                      )}
                    </td>
                    <td>{pol.minimumNoticeDays ? `${pol.minimumNoticeDays} day(s)` : "None"}</td>
                    <td>
                      {pol.isActive ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td>
                      {canManage && (
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenPolicyModal(pol)}
                            title="Edit Policy"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setDeletingItemType("policy");
                              setDeletingId(pol._id);
                              setDeletingName(`Policy for ${pol.leaveTypeId?.name || "Leave"}`);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Policy"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ── CREATE / EDIT LEAVE TYPE MODAL ── */}
      <CrudModal
        show={showTypeModal}
        onHide={() => !modalLoading && setShowTypeModal(false)}
        title={editingType ? "Edit Leave Type" : "Create Leave Type"}
        onSubmit={handleSaveType}
        loading={modalLoading}
        error={modalError}
        submitLabel={editingType ? "Update" : "Create"}
      >
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Leave Type Code <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={typeFormData.code}
                onChange={(e) => setTypeFormData({ ...typeFormData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CL, SL, PL"
                required
                disabled={Boolean(editingType)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={typeFormData.name}
                onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                placeholder="e.g. Casual Leave"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={typeFormData.category}
                onChange={(e) => setTypeFormData({ ...typeFormData, category: e.target.value })}
              >
                <option value="CASUAL">Casual</option>
                <option value="SICK">Sick</option>
                <option value="EARNED">Earned / Privilege</option>
                <option value="UNPAID">Unpaid / LOP</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PATERNITY">Paternity</option>
                <option value="BEREAVEMENT">Bereavement</option>
                <option value="COMPENSATORY">Compensatory Off</option>
                <option value="SPECIAL">Special</option>
                <option value="OTHER">Other</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Badge Color</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control
                  type="color"
                  value={typeFormData.color}
                  onChange={(e) => setTypeFormData({ ...typeFormData, color: e.target.value })}
                  style={{ width: "50px", height: "38px", padding: "2px" }}
                />
                <Form.Control
                  type="text"
                  value={typeFormData.color}
                  onChange={(e) => setTypeFormData({ ...typeFormData, color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <Form.Label>Branch Scope</Form.Label>
              <Form.Select
                value={typeFormData.branchId}
                onChange={(e) => setTypeFormData({ ...typeFormData, branchId: e.target.value })}
                disabled={Boolean(lockedBranchId)}
              >
                <option value="">Organization-Wide (All Branches)</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchName || b.name}
                  </option>
                ))}
              </Form.Select>
              {lockedBranchId && <Form.Text className="text-muted">Locked to current branch.</Form.Text>}
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={typeFormData.description}
                onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                placeholder="Optional description of leave type purpose"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="isPaidCheck"
              label="Paid Leave"
              checked={typeFormData.isPaid}
              onChange={(e) => setTypeFormData({ ...typeFormData, isPaid: e.target.checked })}
              className="mt-2"
            />
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="isActiveCheck"
              label="Active Status"
              checked={typeFormData.isActive}
              onChange={(e) => setTypeFormData({ ...typeFormData, isActive: e.target.checked })}
              className="mt-2"
            />
          </Col>
        </Row>
      </CrudModal>

      {/* ── CREATE / EDIT LEAVE POLICY MODAL ── */}
      <CrudModal
        show={showPolicyModal}
        onHide={() => !modalLoading && setShowPolicyModal(false)}
        title={editingPolicy ? "Edit Leave Policy" : "Configure Leave Policy"}
        onSubmit={handleSavePolicy}
        loading={modalLoading}
        error={modalError}
        submitLabel={editingPolicy ? "Update Policy" : "Save Policy"}
      >
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Leave Type <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={policyFormData.leaveTypeId}
                onChange={(e) => setPolicyFormData({ ...policyFormData, leaveTypeId: e.target.value })}
                required
                disabled={Boolean(editingPolicy)}
              >
                <option value="">Select Leave Type...</option>
                {leaveTypes.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Branch Scope</Form.Label>
              <Form.Select
                value={policyFormData.branchId}
                onChange={(e) => setPolicyFormData({ ...policyFormData, branchId: e.target.value })}
                disabled={Boolean(lockedBranchId || editingPolicy)}
              >
                <option value="">Organization-Wide Default</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    Override: {b.branchName || b.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Annual Entitlement (Days) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                step="0.5"
                min="0"
                value={policyFormData.entitlement}
                onChange={(e) => setPolicyFormData({ ...policyFormData, entitlement: Number(e.target.value) })}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Accrual Frequency</Form.Label>
              <Form.Select
                value={policyFormData.accrualFrequency}
                onChange={(e) => setPolicyFormData({ ...policyFormData, accrualFrequency: e.target.value })}
              >
                <option value="Yearly">Yearly (All upfront)</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="None">None</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Minimum Advance Notice (Days)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={policyFormData.minimumNoticeDays}
                onChange={(e) => setPolicyFormData({ ...policyFormData, minimumNoticeDays: Number(e.target.value) })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Allow Backdated Days (Past Dates)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={policyFormData.allowBackdatedDays}
                onChange={(e) => setPolicyFormData({ ...policyFormData, allowBackdatedDays: Number(e.target.value) })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="carryForwardCheck"
              label="Enable Carry Forward"
              checked={policyFormData.carryForwardEnabled}
              onChange={(e) => setPolicyFormData({ ...policyFormData, carryForwardEnabled: e.target.checked })}
              className="mt-2"
            />
            {policyFormData.carryForwardEnabled && (
              <Form.Control
                type="number"
                min="0"
                placeholder="Carry Forward Limit (Days)"
                value={policyFormData.carryForwardLimit}
                onChange={(e) => setPolicyFormData({ ...policyFormData, carryForwardLimit: Number(e.target.value) })}
                className="mt-2"
              />
            )}
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="allowHalfDayCheck"
              label="Allow Half-Day Applications"
              checked={policyFormData.allowHalfDay}
              onChange={(e) => setPolicyFormData({ ...policyFormData, allowHalfDay: e.target.checked })}
              className="mt-2"
            />
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="allowNegativeCheck"
              label="Allow Negative Balance (Advance)"
              checked={policyFormData.allowNegativeBalance}
              onChange={(e) => setPolicyFormData({ ...policyFormData, allowNegativeBalance: e.target.checked })}
              className="mt-2"
            />
            {policyFormData.allowNegativeBalance && (
              <Form.Control
                type="number"
                min="0"
                placeholder="Max Negative Balance Limit"
                value={policyFormData.maxNegativeBalance}
                onChange={(e) => setPolicyFormData({ ...policyFormData, maxNegativeBalance: Number(e.target.value) })}
                className="mt-2"
              />
            )}
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Effective From Date</Form.Label>
              <Form.Control
                type="date"
                value={policyFormData.effectiveFrom}
                onChange={(e) => setPolicyFormData({ ...policyFormData, effectiveFrom: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Effective To Date</Form.Label>
              <Form.Control
                type="date"
                value={policyFormData.effectiveTo}
                onChange={(e) => setPolicyFormData({ ...policyFormData, effectiveTo: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="probationRestrictionCheck"
              label="Probation Period Restriction"
              checked={policyFormData.probationRestriction}
              onChange={(e) => setPolicyFormData({ ...policyFormData, probationRestriction: e.target.checked })}
              className="mt-2"
            />
            {policyFormData.probationRestriction && (
              <Form.Control
                type="number"
                min="0"
                placeholder="Probation Days Required"
                value={policyFormData.probationDays}
                onChange={(e) => setPolicyFormData({ ...policyFormData, probationDays: Number(e.target.value) })}
                className="mt-2"
              />
            )}
          </Col>
          <Col md={6}>
            <Form.Check
              type="checkbox"
              id="policyActiveCheck"
              label="Policy Active"
              checked={policyFormData.isActive}
              onChange={(e) => setPolicyFormData({ ...policyFormData, isActive: e.target.checked })}
              className="mt-2"
            />
          </Col>
        </Row>
      </CrudModal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title={`Confirm Delete ${deletingItemType === "type" ? "Leave Type" : "Leave Policy"}`}
        message={`Are you sure you want to delete ${deletingName}?`}
        onConfirm={handleConfirmDelete}
        confirmVariant="danger"
        confirmText="Delete"
      />
    </div>
  );
}

export default LeaveSettingsSection;
