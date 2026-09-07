import React, { useState, useEffect, useCallback } from "react";
import {
  Container, Row, Col, Card, Form, Button, Table, Modal, Tab, Alert, Spinner, InputGroup, Pagination
} from "react-bootstrap";
import {
  FaCalendarAlt, FaClock, FaCheckCircle,
  FaTimesCircle, FaPlus, FaBan, FaHistory, FaUserCheck, FaSearch, FaExclamationTriangle, FaUsers, FaUndo
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import {
  applyLeaveApi,
  fetchLeaveBalanceApi,
  fetchMyLeavesApi,
  fetchTeamLeavesApi,
  fetchAllLeavesApi,
  cancelLeaveApi,
  approveLeaveApi,
  rejectLeaveApi,
  fetchLeaveAuditApi
} from "../../Api/leave/leave";
import "./LeaveRequest.css";

function LeaveRequest() {
  const { user, hasPermission } = useAuth();

  const isOwner = user?.priority === 1 || user?.roleCode === "OWNER";
  const canReadOwn = !isOwner && (hasPermission("leave.read.own") || hasPermission("leave.create.own"));
  const canCreateOwn = !isOwner && hasPermission("leave.create.own");
  const canCancelOwn = !isOwner && (hasPermission("leave.cancel.own") || hasPermission("leave.cancel"));
  const canReadTeam = hasPermission("leave.read.team");
  const canReadAll = isOwner || hasPermission("leave.read.all") || hasPermission("*");
  const canApprove = hasPermission("leave.approve");
  const canReject = hasPermission("leave.reject");
  const canAudit = hasPermission("leave.audit");

  // Active Tab State
  const defaultTab = canReadOwn ? "my-leave" : (canApprove || canReject) ? "approvals" : canReadTeam ? "team" : "all";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Data States
  const [balance, setBalance] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    leaveType: "SL",
    date: todayStr,
    isHalfDay: false,
    halfDayPeriod: "Morning",
    reason: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [formValidationErr, setFormValidationErr] = useState("");

  // Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (val) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };

  const handleTabChange = (k) => {
    setActiveTab(k);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setCurrentPage(1);
  };

  // Load Balance
  const loadBalance = useCallback(async () => {
    if (!canReadOwn) return;
    try {
      setBalanceLoading(true);
      const res = await fetchLeaveBalanceApi();
      if (res?.data?.balance) {
        setBalance(res.data.balance);
      }
    } catch (err) {
      console.warn("Balance load warning:", err.message);
    } finally {
      setBalanceLoading(false);
    }
  }, [canReadOwn]);

  // Load My Leaves
  const loadMyLeaves = useCallback(async () => {
    if (!canReadOwn) return;
    try {
      setLoading(true);
      const res = await fetchMyLeavesApi();
      if (res?.data) {
        setMyLeaves(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [canReadOwn]);

  // Load Team Leaves
  const loadTeamLeaves = useCallback(async () => {
    if (!canReadTeam) return;
    try {
      setLoading(true);
      const res = await fetchTeamLeavesApi();
      if (res?.data) {
        setTeamLeaves(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [canReadTeam]);

  // Load All Leaves
  const loadAllLeaves = useCallback(async () => {
    if (!canReadAll) return;
    try {
      setLoading(true);
      const res = await fetchAllLeavesApi();
      if (res?.data) {
        setAllLeaves(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [canReadAll]);

  useEffect(() => {
    loadBalance();
    if (activeTab === "my-leave") {
      loadMyLeaves();
    } else if (activeTab === "team") {
      loadTeamLeaves();
    } else if (activeTab === "all") {
      if (canReadAll) loadAllLeaves();
    } else if (activeTab === "approvals" || activeTab === "calendar") {
      if (canReadAll) loadAllLeaves();
      else if (canReadTeam) loadTeamLeaves();
    }
  }, [activeTab, loadBalance, loadMyLeaves, loadTeamLeaves, loadAllLeaves, canReadAll, canReadTeam]);

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      // Real-time Sunday Check
      if (name === "date") {
        const d = new Date(`${val}T00:00:00`);
        if (d.getDay() === 0) {
          setFormValidationErr("Sunday is a non-working day. Leave cannot be requested on Sundays.");
        } else if (val < todayStr) {
          setFormValidationErr("Self-service leave cannot be requested for past dates.");
        } else {
          setFormValidationErr("");
        }
      }
      return updated;
    });
  };

  // Submit Leave Request Handler
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFormValidationErr("");

    if (!canCreateOwn) {
      setErrorMsg("You do not have permission to submit leave applications.");
      return;
    }

    // Client-side validations
    if (!formData.reason || formData.reason.trim().length < 5) {
      setFormValidationErr("Reason must be at least 5 characters long.");
      return;
    }

    const selectedDate = new Date(`${formData.date}T00:00:00`);
    if (selectedDate.getDay() === 0) {
      setFormValidationErr("Sunday is a non-working day. Leave cannot be requested on Sundays.");
      return;
    }

    if (formData.date < todayStr) {
      setFormValidationErr("Self-service leave cannot be requested for past dates.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leaveType: formData.leaveType,
        date: formData.date,
        isHalfDay: formData.isHalfDay,
        halfDayPeriod: formData.isHalfDay ? formData.halfDayPeriod : undefined,
        reason: formData.reason.trim()
      };

      await applyLeaveApi(payload);
      setSuccessMsg("Leave application submitted successfully!");
      setFormData({
        leaveType: "SL",
        date: todayStr,
        isHalfDay: false,
        halfDayPeriod: "Morning",
        reason: ""
      });
      loadBalance();
      loadMyLeaves();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Pending Request Handler
  const handleCancelRequest = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this pending leave request?")) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setActionLoading(true);
      await cancelLeaveApi(leaveId);
      setSuccessMsg("Leave request cancelled successfully.");
      loadBalance();
      loadMyLeaves();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Request Handler
  const handleApproveRequest = async (leaveId) => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setActionLoading(true);
      await approveLeaveApi(leaveId);
      setSuccessMsg("Leave request approved successfully.");
      loadAllLeaves();
      if (canReadTeam) loadTeamLeaves();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setRejectionReasonInput("");
    setShowRejectModal(true);
  };

  // Confirm Reject Handler
  const handleConfirmReject = async () => {
    if (!selectedLeaveId) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setActionLoading(true);
      await rejectLeaveApi(selectedLeaveId, rejectionReasonInput);
      setSuccessMsg("Leave request rejected.");
      setShowRejectModal(false);
      loadAllLeaves();
      if (canReadTeam) loadTeamLeaves();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // View Audit History
  const handleViewAudit = async (leaveId) => {
    if (!canAudit) return;
    try {
      setAuditLoading(true);
      setShowAuditModal(true);
      const res = await fetchLeaveAuditApi(leaveId);
      if (res?.data) {
        setAuditData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message);
      setShowAuditModal(false);
    } finally {
      setAuditLoading(false);
    }
  };

  // Format Status Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <span className="leave-badge leave-badge-approved"><FaCheckCircle className="me-1" /> Approved</span>;
      case "Rejected":
        return <span className="leave-badge leave-badge-rejected"><FaTimesCircle className="me-1" /> Rejected</span>;
      case "Cancelled":
        return <span className="leave-badge leave-badge-cancelled"><FaBan className="me-1" /> Cancelled</span>;
      default:
        return <span className="leave-badge leave-badge-pending"><FaClock className="me-1" /> Pending</span>;
    }
  };

  // Pending Approvals List (Filtered for Approvers according to scope)
  const approvalSourceList = canReadAll ? allLeaves : canReadTeam ? teamLeaves : [];
  const pendingApprovalsList = (approvalSourceList || []).filter((l) => l.status === "Pending");

  // Filtered List Helper (Status, Type & Multi-field text search)
  const filterList = (list) => {
    return (list || []).filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesType = typeFilter === "ALL" || item.leaveType === typeFilter;
      const empName = item.employeeId
        ? `${item.employeeId.firstName || ""} ${item.employeeId.lastName || ""} ${item.employeeId.employeeCode || ""}`
        : "";
      const matchesSearch =
        !searchQuery ||
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.leaveType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  };

  // Reusable Compact Pagination Component (5 records per page)
  const renderPagination = (totalRecords) => {
    if (totalRecords === 0) return null;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1;
    const startIdx = (currentPage - 1) * PAGE_SIZE + 1;
    const endIdx = Math.min(currentPage * PAGE_SIZE, totalRecords);

    return (
      <div className="leave-pagination-bar">
        <div className="leave-pagination-info">
          Showing <span className="fw-bold text-dark">{startIdx}–{endIdx}</span> of{" "}
          <span className="fw-bold text-dark">{totalRecords}</span> records
        </div>
        {totalPages > 1 && (
          <Pagination size="sm" className="leave-pagination mb-0">
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Pagination.Prev>
            {[...Array(totalPages)].map((_, i) => {
              const pg = i + 1;
              if (totalPages > 7) {
                if (pg !== 1 && pg !== totalPages && Math.abs(pg - currentPage) > 2) {
                  if (pg === 2 || pg === totalPages - 1) {
                    return <Pagination.Ellipsis key={`ell-${pg}`} disabled />;
                  }
                  return null;
                }
              }
              return (
                <Pagination.Item
                  key={pg}
                  active={pg === currentPage}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </Pagination.Item>
              );
            })}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Pagination.Next>
          </Pagination>
        )}
      </div>
    );
  };

  // Data sets for the active tabs
  const filteredAllLeaves = filterList(allLeaves);
  const paginatedAllLeaves = filteredAllLeaves.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const filteredTeamLeaves = filterList(teamLeaves);
  const paginatedTeamLeaves = filteredTeamLeaves.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const filteredApprovals = filterList(pendingApprovalsList);
  const paginatedApprovals = filteredApprovals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const filteredMyLeaves = filterList(myLeaves);
  const paginatedMyLeaves = filteredMyLeaves.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Container fluid className="leave-container no-scrollbar">
      {/* Header Section */}
      <Row className="mb-2 align-items-center g-2">
        <Col>
          <div className="d-flex align-items-center gap-2">
            <div className="leave-header-icon">
              <FaCalendarAlt />
            </div>
            <h4 className="leave-page-title">
              Leave Management
            </h4>
          </div>
          <p className="text-muted extra-small mb-0 mt-1">
            {isOwner ? "View company leave requests, monitor approvals, and inspect workflow history." : "Apply for leaves, view balances, and manage team requests."}
          </p>
        </Col>
      </Row>

      {/* Top Banner Alerts */}
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="py-2 px-3 small mb-2 rounded-3 shadow-xs">
          <FaExclamationTriangle className="me-2" />
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg("")} className="py-2 px-3 small mb-2 rounded-3 shadow-xs">
          <FaCheckCircle className="me-2 text-success" />
          {successMsg}
        </Alert>
      )}

      {/* Balance Summary Header Cards (Hidden for Owner) */}
      {canReadOwn && (
        <Row className="g-2 mb-3">
          <Col md={4}>
            <Card className="leave-balance-card sl">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="leave-balance-label">
                    Sick Leave (SL)
                  </span>
                  <h5 className="leave-balance-value">
                    {balanceLoading ? (
                      <Spinner size="sm" animation="border" variant="info" />
                    ) : (
                      `${balance?.SL?.remaining ?? 2.0} / ${balance?.SL?.allocated ?? 2.0} Days`
                    )}
                  </h5>
                  <span className="extra-small text-muted">2 days/month allocation</span>
                </div>
                <div className="leave-balance-tag sl">
                  SL
                </div>
              </div>
              <div className="leave-progress-track">
                <div
                  className="leave-progress-bar sl"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((balance?.SL?.remaining ?? 2.0) / (balance?.SL?.allocated ?? 2.0)) * 100))}%`
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="leave-balance-card cl">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="leave-balance-label">
                    Casual Leave (CL)
                  </span>
                  <h5 className="leave-balance-value">
                    {balanceLoading ? (
                      <Spinner size="sm" animation="border" variant="warning" />
                    ) : (
                      `${balance?.CL?.remaining ?? 1.0} / ${balance?.CL?.allocated ?? 1.0} Days`
                    )}
                  </h5>
                  <span className="extra-small text-muted">1 day/month allocation</span>
                </div>
                <div className="leave-balance-tag cl">
                  CL
                </div>
              </div>
              <div className="leave-progress-track">
                <div
                  className="leave-progress-bar cl"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((balance?.CL?.remaining ?? 1.0) / (balance?.CL?.allocated ?? 1.0)) * 100))}%`
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="leave-balance-card lop">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="leave-balance-label">
                    Unpaid Leave (LOP)
                  </span>
                  <h5 className="leave-balance-value">
                    {balanceLoading ? (
                      <Spinner size="sm" animation="border" variant="secondary" />
                    ) : (
                      `${balance?.LOP?.used ?? 0} Days Used`
                    )}
                  </h5>
                  <span className="extra-small text-muted">Subject to supervisor approval</span>
                </div>
                <div className="leave-balance-tag lop">
                  LOP
                </div>
              </div>
              <div className="leave-progress-track">
                <div
                  className="leave-progress-bar lop"
                  style={{
                    width: `${Math.min(100, (balance?.LOP?.used ?? 0) * 15)}%`
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Tabbed Layout */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => handleTabChange(k)}>
        {/* Segmented Compact Pill Navigation */}
        <div className="leave-nav-pills">
          {canReadOwn && (
            <button
              type="button"
              className={`leave-nav-btn ${activeTab === "my-leave" ? "active" : ""}`}
              onClick={() => handleTabChange("my-leave")}
            >
              <FaCalendarAlt className="me-2" /> My Leave Requests
            </button>
          )}
          {(canApprove || canReject) && (
            <button
              type="button"
              className={`leave-nav-btn ${activeTab === "approvals" ? "active" : ""}`}
              onClick={() => handleTabChange("approvals")}
            >
              <FaUserCheck className="me-2" /> Pending Approvals
              {pendingApprovalsList.length > 0 && (
                <span className="leave-nav-badge">{pendingApprovalsList.length}</span>
              )}
            </button>
          )}
          {canReadTeam && (
            <button
              type="button"
              className={`leave-nav-btn ${activeTab === "team" ? "active" : ""}`}
              onClick={() => handleTabChange("team")}
            >
              <FaUsers className="me-2" /> Team Requests
            </button>
          )}
          {canReadAll && (
            <button
              type="button"
              className={`leave-nav-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => handleTabChange("all")}
            >
              <FaUsers className="me-2" /> All Company Leaves
            </button>
          )}
          {(canReadTeam || canReadAll) && (
            <button
              type="button"
              className={`leave-nav-btn ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => handleTabChange("calendar")}
            >
              <FaCalendarAlt className="me-2" /> Leave Schedule
            </button>
          )}
        </div>

        <Card className="leave-main-card">
          <Card.Body className="p-3">
            <Tab.Content>
              {/* TAB 1: MY LEAVE (Apply Form + History) */}
              {canReadOwn && (
                <Tab.Pane eventKey="my-leave">
                  <Row className="g-3">
                    {/* Left: Apply Leave Form */}
                    {canCreateOwn && (
                      <Col lg={5}>
                        <div className="leave-apply-card">
                          <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                            <FaPlus className="text-success" /> Apply for Leave
                          </h6>
                          {formValidationErr && (
                            <Alert variant="warning" className="small py-1 px-2 mb-2 rounded-2">
                              <FaExclamationTriangle className="me-1" /> {formValidationErr}
                            </Alert>
                          )}

                          <Form onSubmit={handleSubmitLeave}>
                            <Form.Group className="mb-2">
                              <Form.Label className="small fw-bold text-dark mb-1">Leave Type</Form.Label>
                              <Form.Select
                                name="leaveType"
                                value={formData.leaveType}
                                onChange={handleInputChange}
                                className="form-select-sm shadow-none border"
                              >
                                <option value="SL">Sick Leave (SL) — 2.0 days/mo</option>
                                <option value="CL">Casual Leave (CL) — 1.0 day/mo</option>
                                <option value="LOP">Unpaid Leave (LOP) — Subject to approval</option>
                              </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-2">
                              <Form.Label className="small fw-bold text-dark mb-1">Requested Date</Form.Label>
                              <Form.Control
                                type="date"
                                name="date"
                                min={todayStr}
                                value={formData.date}
                                onChange={handleInputChange}
                                className="form-control-sm shadow-none border"
                                required
                              />
                              <Form.Text className="text-muted extra-small">
                                One working calendar date. Sundays are non-working.
                              </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-2">
                              <div className="leave-halfday-box">
                                <Form.Check
                                  type="checkbox"
                                  id="isHalfDay"
                                  name="isHalfDay"
                                  label="Apply as Half Day Leave (0.5 day)"
                                  checked={formData.isHalfDay}
                                  onChange={handleInputChange}
                                  className="small text-dark fw-semibold"
                                />
                                {formData.isHalfDay && (
                                  <div className="mt-2 pt-2 border-top">
                                    <Form.Label className="extra-small fw-bold text-muted mb-1 text-uppercase">Half Day Period</Form.Label>
                                    <div className="d-flex gap-4">
                                      <Form.Check
                                        type="radio"
                                        name="halfDayPeriod"
                                        id="morning"
                                        label="Morning"
                                        value="Morning"
                                        checked={formData.halfDayPeriod === "Morning"}
                                        onChange={handleInputChange}
                                        className="small"
                                      />
                                      <Form.Check
                                        type="radio"
                                        name="halfDayPeriod"
                                        id="afternoon"
                                        label="Afternoon"
                                        value="Afternoon"
                                        checked={formData.halfDayPeriod === "Afternoon"}
                                        onChange={handleInputChange}
                                        className="small"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label className="small fw-bold text-dark mb-1">Reason for Leave</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                name="reason"
                                placeholder="State reason clearly (minimum 5 characters)..."
                                value={formData.reason}
                                onChange={handleInputChange}
                                className="form-control-sm shadow-none border"
                                required
                              />
                            </Form.Group>

                            <button
                              type="submit"
                              disabled={submitting || Boolean(formValidationErr)}
                              className="leave-submit-btn"
                            >
                              {submitting ? <Spinner size="sm" animation="border" /> : <><FaPlus /> Submit Application</>}
                            </button>
                          </Form>
                        </div>
                      </Col>
                    )}

                    {/* Right: My Leave History */}
                    <Col lg={canCreateOwn ? 7 : 12}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                          <FaHistory className="text-success" /> My Leave History
                        </h6>
                        <span className="leave-count-badge">
                          {filteredMyLeaves.length} Records
                        </span>
                      </div>

                      <div className="table-responsive">
                        <Table hover className="leave-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th className="py-2 px-2">Leave Type</th>
                              <th className="py-2 px-2">Date & Duration</th>
                              <th className="py-2 px-2">Reason</th>
                              <th className="py-2 px-2 text-center">Status</th>
                              <th className="py-2 px-2 text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loading ? (
                              <tr>
                                <td colSpan={5} className="text-center py-4"><Spinner animation="border" size="sm" variant="success" /></td>
                              </tr>
                            ) : paginatedMyLeaves.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-4 text-muted">No personal leave applications found.</td>
                              </tr>
                            ) : (
                              paginatedMyLeaves.map((item) => (
                                <tr key={item._id}>
                                  <td className="py-2 px-2">
                                    <div className="fw-bold text-dark leave-emp-name">{item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"}</div>
                                    <small className="text-muted extra-small">{item.title}</small>
                                  </td>
                                  <td className="py-2 px-2">
                                    <div className="fw-semibold text-dark leave-date-text">{new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                    <small className="text-muted extra-small">{item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day (1.0 Day)"}</small>
                                  </td>
                                  <td className="py-2 px-2 leave-reason-cell">
                                    <span className="leave-reason-text" title={item.reason}>{item.reason}</span>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {getStatusBadge(item.status)}
                                  </td>
                                  <td className="py-2 px-2 text-end">
                                    <div className="d-flex justify-content-end align-items-center gap-1">
                                      {canCancelOwn && item.status === "Pending" && (
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          className="p-1 px-2 extra-small rounded-pill"
                                          disabled={actionLoading}
                                          onClick={() => handleCancelRequest(item._id)}
                                        >
                                          Cancel
                                        </Button>
                                      )}
                                      {canAudit && (
                                        <Button
                                          variant="light"
                                          size="sm"
                                          className="leave-audit-btn p-1 text-muted border-0 shadow-none"
                                          title="View Audit Trail"
                                          onClick={() => handleViewAudit(item._id)}
                                        >
                                          <FaHistory size={13} />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                      {renderPagination(filteredMyLeaves.length)}
                    </Col>
                  </Row>
                </Tab.Pane>
              )}

              {/* TAB 2: PENDING APPROVALS */}
              {(canApprove || canReject) && (
                <Tab.Pane eventKey="approvals">
                  <div className="leave-toolbar d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                        <FaUserCheck className="text-success" /> Pending Leave Approvals
                      </h6>
                      <span className="leave-count-badge">
                        {filteredApprovals.length} Action Required
                      </span>
                    </div>

                    {pendingApprovalsList.length > 0 && (
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <InputGroup size="sm" className="leave-search-group">
                          <InputGroup.Text className="bg-white border-end-0 text-muted">
                            <FaSearch size={12} />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search pending..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="border-start-0 shadow-none leave-search-input"
                          />
                        </InputGroup>

                        <Form.Select
                          size="sm"
                          value={typeFilter}
                          onChange={(e) => handleTypeFilterChange(e.target.value)}
                          className="leave-type-select shadow-none"
                        >
                          <option value="ALL">All Types</option>
                          <option value="SL">Sick (SL)</option>
                          <option value="CL">Casual (CL)</option>
                          <option value="LOP">Unpaid (LOP)</option>
                        </Form.Select>

                        {(searchQuery || typeFilter !== "ALL") && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleResetFilters}
                            className="leave-reset-btn d-flex align-items-center gap-1"
                            title="Reset filters"
                          >
                            <FaUndo size={11} /> Reset
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {pendingApprovalsList.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded-3">
                      <FaCheckCircle size={30} className="text-success mb-2" />
                      <h6 className="fw-bold text-dark mb-1">Queue is clear!</h6>
                      <p className="text-muted extra-small mb-0">No pending leave requests requiring your review at this time.</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <Table hover className="leave-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th className="py-2 px-3">Employee</th>
                              <th className="py-2 px-3">Leave Type</th>
                              <th className="py-2 px-3">Requested Date</th>
                              <th className="py-2 px-3">Duration</th>
                              <th className="py-2 px-3">Reason</th>
                              <th className="py-2 px-3 text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedApprovals.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-4 text-muted">
                                  No pending leave requests match your search criteria.
                                </td>
                              </tr>
                            ) : (
                              paginatedApprovals.map((item) => {
                                const isSelf = item.employeeId?._id === user?.id || item.employeeId === user?.id;
                                return (
                                  <tr key={item._id}>
                                    <td className="py-2 px-3">
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="leave-avatar-chip">
                                          {(item.employeeId?.firstName?.[0] || "E") + (item.employeeId?.lastName?.[0] || "")}
                                        </div>
                                        <div className="leave-emp-info">
                                          <div className="fw-bold text-dark leave-emp-name">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                                          <span className="leave-emp-code">{item.employeeId?.employeeCode || item.employeeId?.email || "Employee"}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">
                                      <span className={`leave-type-badge ${item.leaveType === "SL" ? "sl" : item.leaveType === "CL" ? "cl" : "lop"}`}>
                                        {item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 fw-semibold text-dark leave-date-text">
                                      {new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-2 px-3 extra-small text-muted">
                                      {item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day (1.0 Day)"}
                                    </td>
                                    <td className="py-2 px-3 leave-reason-cell-wide">
                                      <span className="leave-reason-text" title={item.reason}>{item.reason}</span>
                                    </td>
                                    <td className="py-2 px-3 text-end">
                                      {isSelf ? (
                                        <span className="badge bg-light text-muted border px-2 py-1 rounded-pill extra-small">Self-approval Disabled</span>
                                      ) : (
                                        <div className="d-flex justify-content-end align-items-center gap-1">
                                          {canApprove && (
                                            <button
                                              type="button"
                                              disabled={actionLoading}
                                              onClick={() => handleApproveRequest(item._id)}
                                              className="leave-btn-approve"
                                            >
                                              Approve
                                            </button>
                                          )}
                                          {canReject && (
                                            <Button
                                              variant="outline-danger"
                                              size="sm"
                                              disabled={actionLoading}
                                              onClick={() => openRejectModal(item._id)}
                                              className="leave-btn-reject"
                                            >
                                              Reject
                                            </Button>
                                          )}
                                          {canAudit && (
                                            <Button
                                              variant="light"
                                              size="sm"
                                              className="leave-audit-btn p-1 text-muted border-0 shadow-none"
                                              onClick={() => handleViewAudit(item._id)}
                                              title="Audit Trail"
                                            >
                                              <FaHistory size={13} />
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </Table>
                      </div>
                      {renderPagination(filteredApprovals.length)}
                    </>
                  )}
                </Tab.Pane>
              )}

              {/* TAB 3: TEAM LEAVES */}
              {canReadTeam && (
                <Tab.Pane eventKey="team">
                  <div className="leave-toolbar d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                        <FaUsers className="text-success" /> Team Leave Requests
                      </h6>
                      <span className="leave-count-badge">
                        {filteredTeamLeaves.length} Records
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <InputGroup size="sm" className="leave-search-group">
                        <InputGroup.Text className="bg-white border-end-0 text-muted">
                          <FaSearch size={12} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search employee / reason..."
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="border-start-0 shadow-none leave-search-input"
                        />
                      </InputGroup>

                      <Form.Select
                        size="sm"
                        value={statusFilter}
                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                        className="leave-status-select shadow-none"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>

                      <Form.Select
                        size="sm"
                        value={typeFilter}
                        onChange={(e) => handleTypeFilterChange(e.target.value)}
                        className="leave-type-select shadow-none"
                      >
                        <option value="ALL">All Types</option>
                        <option value="SL">Sick (SL)</option>
                        <option value="CL">Casual (CL)</option>
                        <option value="LOP">Unpaid (LOP)</option>
                      </Form.Select>

                      {(searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleResetFilters}
                          className="leave-reset-btn d-flex align-items-center gap-1"
                          title="Reset filters"
                        >
                          <FaUndo size={11} /> Reset
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table hover className="leave-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="py-2 px-3">Employee</th>
                          <th className="py-2 px-3">Leave Type</th>
                          <th className="py-2 px-3">Date & Duration</th>
                          <th className="py-2 px-3">Reason</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 px-3 text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTeamLeaves.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-muted">No team leave records found.</td>
                          </tr>
                        ) : (
                          paginatedTeamLeaves.map((item) => (
                            <tr key={item._id}>
                              <td className="py-2 px-3">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="leave-avatar-chip">
                                    {(item.employeeId?.firstName?.[0] || "E") + (item.employeeId?.lastName?.[0] || "")}
                                  </div>
                                  <div className="leave-emp-info">
                                    <div className="fw-bold text-dark leave-emp-name">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                                    <span className="leave-emp-code">{item.employeeId?.employeeCode || "Employee"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`leave-type-badge ${item.leaveType === "SL" ? "sl" : item.leaveType === "CL" ? "cl" : "lop"}`}>
                                  {item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="fw-semibold text-dark leave-date-text">{new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <small className="text-muted extra-small">{item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day"}</small>
                              </td>
                              <td className="py-2 px-3 leave-reason-cell">
                                <span className="leave-reason-text" title={item.reason}>{item.reason}</span>
                              </td>
                              <td className="py-2 px-3 text-center">{getStatusBadge(item.status)}</td>
                              <td className="py-2 px-3 text-end">
                                {canAudit && (
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="leave-audit-btn p-1 text-muted border-0 shadow-none"
                                    onClick={() => handleViewAudit(item._id)}
                                    title="Audit Trail"
                                  >
                                    <FaHistory size={13} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                  {renderPagination(filteredTeamLeaves.length)}
                </Tab.Pane>
              )}

              {/* TAB 4: ALL COMPANY LEAVES (Company-Wide Leave Directory - Main Focus) */}
              {canReadAll && (
                <Tab.Pane eventKey="all">
                  <div className="leave-toolbar d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                        <FaUsers className="text-success" /> Company-Wide Leave Directory
                      </h6>
                      <span className="leave-count-badge">
                        {filteredAllLeaves.length} Records
                      </span>
                    </div>

                    {/* Single-Row Compact Filter Toolbar */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <InputGroup size="sm" className="leave-search-group">
                        <InputGroup.Text className="bg-white border-end-0 text-muted">
                          <FaSearch size={12} />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search employee / code..."
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="border-start-0 shadow-none leave-search-input"
                        />
                      </InputGroup>

                      <Form.Select
                        size="sm"
                        value={statusFilter}
                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                        className="leave-status-select shadow-none"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>

                      <Form.Select
                        size="sm"
                        value={typeFilter}
                        onChange={(e) => handleTypeFilterChange(e.target.value)}
                        className="leave-type-select shadow-none"
                      >
                        <option value="ALL">All Types</option>
                        <option value="SL">Sick (SL)</option>
                        <option value="CL">Casual (CL)</option>
                        <option value="LOP">Unpaid (LOP)</option>
                      </Form.Select>

                      {(searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleResetFilters}
                          className="leave-reset-btn d-flex align-items-center gap-1"
                          title="Reset filters"
                        >
                          <FaUndo size={11} /> Reset
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table hover className="leave-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="py-2 px-3">Employee</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Date & Duration</th>
                          <th className="py-2 px-3">Reason</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 px-3">Handled By</th>
                          <th className="py-2 px-3 text-end">Audit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAllLeaves.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">No company leave records found matching current filters.</td>
                          </tr>
                        ) : (
                          paginatedAllLeaves.map((item) => (
                            <tr key={item._id}>
                              <td className="py-2 px-3">
                                <div className="d-flex align-items-center gap-2">
                                  <div className="leave-avatar-chip">
                                    {(item.employeeId?.firstName?.[0] || "E") + (item.employeeId?.lastName?.[0] || "")}
                                  </div>
                                  <div className="leave-emp-info">
                                    <div className="fw-bold text-dark leave-emp-name">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                                    <span className="leave-emp-code">{item.employeeId?.employeeCode || "Employee"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`leave-type-badge ${item.leaveType === "SL" ? "sl" : item.leaveType === "CL" ? "cl" : "lop"}`}>
                                  {item.leaveType}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="fw-semibold text-dark leave-date-text">{new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <small className="text-muted extra-small">{item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day"}</small>
                              </td>
                              <td className="py-2 px-3 leave-reason-cell">
                                <span className="leave-reason-text" title={item.reason}>{item.reason}</span>
                              </td>
                              <td className="py-2 px-3 text-center">{getStatusBadge(item.status)}</td>
                              <td className="py-2 px-3">
                                <span className="text-dark extra-small fw-medium">
                                  {item.approvedBy ? `${item.approvedBy.firstName} ${item.approvedBy.lastName}` : "—"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-end">
                                {canAudit && (
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="leave-audit-btn p-1 text-muted border-0 shadow-none"
                                    onClick={() => handleViewAudit(item._id)}
                                    title="Audit Trail"
                                  >
                                    <FaHistory size={13} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                  {renderPagination(filteredAllLeaves.length)}
                </Tab.Pane>
              )}

              {/* TAB 5: LEAVE CALENDAR */}
              {(canReadTeam || canReadAll) && (
                <Tab.Pane eventKey="calendar">
                  <h6 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                    <FaCalendarAlt className="text-success" /> Approved Leave Schedule
                  </h6>
                  <div className="bg-light p-3 rounded-3 text-center">
                    <p className="text-muted extra-small mb-2">Displaying scheduled approved employee leaves for upcoming days.</p>
                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                      {(allLeaves.length > 0 ? allLeaves : teamLeaves)
                        .filter((l) => l.status === "Approved")
                        .map((item) => (
                          <div key={item._id} className="leave-calendar-card text-start">
                            <div className="fw-bold text-dark small">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                            <small className="text-muted extra-small">{new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                            <div className="mt-1">
                              <span className={`leave-type-badge ${item.leaveType === "SL" ? "sl" : item.leaveType === "CL" ? "cl" : "lop"}`}>
                                {item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"} ({item.isHalfDay ? "0.5 Day" : "1.0 Day"})
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </Tab.Pane>
              )}
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>

      {/* Reject Reason Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold text-danger d-flex align-items-center gap-2">
            <FaTimesCircle /> Reject Leave Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="small fw-bold text-dark">Rejection Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Provide a clear explanation for this rejection..."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="rounded-3 shadow-none border"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={actionLoading} onClick={handleConfirmReject} className="fw-bold px-3">
            {actionLoading ? <Spinner size="sm" animation="border" /> : "Confirm Reject"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Audit History Modal */}
      <Modal show={showAuditModal} onHide={() => setShowAuditModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
            <FaHistory className="text-secondary" /> Leave Workflow Audit Log
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {auditLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="success" /></div>
          ) : auditData ? (
            <div>
              <div className="mb-3 p-3 bg-light rounded-3 border">
                <div className="fw-bold text-dark">{auditData.title}</div>
                <small className="text-muted">Status: {auditData.status}</small>
              </div>

              <div className="leave-audit-heading">Status Transition History</div>
              <div className="leave-audit-timeline">
                {auditData.auditTrail?.map((log, idx) => (
                  <div key={idx} className="mb-2 position-relative">
                    <div className="fw-bold small text-dark">
                      {log.action} : {log.oldStatus || "New"} &rarr; <span className="text-primary">{log.newStatus}</span>
                    </div>
                    <small className="text-muted d-block extra-small">
                      By: {log.performedByName || log.performedBy?.firstName || "System"} at {new Date(log.performedAt).toLocaleString()}
                    </small>
                    {log.reason && <small className="text-danger d-block mt-1 extra-small">Reason: {log.reason}</small>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0 text-center py-3">No audit records available.</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default LeaveRequest;