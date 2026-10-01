import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Modal, Form } from 'react-bootstrap';
import {
  MdAccountTree,
  MdPendingActions,
  MdAddCircle,
  MdRefresh,
  MdCheckCircle,
  MdCancel,
  MdSettings,
  MdLayers
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
  configureWorkflow,
  getWorkflows,
  getPendingApprovals,
  processApprovalAction
} from '../../services/approvalWorkflowService';
import { fetchAllRoles } from '../../services/rbacService';
import './ApprovalWorkflows.css';

const WORKFLOW_MODULES = [
  { value: 'LEAVE', label: 'Leave Requests' },
  { value: 'REIMBURSEMENT', label: 'Expense Reimbursements' },
  { value: 'RESIGNATION', label: 'Resignations & Separations' },
  { value: 'OFFBOARDING', label: 'Offboarding Clearances' },
];

function ApprovalWorkflows() {
  const currentUser = useSelector(selectAuthUser);
  const isSystemAdmin = useSelector(selectIsSystemAdmin);
  const userRole = currentUser?.roleCode || currentUser?.role?.roleCode || '';
  const isAdmin = isSystemAdmin || ['OWNER', 'ADMIN', 'HR_MANAGER'].includes(userRole);

  const [activeTab, setActiveTab] = useState(isAdmin ? 'workflows' : 'pending-approvals');
  const [workflows, setWorkflows] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Available roles for config
  const [roles, setRoles] = useState([]);

  // Configure Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    module: 'LEAVE',
    title: '',
    description: '',
    allowSelfApproval: false,
    isActive: true,
    approvalLevels: [
      { level: 1, roleId: '', roleName: '', minimumPriority: 3, isMandatory: true }
    ],
  });

  // Action Modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionForm, setActionForm] = useState({
    action: 'APPROVED',
    comments: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const wfRes = await getWorkflows();
        setWorkflows(wfRes.data || []);
      }
      const pendingRes = await getPendingApprovals();
      const pList = Array.isArray(pendingRes.data) ? pendingRes.data : pendingRes.data?.data || [];
      setPendingRequests(pList);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load workflow data.' });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
    if (isAdmin) {
      fetchAllRoles()
        .then((res) => {
          const list = Array.isArray(res) ? res : res.data || [];
          setRoles(list);
        })
        .catch(() => {});
    }
  }, [loadData, isAdmin]);

  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    if (!configForm.module || !configForm.title) {
      setAlert({ type: 'warning', message: 'Module and title are required.' });
      return;
    }
    try {
      await configureWorkflow(configForm);
      setAlert({ type: 'success', message: 'Workflow configuration saved successfully.' });
      setShowConfigModal(false);
      loadData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to configure workflow.' });
    }
  };

  const handleProcessAction = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await processApprovalAction({
        requestId: selectedRequest._id,
        action: actionForm.action,
        comments: actionForm.comments,
      });
      setAlert({ type: 'success', message: `Approval request processed: ${actionForm.action}` });
      setShowActionModal(false);
      setSelectedRequest(null);
      loadData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to process approval action.' });
    }
  };

  const addLevel = () => {
    setConfigForm((prev) => ({
      ...prev,
      approvalLevels: [
        ...prev.approvalLevels,
        {
          level: prev.approvalLevels.length + 1,
          roleId: '',
          roleName: '',
          minimumPriority: 2,
          isMandatory: true,
        },
      ],
    }));
  };

  const removeLevel = (index) => {
    if (configForm.approvalLevels.length <= 1) return;
    setConfigForm((prev) => ({
      ...prev,
      approvalLevels: prev.approvalLevels
        .filter((_, i) => i !== index)
        .map((lvl, idx) => ({ ...lvl, level: idx + 1 })),
    }));
  };

  const workflowColumns = [
    {
      key: 'module',
      header: 'Module',
      render: (row) => <span className="workflow-module-badge">{row.module}</span>,
    },
    {
      key: 'title',
      header: 'Workflow Name',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.title}</div>
          <small className="text-muted">{row.description || 'Standard approval sequence'}</small>
        </div>
      ),
    },
    {
      key: 'levels',
      header: 'Approval Hierarchy',
      render: (row) => (
        <div>
          {row.approvalLevels?.map((l) => (
            <span key={l.level} className="badge bg-light text-dark border me-1">
              L{l.level}: {l.roleName || `Priority ≤ ${l.minimumPriority}`}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'selfApproval',
      header: 'Self-Approval',
      render: (row) => (row.allowSelfApproval ? <span className="text-success">Allowed</span> : <span className="text-muted">Prohibited</span>),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() => {
            setConfigForm({
              module: row.module,
              title: row.title,
              description: row.description || '',
              allowSelfApproval: Boolean(row.allowSelfApproval),
              isActive: row.isActive !== undefined ? row.isActive : true,
              approvalLevels: row.approvalLevels?.length ? row.approvalLevels : [{ level: 1, roleId: '', roleName: '', minimumPriority: 3, isMandatory: true }],
            });
            setShowConfigModal(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  const pendingColumns = [
    {
      key: 'module',
      header: 'Module',
      render: (row) => <span className="workflow-module-badge">{row.module}</span>,
    },
    {
      key: 'requester',
      header: 'Requester',
      render: (row) => (
        <div>
          <div className="fw-semibold">
            {row.requester?.firstName ? `${row.requester.firstName} ${row.requester.lastName || ''}` : 'N/A'}
          </div>
          <small className="text-muted">{row.requester?.employeeCode || row.requester?.email || ''}</small>
        </div>
      ),
    },
    {
      key: 'currentLevel',
      header: 'Pending Level',
      render: (row) => <span className="badge bg-info text-white">Level {row.currentLevel}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'submittedAt',
      header: 'Date',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setSelectedRequest(row);
            setActionForm({ action: 'APPROVED', comments: '' });
            setShowActionModal(true);
          }}
        >
          Review & Decide
        </Button>
      ),
    },
  ];

  return (
    <div className="approval-workflows-page">
      <Container fluid>
        <div className="approval-workflows-header">
          <div>
            <h1 className="approval-workflows-title">Approval Workflows & Authorities</h1>
            <p className="approval-workflows-subtitle">
              Configure multi-level approval hierarchies and process pending authority requests.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={loadData} className="d-flex align-items-center gap-1">
              <MdRefresh /> Refresh
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                onClick={() => {
                  setConfigForm({
                    module: 'LEAVE',
                    title: '',
                    description: '',
                    allowSelfApproval: false,
                    isActive: true,
                    approvalLevels: [{ level: 1, roleId: '', roleName: '', minimumPriority: 3, isMandatory: true }],
                  });
                  setShowConfigModal(true);
                }}
                className="d-flex align-items-center gap-1"
              >
                <MdAddCircle /> Configure Workflow
              </Button>
            )}
          </div>
        </div>

        {alert && <FeedbackAlert variant={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <Card className="approval-workflows-card">
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="lifecycle-nav-tabs mb-3">
              <Nav.Item>
                <Nav.Link eventKey="pending-approvals">
                  <MdPendingActions className="me-1" /> Pending Approvals ({pendingRequests.length})
                </Nav.Link>
              </Nav.Item>
              {isAdmin && (
                <Nav.Item>
                  <Nav.Link eventKey="workflows">
                    <MdAccountTree className="me-1" /> Configured Workflows ({workflows.length})
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="pending-approvals">
                <DataTable
                  columns={pendingColumns}
                  rows={pendingRequests}
                  loading={loading}
                  loadingComponent={<LoadingSpinner variant="table" />}
                  emptyComponent={<EmptyState message="No pending approval requests requiring your decision." variant="table" />}
                  className="align-middle"
                />
              </Tab.Pane>

              {isAdmin && (
                <Tab.Pane eventKey="workflows">
                  <DataTable
                    columns={workflowColumns}
                    rows={workflows}
                    loading={loading}
                    loadingComponent={<LoadingSpinner variant="table" />}
                    emptyComponent={<EmptyState message="No approval workflows configured yet." variant="table" />}
                    className="align-middle"
                  />
                </Tab.Pane>
              )}
            </Tab.Content>
          </Tab.Container>
        </Card>

        {/* Configure Workflow Modal */}
        <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Configure Approval Workflow</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveWorkflow}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Target Module <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={configForm.module}
                      onChange={(e) => setConfigForm({ ...configForm, module: e.target.value })}
                    >
                      {WORKFLOW_MODULES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Workflow Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="e.g. Standard Leave Approval"
                      value={configForm.title}
                      onChange={(e) => setConfigForm({ ...configForm, title: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Requires Manager sign-off followed by HR authorization"
                  value={configForm.description}
                  onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-2 mt-4">
                <h6 className="mb-0 fw-bold"><MdLayers className="me-1" /> Sequential Approval Levels</h6>
                <Button size="sm" variant="outline-primary" onClick={addLevel}>
                  + Add Next Level
                </Button>
              </div>

              {configForm.approvalLevels.map((lvl, index) => (
                <div key={index} className="workflow-level-item">
                  <Row className="align-items-center g-2">
                    <Col md={2}>
                      <strong>Level {lvl.level}</strong>
                    </Col>
                    <Col md={4}>
                      <Form.Select
                        value={lvl.roleId || ''}
                        onChange={(e) => {
                          const selected = roles.find((r) => String(r._id || r.id) === String(e.target.value));
                          const updated = [...configForm.approvalLevels];
                          updated[index] = {
                            ...updated[index],
                            roleId: e.target.value,
                            roleName: selected?.roleName || selected?.name || 'Authority Role',
                          };
                          setConfigForm({ ...configForm, approvalLevels: updated });
                        }}
                      >
                        <option value="">Select Role / Authority...</option>
                        {roles.map((r) => (
                          <option key={r._id || r.id} value={r._id || r.id}>
                            {r.roleName || r.name} (Priority: {r.priority ?? 'N/A'})
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Min Priority"
                        value={lvl.minimumPriority}
                        onChange={(e) => {
                          const updated = [...configForm.approvalLevels];
                          updated[index] = { ...updated[index], minimumPriority: Number(e.target.value) };
                          setConfigForm({ ...configForm, approvalLevels: updated });
                        }}
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>Max priority allowed</small>
                    </Col>
                    <Col md={3} className="text-end">
                      {configForm.approvalLevels.length > 1 && (
                        <Button size="sm" variant="outline-danger" onClick={() => removeLevel(index)}>
                          Remove
                        </Button>
                      )}
                    </Col>
                  </Row>
                </div>
              ))}

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Allow Self-Approval (If requester holds authority)"
                    checked={configForm.allowSelfApproval}
                    onChange={(e) => setConfigForm({ ...configForm, allowSelfApproval: e.target.checked })}
                  />
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Workflow Active"
                    checked={configForm.isActive}
                    onChange={(e) => setConfigForm({ ...configForm, isActive: e.target.checked })}
                  />
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowConfigModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Workflow Configuration
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Process Action Modal */}
        <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Process Approval Request</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleProcessAction}>
            <Modal.Body>
              <div className="mb-3">
                <p className="mb-1"><strong>Module:</strong> {selectedRequest?.module}</p>
                <p className="mb-1"><strong>Requester:</strong> {selectedRequest?.requester?.firstName} {selectedRequest?.requester?.lastName}</p>
                <p className="mb-1"><strong>Current Level:</strong> Level {selectedRequest?.currentLevel}</p>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Decision <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={actionForm.action}
                  onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
                >
                  <option value="APPROVED">APPROVE (Advance to next level / Finalize)</option>
                  <option value="REJECTED">REJECT (Decline request)</option>
                  <option value="CANCELLED">CANCEL (Cancel processing)</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Decision Remarks / Comments</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Add notes explaining this decision..."
                  value={actionForm.comments}
                  onChange={(e) => setActionForm({ ...actionForm, comments: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowActionModal(false)}>
                Cancel
              </Button>
              <Button
                variant={actionForm.action === 'APPROVED' ? 'success' : 'danger'}
                type="submit"
              >
                Submit Decision
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
}

export default ApprovalWorkflows;
