import React, { useState, useEffect, useCallback } from "react";
import {
  Container, Row, Col, Card, Form, Button, Table, Modal, Tab
} from "react-bootstrap";
import {
  FaCalendarAlt, FaClock, FaCheckCircle,
  FaTimesCircle, FaPlus, FaBan, FaHistory, FaUserCheck, FaExclamationTriangle, FaUsers, FaUndo
} from "react-icons/fa";
import { useSelector } from 'react-redux';
import { selectAuthUser, useHasPermission } from '../../redux/slices/authSlice';
import LoadingSpinner from '../../Components/Common/LoadingSpinner';
import EmptyState from '../../Components/Common/EmptyState';
import DataTable from '../../Components/Common/DataTable';
import SearchInput from '../../Components/Common/SearchInput';
import PaginationBar from '../../Components/Common/PaginationBar';
import ConfirmModal from '../../Components/Common/ConfirmModal';
import FeedbackAlert from '../../Components/Common/FeedbackAlert';
import {
  applyLeaveApi,
  fetchLeaveBalanceApi,
  fetchMyLeavesApi,
  fetchTeamLeavesApi,
  fetchAllLeavesApi,
  cancelLeaveApi,
  approveLeaveApi,
  rejectLeaveApi,
  fetchLeaveAuditApi,
  fetchLeaveTypesApi,
  calculateLeaveDaysApi
} from "../../Api/leave/leave";
import "./LeaveRequest.css";

