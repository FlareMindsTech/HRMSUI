import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import {
  MdSecurity,
  MdRefresh,
  MdFilterList,
  MdVisibility,
  MdHistory
} from 'react-icons/md';
import DataTable from '../../Components/Common/DataTable';
import StatusBadge from '../../Components/Common/StatusBadge';
import LoadingSpinner from '../../Components/Common/LoadingSpinner';
import EmptyState from '../../Components/Common/EmptyState';
import FeedbackAlert from '../../Components/Common/FeedbackAlert';
import PaginationBar from '../../Components/Common/PaginationBar';
import SearchInput from '../../Components/Common/SearchInput';
import { getAuditLogs } from '../../services/auditLogService';
import './AuditLogs.css';

const MODULES = [
  'ALL',
  'ATTENDANCE',
  'PROJECTS',
  'USER_MANAGEMENT',
  'LEAVE',
  'ASSETS',
  'ORGANISATION',
  'APPROVAL_WORKFLOW',
  'AUTH',
  'ONBOARDING',
  'RESIGNATION',
  'OFFBOARDING',
  'REIMBURSEMENT',
  'PLATFORM',
];

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [alert, setAlert] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (moduleFilter !== 'ALL') params.module = moduleFilter;
      if (search) params.action = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getAuditLogs(params);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setLogs(list);
      setTotal(res.pagination?.total || list.length);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load audit logs.' });
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, search, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A'),
    },
    {
      key: 'module',
      header: 'Module',
      render: (row) => <span className="badge bg-secondary">{row.module || 'SYSTEM'}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <span className="fw-semibold text-primary">{row.action}</span>,
    },
    {
      key: 'performedBy',
      header: 'User',
      render: (row) => (
        <div>
          <div>
            {row.performedBy?.firstName
              ? `${row.performedBy.firstName} ${row.performedBy.lastName || ''}`
              : 'System / Background'}
          </div>
          <small className="text-muted">{row.performedBy?.email || row.ipAddress || ''}</small>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (row) => (
        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.details}>
          {row.details || 'N/A'}
        </div>
      ),
    },
    {
      key: 'view',
      header: 'Inspect',
      render: (row) => (
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => setSelectedLog(row)}
          className="d-flex align-items-center gap-1"
        >
          <MdVisibility /> View
        </Button>
      ),
    },
  ];

  return (
    <div className="audit-logs-page">
      <Container fluid>
        <div className="audit-logs-header">
          <div>
            <h1 className="audit-logs-title">System & Security Audit Logs</h1>
            <p className="audit-logs-subtitle">
              Inspect immutable audit trails of sensitive modifications, user activities, and organizational events.
            </p>
          </div>
          <div>
            <Button variant="outline-secondary" onClick={loadLogs} className="d-flex align-items-center gap-1">
              <MdRefresh /> Refresh Logs
            </Button>
          </div>
        </div>

        {alert && <FeedbackAlert variant={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <Card className="audit-logs-card">
          <Row className="mb-3 g-2 align-items-center">
            <Col md={4}>
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search by action name (e.g. UPDATE, CREATE)..."
              />
            </Col>
            <Col md={3}>
              <Form.Select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                {MODULES.map((m) => (
                  <option key={m} value={m}>{m === 'ALL' ? 'All Modules' : m}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                placeholder="From Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                placeholder="To Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
            <Col md={1}>
              {(startDate || endDate || search || moduleFilter !== 'ALL') && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => {
                    setSearch('');
                    setModuleFilter('ALL');
                    setStartDate('');
                    setEndDate('');
                  }}
                  title="Clear Filters"
                >
                  Reset
                </Button>
              )}
            </Col>
          </Row>

          <DataTable
            columns={columns}
            rows={logs}
            loading={loading}
            loadingComponent={<LoadingSpinner variant="table" />}
            emptyComponent={<EmptyState message="No audit logs matched the criteria." variant="table" />}
            className="align-middle"
          />

          {total > 15 && (
            <PaginationBar
              page={page}
              totalPages={Math.ceil(total / 15)}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </Card>

        {/* Inspect Log Details Modal */}
        <Modal show={Boolean(selectedLog)} onHide={() => setSelectedLog(null)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Audit Log Entry Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="mb-3">
              <Col md={6}>
                <strong>Module:</strong> {selectedLog?.module}
              </Col>
              <Col md={6}>
                <strong>Action:</strong> {selectedLog?.action}
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <strong>Timestamp:</strong> {selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : ''}
              </Col>
              <Col md={6}>
                <strong>Resource ID:</strong> <code>{selectedLog?.resourceId || 'N/A'}</code>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <strong>Performed By:</strong> {selectedLog?.performedBy?.firstName} {selectedLog?.performedBy?.lastName} ({selectedLog?.performedBy?.email})
              </Col>
              <Col md={6}>
                <strong>IP / Agent:</strong> {selectedLog?.ipAddress || 'Internal Call'}
              </Col>
            </Row>
            <div className="mb-3">
              <strong>Description:</strong>
              <p className="text-muted mt-1">{selectedLog?.details || 'None'}</p>
            </div>

            {selectedLog?.previousState && (
              <div className="mb-3">
                <strong>Previous State:</strong>
                <pre className="audit-diff-pre">{JSON.stringify(selectedLog.previousState, null, 2)}</pre>
              </div>
            )}

            {selectedLog?.newState && (
              <div className="mb-3">
                <strong>New State:</strong>
                <pre className="audit-diff-pre">{JSON.stringify(selectedLog.newState, null, 2)}</pre>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default AuditLogs;
