import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Modal, Form } from 'react-bootstrap';
import {
  MdReceiptLong,
  MdAddCircle,
  MdRefresh,
  MdPayments,
  MdAttachMoney,
  MdReceipt
} from 'react-icons/md';
import { useSelector } from 'react-redux';
import { selectAuthUser, selectIsSystemAdmin } from '../../redux/slices/authSlice';
import DataTable from '../../Components/Common/DataTable';
import StatusBadge from '../../Components/Common/StatusBadge';
import LoadingSpinner from '../../Components/Common/LoadingSpinner';
import EmptyState from '../../Components/Common/EmptyState';
import FeedbackAlert from '../../Components/Common/FeedbackAlert';
import PaginationBar from '../../Components/Common/PaginationBar';
import SearchInput from '../../Components/Common/SearchInput';
import {
  submitReimbursement,
  getReimbursements,
  markReimbursementPaid
} from '../../services/reimbursementService';
import './ReimbursementManagement.css';

const CATEGORIES = ['TRAVEL', 'FOOD', 'MEDICAL', 'OFFICE_SUPPLIES', 'INTERNET', 'CLIENT_ENTERTAINMENT', 'OTHER'];

function ReimbursementManagement() {
  const currentUser = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const userRole = currentUser?.roleCode || currentUser?.role?.roleCode || '';
  const isHrOrAdmin = isSystemAdmin || ['OWNER', 'ADMIN', 'HR', 'HR_MANAGER', 'FINANCE'].includes(userRole);

  const [activeTab, setActiveTab] = useState(isHrOrAdmin ? 'all-claims' : 'my-claims');
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [alert, setAlert] = useState(null);

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    category: 'TRAVEL',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    receiptUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Pay modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [payForm, setPayForm] = useState({
    paymentReference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  });

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
      };
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await getReimbursements(params);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setClaims(list);
      setTotal(res.pagination?.total || list.length);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load reimbursements.' });
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, statusFilter]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitForm.title || !submitForm.amount || !submitForm.expenseDate) {
      setAlert({ type: 'warning', message: 'Title, amount, and date are required.' });
      return;
    }
    setSubmitting(true);
    try {
      await submitReimbursement({
        ...submitForm,
        amount: Number(submitForm.amount),
      });
      setAlert({ type: 'success', message: 'Reimbursement claim submitted successfully.' });
      setShowSubmitModal(false);
      setSubmitForm({
        title: '',
        category: 'TRAVEL',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        receiptUrl: '',
      });
      loadClaims();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to submit claim.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedClaim) return;
    try {
      await markReimbursementPaid(selectedClaim._id, payForm);
      setAlert({ type: 'success', message: 'Reimbursement marked as paid successfully.' });
      setShowPayModal(false);
      setSelectedClaim(null);
      loadClaims();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to record payout.' });
    }
  };

  const myClaims = claims.filter((c) => {
    const claimantId = c.userId?._id || c.userId || c.submittedBy?._id || c.submittedBy;
    return String(claimantId) === String(currentUser?._id || currentUser?.id);
  });

  const filteredClaims = (activeTab === 'my-claims' ? myClaims : claims).filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const title = (c.title || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    const user = `${c.userId?.firstName || ''} ${c.userId?.lastName || ''}`.toLowerCase();
    return title.includes(term) || desc.includes(term) || user.includes(term);
  });

  const columns = [
    {
      key: 'title',
      header: 'Claim & Details',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.title || 'Untitled Claim'}</div>
          <small className="text-muted">{row.description || 'No description provided'}</small>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="reimbursement-category-badge">{row.category || 'OTHER'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => <span className="reimbursement-amount">₹{Number(row.amount || 0).toLocaleString()}</span>,
    },
    {
      key: 'expenseDate',
      header: 'Expense Date',
      render: (row) => (row.expenseDate ? new Date(row.expenseDate).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'employee',
      header: 'Claimant',
      render: (row) => (
        <div>
          <div>{row.userId?.firstName ? `${row.userId.firstName} ${row.userId.lastName || ''}` : 'Me'}</div>
          <small className="text-muted">{row.userId?.employeeCode || ''}</small>
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
          {isHrOrAdmin && row.status === 'APPROVED' && (
            <Button
              size="sm"
              variant="outline-success"
              onClick={() => {
                setSelectedClaim(row);
                setPayForm({
                  paymentReference: '',
                  paymentDate: new Date().toISOString().slice(0, 10),
                  remarks: '',
                });
                setShowPayModal(true);
              }}
            >
              <MdPayments className="me-1" /> Mark Paid
            </Button>
          )}
          {row.receiptUrl && (
            <a
              href={row.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary"
            >
              <MdReceipt className="me-1" /> Receipt
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="reimbursement-page">
      <Container fluid>
        <div className="reimbursement-header">
          <div>
            <h1 className="reimbursement-title">Expense Reimbursements</h1>
            <p className="reimbursement-subtitle">
              Submit employee expense claims, review submissions, and manage payout disbursements.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={loadClaims} className="d-flex align-items-center gap-1">
              <MdRefresh /> Refresh
            </Button>
            <Button variant="primary" onClick={() => setShowSubmitModal(true)} className="d-flex align-items-center gap-1">
              <MdAddCircle /> Submit Claim
            </Button>
          </div>
        </div>

        {alert && (
          <FeedbackAlert variant={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        <Card className="reimbursement-card">
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="lifecycle-nav-tabs mb-3">
              {isHrOrAdmin && (
                <Nav.Item>
                  <Nav.Link eventKey="all-claims">
                    <MdReceiptLong className="me-1" /> All Expense Claims
                  </Nav.Link>
                </Nav.Item>
              )}
              <Nav.Item>
                <Nav.Link eventKey="my-claims">
                  <MdAttachMoney className="me-1" /> My Claims
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Row className="mb-3 g-2 align-items-center">
              <Col md={5}>
                <SearchInput
                  value={search}
                  onChange={(val) => setSearch(val)}
                  placeholder="Search by claim title, description, or employee..."
                />
              </Col>
              <Col md={3}>
                <Form.Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="PAID">PAID</option>
                </Form.Select>
              </Col>
            </Row>

            <DataTable
              columns={columns}
              rows={filteredClaims}
              loading={loading}
              loadingComponent={<LoadingSpinner variant="table" />}
              emptyComponent={<EmptyState message="No reimbursement claims found." variant="table" />}
              className="align-middle"
            />

            {total > 10 && (
              <PaginationBar
                page={page}
                totalPages={Math.ceil(total / 10)}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </Tab.Container>
        </Card>

        {/* Submit Claim Modal */}
        <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Submit Reimbursement Claim</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Claim Title <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. Client Dinner, Travel Fare to Delhi"
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={submitForm.category}
                      onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount (₹) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={submitForm.amount}
                      onChange={(e) => setSubmitForm({ ...submitForm, amount: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Expense Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={submitForm.expenseDate}
                  onChange={(e) => setSubmitForm({ ...submitForm, expenseDate: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Receipt / Invoice URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://... (Link to receipt image/document)"
                  value={submitForm.receiptUrl}
                  onChange={(e) => setSubmitForm({ ...submitForm, receiptUrl: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description / Business Justification</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Provide context on this business expense..."
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Mark Paid Modal */}
        <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Disburse Reimbursement Payment</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handlePay}>
            <Modal.Body>
              <p className="text-muted mb-3">
                Confirm payout of <strong>₹{selectedClaim?.amount}</strong> for claim: <em>{selectedClaim?.title}</em>
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Payment Reference / UTR / Cheque No <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. UTR-9823481239"
                  value={payForm.paymentReference}
                  onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Payment Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  required
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Disbursed via standard bank transfer"
                  value={payForm.remarks}
                  onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowPayModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit">
                Record Payout
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
}

export default ReimbursementManagement;