function LeaveRequest() {
  const user = useSelector(selectAuthUser);
  const hasPermission = useHasPermission();

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
  const [dynamicBalancesList, setDynamicBalancesList] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    leaveType: "",
    leaveTypeId: null,
    startDate: todayStr,
    endDate: todayStr,
    isHalfDay: false,
    halfDayPeriod: "Morning",
    reason: ""
  });
  const [calculationPreview, setCalculationPreview] = useState(null);
  const [calculatingDays, setCalculatingDays] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formValidationErr, setFormValidationErr] = useState("");

  // Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Cancel-confirmation Modal State (replaces window.confirm)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);

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

  const formatLeaveDateRange = (item) => {
    if (!item?.startDate) return "-";
    const startStr = new Date(item.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (!item.endDate) return startStr;
    const endStr = new Date(item.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  };

  const formatLeaveDuration = (item) => {
    if (!item) return "-";
    const days = item.totalDays ?? (item.isHalfDay ? 0.5 : 1.0);
    return item.isHalfDay ? `Half Day (${item.halfDayPeriod || "0.5d"})` : `${days} Day${days === 1 ? "" : "s"}`;
  };

  // Load Dynamic Leave Types
  useEffect(() => {
    fetchLeaveTypesApi({ activeOnly: "true" })
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        if (list.length > 0) {
          setAvailableLeaveTypes(list);
          setFormData((prev) => ({
            ...prev,
            leaveType: list[0].code,
            leaveTypeId: list[0]._id,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Load Balance
  const loadBalance = useCallback(async () => {
    if (!canReadOwn) return;
    try {
      setBalanceLoading(true);
      const res = await fetchLeaveBalanceApi();
      if (res?.data?.balance) {
        setBalance(res.data.balance);
      }
      if (res?.data?.balances) {
        setDynamicBalancesList(res.data.balances);
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

  // Live Working Days Calculation Preview
  useEffect(() => {
    if (!formData.startDate) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setCalculatingDays(true);
        const res = await calculateLeaveDaysApi({
          startDate: formData.startDate,
          endDate: formData.endDate || formData.startDate,
          isHalfDay: formData.isHalfDay,
          halfDayPeriod: formData.halfDayPeriod,
          leaveTypeId: formData.leaveTypeId || undefined,
        });
        if (isMounted && res?.data) {
          setCalculationPreview(res.data);
          if (res.data.totalDays === 0) {
            setFormValidationErr("Selected date range has no working days (all days are weekly offs or holidays).");
          } else {
            setFormValidationErr("");
          }
        }
      } catch (err) {
        if (isMounted) {
          setCalculationPreview(null);
          setFormValidationErr(err.message || "Failed to calculate working days");
        }
      } finally {
        if (isMounted) setCalculatingDays(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData.startDate, formData.endDate, formData.isHalfDay, formData.halfDayPeriod, formData.leaveTypeId]);

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name === "leaveType") {
      const selectedLt = availableLeaveTypes.find((lt) => lt.code === value);
      setFormData((prev) => ({
        ...prev,
        leaveType: value,
        leaveTypeId: selectedLt?._id || null,
      }));
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      if (name === "startDate") {
        if (val < todayStr) {
          setFormValidationErr("Self-service leave cannot be requested for past dates.");
        } else {
          setFormValidationErr("");
        }
        if (updated.endDate && updated.endDate < val) {
          updated.endDate = val;
        }
      } else if (name === "endDate") {
        if (val < updated.startDate) {
          setFormValidationErr("End date must be greater than or equal to start date.");
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

    if (formData.startDate < todayStr) {
      setFormValidationErr("Self-service leave cannot be requested for past dates.");
      return;
    }

    if (formData.endDate < formData.startDate) {
      setFormValidationErr("End date must be greater than or equal to start date.");
      return;
    }

    if (calculationPreview && calculationPreview.totalDays <= 0) {
      setFormValidationErr("Selected date range contains no working days (all dates are weekly offs or holidays).");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leaveType: formData.leaveType,
        leaveTypeId: formData.leaveTypeId || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isHalfDay: formData.isHalfDay,
        halfDayPeriod: formData.isHalfDay ? formData.halfDayPeriod : undefined,
        reason: formData.reason.trim()
      };

      await applyLeaveApi(payload);
      setSuccessMsg("Leave application submitted successfully!");
      setFormData((prev) => ({
        ...prev,
        startDate: todayStr,
        endDate: todayStr,
        isHalfDay: false,
        halfDayPeriod: "Morning",
        reason: ""
      }));
      setCalculationPreview(null);
      loadBalance();
      loadMyLeaves();
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit leave application.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Pending Request Handler
  // Opens the shared ConfirmModal; the actual cancel runs in
  // handleConfirmCancel so accept/cancel semantics stay identical
  // to the previous window.confirm flow.
  const handleCancelRequest = (leaveId) => {
    setPendingCancelId(leaveId);
    setShowCancelConfirm(true);
  };

  const handleCloseCancelConfirm = () => {
    setShowCancelConfirm(false);
    setPendingCancelId(null);
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancelId) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      setActionLoading(true);
      await cancelLeaveApi(pendingCancelId);
      setSuccessMsg("Leave request cancelled successfully.");
      setShowCancelConfirm(false);
      setPendingCancelId(null);
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
      <PaginationBar
        size="sm"
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(pg) => setCurrentPage(pg)}
        showEllipsis
        prevLabel="Previous"
        nextLabel="Next"
        info={
          <div className="leave-pagination-info">
            Showing <span className="fw-bold text-dark">{startIdx}–{endIdx}</span> of{" "}
            <span className="fw-bold text-dark">{totalRecords}</span> records
          </div>
        }
        wrapperClassName="leave-pagination-bar"
        paginationClassName="leave-pagination mb-0"
      />
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
        <FeedbackAlert variant="danger" dismissible onClose={() => setErrorMsg("")} className="py-2 px-3 small mb-2 rounded-3 shadow-xs" message={<><FaExclamationTriangle className="me-2" />{errorMsg}</>} />
      )}
      {successMsg && (
        <FeedbackAlert variant="success" dismissible onClose={() => setSuccessMsg("")} className="py-2 px-3 small mb-2 rounded-3 shadow-xs" message={<><FaCheckCircle className="me-2 text-success" />{successMsg}</>} />
      )}

      {/* Balance Summary Header Cards (Hidden for Owner) */}
      {canReadOwn && (
        <Row className="g-2 mb-3">
          {dynamicBalancesList.length > 0 ? (
            dynamicBalancesList.map((item) => {
              const code = item.leaveType?.code || "LEAVE";
              const name = item.leaveType?.name || code;
              const allocated = item.balance?.allocated ?? 0;
              const remaining = item.balance?.available ?? 0;
              const used = item.balance?.used ?? 0;
              const color = item.leaveType?.color || "#3B82F6";
              const pct = allocated > 0 ? Math.min(100, Math.max(0, (remaining / allocated) * 100)) : 0;
              return (
                <Col md={4} sm={6} xs={12} key={item.leaveType?._id || code}>
                  <Card className="leave-balance-card shadow-xs">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="leave-balance-label">
                          {name} ({code})
                        </span>
                        <h5 className="leave-balance-value">
                          {balanceLoading ? (
                            <LoadingSpinner variant="inline" size="sm" color="info" />
                          ) : (
                            `${remaining} / ${allocated} Days`
                          )}
                        </h5>
                        <span className="extra-small text-muted">{used} day(s) used</span>
                      </div>
                      <div
                        className="leave-balance-tag"
                        style={{
                          backgroundColor: `${color}18`,
                          color: color,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {code}
                      </div>
                    </div>
                    <div className="leave-progress-track">
                      <div
                        className="leave-progress-bar"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </Card>
                </Col>
              );
            })
          ) : balance && Object.keys(balance).length > 0 ? (
            Object.entries(balance).map(([code, val]) => {
              const allocated = val?.allocated ?? 0;
              const remaining = val?.remaining ?? 0;
              const used = val?.used ?? 0;
              const pct = allocated > 0 ? Math.min(100, Math.max(0, (remaining / allocated) * 100)) : 0;
              return (
                <Col md={4} sm={6} xs={12} key={code}>
                  <Card className="leave-balance-card shadow-xs">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="leave-balance-label">
                          {code}
                        </span>
                        <h5 className="leave-balance-value">
                          {balanceLoading ? (
                            <LoadingSpinner variant="inline" size="sm" color="info" />
                          ) : (
                            `${remaining} / ${allocated} Days`
                          )}
                        </h5>
                        <span className="extra-small text-muted">{used} day(s) used</span>
                      </div>
                      <div className="leave-balance-tag">
                        {code}
                      </div>
                    </div>
                    <div className="leave-progress-track">
                      <div
                        className="leave-progress-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Card>
                </Col>
              );
            })
          ) : (
            <Col xs={12}>
              <div className="text-muted small py-2 px-3 border rounded bg-light">
                {balanceLoading ? "Loading leave balances..." : "No active leave policy balances configured."}
              </div>
            </Col>
          )}
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
                            <FeedbackAlert variant="warning" className="small py-1 px-2 mb-2 rounded-2" message={<><FaExclamationTriangle className="me-1" /> {formValidationErr}</>} />
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
                                {availableLeaveTypes.length > 0 ? (
                                  availableLeaveTypes.map((lt) => (
                                    <option key={lt._id} value={lt.code}>
                                      {lt.name} ({lt.code})
                                    </option>
                                  ))
                                ) : (
                                  <option value="">No configured leave types available</option>
                                )}
                              </Form.Select>
                            </Form.Group>

                            <Row className="g-2 mb-2">
                              <Col sm={6}>
                                <Form.Group>
                                  <Form.Label className="small fw-bold text-dark mb-1">Start Date</Form.Label>
                                  <Form.Control
                                    type="date"
                                    name="startDate"
                                    min={todayStr}
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="form-control-sm shadow-none border"
                                    required
                                  />
                                </Form.Group>
                              </Col>
                              <Col sm={6}>
                                <Form.Group>
                                  <Form.Label className="small fw-bold text-dark mb-1">End Date</Form.Label>
                                  <Form.Control
                                    type="date"
                                    name="endDate"
                                    min={formData.startDate || todayStr}
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className="form-control-sm shadow-none border"
                                    required
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            {/* Working Days & Exclusions Preview */}
                            {calculationPreview && (
                              <div className="p-2 mb-2 bg-light border rounded small">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="text-muted">Working Days:</span>
                                  <strong className="text-primary">
                                    {calculationPreview.totalDays} day{calculationPreview.totalDays === 1 ? "" : "s"}
                                    {calculatingDays && " (updating...)"}
                                  </strong>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-1 extra-small text-muted">
                                  <span>Date Range:</span>
                                  <span>{calculationPreview.startDate} → {calculationPreview.endDate} ({calculationPreview.totalCalendarDays} cal days)</span>
                                </div>
                                {calculationPreview.excludedWeeklyOffs?.length > 0 && (
                                  <div className="extra-small text-secondary mb-1">
                                    Weekly Offs ({calculationPreview.excludedWeeklyOffs.length}):{" "}
                                    {calculationPreview.excludedWeeklyOffs.map((o) => `${o.date} (${o.dayName})`).join(", ")}
                                  </div>
                                )}
                                {calculationPreview.excludedHolidays?.length > 0 && (
                                  <div className="extra-small text-success mb-1">
                                    Holidays ({calculationPreview.excludedHolidays.length}):{" "}
                                    {calculationPreview.excludedHolidays.map((h) => `${h.date} (${h.title})`).join(", ")}
                                  </div>
                                )}
                                {calculationPreview.balance && (
                                  <div className="d-flex justify-content-between align-items-center pt-1 border-top extra-small">
                                    <span className="text-muted">Available: {calculationPreview.balance.available}d</span>
                                    <span className="fw-semibold text-info">Projected Remaining: {calculationPreview.balance.projectedRemaining}d</span>
                                  </div>
                                )}
                              </div>
                            )}

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
                              {submitting ? <LoadingSpinner variant="button" size="sm" /> : <><FaPlus /> Submit Application</>}
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
                        <DataTable
                          hover
                          className="leave-table align-middle mb-0"
                          columns={[
                            {
                              key: "type",
                              header: "Leave Type",
                              headerClassName: "py-2 px-2",
                              cellClassName: "py-2 px-2",
                              render: (item) => (
                                <>
                                  <div className="fw-bold text-dark leave-emp-name">{item.leaveType === "SL" ? "Sick Leave" : item.leaveType === "CL" ? "Casual Leave" : "Unpaid Leave"}</div>
                                  <small className="text-muted extra-small">{item.title}</small>
                                </>
                              ),
                            },
                            {
                              key: "date",
                              header: "Date & Duration",
                              headerClassName: "py-2 px-2",
                              cellClassName: "py-2 px-2",
                              render: (item) => (
                                <>
                                  <div className="fw-semibold text-dark leave-date-text">{formatLeaveDateRange(item)}</div>
                                  <small className="text-muted extra-small">{formatLeaveDuration(item)}</small>
                                </>
                              ),
                            },
                            {
                              key: "reason",
                              header: "Reason",
                              headerClassName: "py-2 px-2",
                              cellClassName: "py-2 px-2 leave-reason-cell",
                              render: (item) => (
                                <span className="leave-reason-text" title={item.reason}>{item.reason}</span>
                              ),
                            },
                            {
                              key: "status",
                              header: "Status",
                              headerClassName: "py-2 px-2 text-center",
                              cellClassName: "py-2 px-2 text-center",
                              render: (item) => getStatusBadge(item.status),
                            },
                            {
                              key: "action",
                              header: "Action",
                              headerClassName: "py-2 px-2 text-end",
                              cellClassName: "py-2 px-2 text-end",
                              render: (item) => (
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
                                      aria-label="View Audit Trail"
                                      onClick={() => handleViewAudit(item._id)}
                                    >
                                      <FaHistory size={13} />
                                    </Button>
                                  )}
                                </div>
                              ),
                            },
                          ]}
                          rows={paginatedMyLeaves}
                          rowKey={(item) => item._id}
                          loading={loading}
                          loadingComponent={
                            <LoadingSpinner variant="table" colSpan={5} color="success" size="sm" />
                          }
                          emptyComponent={
                            <EmptyState variant="table" colSpan={5} className="text-center py-4 text-muted" title="No personal leave applications found." />
                          }
                        />
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
                        <SearchInput
                          size="sm"
                          iconSize={12}
                          inputGroupClassName="leave-search-group"
                          inputGroupTextClassName="bg-white border-end-0 text-muted"
                          inputClassName="border-start-0 shadow-none leave-search-input"
                          type="text"
                          placeholder="Search pending..."
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                        />

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
                              <EmptyState variant="table" colSpan={6} className="text-center py-4 text-muted" title="No pending leave requests match your search criteria." />
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
                                      {formatLeaveDateRange(item)}
                                    </td>
                                    <td className="py-2 px-3 extra-small text-muted">
                                      {formatLeaveDuration(item)}
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
                                              aria-label="Audit Trail"
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
                      <SearchInput
                        size="sm"
                        iconSize={12}
                        inputGroupClassName="leave-search-group"
                        inputGroupTextClassName="bg-white border-end-0 text-muted"
                        inputClassName="border-start-0 shadow-none leave-search-input"
                        type="text"
                        placeholder="Search employee / reason..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />

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
                            <EmptyState variant="table" colSpan={6} className="text-center py-4 text-muted" title="No team leave records found." />
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
                                <div className="fw-semibold text-dark leave-date-text">{formatLeaveDateRange(item)}</div>
                                <small className="text-muted extra-small">{formatLeaveDuration(item)}</small>
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
                      <SearchInput
                        size="sm"
                        iconSize={12}
                        inputGroupClassName="leave-search-group"
                        inputGroupTextClassName="bg-white border-end-0 text-muted"
                        inputClassName="border-start-0 shadow-none leave-search-input"
                        type="text"
                        placeholder="Search employee / code..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />

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
                            <EmptyState variant="table" colSpan={7} className="text-center py-4 text-muted" title="No company leave records found matching current filters." />
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
                                <div className="fw-semibold text-dark leave-date-text">{formatLeaveDateRange(item)}</div>
                                <small className="text-muted extra-small">{formatLeaveDuration(item)}</small>
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
            {actionLoading ? <LoadingSpinner variant="button" size="sm" /> : "Confirm Reject"}
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
            <div className="text-center py-4"><LoadingSpinner color="success" /></div>
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

      {/* Cancel Leave Confirmation */}
      <ConfirmModal
        show={showCancelConfirm}
        onClose={handleCloseCancelConfirm}
        onConfirm={handleConfirmCancel}
        loading={actionLoading}
        title={<><FaBan /> Cancel Leave Request</>}
        message="Are you sure you want to cancel this pending leave request?"
        confirmLabel="Yes, Cancel"
      />
    </Container>
  );
}

export default LeaveRequest;