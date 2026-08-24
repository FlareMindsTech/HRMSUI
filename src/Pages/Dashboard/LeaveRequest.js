import React, { useState, useEffect, useCallback } from "react";
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal, Tab, Nav, Alert, Spinner
} from "react-bootstrap";
import {
  FaCalendarAlt, FaCalendarCheck, FaClock, FaCheckCircle,
  FaTimesCircle, FaInfoCircle, FaPlus, FaBan, FaHistory, FaUserCheck, FaSearch, FaExclamationTriangle
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

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
        return <Badge bg="success" className="px-2 py-1 rounded-pill"><FaCheckCircle className="me-1" /> Approved</Badge>;
      case "Rejected":
        return <Badge bg="danger" className="px-2 py-1 rounded-pill"><FaTimesCircle className="me-1" /> Rejected</Badge>;
      case "Cancelled":
        return <Badge bg="secondary" className="px-2 py-1 rounded-pill"><FaBan className="me-1" /> Cancelled</Badge>;
      default:
        return <Badge bg="warning" className="text-dark px-2 py-1 rounded-pill"><FaClock className="me-1" /> Pending</Badge>;
    }
  };

  // Pending Approvals List (Filtered for Approvers according to scope)
  const approvalSourceList = canReadAll ? allLeaves : canReadTeam ? teamLeaves : [];
  const pendingApprovalsList = (approvalSourceList || []).filter((l) => l.status === "Pending");

  // Filtered List Helper
  const filterList = (list) => {
    return list.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const empName = item.employeeId
        ? `${item.employeeId.firstName || ""} ${item.employeeId.lastName || ""} ${item.employeeId.employeeCode || ""}`
        : "";
      const matchesSearch =
        !searchQuery ||
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.leaveType || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  return (
    <Container fluid className="p-3 no-scrollbar" style={{ height: "calc(100vh - var(--header-height))", overflowY: "auto" }}>
      {/* Top Banner / Alerts */}
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="mb-3">
          <FaExclamationTriangle className="me-2" />
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg("")} className="mb-3">
          <FaCheckCircle className="me-2" />
          {successMsg}
        </Alert>
      )}

      {/* Header Section */}
      <Row className="mb-3 align-items-center">
        <Col>
          <h4 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
            <FaCalendarAlt /> Leave Management
          </h4>
          <p className="text-muted small mb-0">
            {isOwner ? "View company leave requests, monitor approvals, and inspect workflow history." : "Apply for leaves, view balances, and manage team requests."}
          </p>
        </Col>
      </Row>

      {/* Balance Summary Header Cards (Hidden for Owner) */}
      {canReadOwn && (
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm rounded-3 bg-white p-3 border-start border-4 border-info">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted extra-small fw-bold uppercase">Sick Leave (SL)</span>
                  <h4 className="fw-bold mb-0 text-dark">
                    {balanceLoading ? <Spinner size="sm" animation="border" /> : `${balance?.SL?.remaining ?? 2.0} / ${balance?.SL?.allocated ?? 2.0} Days`}
                  </h4>
                  <small className="text-muted">2 days/month allocation</small>
                </div>
                <Badge bg="info" className="p-2 rounded-circle text-white">SL</Badge>
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm rounded-3 bg-white p-3 border-start border-4 border-warning">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted extra-small fw-bold uppercase">Casual Leave (CL)</span>
                  <h4 className="fw-bold mb-0 text-dark">
                    {balanceLoading ? <Spinner size="sm" animation="border" /> : `${balance?.CL?.remaining ?? 1.0} / ${balance?.CL?.allocated ?? 1.0} Days`}
                  </h4>
                  <small className="text-muted">1 day/month allocation</small>
                </div>
                <Badge bg="warning" className="p-2 rounded-circle text-dark">CL</Badge>
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm rounded-3 bg-white p-3 border-start border-4 border-secondary">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted extra-small fw-bold uppercase">Unpaid Leave (LOP)</span>
                  <h4 className="fw-bold mb-0 text-dark">
                    {balanceLoading ? <Spinner size="sm" animation="border" /> : `${balance?.LOP?.used ?? 0} Days Used`}
                  </h4>
                  <small className="text-muted">Allocated: No Limit</small>
                </div>
                <Badge bg="secondary" className="p-2 rounded-circle">LOP</Badge>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Tabbed Layout */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Card className="border-0 shadow-sm rounded-3 bg-white mb-4">
          <Card.Header className="bg-white border-bottom p-0">
            <Nav variant="tabs" className="px-3 border-bottom-0">
              {canReadOwn && (
                <Nav.Item>
                  <Nav.Link eventKey="my-leave" className="fw-bold text-dark py-3">
                    My Leave Requests
                  </Nav.Link>
                </Nav.Item>
              )}
              {(canApprove || canReject) && (
                <Nav.Item>
                  <Nav.Link eventKey="approvals" className="fw-bold text-dark py-3 position-relative">
                    Pending Approvals
                    {pendingApprovalsList.length > 0 && (
                      <Badge bg="danger" pill className="ms-2">{pendingApprovalsList.length}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              )}
              {canReadTeam && (
                <Nav.Item>
                  <Nav.Link eventKey="team" className="fw-bold text-dark py-3">
                    Team Leave Requests
                  </Nav.Link>
                </Nav.Item>
              )}
              {canReadAll && (
                <Nav.Item>
                  <Nav.Link eventKey="all" className="fw-bold text-dark py-3">
                    All Company Leaves
                  </Nav.Link>
                </Nav.Item>
              )}
              {(canReadTeam || canReadAll) && (
                <Nav.Item>
                  <Nav.Link eventKey="calendar" className="fw-bold text-dark py-3">
                    Leave Schedule Calendar
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>
          </Card.Header>

          <Card.Body className="p-4">
            <Tab.Content>
              {/* TAB 1: MY LEAVE (Apply Form + History) */}
              {canReadOwn && (
                <Tab.Pane eventKey="my-leave">
                  <Row className="g-4">
                    {/* Left: Apply Leave Form */}
                    {canCreateOwn && (
                      <Col lg={5}>
                        <Card className="border shadow-none rounded-3 h-100">
                          <Card.Body className="p-4">
                            <h5 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                              <FaPlus /> Apply for Leave
                            </h5>
                            {formValidationErr && (
                              <Alert variant="warning" className="small py-2 mb-3">
                                <FaExclamationTriangle className="me-1" /> {formValidationErr}
                              </Alert>
                            )}

                            <Form onSubmit={handleSubmitLeave}>
                              <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Leave Type</Form.Label>
                                <Form.Select
                                  name="leaveType"
                                  value={formData.leaveType}
                                  onChange={handleInputChange}
                                  className="shadow-none form-control-sm"
                                >
                                  <option value="SL">Sick Leave (SL) — 2.0 days/mo</option>
                                  <option value="CL">Casual Leave (CL) — 1.0 day/mo</option>
                                  <option value="LOP">Unpaid Leave (LOP) — Subject to approval</option>
                                </Form.Select>
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Requested Date</Form.Label>
                                <Form.Control
                                  type="date"
                                  name="date"
                                  min={todayStr}
                                  value={formData.date}
                                  onChange={handleInputChange}
                                  className="shadow-none form-control-sm"
                                  required
                                />
                                <Form.Text className="text-muted extra-small">
                                  V1 requests represent exactly ONE calendar date. Sundays are non-working.
                                </Form.Text>
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <Form.Check
                                  type="checkbox"
                                  id="isHalfDay"
                                  name="isHalfDay"
                                  label="Apply as Half Day Leave (0.5 day)"
                                  checked={formData.isHalfDay}
                                  onChange={handleInputChange}
                                  className="small text-dark fw-medium mb-2"
                                />
                                {formData.isHalfDay && (
                                  <div className="bg-light p-2 rounded border ms-3">
                                    <Form.Label className="small fw-bold mb-1">Half Day Period</Form.Label>
                                    <div className="d-flex gap-3">
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
                              </Form.Group>

                              <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold">Reason for Leave</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  name="reason"
                                  placeholder="Provide clear reason (at least 5 characters)..."
                                  value={formData.reason}
                                  onChange={handleInputChange}
                                  className="shadow-none form-control-sm"
                                  required
                                />
                              </Form.Group>

                              <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting || Boolean(formValidationErr)}
                                className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                              >
                                {submitting ? <Spinner size="sm" animation="border" /> : <><FaPlus /> Submit Request</>}
                              </Button>
                            </Form>
                          </Card.Body>
                        </Card>
                      </Col>
                    )}

                    {/* Right: My Leave History */}
                    <Col lg={canCreateOwn ? 7 : 12}>
                      <Card className="border shadow-none rounded-3 h-100">
                        <Card.Body className="p-4">
                          <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                            <FaHistory /> My Leave History
                          </h5>

                          <div className="table-responsive">
                            <Table borderless hover className="align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                              <thead className="bg-light border-bottom text-muted">
                                <tr>
                                  <th className="fw-bold py-2">Leave Type</th>
                                  <th className="fw-bold py-2">Date & Duration</th>
                                  <th className="fw-bold py-2">Reason</th>
                                  <th className="fw-bold py-2 text-center">Status</th>
                                  <th className="fw-bold py-2 text-end">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loading ? (
                                  <tr>
                                    <td colSpan={5} className="text-center py-4"><Spinner animation="border" size="sm" /></td>
                                  </tr>
                                ) : myLeaves.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="text-center py-4 text-muted">No leave applications found.</td>
                                  </tr>
                                ) : (
                                  myLeaves.map((item) => (
                                    <tr key={item._id} className="border-bottom-light">
                                      <td className="py-3">
                                        <div className="fw-bold text-dark">{item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"}</div>
                                        <small className="text-muted">{item.title}</small>
                                      </td>
                                      <td className="py-3">
                                        <div className="fw-medium text-dark">{new Date(item.startDate).toLocaleDateString()}</div>
                                        <small className="text-muted">{item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day (1.0 Day)"}</small>
                                      </td>
                                      <td className="py-3" style={{ maxWidth: "200px" }}>
                                        <div className="text-truncate" title={item.reason}>{item.reason}</div>
                                      </td>
                                      <td className="py-3 text-center">
                                        {getStatusBadge(item.status)}
                                      </td>
                                      <td className="py-3 text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                          {canCancelOwn && item.status === "Pending" && (
                                            <Button
                                              variant="outline-danger"
                                              size="sm"
                                              className="py-0 px-2 small"
                                              disabled={actionLoading}
                                              onClick={() => handleCancelRequest(item._id)}
                                            >
                                              Cancel
                                            </Button>
                                          )}
                                          {canAudit && (
                                            <Button
                                              variant="link"
                                              size="sm"
                                              className="p-0 text-muted shadow-none"
                                              title="View Audit Log"
                                              onClick={() => handleViewAudit(item._id)}
                                            >
                                              <FaHistory size={14} />
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
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>
              )}

              {/* TAB 2: PENDING APPROVALS */}
              {(canApprove || canReject) && (
                <Tab.Pane eventKey="approvals">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                      <FaUserCheck className="text-primary" /> Pending Leave Approvals
                    </h5>
                    <Badge bg="warning" className="text-dark">{pendingApprovalsList.length} Pending</Badge>
                  </div>

                  {pendingApprovalsList.length === 0 ? (
                    <div className="text-center py-5 bg-light rounded-3">
                      <FaCheckCircle size={32} className="text-success mb-2" />
                      <p className="text-muted mb-0">No pending leave requests requiring approval.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table borderless hover className="align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                        <thead className="bg-light border-bottom text-muted">
                          <tr>
                            <th className="fw-bold py-2">Employee</th>
                            <th className="fw-bold py-2">Leave Type</th>
                            <th className="fw-bold py-2">Requested Date</th>
                            <th className="fw-bold py-2">Duration</th>
                            <th className="fw-bold py-2">Reason</th>
                            <th className="fw-bold py-2 text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingApprovalsList.map((item) => {
                            const isSelf = item.employeeId?._id === user?.id || item.employeeId === user?.id;
                            return (
                              <tr key={item._id} className="border-bottom-light">
                                <td className="py-3">
                                  <div className="fw-bold text-dark">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                                  <small className="text-muted">{item.employeeId?.employeeCode || item.employeeId?.email || "Employee"}</small>
                                </td>
                                <td className="py-3">
                                  <Badge bg={item.leaveType === "SL" ? "info" : item.leaveType === "CL" ? "warning" : "secondary"}>
                                    {item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"}
                                  </Badge>
                                </td>
                                <td className="py-3 fw-medium">
                                  {new Date(item.startDate).toLocaleDateString()}
                                </td>
                                <td className="py-3">
                                  {item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day (1.0 Day)"}
                                </td>
                                <td className="py-3" style={{ maxWidth: "250px" }}>
                                  <div title={item.reason}>{item.reason}</div>
                                </td>
                                <td className="py-3 text-end">
                                  {isSelf ? (
                                    <Badge bg="light" className="text-muted border">Self-approval Disabled</Badge>
                                  ) : (
                                    <div className="d-flex justify-content-end gap-2">
                                      {canApprove && (
                                        <Button
                                          variant="success"
                                          size="sm"
                                          disabled={actionLoading}
                                          onClick={() => handleApproveRequest(item._id)}
                                          className="fw-bold px-3 py-1"
                                        >
                                          Approve
                                        </Button>
                                      )}
                                      {canReject && (
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          disabled={actionLoading}
                                          onClick={() => openRejectModal(item._id)}
                                          className="fw-bold px-3 py-1"
                                        >
                                          Reject
                                        </Button>
                                      )}
                                      {canAudit && (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 text-muted shadow-none"
                                          onClick={() => handleViewAudit(item._id)}
                                        >
                                          <FaHistory size={14} />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Tab.Pane>
              )}

              {/* TAB 3: TEAM LEAVES */}
              {canReadTeam && (
                <Tab.Pane eventKey="team">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0 text-dark">Team Leave Requests</h5>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder="Search employee / reason..."
                        size="sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: "200px" }}
                      />
                      <Form.Select
                        size="sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: "130px" }}
                      >
                        <option value="ALL">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table borderless hover className="align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                      <thead className="bg-light border-bottom text-muted">
                        <tr>
                          <th className="fw-bold py-2">Employee</th>
                          <th className="fw-bold py-2">Leave Type</th>
                          <th className="fw-bold py-2">Date & Duration</th>
                          <th className="fw-bold py-2">Reason</th>
                          <th className="fw-bold py-2 text-center">Status</th>
                          <th className="fw-bold py-2 text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterList(teamLeaves).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-muted">No team leave records found.</td>
                          </tr>
                        ) : (
                          filterList(teamLeaves).map((item) => (
                            <tr key={item._id} className="border-bottom-light">
                              <td className="py-3">
                                <div className="fw-bold text-dark">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                                <small className="text-muted">{item.employeeId?.employeeCode || "Employee"}</small>
                              </td>
                              <td className="py-3">
                                <Badge bg={item.leaveType === "SL" ? "info" : item.leaveType === "CL" ? "warning" : "secondary"}>
                                  {item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <div className="fw-medium text-dark">{new Date(item.startDate).toLocaleDateString()}</div>
                                <small className="text-muted">{item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day"}</small>
                              </td>
                              <td className="py-3" style={{ maxWidth: "200px" }}>
                                <div className="text-truncate" title={item.reason}>{item.reason}</div>
                              </td>
                              <td className="py-3 text-center">{getStatusBadge(item.status)}</td>
                              <td className="py-3 text-end">
                                {canAudit && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-muted shadow-none"
                                    onClick={() => handleViewAudit(item._id)}
                                  >
                                    <FaHistory size={14} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Tab.Pane>
              )}

              {/* TAB 4: ALL COMPANY LEAVES */}
              {canReadAll && (
                <Tab.Pane eventKey="all">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0 text-dark">Company-Wide Leave Directory</h5>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder="Search employee / code..."
                        size="sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: "220px" }}
                      />
                      <Form.Select
                        size="sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: "130px" }}
                      >
                        <option value="ALL">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <Table borderless hover className="align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                      <thead className="bg-light border-bottom text-muted">
                        <tr>
                          <th className="fw-bold py-2">Employee</th>
                          <th className="fw-bold py-2">Type</th>
                          <th className="fw-bold py-2">Date & Duration</th>
                          <th className="fw-bold py-2">Reason</th>
                          <th className="fw-bold py-2 text-center">Status</th>
                          <th className="fw-bold py-2">Approved / Handled By</th>
                          <th className="fw-bold py-2 text-end">Audit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterList(allLeaves).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">No leave records found.</td>
                          </tr>
                        ) : (
                          filterList(allLeaves).map((item) => (
                            <tr key={item._id} className="border-bottom-light">
                              <td className="py-3">
                                <div className="fw-bold text-dark">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                                <small className="text-muted">{item.employeeId?.employeeCode || "Employee"}</small>
                              </td>
                              <td className="py-3">
                                <Badge bg={item.leaveType === "SL" ? "info" : item.leaveType === "CL" ? "warning" : "secondary"}>
                                  {item.leaveType}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <div className="fw-medium text-dark">{new Date(item.startDate).toLocaleDateString()}</div>
                                <small className="text-muted">{item.isHalfDay ? `Half Day (${item.halfDayPeriod})` : "Full Day"}</small>
                              </td>
                              <td className="py-3" style={{ maxWidth: "200px" }}>
                                <div className="text-truncate" title={item.reason}>{item.reason}</div>
                              </td>
                              <td className="py-3 text-center">{getStatusBadge(item.status)}</td>
                              <td className="py-3">
                                <small className="text-dark fw-medium">
                                  {item.approvedBy ? `${item.approvedBy.firstName} ${item.approvedBy.lastName}` : "-"}
                                </small>
                              </td>
                              <td className="py-3 text-end">
                                {canAudit && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-muted shadow-none"
                                    onClick={() => handleViewAudit(item._id)}
                                  >
                                    <FaHistory size={14} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Tab.Pane>
              )}

              {/* TAB 5: LEAVE CALENDAR */}
              {(canReadTeam || canReadAll) && (
                <Tab.Pane eventKey="calendar">
                  <h5 className="fw-bold mb-3 text-dark">Approved Leave Schedule</h5>
                  <div className="bg-light p-4 rounded-3 text-center">
                    <p className="text-muted mb-2">Displaying scheduled approved employee leaves for the month.</p>
                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                      {(allLeaves.length > 0 ? allLeaves : teamLeaves)
                        .filter((l) => l.status === "Approved")
                        .map((item) => (
                          <Card key={item._id} className="border-0 shadow-sm p-3 text-start bg-white" style={{ minWidth: "220px" }}>
                            <div className="fw-bold text-primary">{item.employeeId?.firstName} {item.employeeId?.lastName}</div>
                            <small className="text-muted">{new Date(item.startDate).toLocaleDateString()}</small>
                            <div className="mt-2">
                              <Badge bg={item.leaveType === "SL" ? "info" : item.leaveType === "CL" ? "warning" : "secondary"}>
                                {item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"} ({item.isHalfDay ? "0.5 Day" : "1.0 Day"})
                              </Badge>
                            </div>
                          </Card>
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
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">Reject Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="small fw-bold">Rejection Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Provide a brief explanation for rejection..."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
          <Button variant="danger" size="sm" disabled={actionLoading} onClick={handleConfirmReject}>
            {actionLoading ? <Spinner size="sm" animation="border" /> : "Confirm Reject"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Audit History Modal */}
      <Modal show={showAuditModal} onHide={() => setShowAuditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
            <FaHistory /> Leave Workflow Audit Log
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {auditLoading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : auditData ? (
            <div>
              <div className="mb-3 p-2 bg-light rounded">
                <div className="fw-bold">{auditData.title}</div>
                <small className="text-muted">Status: {auditData.status}</small>
              </div>

              <h6 className="fw-bold small text-muted mb-3">Status Transition History</h6>
              <div className="timeline ps-3 border-start border-2 border-primary">
                {auditData.auditTrail?.map((log, idx) => (
                  <div key={idx} className="mb-3 position-relative">
                    <div className="fw-bold small text-dark">
                      {log.action} : {log.oldStatus || "New"} &rarr; {log.newStatus}
                    </div>
                    <small className="text-muted d-block">
                      By: {log.performedByName || log.performedBy?.firstName || "System"} at {new Date(log.performedAt).toLocaleString()}
                    </small>
                    {log.reason && <small className="text-danger d-block">Reason: {log.reason}</small>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted mb-0">No audit records available.</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default LeaveRequest;