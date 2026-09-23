import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FaCodeBranch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaClock,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaUserCheck,
  FaUserPlus,
  FaBuilding,
  FaInfoCircle,
} from "react-icons/fa";
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  fetchEmployeesDropdown,
  fetchOnboardedEmployees,
  assignEmployeesToBranch,
  removeEmployeeFromBranch,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function BranchesSection() {
  const { hasPermission, isSystemAdmin } = useAuth();
  const { refreshBranches } = useBranch();
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [onboardedStaff, setOnboardedStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [locating, setLocating] = useState(false);

  // Assign Members Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBranchForMembers, setSelectedBranchForMembers] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [assignAsPrimary, setAssignAsPrimary] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilterTab, setMemberFilterTab] = useState("all"); // 'all' | 'assigned' | 'unassigned'
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignModalError, setAssignModalError] = useState("");
  const [assignModalSuccess, setAssignModalSuccess] = useState("");

  // Delete Confirm Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");

  const initialForm = {
    branchName: "",
    branchCode: "",
    branchType: "BRANCH_OFFICE",
    branchHeadId: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    latitude: "",
    longitude: "",
    officeRadiusMeters: 200,
    timeZone: "Asia/Kolkata",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    status: "ACTIVE",
  };
  const [formData, setFormData] = useState(initialForm);

  const canCreate = isSystemAdmin || hasPermission("branch.create");
  const canUpdate = isSystemAdmin || hasPermission("branch.update");
  const canDelete = isSystemAdmin || hasPermission("branch.delete");

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page,
        limit: 10,
        search,
        branchType: filterType,
        status: filterStatus,
      };
      const res = await fetchBranches(params);
      if (res.success) {
        setBranches(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalRecords(res.pagination.totalRecords || 0);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus]);

  const loadStaffData = useCallback(async () => {
    try {
      const [dropdownList, fullStaff] = await Promise.all([
        fetchEmployeesDropdown().catch(() => []),
        fetchOnboardedEmployees().catch(() => []),
      ]);
      setEmployees(dropdownList || []);
      setOnboardedStaff(fullStaff || []);
    } catch (e) {
      console.warn("Failed to load staff roster:", e);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  // Compute branch member count dynamically
  const getBranchMembers = useCallback(
    (branchId) => {
      if (!branchId) return [];
      const bIdStr = String(branchId);
      return onboardedStaff.filter((e) => {
        const pMatch = e.primaryBranchId && String(e.primaryBranchId) === bIdStr;
        const bMatch = Array.isArray(e.branchIds) && e.branchIds.some((id) => String(id) === bIdStr);
        return pMatch || bMatch;
      });
    },
    [onboardedStaff]
  );

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData(initialForm);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branchName: branch.branchName || "",
      branchCode: branch.branchCode || "",
      branchType: branch.branchType || "BRANCH_OFFICE",
      branchHeadId: branch.branchHeadId?._id || branch.branchHeadId || "",
      email: branch.email || "",
      phone: branch.phone || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      country: branch.country || "India",
      latitude: branch.latitude !== undefined && branch.latitude !== null ? branch.latitude : "",
      longitude: branch.longitude !== undefined && branch.longitude !== null ? branch.longitude : "",
      officeRadiusMeters: branch.officeRadiusMeters || 200,
      timeZone: branch.timeZone || "Asia/Kolkata",
      workingDays: Array.isArray(branch.workingDays) ? branch.workingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHoursStart: branch.workingHours?.start || "09:00",
      workingHoursEnd: branch.workingHours?.end || "18:00",
      status: branch.status || "ACTIVE",
    });
    setModalError("");
    setShowModal(true);
  };

  // ── Open Assign Members Modal ──
  const handleOpenAssignModal = (branch) => {
    setSelectedBranchForMembers(branch);
    setMemberSearch("");
    setMemberFilterTab("all");
    setAssignModalError("");
    setAssignModalSuccess("");
    setAssignAsPrimary(true);

    // Initial selected set: employees already in this branch
    const bIdStr = String(branch._id || branch.id);
    const initialSelected = new Set();
    onboardedStaff.forEach((emp) => {
      const isPrimary = emp.primaryBranchId && String(emp.primaryBranchId) === bIdStr;
      const isBranchInList = Array.isArray(emp.branchIds) && emp.branchIds.some((id) => String(id) === bIdStr);
      if (isPrimary || isBranchInList) {
        initialSelected.add(String(emp._id || emp.id));
      }
    });
    setSelectedMemberIds(initialSelected);
    setShowAssignModal(true);
  };

  const toggleMemberSelection = (empId) => {
    const idStr = String(empId);
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });
  };

  const handleSelectAllVisible = (visibleEmployees) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      visibleEmployees.forEach((emp) => next.add(String(emp._id || emp.id)));
      return next;
    });
  };

  const handleDeselectAllVisible = (visibleEmployees) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      visibleEmployees.forEach((emp) => next.delete(String(emp._id || emp.id)));
      return next;
    });
  };

  // ── Save Member Assignments ──
  const handleSaveMemberAssignments = async () => {
    if (!selectedBranchForMembers) return;
    const branchId = selectedBranchForMembers._id || selectedBranchForMembers.id;

    try {
      setAssignLoading(true);
      setAssignModalError("");
      setAssignModalSuccess("");

      const currentAssignedIds = new Set(
        getBranchMembers(branchId).map((e) => String(e._id || e.id))
      );

      // Newly added user IDs
      const toAdd = Array.from(selectedMemberIds).filter((id) => !currentAssignedIds.has(id));
      // Removed user IDs
      const toRemove = Array.from(currentAssignedIds).filter((id) => !selectedMemberIds.has(id));

      const tasks = [];
      if (toAdd.length > 0) {
        tasks.push(assignEmployeesToBranch(branchId, toAdd, assignAsPrimary));
      }
      if (toRemove.length > 0) {
        toRemove.forEach((uId) => tasks.push(removeEmployeeFromBranch(branchId, uId)));
      }

      await Promise.allSettled(tasks);

      setAssignModalSuccess(
        `Successfully updated branch roster! (${toAdd.length} added, ${toRemove.length} removed)`
      );

      // Refresh staff roster and branches
      await loadStaffData();
      await loadBranches();
      refreshBranches();

      setTimeout(() => {
        setShowAssignModal(false);
        setSuccess(`Branch members updated for ${selectedBranchForMembers.branchName}.`);
        setTimeout(() => setSuccess(""), 4000);
      }, 1200);
    } catch (err) {
      setAssignModalError(err.message || "Failed to update branch member assignments");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCurrentGPS = () => {
    if (!navigator.geolocation) {
      setModalError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setLocating(false);
      },
      (err) => {
        setModalError("Failed to fetch GPS coordinates: " + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleDay = (day) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day);
      return {
        ...prev,
        workingDays: exists
          ? prev.workingDays.filter((d) => d !== day)
          : [...prev.workingDays, day],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");

      const payload = {
        branchName: formData.branchName.trim(),
        branchCode: formData.branchCode.trim().toUpperCase(),
        branchType: formData.branchType,
        branchHeadId: formData.branchHeadId || null,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        latitude: formData.latitude !== "" ? Number(formData.latitude) : null,
        longitude: formData.longitude !== "" ? Number(formData.longitude) : null,
        officeRadiusMeters: Number(formData.officeRadiusMeters) || 200,
        timeZone: formData.timeZone,
        workingDays: formData.workingDays,
        workingHours: {
          start: formData.workingHoursStart,
          end: formData.workingHoursEnd,
        },
        status: formData.status,
      };

      if (editingBranch) {
        const res = await updateBranch(editingBranch._id, payload);
        setSuccess(res.message || "Branch updated successfully");
      } else {
        const res = await createBranch(payload);
        setSuccess(res.message || "Branch created successfully");
      }
      setShowModal(false);
      loadBranches();
      refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setModalLoading(true);
      const res = await deleteBranch(deletingId);
      setSuccess(res.message || "Branch deleted successfully");
      setShowDeleteModal(false);
      loadBranches();
      refreshBranches();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete branch");
      setShowDeleteModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  // Filtered onboarded employees for the assignment modal
  const filteredModalStaff = useMemo(() => {
    if (!selectedBranchForMembers) return [];
    const bIdStr = String(selectedBranchForMembers._id || selectedBranchForMembers.id);
    const q = memberSearch.trim().toLowerCase();

    return onboardedStaff.filter((emp) => {
      // Search match
      const nameMatch = (emp.fullName || "").toLowerCase().includes(q);
      const codeMatch = (emp.employeeId || "").toLowerCase().includes(q);
      const emailMatch = (emp.email || "").toLowerCase().includes(q);
      const desigMatch = (emp.designation || "").toLowerCase().includes(q);
      const matchesSearch = !q || nameMatch || codeMatch || emailMatch || desigMatch;
      if (!matchesSearch) return false;

      // Filter tabs
      const isAssignedToThis =
        (emp.primaryBranchId && String(emp.primaryBranchId) === bIdStr) ||
        (Array.isArray(emp.branchIds) && emp.branchIds.some((id) => String(id) === bIdStr));

      if (memberFilterTab === "assigned") return isAssignedToThis;
      if (memberFilterTab === "unassigned") return !emp.primaryBranchId;
      return true;
    });
  }, [onboardedStaff, selectedBranchForMembers, memberSearch, memberFilterTab]);

  return (
    <div className="org-section-container">
      {/* ── Section Header ── */}
      <div className="org-section-header">
        <div>
          <h3 className="org-section-title">
            <FaCodeBranch className="text-success me-2" /> Branches & Office Hubs
          </h3>
          <p className="org-section-sub">
            Manage headquarters, regional offices, and physical work centers with geofencing and member assignments.
          </p>
        </div>
        {canCreate && (
          <Button variant="success" className="org-action-btn" onClick={handleOpenCreate}>
            <FaPlus className="me-2" /> Add Branch
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── Filters & Search ── */}
      <Card className="org-filter-card mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search by branch name, code, or city..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              >
                <option value="">All Branch Types</option>
                <option value="HEAD_OFFICE">Head Office</option>
                <option value="REGIONAL_OFFICE">Regional Office</option>
                <option value="BRANCH_OFFICE">Branch Office</option>
                <option value="VIRTUAL">Virtual Office</option>
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

      {/* ── Table ── */}
      <Card className="org-table-card">
        <Table responsive hover className="org-table mb-0 align-middle">
          <thead>
            <tr>
              <th>Branch Code & Name</th>
              <th>Type</th>
              <th>Branch Head</th>
              <th>Assigned Staff</th>
              <th>Location & Geofence</th>
              <th>Working Hours</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">
                  <Spinner animation="border" size="sm" variant="success" className="me-2" />
                  Loading branches...
                </td>
              </tr>
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">
                  No branches found matching your search.
                </td>
              </tr>
            ) : (
              branches.map((b) => {
                const members = getBranchMembers(b._id);
                return (
                  <tr key={b._id}>
                    <td>
                      <div className="fw-semibold text-dark">{b.branchName}</div>
                      <div className="small font-monospace text-muted">{b.branchCode}</div>
                    </td>
                    <td>
                      <Badge bg="light" className="text-dark border">
                        {b.branchType ? b.branchType.replace("_", " ") : "BRANCH"}
                      </Badge>
                    </td>
                    <td>
                      {b.branchHeadId ? (
                        <div className="d-flex align-items-center gap-1">
                          <FaUserTie className="text-primary small" />
                          <span className="small fw-medium">{b.branchHeadId.firstName} {b.branchHeadId.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-muted small">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 px-2 py-1"
                        style={{ borderRadius: "20px", fontSize: "0.8rem" }}
                        onClick={() => handleOpenAssignModal(b)}
                        title="Click to view or assign onboarded employees"
                      >
                        <FaUsers />
                        <span><strong>{members.length}</strong> Members</span>
                      </button>
                    </td>
                    <td>
                      <div className="small">
                        <FaMapMarkerAlt className="text-danger me-1" />
                        {typeof b.city === "string" ? b.city : (b.address?.city || "")}
                        {(b.city || b.address?.city) ? ", " : ""}
                        {typeof b.state === "string" ? b.state : (typeof b.country === "string" ? b.country : (b.address?.country || "N/A"))}
                      </div>
                      {b.latitude && b.longitude && (
                        <div className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
                          GPS: {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)} ({b.officeRadiusMeters || 200}m)
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="small">
                        <FaClock className="text-secondary me-1" />
                        {b.workingHours?.start || "09:00"} - {b.workingHours?.end || "18:00"}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {b.workingDays?.length || 5} days/week
                      </div>
                    </td>
                    <td>
                      <Badge bg={b.status === "ACTIVE" ? "success" : "secondary"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="p-1 px-2 me-2 d-inline-flex align-items-center gap-1"
                        style={{ fontSize: "0.8rem", borderRadius: "6px" }}
                        title="Manage Branch Members"
                        onClick={() => handleOpenAssignModal(b)}
                      >
                        <FaUserPlus /> Staff
                      </Button>
                      {canUpdate && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary p-1"
                          title="Edit Branch"
                          onClick={() => handleOpenEdit(b)}
                        >
                          <FaEdit />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-1"
                          title="Delete Branch"
                          onClick={() => {
                            setDeletingId(b._id);
                            setDeletingName(b.branchName);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
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

      {/* ── ASSIGN ONBOARDED MEMBERS MODAL ── */}
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaUsers className="text-success" />
            <div>
              <div className="fw-bold fs-6">Assign Onboarded Staff to Branch</div>
              <div className="text-muted small fw-normal">
                {selectedBranchForMembers?.branchName} ({selectedBranchForMembers?.branchCode})
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-3">
          {assignModalError && <Alert variant="danger" dismissible onClose={() => setAssignModalError("")}>{assignModalError}</Alert>}
          {assignModalSuccess && <Alert variant="success">{assignModalSuccess}</Alert>}

          {/* Quick Info Alert */}
          <div className="d-flex align-items-center gap-2 p-2 px-3 mb-3 rounded bg-light border text-muted small">
            <FaInfoCircle className="text-primary flex-shrink-0" />
            <div>
              Select employees who have completed onboarding. Assigned employees will hold this branch reference for geofenced GPS attendance and localized holiday schedules.
            </div>
          </div>

          {/* Controls: Search & Tabs */}
          <Row className="g-2 mb-3 align-items-center">
            <Col md={6}>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, employee code, or designation..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={6} className="d-flex justify-content-md-end gap-1">
              <Button
                size="sm"
                variant={memberFilterTab === "all" ? "dark" : "outline-secondary"}
                onClick={() => setMemberFilterTab("all")}
              >
                All Onboarded ({onboardedStaff.length})
              </Button>
              <Button
                size="sm"
                variant={memberFilterTab === "assigned" ? "success" : "outline-secondary"}
                onClick={() => setMemberFilterTab("assigned")}
              >
                Assigned ({selectedMemberIds.size})
              </Button>
              <Button
                size="sm"
                variant={memberFilterTab === "unassigned" ? "warning" : "outline-secondary"}
                onClick={() => setMemberFilterTab("unassigned")}
              >
                Unassigned ({onboardedStaff.filter((e) => !e.primaryBranchId).length})
              </Button>
            </Col>
          </Row>

          {/* Bulk Selection Bar */}
          <div className="d-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded border">
            <div className="d-flex align-items-center gap-2">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => handleSelectAllVisible(filteredModalStaff)}
                disabled={filteredModalStaff.length === 0}
              >
                Select All Filtered ({filteredModalStaff.length})
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => handleDeselectAllVisible(filteredModalStaff)}
                disabled={filteredModalStaff.length === 0}
              >
                Deselect Filtered
              </Button>
            </div>
            <Form.Check
              type="checkbox"
              id="set-primary-checkbox"
              label="Set as Primary Base Branch"
              checked={assignAsPrimary}
              onChange={(e) => setAssignAsPrimary(e.target.checked)}
              className="fw-semibold text-secondary small mb-0"
            />
          </div>

          {/* Employee Roster List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }} className="border rounded">
            <Table hover responsive size="sm" className="mb-0 align-middle">
              <thead className="bg-light sticky-top">
                <tr>
                  <th style={{ width: "40px" }} className="text-center">Select</th>
                  <th>Employee</th>
                  <th>Designation / Dept</th>
                  <th>Current Base Branch</th>
                  <th>Onboarding Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredModalStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No eligible onboarded employees found.
                    </td>
                  </tr>
                ) : (
                  filteredModalStaff.map((emp) => {
                    const empId = String(emp._id || emp.id);
                    const isSelected = selectedMemberIds.has(empId);
                    const currentBranchObj = branches.find((b) => String(b._id) === String(emp.primaryBranchId));

                    return (
                      <tr
                        key={empId}
                        onClick={() => toggleMemberSelection(empId)}
                        style={{ cursor: "pointer", backgroundColor: isSelected ? "#f0fdf4" : undefined }}
                      >
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Form.Check
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMemberSelection(empId)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: "32px", height: "32px", fontSize: "0.75rem", flexShrink: 0 }}
                            >
                              {emp.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{emp.fullName}</div>
                              <div className="small text-muted font-monospace">{emp.employeeId || emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small text-dark fw-medium">{emp.designation}</div>
                          <div className="text-muted small" style={{ fontSize: "0.75rem" }}>{emp.department}</div>
                        </td>
                        <td>
                          {currentBranchObj ? (
                            <Badge bg="light" className="text-dark border">
                              <FaBuilding className="me-1 text-muted" />
                              {currentBranchObj.branchName}
                            </Badge>
                          ) : (
                            <span className="text-muted small">None (Unassigned)</span>
                          )}
                        </td>
                        <td>
                          <Badge bg={emp.isOnboarded ? "success" : "warning"}>
                            <FaUserCheck className="me-1" />
                            {emp.onboardingStatus || "COMPLETED"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>

        <Modal.Footer className="d-flex align-items-center justify-content-between">
          <div className="small text-muted">
            Selected: <strong className="text-success">{selectedMemberIds.size}</strong> employees
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAssignModal(false)}
              disabled={assignLoading}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleSaveMemberAssignments}
              disabled={assignLoading}
            >
              {assignLoading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-1" />
                  Saving Assignments...
                </>
              ) : (
                <>
                  <FaUserPlus className="me-1" /> Save Branch Members
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ── Create / Edit Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaCodeBranch className="text-success" />
              {editingBranch ? "Edit Branch" : "Add New Branch"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Bangalore Headquarters"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. BLR-HQ"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Type</Form.Label>
                  <Form.Select
                    value={formData.branchType}
                    onChange={(e) => setFormData({ ...formData, branchType: e.target.value })}
                  >
                    <option value="HEAD_OFFICE">Head Office</option>
                    <option value="REGIONAL_OFFICE">Regional Office</option>
                    <option value="BRANCH_OFFICE">Branch Office</option>
                    <option value="VIRTUAL">Virtual Office</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Head</Form.Label>
                  <Form.Select
                    value={formData.branchHeadId}
                    onChange={(e) => setFormData({ ...formData, branchHeadId: e.target.value })}
                  >
                    <option value="">-- Select Branch Head (Onboarded Leader) --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="e.g. branch.blr@flareminds.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch Contact Phone</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. +91 80 4567 8900"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Physical Street Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="e.g. Building 4, Tech Park, Outer Ring Road, Mahadevapura"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    placeholder="e.g. 560103"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </Form.Group>
              </Col>

              {/* Geofencing Coordinates */}
              <Col md={12}>
                <div className="p-3 bg-light rounded border">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold text-secondary small">
                      <FaMapMarkerAlt className="text-danger me-1" /> Geofencing Attendance Boundary
                    </span>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      type="button"
                      onClick={handleCurrentGPS}
                      disabled={locating}
                    >
                      <FaCrosshairs className="me-1" />
                      {locating ? "Acquiring GPS..." : "Autofill Current GPS"}
                    </Button>
                  </div>
                  <Row className="g-2">
                    <Col md={4}>
                      <Form.Label className="small text-muted">Latitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        placeholder="e.g. 12.9716"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small text-muted">Longitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        placeholder="e.g. 77.5946"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small text-muted">Radius (Meters)</Form.Label>
                      <Form.Control
                        type="number"
                        min="10"
                        placeholder="e.g. 200"
                        value={formData.officeRadiusMeters}
                        onChange={(e) => setFormData({ ...formData, officeRadiusMeters: e.target.value })}
                      />
                    </Col>
                  </Row>
                </div>
              </Col>

              {/* Working Hours & Schedule */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Working Hours Start</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.workingHoursStart}
                    onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Working Hours End</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.workingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Branch Status</Form.Label>
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
                <Form.Label>Weekly Working Days</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = formData.workingDays.includes(d);
                    return (
                      <Button
                        key={d}
                        size="sm"
                        type="button"
                        variant={isSelected ? "success" : "outline-secondary"}
                        onClick={() => toggleDay(d)}
                      >
                        {isSelected ? <FaCheckCircle className="me-1" /> : <FaTimesCircle className="me-1" />}
                        {d}
                      </Button>
                    );
                  })}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={modalLoading}>
              {modalLoading ? <Spinner size="sm" animation="border" /> : "Save Branch"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <FaTrash /> Delete Branch
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete branch <strong>{deletingName}</strong>?
          <p className="text-muted small mt-2">
            Warning: Departments, locations, or users linked to this branch must be re-assigned.
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

export default BranchesSection;
