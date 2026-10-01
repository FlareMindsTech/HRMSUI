import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Modal, Form } from 'react-bootstrap';
import {
  MdExitToApp,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdAddCircle,
  MdRefresh,
  MdAssignmentTurnedIn,
  MdWorkHistory
} from 'react-icons/md';
import { useSelector } from 'react-redux';
import { selectAuthUser, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import DataTable from '../../Components/Common/DataTable';
import StatusBadge from '../../Components/Common/StatusBadge';
import LoadingSpinner from '../../Components/Common/LoadingSpinner';
import EmptyState from '../../Components/Common/EmptyState';
import FeedbackAlert from '../../Components/Common/FeedbackAlert';
import ConfirmModal from '../../Components/Common/ConfirmModal';
import PaginationBar from '../../Components/Common/PaginationBar';
import SearchInput from '../../Components/Common/SearchInput';
import {
  submitResignation,
  withdrawResignation,
  getAllResignations,
  updateExitDetails
} from '../../services/resignationService';
import {
  initiateOffboarding,
  updateDepartmentClearance,
  completeOffboarding,
  getAllOffboardings
} from '../../services/offboardingService';
import './LifecycleManagement.css';

const DEPARTMENTS = ['IT', 'FINANCE', 'HR', 'DEPARTMENT'];

function LifecycleManagement() {
  const currentUser = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const userRole = currentUser?.roleCode || currentUser?.role?.roleCode || '';
  const isHrOrAdmin = isSystemAdmin || ['OWNER', 'ADMIN', 'HR', 'HR_MANAGER'].includes(userRole);

  const [activeTab, setActiveTab] = useState(isHrOrAdmin ? 'resignations' : 'my-resignation');

  // Resignations state
  const [resignations, setResignations] = useState([]);
  const [resLoading, setResLoading] = useState(false);
  const [resSearch, setResSearch] = useState('');
  const [resStatusFilter, setResStatusFilter] = useState('ALL');
  const [resPage, setResPage] = useState(1);
  const [resTotal, setResTotal] = useState(0);

  // Offboardings state
  const [offboardings, setOffboardings] = useState([]);
  const [offLoading, setOffLoading] = useState(false);
  const [offSearch, setOffSearch] = useState('');
  const [offStatusFilter, setOffStatusFilter] = useState('ALL');
  const [offPage, setOffPage] = useState(1);
  const [offTotal, setOffTotal] = useState(0);

  // Feedback & modals
  const [alert, setAlert] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    reason: '',
    proposedLastWorkingDate: '',
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Review Exit modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'APPROVED',
    approvedLastWorkingDate: '',
    exitInterviewNotes: '',
    hrFeedback: '',
    managerFeedback: '',
    remarks: '',
  });

  // Clearance Modal
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [selectedOffboarding, setSelectedOffboarding] = useState(null);
  const [clearanceForm, setClearanceForm] = useState({
    department: 'IT',
    status: 'CLEARED',
    remarks: '',
  });

  // Withdraw Confirmation
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Complete Offboarding Confirmation
  const [completeTarget, setCompleteTarget] = useState(null);

  // Load Resignations
  const loadResignations = useCallback(async () => {
    setResLoading(true);
    try {
      const params = {
        page: resPage,
        limit: 10,
      };
      if (resStatusFilter !== 'ALL') params.status = resStatusFilter;
      const res = await getAllResignations(params);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setResignations(list);
      setResTotal(res.pagination?.total || list.length);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load resignations.' });
    } finally {
      setResLoading(false);
    }
  }, [resPage, resStatusFilter]);

  // Load Offboardings
  const loadOffboardings = useCallback(async () => {
    setOffLoading(true);
    try {
      const params = {
        page: offPage,
        limit: 10,
      };
      if (offStatusFilter !== 'ALL') params.status = offStatusFilter;
      const res = await getAllOffboardings(params);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setOffboardings(list);
      setOffTotal(res.pagination?.total || list.length);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load offboardings.' });
    } finally {
      setOffLoading(false);
    }
  }, [offPage, offStatusFilter]);

  useEffect(() => {
    if (activeTab === 'resignations' || activeTab === 'my-resignation') {
      loadResignations();
    } else if (activeTab === 'offboardings') {
      loadOffboardings();
    }
  }, [activeTab, loadResignations, loadOffboardings]);

  // Handle Submit Resignation
  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!submitForm.reason || !submitForm.proposedLastWorkingDate) {
      setAlert({ type: 'warning', message: 'Reason and proposed last working date are required.' });
      return;
    }
    setSubmitting(true);
    try {
      await submitResignation({
        reason: submitForm.reason,
        comments: submitForm.comments,
        requestedLastWorkingDate: submitForm.proposedLastWorkingDate || submitForm.requestedLastWorkingDate,
      });
      setAlert({ type: 'success', message: 'Resignation submitted successfully.' });
      setShowSubmitModal(false);
      setSubmitForm({ reason: '', proposedLastWorkingDate: '', comments: '' });
      loadResignations();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to submit resignation.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Withdraw
  const handleWithdrawConfirm = async () => {
    if (!withdrawTarget) return;
    try {
      await withdrawResignation(withdrawTarget._id, withdrawReason);
      setAlert({ type: 'success', message: 'Resignation withdrawn successfully.' });
      setWithdrawTarget(null);
      setWithdrawReason('');
      loadResignations();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to withdraw resignation.' });
    }
  };

  // Handle Exit Details / Approval
  const handleSaveExitReview = async (e) => {
    e.preventDefault();
    if (!selectedResignation) return;
    try {
      await updateExitDetails(selectedResignation._id, reviewForm);
      setAlert({ type: 'success', message: 'Exit details updated successfully.' });
      setShowReviewModal(false);
      setSelectedResignation(null);
      loadResignations();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update exit details.' });
    }
  };

  // Handle Clearance Update
  const handleSaveClearance = async (e) => {
    e.preventDefault();
    if (!selectedOffboarding) return;
    try {
      const payload = {
        department: clearanceForm.department,
        isCleared: clearanceForm.status === 'CLEARED' || clearanceForm.isCleared === true,
        remarks: clearanceForm.remarks || '',
      };
      await updateDepartmentClearance(selectedOffboarding._id, payload);
      setAlert({ type: 'success', message: 'Department clearance updated successfully.' });
      setShowClearanceModal(false);
      setSelectedOffboarding(null);
      loadOffboardings();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update clearance.' });
    }
  };

  // Handle Complete Offboarding
  const handleCompleteConfirm = async () => {
    if (!completeTarget) return;
    try {
      await completeOffboarding(completeTarget._id, 'All department clearances confirmed.');
      setAlert({ type: 'success', message: 'Offboarding completed successfully.' });
      setCompleteTarget(null);
      loadOffboardings();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to complete offboarding.' });
    }
  };

  // Filtered lists
  const filteredResignations = resignations.filter((r) => {
    if (!resSearch) return true;
    const term = resSearch.toLowerCase();
    const empName = `${r.employeeId?.firstName || ''} ${r.employeeId?.lastName || ''}`.toLowerCase();
    const empCode = (r.employeeId?.employeeCode || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();
    return empName.includes(term) || empCode.includes(term) || reason.includes(term);
  });

  const myResignations = resignations.filter((r) => {
    const empUserId = r.employeeId?._id || r.employeeId?.userId || r.employeeId;
    return String(empUserId) === String(currentUser?._id || currentUser?.id);
  });

  const resignationColumns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div>
          <div className="fw-semibold">
            {row.employeeId?.firstName ? `${row.employeeId.firstName} ${row.employeeId.lastName || ''}` : 'N/A'}
          </div>
          <small className="text-muted">{row.employeeId?.employeeCode || row.employeeId?.email || ''}</small>
        </div>
      ),
    },
    {
      key: 'submissionDate',
      header: 'Submitted On',
      render: (row) => (row.submissionDate ? new Date(row.submissionDate).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'proposedDate',
      header: 'Proposed LWD',
      render: (row) => (row.proposedLastWorkingDate ? new Date(row.proposedLastWorkingDate).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => (
        <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.reason}>
          {row.reason || 'N/A'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          {isHrOrAdmin && row.status !== 'WITHDRAWN' && (
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => {
                setSelectedResignation(row);
                setReviewForm({
                  status: row.status === 'SUBMITTED' ? 'APPROVED' : row.status,
                  approvedLastWorkingDate: row.approvedLastWorkingDate ? row.approvedLastWorkingDate.slice(0, 10) : (row.proposedLastWorkingDate ? row.proposedLastWorkingDate.slice(0, 10) : ''),
                  exitInterviewNotes: row.exitInterviewNotes || '',
                  hrFeedback: row.hrFeedback || '',
                  managerFeedback: row.managerFeedback || '',
                  remarks: row.remarks || '',
                });
                setShowReviewModal(true);
              }}
            >
              Review Exit
            </Button>
          )}
          {row.status === 'SUBMITTED' && (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => setWithdrawTarget(row)}
            >
              Withdraw
            </Button>
          )}
        </div>
      ),
    },
  ];

  const offboardingColumns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div>
          <div className="fw-semibold">
            {row.employeeId?.firstName ? `${row.employeeId.firstName} ${row.employeeId.lastName || ''}` : 'N/A'}
          </div>
          <small className="text-muted">{row.employeeId?.employeeCode || row.employeeId?.email || ''}</small>
        </div>
      ),
    },
    {
      key: 'lastWorkingDate',
      header: 'LWD',
      render: (row) => (row.lastWorkingDate ? new Date(row.lastWorkingDate).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'clearances',
      header: 'Department Clearances',
      render: (row) => {
        const clList = row.clearances || [];
        const clMap = {};
        if (Array.isArray(clList)) {
          clList.forEach((c) => {
            clMap[c.department] = c.isCleared ? 'CLEARED' : (c.status || 'PENDING');
          });
        }
        const cl = { ...clMap, ...(row.departmentClearances || {}) };
        return (
          <div className="d-flex flex-wrap gap-1">
            {DEPARTMENTS.map((dept) => {
              const status = cl[dept]?.status || cl[dept] || 'PENDING';
              let badgeClass = 'lifecycle-badge-pending';
              if (status === 'CLEARED') badgeClass = 'lifecycle-badge-cleared';
              if (status === 'REJECTED') badgeClass = 'lifecycle-badge-rejected';
              return (
                <span key={dept} className={`lifecycle-badge-clearance ${badgeClass}`} title={`${dept}: ${status}`}>
                  {dept}: {status}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          {isHrOrAdmin && row.status !== 'COMPLETED' && (
            <>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => {
                  setSelectedOffboarding(row);
                  setClearanceForm({ department: 'IT', status: 'CLEARED', remarks: '' });
                  setShowClearanceModal(true);
                }}
              >
                Clearance
              </Button>
              <Button
                size="sm"
                variant="outline-success"
                onClick={() => setCompleteTarget(row)}
              >
                Complete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="lifecycle-page">
      <Container fluid>
        {/* Header */}
        <div className="lifecycle-header">
          <div>
            <h1 className="lifecycle-title">Lifecycle & Separation</h1>
            <p className="lifecycle-subtitle">
              Manage resignation submissions, exit interviews, and departmental offboarding clearances.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => {
                if (activeTab === 'offboardings') loadOffboardings();
                else loadResignations();
              }}
              className="d-flex align-items-center gap-1"
            >
              <MdRefresh /> Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowSubmitModal(true)}
              className="d-flex align-items-center gap-1"
            >
              <MdAddCircle /> Submit Resignation
            </Button>
          </div>
        </div>

        {alert && (
          <FeedbackAlert
            variant={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Main Card with Tabs */}
        <Card className="lifecycle-card">
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="lifecycle-nav-tabs mb-3">
              {isHrOrAdmin && (
                <Nav.Item>
                  <Nav.Link eventKey="resignations">
                    <MdWorkHistory className="me-1" /> Resignations Review
                  </Nav.Link>
                </Nav.Item>
              )}
              {isHrOrAdmin && (
                <Nav.Item>
                  <Nav.Link eventKey="offboardings">
                    <MdAssignmentTurnedIn className="me-1" /> Offboarding & Clearances
                  </Nav.Link>
                </Nav.Item>
              )}
              <Nav.Item>
                <Nav.Link eventKey="my-resignation">
                  <MdExitToApp className="me-1" /> My Resignations
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Tab 1: Resignations Review (Admin / HR) */}
              {isHrOrAdmin && (
                <Tab.Pane eventKey="resignations">
                  <Row className="mb-3 g-2 align-items-center">
                    <Col md={6}>
                      <SearchInput
                        value={resSearch}
                        onChange={(val) => setResSearch(val)}
                        placeholder="Search by employee name, code, or reason..."
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={resStatusFilter}
                        onChange={(e) => setResStatusFilter(e.target.value)}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="WITHDRAWN">WITHDRAWN</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  <DataTable
                    columns={resignationColumns}
                    rows={filteredResignations}
                    loading={resLoading}
                    loadingComponent={<LoadingSpinner variant="table" />}
                    emptyComponent={<EmptyState message="No resignations found." variant="table" />}
                    className="align-middle"
                  />

                  {resTotal > 10 && (
                    <PaginationBar
                      page={resPage}
                      totalPages={Math.ceil(resTotal / 10)}
                      onPageChange={(p) => setResPage(p)}
                    />
                  )}
                </Tab.Pane>
              )}

              {/* Tab 2: Offboardings & Clearances (Admin / HR) */}
              {isHrOrAdmin && (
                <Tab.Pane eventKey="offboardings">
                  <Row className="mb-3 g-2 align-items-center">
                    <Col md={6}>
                      <SearchInput
                        value={offSearch}
                        onChange={(val) => setOffSearch(val)}
                        placeholder="Search offboarding records..."
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={offStatusFilter}
                        onChange={(e) => setOffStatusFilter(e.target.value)}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="INITIATED">INITIATED</option>
                        <option value="CLEARANCE_IN_PROGRESS">CLEARANCE_IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  <DataTable
                    columns={offboardingColumns}
                    rows={offboardings}
                    loading={offLoading}
                    loadingComponent={<LoadingSpinner variant="table" />}
                    emptyComponent={<EmptyState message="No offboarding records found." variant="table" />}
                    className="align-middle"
                  />

                  {offTotal > 10 && (
                    <PaginationBar
                      page={offPage}
                      totalPages={Math.ceil(offTotal / 10)}
                      onPageChange={(p) => setOffPage(p)}
                    />
                  )}
                </Tab.Pane>
              )}

              {/* Tab 3: My Resignations (Employee View) */}
              <Tab.Pane eventKey="my-resignation">
                <DataTable
                  columns={resignationColumns.filter((c) => c.key !== 'employee')}
                  rows={myResignations}
                  loading={resLoading}
                  loadingComponent={<LoadingSpinner variant="table" />}
                  emptyComponent={<EmptyState message="You have no active resignation requests." variant="table" />}
                  className="align-middle"
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card>

        {/* Submit Resignation Modal */}
        <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Submit Resignation</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmitResignation}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Reason for Leaving <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. Better Career Opportunity, Relocation, Higher Studies"
                  value={submitForm.reason}
                  onChange={(e) => setSubmitForm({ ...submitForm, reason: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Proposed Last Working Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={submitForm.proposedLastWorkingDate}
                  onChange={(e) => setSubmitForm({ ...submitForm, proposedLastWorkingDate: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Additional Comments / Handover Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Provide handover details or transition plan..."
                  value={submitForm.comments}
                  onChange={(e) => setSubmitForm({ ...submitForm, comments: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Resignation'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Review Exit Modal */}
        <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Review Resignation & Exit Details</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveExitReview}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Decision Status <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={reviewForm.status}
                      onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Approved Last Working Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={reviewForm.approvedLastWorkingDate}
                      onChange={(e) => setReviewForm({ ...reviewForm, approvedLastWorkingDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Exit Interview Summary / Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Record insights or handover summary..."
                  value={reviewForm.exitInterviewNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, exitInterviewNotes: e.target.value })}
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>HR Feedback</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="HR verification notes..."
                      value={reviewForm.hrFeedback}
                      onChange={(e) => setReviewForm({ ...reviewForm, hrFeedback: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Manager Feedback</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Manager transition sign-off..."
                      value={reviewForm.managerFeedback}
                      onChange={(e) => setReviewForm({ ...reviewForm, managerFeedback: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Exit Review
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Clearance Modal */}
        <Modal show={showClearanceModal} onHide={() => setShowClearanceModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Update Department Clearance</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveClearance}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Department <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={clearanceForm.department}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, department: e.target.value })}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Clearance Status <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={clearanceForm.status}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, status: e.target.value })}
                >
                  <option value="CLEARED">CLEARED (No dues/assets recovered)</option>
                  <option value="PENDING">PENDING (In progress)</option>
                  <option value="REJECTED">REJECTED (Outstanding items)</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Remarks / Asset Reference</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Laptop & access keycard returned"
                  value={clearanceForm.remarks}
                  onChange={(e) => setClearanceForm({ ...clearanceForm, remarks: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowClearanceModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Clearance
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Withdraw Resignation Confirmation */}
        <ConfirmModal
          show={Boolean(withdrawTarget)}
          title="Withdraw Resignation"
          message={`Are you sure you want to withdraw the resignation submitted for proposed date: ${withdrawTarget?.proposedLastWorkingDate ? new Date(withdrawTarget.proposedLastWorkingDate).toLocaleDateString() : ''}?`}
          confirmLabel="Withdraw Request"
          confirmVariant="danger"
          onConfirm={handleWithdrawConfirm}
          onCancel={() => setWithdrawTarget(null)}
        />

        {/* Complete Offboarding Confirmation */}
        <ConfirmModal
          show={Boolean(completeTarget)}
          title="Complete Employee Offboarding"
          message={`Are you sure all departmental clearances have been verified and you want to finalize offboarding for ${completeTarget?.employeeId?.firstName || 'this employee'}?`}
          confirmLabel="Complete Offboarding"
          confirmVariant="success"
          onConfirm={handleCompleteConfirm}
          onCancel={() => setCompleteTarget(null)}
        />
      </Container>
    </div>
  );
}

export default LifecycleManagement;
