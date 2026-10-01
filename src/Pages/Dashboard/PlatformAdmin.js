import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Modal, Form } from 'react-bootstrap';
import {
  MdBusiness,
  MdSubscriptions,
  MdCardMembership,
  MdRefresh,
  MdAddCircle,
  MdAnalytics,
  MdHistory,
  MdMoreTime,
  MdPeople,
  MdDataUsage
} from 'react-icons/md';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectAuthUser } from '../../redux/slices/authSlice';
import DataTable from '../../Components/Common/DataTable';
import StatusBadge from '../../Components/Common/StatusBadge';
import LoadingSpinner from '../../Components/Common/LoadingSpinner';
import EmptyState from '../../Components/Common/EmptyState';
import FeedbackAlert from '../../Components/Common/FeedbackAlert';
import PaginationBar from '../../Components/Common/PaginationBar';
import SearchInput from '../../Components/Common/SearchInput';
import {
  getPlatformDashboard,
  getPlatformUsage,
  getPlatformOrganizations,
  getPlatformOrganizationById,
  suspendPlatformOrganization,
  activatePlatformOrganization,
  getPlatformPlans,
  createPlatformPlan,
  updatePlatformPlan,
  updatePlatformPlanStatus,
  getPlatformSubscriptions,
  getPlatformSubscriptionById,
  updatePlatformSubscription,
  activatePlatformSubscription,
  suspendPlatformSubscription,
  extendPlatformSubscription,
  getPlatformUsers,
  getPlatformAuditLogs
} from '../../services/platformService';
import './PlatformAdmin.css';

