import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaUserCheck,
  FaBusinessTime,
  FaCalendarAlt,
  FaShieldAlt,
  FaArrowRight,
  FaUsers,
  FaUserShield,
  FaTasks,
  FaLaptop,
  FaFileAlt,
  FaCalendarCheck,
} from 'react-icons/fa';
import AttendanceCard from '../../Components/Attendance/AttendanceCard';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

/**
 * Dashboard Component
 *
 * Serves as the landing view for authenticated users.
 * Role Matrix Rules:
 * - Employee & HR: Display AttendanceCard (Punch In / Punch Out Widget).
 * - Admin & Owner: NO Attendance Punch card on Dashboard.
 *
 * Strict Rule: No dummy/fake statistics or fake counts. Real router navigation shortcuts only.
 */
function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const employeeName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Team Member';
  const roleCode = (user?.roleCode || user?.roleName || '').toUpperCase();

  // Admin and Owner roles do not have Punch In / Out widget on Dashboard
  const isPunchTrackedRole = !(roleCode.includes('ADMIN') || roleCode.includes('OWNER'));

  // Formatted date
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Container fluid className="px-0">
      {/* ── Hero Welcome Banner ── */}
      <div className="app-hero-card">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="app-pill app-pill-success dash-role-badge">
                <FaShieldAlt size={12} /> {user?.roleName || 'Team Member'}
              </span>
              <span className="dash-date-text">
                {todayFormatted}
              </span>
            </div>
            <h3 className="fw-bold mb-1 text-white">
              Welcome back, {employeeName}! 👋
            </h3>
            <p className="small mb-0 dash-hero-desc">
              {isPunchTrackedRole
                ? 'Track your daily attendance, manage work milestones, and access team resources from your personal workspace.'
                : 'Enterprise Administration Console. Access organization directories, governance workflows, and role permissions.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Content ── */}
      {isPunchTrackedRole ? (
        /* Employee & HR Dashboard View */
        <Row className="g-4 mb-4">
          {/* Left: Punch Card */}
          <Col lg={6} xl={5}>
            <AttendanceCard />
          </Col>

          {/* Right: Workspace Policy & Quick Links */}
          <Col lg={6} xl={7}>
            {/* Daily Policy Guidelines Card */}
            <Card className="app-card mb-3">
              <div className="app-card-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="dash-policy-icon">
                    <FaBusinessTime size={16} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Daily Work Policy & Punch Rules</h6>
                    <span className="extra-small text-muted">Attendance Guidelines</span>
                  </div>
                </div>
              </div>
              <div className="app-card-body">
                <div className="p-3 bg-light rounded-3 mb-3 small text-secondary">
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <FaUserCheck className="text-success mt-1 flex-shrink-0" />
                    <span>
                      <strong>Shift Punch In:</strong> Record your arrival time upon starting daily assignments.
                    </span>
                  </div>
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <FaCalendarAlt className="text-primary mt-1 flex-shrink-0" />
                    <span>
                      <strong>Shift Punch Out:</strong> Finalize your attendance when concluding your working day.
                    </span>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <FaShieldAlt className="text-warning mt-1 flex-shrink-0" />
                    <span>
                      <strong>Hours Policy:</strong> Minimum 8.5 hours for full-day credit (minimum 4 hours for half-day).
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Chips */}
                <h6 className="fw-bold text-uppercase micro-text text-muted mb-2">Quick Navigation</h6>
                <Row className="g-2">
                  <Col sm={6}>
                    <div
                      className="app-quick-card"
                      onClick={() => navigate('/attendance')}
                    >
                      <div className="app-quick-icon">
                        <FaCalendarCheck />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-bold text-dark small text-truncate">My Attendance</div>
                        <div className="extra-small text-muted">Monthly Calendar & History</div>
                      </div>
                      <FaArrowRight size={12} className="text-muted ms-auto" />
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div
                      className="app-quick-card"
                      onClick={() => navigate('/leave')}
                    >
                      <div className="app-quick-icon">
                        <FaFileAlt />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-bold text-dark small text-truncate">Leave Request</div>
                        <div className="extra-small text-muted">Check Balance & Apply</div>
                      </div>
                      <FaArrowRight size={12} className="text-muted ms-auto" />
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      ) : (
        /* Admin & Owner Dashboard View (No fake stats, Clean module shortcuts) */
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Management Consoles</h5>
              <p className="text-muted small mb-0">Direct access to core administrative modules</p>
            </div>
          </div>

          <Row className="g-3 mb-4">
            <Col sm={6} lg={4}>
              <div
                className="app-quick-card p-3"
                onClick={() => navigate('/attendance')}
              >
                <div className="app-quick-icon dash-icon-mint">
                  <FaCalendarCheck />
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-dark small">Attendance Console</div>
                  <div className="extra-small text-muted">Team logs, today status & corrections</div>
                </div>
                <FaArrowRight size={12} className="text-muted" />
              </div>
            </Col>

            <Col sm={6} lg={4}>
              <div
                className="app-quick-card p-3"
                onClick={() => navigate('/roles')}
              >
                <div className="app-quick-icon dash-icon-purple">
                  <FaUserShield />
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-dark small">Access & Role Matrix</div>
                  <div className="extra-small text-muted">RBAC, permissions & user provisioning</div>
                </div>
                <FaArrowRight size={12} className="text-muted" />
              </div>
            </Col>

            <Col sm={6} lg={4}>
              <div
                className="app-quick-card p-3"
                onClick={() => navigate('/projects')}
              >
                <div className="app-quick-icon dash-icon-sky">
                  <FaTasks />
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-dark small">Projects & Sprints</div>
                  <div className="extra-small text-muted">Sprint boards, tasks & delivery gates</div>
                </div>
                <FaArrowRight size={12} className="text-muted" />
              </div>
            </Col>

            <Col sm={6} lg={4}>
              <div
                className="app-quick-card p-3"
                onClick={() => navigate('/assets')}
              >
                <div className="app-quick-icon dash-icon-amber">
                  <FaLaptop />
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-dark small">Asset Management</div>
                  <div className="extra-small text-muted">Device inventory & hardware tracking</div>
                </div>
                <FaArrowRight size={12} className="text-muted" />
              </div>
            </Col>

            <Col sm={6} lg={4}>
              <div
                className="app-quick-card p-3"
                onClick={() => navigate('/onboarding')}
              >
                <div className="app-quick-icon dash-icon-pink">
                  <FaUsers />
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-dark small">HR Onboarding</div>
                  <div className="extra-small text-muted">Employee enrollment & document verification</div>
                </div>
                <FaArrowRight size={12} className="text-muted" />
              </div>
            </Col>

            <Col sm={6} lg={4}>
              <div
                className="app-quick-card p-3"
                onClick={() => navigate('/leave')}
              >
                <div className="app-quick-icon dash-icon-emerald">
                  <FaFileAlt />
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-dark small">Leave Approvals</div>
                  <div className="extra-small text-muted">Organization leave requests & audits</div>
                </div>
                <FaArrowRight size={12} className="text-muted" />
              </div>
            </Col>
          </Row>

          {/* System Environment Information Card */}
          <Card className="app-card">
            <div className="app-card-body p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="dash-admin-banner-icon">
                  <FaShieldAlt />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h6 className="fw-bold mb-1 text-dark">TeamHub HRMS Administration Portal</h6>
                  <p className="text-muted small mb-0">
                    Granular RBAC enforcement is active. Permissions are applied based on your assigned administrative profile.
                  </p>
                </div>
                <span className="app-pill app-pill-success flex-shrink-0 d-none d-sm-inline-flex">
                  Active
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}

export default Dashboard;