function PlatformAdmin() {
  const navigate = useNavigate();
  const currentUser = useSelector(selectAuthUser);
  const roleCode = (currentUser?.roleCode || currentUser?.role?.roleCode || '').toUpperCase();
  const isPlatformAdmin = roleCode === 'SAAS_SUPER_ADMIN' || (currentUser?.scope === 'PLATFORM' && !currentUser?.organizationId);

  const [activeTab, setActiveTab] = useState('organizations');
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Organizations state
  const [organizations, setOrganizations] = useState([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotal, setOrgTotal] = useState(0);

  // Plans state
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Platform Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Platform Users state
  const [platformUsers, setPlatformUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  // Platform Resource Usage state
  const [usageData, setUsageData] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Organization Detail Modal State
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgDetailLoading, setOrgDetailLoading] = useState(false);

  // Subscription Detail / Edit Modal State
  const [selectedSub, setSelectedSub] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subDetailLoading, setSubDetailLoading] = useState(false);
  const [subEditForm, setSubEditForm] = useState({
    status: 'ACTIVE',
    planCode: 'PAID',
    maxEmployees: 100,
    maxBranches: 10,
    maxStorageMB: 20480,
    maxProjects: 50,
    maxUsers: 100,
  });

  const [alert, setAlert] = useState(null);

  // Suspend Org modal
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Plan modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    _id: null,
    planCode: '',
    planName: '',
    description: '',
    billingCycle: 'MONTHLY',
    price: 0,
    currency: 'INR',
    maxUsers: 50,
    maxBranches: 2,
    isActive: true,
  });

  // Extend Subscription Modal
  const [extendTarget, setExtendTarget] = useState(null);
  const [extendDays, setExtendDays] = useState(30);

  // Load Dashboard Overview
  const loadOverview = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setLoadingMetrics(true);
    try {
      const res = await getPlatformDashboard();
      setMetrics(res.data?.overview || res.data || null);
    } catch (err) {
      // dashboard is support/super-admin metric
    } finally {
      setLoadingMetrics(false);
    }
  }, [isPlatformAdmin]);

  // Load Organizations
  const loadOrganizations = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setOrgLoading(true);
    try {
      const res = await getPlatformOrganizations({ page: orgPage, limit: 10, search: orgSearch });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setOrganizations(list);
      setOrgTotal(res.pagination?.total || list.length);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load platform organizations.' });
    } finally {
      setOrgLoading(false);
    }
  }, [orgPage, orgSearch, isPlatformAdmin]);

  // Load Plans
  const loadPlans = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setPlansLoading(true);
    try {
      const res = await getPlatformPlans();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPlans(list);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load plans.' });
    } finally {
      setPlansLoading(false);
    }
  }, [isPlatformAdmin]);

  // Load Subscriptions
  const loadSubscriptions = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setSubsLoading(true);
    try {
      const res = await getPlatformSubscriptions();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setSubscriptions(list);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load subscriptions.' });
    } finally {
      setSubsLoading(false);
    }
  }, [isPlatformAdmin]);

  // Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setAuditLoading(true);
    try {
      const res = await getPlatformAuditLogs();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAuditLogs(list);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load platform audit logs.' });
    } finally {
      setAuditLoading(false);
    }
  }, [isPlatformAdmin]);

  // Load Platform Users
  const loadPlatformUsers = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setUserLoading(true);
    try {
      const res = await getPlatformUsers({ page: userPage, limit: 10, search: userSearch });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPlatformUsers(list);
      setUserTotal(res.pagination?.total || list.length);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load platform users.' });
    } finally {
      setUserLoading(false);
    }
  }, [userPage, userSearch, isPlatformAdmin]);

  // Load Resource Usage
  const loadUsage = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setUsageLoading(true);
    try {
      const res = await getPlatformUsage();
      setUsageData(res.data || null);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load platform resource usage.' });
    } finally {
      setUsageLoading(false);
    }
  }, [isPlatformAdmin]);

  // View Org Details
  const handleViewOrgDetails = async (orgId) => {
    setShowOrgModal(true);
    setOrgDetailLoading(true);
    try {
      const res = await getPlatformOrganizationById(orgId);
      setSelectedOrg(res.data || null);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load organization details.' });
      setShowOrgModal(false);
    } finally {
      setOrgDetailLoading(false);
    }
  };

  // View Subscription Details
  const handleViewSubDetails = async (subId) => {
    setShowSubModal(true);
    setSubDetailLoading(true);
    try {
      const res = await getPlatformSubscriptionById(subId);
      const sub = res.data || null;
      setSelectedSub(sub);
      if (sub) {
        setSubEditForm({
          status: sub.status || 'ACTIVE',
          planCode: sub.planCode || 'PAID',
          maxEmployees: sub.featureLimits?.maxEmployees || 100,
          maxBranches: sub.featureLimits?.maxBranches || 10,
          maxStorageMB: sub.featureLimits?.maxStorageMB || 20480,
          maxProjects: sub.featureLimits?.maxProjects || 50,
          maxUsers: sub.featureLimits?.maxUsers || 100,
        });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load subscription details.' });
      setShowSubModal(false);
    } finally {
      setSubDetailLoading(false);
    }
  };

  // Save Subscription Edits
  const handleSaveSubDetails = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      await updatePlatformSubscription(selectedSub._id, {
        status: subEditForm.status,
        planCode: subEditForm.planCode,
        featureLimits: {
          maxEmployees: Number(subEditForm.maxEmployees),
          maxBranches: Number(subEditForm.maxBranches),
          maxStorageMB: Number(subEditForm.maxStorageMB),
          maxProjects: Number(subEditForm.maxProjects),
          maxUsers: Number(subEditForm.maxUsers),
        },
      });
      setAlert({ type: 'success', message: 'Subscription details updated successfully.' });
      setShowSubModal(false);
      loadSubscriptions();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update subscription.' });
    }
  };

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === 'organizations') loadOrganizations();
    else if (activeTab === 'users') loadPlatformUsers();
    else if (activeTab === 'plans') loadPlans();
    else if (activeTab === 'subscriptions') loadSubscriptions();
    else if (activeTab === 'usage') loadUsage();
    else if (activeTab === 'audit-logs') loadAuditLogs();
  }, [activeTab, loadOrganizations, loadPlatformUsers, loadPlans, loadSubscriptions, loadUsage, loadAuditLogs]);

  // Handle Org Suspend
  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    try {
      await suspendPlatformOrganization(suspendTarget._id, suspendReason);
      setAlert({ type: 'success', message: `Organization '${suspendTarget.organizationName}' suspended.` });
      setSuspendTarget(null);
      setSuspendReason('');
      loadOrganizations();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to suspend organization.' });
    }
  };

  // Handle Org Activate
  const handleActivateOrg = async (org) => {
    try {
      await activatePlatformOrganization(org._id);
      setAlert({ type: 'success', message: `Organization '${org.organizationName}' activated.` });
      loadOrganizations();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to activate organization.' });
    }
  };

  // Handle Save Plan
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (planForm._id) {
        await updatePlatformPlan(planForm._id, planForm);
        setAlert({ type: 'success', message: 'Subscription plan updated successfully.' });
      } else {
        await createPlatformPlan(planForm);
        setAlert({ type: 'success', message: 'Subscription plan created successfully.' });
      }
      setShowPlanModal(false);
      loadPlans();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to save plan.' });
    }
  };

  // Handle Extend Subscription
  const handleExtendConfirm = async () => {
    if (!extendTarget) return;
    try {
      await extendPlatformSubscription(extendTarget._id, extendDays);
      setAlert({ type: 'success', message: `Subscription extended by ${extendDays} days.` });
      setExtendTarget(null);
      loadSubscriptions();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to extend subscription.' });
    }
  };

  const orgColumns = [
    {
      key: 'name',
      header: 'Organization',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.organizationName || 'Unnamed Org'}</div>
          <small className="text-muted">{row.organizationCode || row._id}</small>
        </div>
      ),
    },
    {
      key: 'primaryEmail',
      header: 'Contact Email',
      render: (row) => row.email || row.contactEmail || row.primaryEmail || 'N/A',
    },
    {
      key: 'plan',
      header: 'Assigned Plan',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          {row.subscription?.plan?.planName || row.planName || 'Standard SaaS'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.isSuspended ? 'SUSPENDED' : (row.isActive ? 'ACTIVE' : 'INACTIVE')} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-primary" onClick={() => handleViewOrgDetails(row._id)}>
            Details
          </Button>
          {row.isSuspended ? (
            <Button size="sm" variant="outline-success" onClick={() => handleActivateOrg(row)}>
              Activate
            </Button>
          ) : (
            <Button size="sm" variant="outline-danger" onClick={() => setSuspendTarget(row)}>
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  const userColumns = [
    {
      key: 'user',
      header: 'User & Email',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.firstName} {row.lastName}</div>
          <small className="text-muted">{row.email}</small>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Employee Code',
      render: (row) => row.employeeCode || 'N/A',
    },
    {
      key: 'org',
      header: 'Organization',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          {row.organizationId?.organizationName || 'Platform Scope'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => row.role?.roleName || row.roleCode || (row.isOwner ? 'Owner' : 'Member'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.isBlocked ? 'BLOCKED' : (row.isActive ? 'ACTIVE' : 'INACTIVE')} />,
    },
    {
      key: 'joined',
      header: 'Joined Date',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
    },
  ];

  const planColumns = [
    {
      key: 'code',
      header: 'Plan Code & Name',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.planName} ({row.planCode})</div>
          <small className="text-muted">{row.description || 'Enterprise Tier'}</small>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price / Cycle',
      render: (row) => (
        <div className="fw-bold text-success">
          {row.currency || 'INR'} {row.price} / {row.billingCycle}
        </div>
      ),
    },
    {
      key: 'limits',
      header: 'Limits',
      render: (row) => (
        <small className="text-muted">
          Max Users: {row.maxUsers} · Max Branches: {row.maxBranches}
        </small>
      ),
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
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => {
              setPlanForm({
                _id: row._id,
                planCode: row.planCode,
                planName: row.planName,
                description: row.description || '',
                billingCycle: row.billingCycle || 'MONTHLY',
                price: row.price || 0,
                currency: row.currency || 'INR',
                maxUsers: row.maxUsers || 50,
                maxBranches: row.maxBranches || 2,
                isActive: row.isActive !== undefined ? row.isActive : true,
              });
              setShowPlanModal(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={row.isActive ? 'outline-warning' : 'outline-success'}
            onClick={async () => {
              await updatePlatformPlanStatus(row._id, !row.isActive);
              loadPlans();
            }}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const subColumns = [
    {
      key: 'org',
      header: 'Tenant Organization',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.organizationId?.organizationName || 'Organization'}</div>
          <small className="text-muted">Sub ID: {row._id?.slice(-8)}</small>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (row) => row.planId?.planName || 'Standard Plan',
    },
    {
      key: 'dates',
      header: 'Valid Period',
      render: (row) => (
        <small>
          {row.startDate ? new Date(row.startDate).toLocaleDateString() : ''} → {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Continuous'}
        </small>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'ACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => handleViewSubDetails(row._id)}
          >
            Inspect / Edit
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              setExtendTarget(row);
              setExtendDays(30);
            }}
            className="d-flex align-items-center gap-1"
          >
            <MdMoreTime /> Extend
          </Button>
          {row.status === 'SUSPENDED' ? (
            <Button
              size="sm"
              variant="outline-success"
              onClick={async () => {
                await activatePlatformSubscription(row._id);
                loadSubscriptions();
              }}
            >
              Activate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={async () => {
                await suspendPlatformSubscription(row._id, 'Administrative suspension');
                loadSubscriptions();
              }}
            >
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!isPlatformAdmin) {
    return (
      <div className="platform-page">
        <Container fluid>
          <div className="platform-header">
            <div>
              <h1 className="platform-title">Platform Administration</h1>
              <p className="platform-subtitle">
                This administrative console is restricted to SaaS Super Administrators.
              </p>
            </div>
          </div>
          <Card className="platform-card text-center py-5">
            <div className="mb-3">
              <MdBusiness style={{ fontSize: '3rem', color: 'var(--color-primary, #C79D58)' }} />
            </div>
            <h4 className="fw-bold mb-2">Tenant Organization Mode</h4>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: '520px' }}>
              You are currently logged in with organization credentials (<em>{currentUser?.roleName || currentUser?.roleCode || 'Organization Member'}</em>).
              To configure your company profile, branches, or subscription tier, please visit the Organization settings.
            </p>
            <div>
              <Button variant="primary" onClick={() => navigate('/organisation')}>
                Go to Organization Management
              </Button>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="platform-page">
      <Container fluid>
        <div className="platform-header">
          <div>
            <h1 className="platform-title">SaaS Platform Administration</h1>
            <p className="platform-subtitle">
              Multi-tenant overview, tenant organization control, subscription plan provisioning, and platform health.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={loadOverview} className="d-flex align-items-center gap-1">
              <MdRefresh /> Refresh
            </Button>
            {activeTab === 'plans' && (
              <Button
                variant="primary"
                onClick={() => {
                  setPlanForm({
                    _id: null,
                    planCode: '',
                    planName: '',
                    description: '',
                    billingCycle: 'MONTHLY',
                    price: 0,
                    currency: 'INR',
                    maxUsers: 50,
                    maxBranches: 2,
                    isActive: true,
                  });
                  setShowPlanModal(true);
                }}
                className="d-flex align-items-center gap-1"
              >
                <MdAddCircle /> Create Plan
              </Button>
            )}
          </div>
        </div>

        {alert && <FeedbackAlert variant={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Metric Cards */}
        {metrics && (
          <Row className="mb-4 g-3">
            <Col md={3}>
              <div className="platform-stat-card">
                <div className="platform-stat-icon"><MdBusiness /></div>
                <div>
                  <div className="platform-stat-val">{metrics.totalOrganizations ?? organizations.length}</div>
                  <div className="platform-stat-lbl">Organizations</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="platform-stat-card">
                <div className="platform-stat-icon"><MdSubscriptions /></div>
                <div>
                  <div className="platform-stat-val">{metrics.activeSubscriptions ?? subscriptions.length}</div>
                  <div className="platform-stat-lbl">Active Subscriptions</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="platform-stat-card">
                <div className="platform-stat-icon"><MdCardMembership /></div>
                <div>
                  <div className="platform-stat-val">{plans.length || 3}</div>
                  <div className="platform-stat-lbl">Subscription Plans</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="platform-stat-card">
                <div className="platform-stat-icon"><MdAnalytics /></div>
                <div>
                  <div className="platform-stat-val text-success">Optimal</div>
                  <div className="platform-stat-lbl">System Health</div>
                </div>
              </div>
            </Col>
          </Row>
        )}

        <Card className="platform-card">
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="lifecycle-nav-tabs mb-3">
              <Nav.Item>
                <Nav.Link eventKey="organizations">
                  <MdBusiness className="me-1" /> Tenant Organizations
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="users">
                  <MdPeople className="me-1" /> Platform Users
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="plans">
                  <MdCardMembership className="me-1" /> Subscription Plans
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="subscriptions">
                  <MdSubscriptions className="me-1" /> Active Subscriptions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="usage">
                  <MdDataUsage className="me-1" /> Resource Usage
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="audit-logs">
                  <MdHistory className="me-1" /> Platform Audit Logs
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Tab 1: Organizations */}
              <Tab.Pane eventKey="organizations">
                <Row className="mb-3">
                  <Col md={6}>
                    <SearchInput
                      value={orgSearch}
                      onChange={(val) => setOrgSearch(val)}
                      placeholder="Search tenant organizations by name or code..."
                    />
                  </Col>
                </Row>
                <DataTable
                  columns={orgColumns}
                  rows={organizations}
                  loading={orgLoading}
                  loadingComponent={<LoadingSpinner variant="table" />}
                  emptyComponent={<EmptyState message="No tenant organizations found." variant="table" />}
                  className="align-middle"
                />
                {orgTotal > 10 && (
                  <PaginationBar page={orgPage} totalPages={Math.ceil(orgTotal / 10)} onPageChange={(p) => setOrgPage(p)} />
                )}
              </Tab.Pane>

              {/* Tab 2: Plans */}
              <Tab.Pane eventKey="plans">
                <DataTable
                  columns={planColumns}
                  rows={plans}
                  loading={plansLoading}
                  loadingComponent={<LoadingSpinner variant="table" />}
                  emptyComponent={<EmptyState message="No subscription plans found." variant="table" />}
                  className="align-middle"
                />
              </Tab.Pane>

              {/* Tab 3: Subscriptions */}
              <Tab.Pane eventKey="subscriptions">
                <DataTable
                  columns={subColumns}
                  rows={subscriptions}
                  loading={subsLoading}
                  loadingComponent={<LoadingSpinner variant="table" />}
                  emptyComponent={<EmptyState message="No subscription records found." variant="table" />}
                  className="align-middle"
                />
              </Tab.Pane>

              {/* Tab 4: Audit Logs */}
              <Tab.Pane eventKey="audit-logs">
                <DataTable
                  columns={[
                    {
                      key: 'timestamp',
                      header: 'Timestamp',
                      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : ''),
                    },
                    {
                      key: 'action',
                      header: 'Action',
                      render: (row) => <span className="fw-semibold">{row.action}</span>,
                    },
                    {
                      key: 'performedBy',
                      header: 'Super Admin',
                      render: (row) => row.performedBy?.email || 'System',
                    },
                    {
                      key: 'details',
                      header: 'Details',
                      render: (row) => row.details || 'N/A',
                    },
                  ]}
                  rows={auditLogs}
                  loading={auditLoading}
                  loadingComponent={<LoadingSpinner variant="table" />}
                  emptyComponent={<EmptyState message="No platform audit records found." variant="table" />}
                  className="align-middle"
                />
              </Tab.Pane>

              {/* Tab 5: Platform Users */}
              <Tab.Pane eventKey="users">
                <Row className="mb-3 g-2 align-items-center">
                  <Col md={6}>
                    <SearchInput
                      value={userSearch}
                      onChange={(val) => {
                        setUserSearch(val);
                        setUserPage(1);
                      }}
                      placeholder="Search users by name, email, employee code..."
                    />
                  </Col>
                </Row>

                <DataTable
                  columns={userColumns}
                  rows={platformUsers}
                  loading={userLoading}
                  loadingComponent={<LoadingSpinner variant="table" />}
                  emptyComponent={<EmptyState message="No platform users found." variant="table" />}
                  className="align-middle"
                />

                {userTotal > 10 && (
                  <PaginationBar
                    page={userPage}
                    totalPages={Math.ceil(userTotal / 10)}
                    onPageChange={(p) => setUserPage(p)}
                  />
                )}
              </Tab.Pane>

              {/* Tab 6: Resource Usage */}
              <Tab.Pane eventKey="usage">
                {usageLoading && (
                  <div className="d-flex justify-content-center py-5">
                    <LoadingSpinner variant="table" />
                  </div>
                )}

                {!usageLoading && usageData && (
                  <div>
                    <Row className="mb-4 g-3">
                      <Col md={3}>
                        <div className="platform-stat-card">
                          <div className="platform-stat-icon"><MdBusiness /></div>
                          <div>
                            <div className="platform-stat-val">{usageData.totalOrganizations} ({usageData.activeOrganizations} Active)</div>
                            <div className="platform-stat-lbl">Organizations</div>
                          </div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="platform-stat-card">
                          <div className="platform-stat-icon"><MdPeople /></div>
                          <div>
                            <div className="platform-stat-val">{usageData.totalEmployees}</div>
                            <div className="platform-stat-lbl">Total Active Employees</div>
                          </div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="platform-stat-card">
                          <div className="platform-stat-icon"><MdBusiness /></div>
                          <div>
                            <div className="platform-stat-val">{usageData.totalBranches}</div>
                            <div className="platform-stat-lbl">Total Branches</div>
                          </div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="platform-stat-card">
                          <div className="platform-stat-icon"><MdAnalytics /></div>
                          <div>
                            <div className="platform-stat-val">{usageData.totalProjects}</div>
                            <div className="platform-stat-lbl">Total Projects</div>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <h6 className="fw-bold mb-3 text-dark">Plan Usage Distribution</h6>
                    <DataTable
                      columns={[
                        {
                          key: 'planCode',
                          header: 'Plan Code',
                          render: (row) => <span className="fw-semibold">{row._id || 'Standard'}</span>,
                        },
                        {
                          key: 'total',
                          header: 'Total Subscriptions',
                          render: (row) => <span className="badge bg-light text-dark border">{row.totalSubscriptions}</span>,
                        },
                        {
                          key: 'active',
                          header: 'Active Count',
                          render: (row) => <span className="badge bg-success">{row.activeCount}</span>,
                        },
                      ]}
                      rows={usageData.planUsage || []}
                      emptyComponent={<EmptyState message="No plan usage data available." variant="table" />}
                      className="align-middle"
                    />
                  </div>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card>

        {/* Suspend Confirmation Modal */}
        <Modal show={Boolean(suspendTarget)} onHide={() => setSuspendTarget(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Suspend Tenant Organization</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-danger mb-3">
              Are you sure you want to suspend access for organization: <strong>{suspendTarget?.organizationName}</strong>?
            </p>
            <Form.Group>
              <Form.Label>Suspension Reason <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. Overdue payment, Terms of Service violation"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleSuspendConfirm} disabled={!suspendReason.trim()}>
              Confirm Suspension
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Plan Create / Edit Modal */}
        <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>{planForm._id ? 'Edit Plan' : 'Create Subscription Plan'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSavePlan}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Plan Code <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="e.g. ENTERPRISE_PRO"
                      value={planForm.planCode}
                      onChange={(e) => setPlanForm({ ...planForm, planCode: e.target.value.toUpperCase() })}
                      disabled={Boolean(planForm._id)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Plan Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      required
                      placeholder="e.g. Enterprise Pro Tier"
                      value={planForm.planName}
                      onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      required
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Billing Cycle <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={planForm.billingCycle}
                      onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                    >
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="QUARTERLY">QUARTERLY</option>
                      <option value="ANNUAL">ANNUAL</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Control
                      type="text"
                      value={planForm.currency}
                      onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Employees / Users</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={planForm.maxUsers}
                      onChange={(e) => setPlanForm({ ...planForm, maxUsers: Number(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Branches</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={planForm.maxBranches}
                      onChange={(e) => setPlanForm({ ...planForm, maxBranches: Number(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Plan Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowPlanModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Plan</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Extend Subscription Modal */}
        <Modal show={Boolean(extendTarget)} onHide={() => setExtendTarget(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Extend Subscription</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-3">
              Extend subscription for: <strong>{extendTarget?.organizationId?.organizationName}</strong>
            </p>
            <Form.Group>
              <Form.Label>Number of Days to Extend <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setExtendTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleExtendConfirm}>Confirm Extension</Button>
          </Modal.Footer>
        </Modal>

        {/* Organization Detail Modal */}
        <Modal show={showOrgModal} onHide={() => setShowOrgModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">
              Organization Details: {selectedOrg?.organizationName || 'Loading...'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {orgDetailLoading ? (
              <div className="py-4 text-center">
                <LoadingSpinner variant="table" />
              </div>
            ) : selectedOrg ? (
              <div>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <label className="text-muted small d-block">Organization Name</label>
                    <div className="fw-semibold">{selectedOrg.organizationName}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-muted small d-block">Organization Code</label>
                    <div className="fw-semibold font-monospace">{selectedOrg.organizationCode || selectedOrg._id}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-muted small d-block">Primary Email</label>
                    <div>{selectedOrg.email || selectedOrg.contactEmail || selectedOrg.primaryEmail || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-muted small d-block">Phone / Mobile</label>
                    <div>{selectedOrg.phone || selectedOrg.mobileNo || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-muted small d-block">Domain</label>
                    <div>{selectedOrg.domain || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-muted small d-block">Status</label>
                    <StatusBadge status={selectedOrg.isSuspended ? 'SUSPENDED' : (selectedOrg.status || (selectedOrg.isActive ? 'ACTIVE' : 'INACTIVE'))} />
                  </Col>
                  <Col md={6}>
                    <label className="text-muted small d-block">Created At</label>
                    <div>{selectedOrg.createdAt ? new Date(selectedOrg.createdAt).toLocaleString() : '—'}</div>
                  </Col>
                  <Col md={6}>
                    <label className="text-muted small d-block">Default Currency</label>
                    <div>{selectedOrg.currency || 'INR'}</div>
                  </Col>
                </Row>
              </div>
            ) : (
              <p className="text-muted small mb-0">Organization details could not be loaded.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowOrgModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>

        {/* Subscription Detail / Edit Modal */}
        <Modal show={showSubModal} onHide={() => setShowSubModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="h6 fw-bold">
              Subscription Limits & Configuration
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveSubDetails}>
            <Modal.Body className="p-4">
              {subDetailLoading ? (
                <div className="py-4 text-center">
                  <LoadingSpinner variant="table" />
                </div>
              ) : selectedSub ? (
                <div>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Subscription Status</Form.Label>
                        <Form.Select
                          value={subEditForm.status}
                          onChange={(e) => setSubEditForm({ ...subEditForm, status: e.target.value })}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="EXPIRED">EXPIRED</option>
                          <option value="TRIAL">TRIAL</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Plan Code</Form.Label>
                        <Form.Control
                          type="text"
                          value={subEditForm.planCode}
                          onChange={(e) => setSubEditForm({ ...subEditForm, planCode: e.target.value.toUpperCase() })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6 className="fw-bold text-dark mt-4 mb-3">Feature Resource Limits</h6>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Max Employees</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={subEditForm.maxEmployees}
                          onChange={(e) => setSubEditForm({ ...subEditForm, maxEmployees: Number(e.target.value) })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Max Branches</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={subEditForm.maxBranches}
                          onChange={(e) => setSubEditForm({ ...subEditForm, maxBranches: Number(e.target.value) })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Max Projects</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={subEditForm.maxProjects}
                          onChange={(e) => setSubEditForm({ ...subEditForm, maxProjects: Number(e.target.value) })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Max Storage (MB)</Form.Label>
                        <Form.Control
                          type="number"
                          min="100"
                          value={subEditForm.maxStorageMB}
                          onChange={(e) => setSubEditForm({ ...subEditForm, maxStorageMB: Number(e.target.value) })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Max Users</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={subEditForm.maxUsers}
                          onChange={(e) => setSubEditForm({ ...subEditForm, maxUsers: Number(e.target.value) })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => setShowSubModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Changes</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
}

export default PlatformAdmin;
