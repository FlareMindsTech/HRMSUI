import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaUserCheck, FaBusinessTime, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import AttendanceCard from '../../Components/Attendance/AttendanceCard';

/**
 * Dashboard Component
 *
 * Serves as the landing view for authenticated users.
 * Hosts the AttendanceCard widget for daily punch in / punch out tracking.
 */
function Dashboard() {
  // Retrieve stored user profile for personalized greeting
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (e) {
    console.warn('Failed to parse stored user profile:', e);
  }

  const employeeName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Employee';
  const roleName = user?.roleName || 'Team Member';

  return (
    <Container fluid className="p-3">
      {/* Welcome Banner */}
      <Row className="mb-4 align-items-center g-3">
        <Col md={8}>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary, #1a2e2a)' }}>
            Welcome back, {employeeName || 'Team Member'}! 👋
          </h4>
          <p className="text-muted small mb-0">
            Role: <span className="fw-medium text-dark">{roleName}</span> · Here is your daily workspace overview.
          </p>
        </Col>
      </Row>

      {/* Main Grid: Attendance Card + Workspace Overview */}
      <Row className="g-4 mb-4">
        {/* Attendance Action Widget */}
        <Col lg={6} xl={5}>
          <AttendanceCard />
        </Col>

        {/* Quick Workspace Info / Summary Card */}
        <Col lg={6} xl={7}>
          <Card
            className="border-0 shadow-sm rounded-4 h-100 p-4"
            style={{ background: '#ffffff', border: '1px solid var(--card-border, rgba(220, 235, 228, 0.9))' }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(45, 197, 138, 0.12)',
                  color: '#2DC58A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                <FaBusinessTime />
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">Workspace Guidelines</h6>
                <span className="extra-small text-muted">Daily Attendance & Work Policy</span>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3 mb-3 small text-secondary">
              <div className="d-flex align-items-center gap-2 mb-2">
                <FaUserCheck className="text-success" />
                <span><strong>Punch In:</strong> Record your start time when you begin your workday.</span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <FaCalendarAlt className="text-primary" />
                <span><strong>Punch Out:</strong> Finalize your attendance when ending your working session.</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <FaShieldAlt className="text-warning" />
                <span><strong>Policy:</strong> Minimum 8.5 hours for full-day credit (4 hours for half-day).</span>
              </div>
            </div>

            <div className="mt-auto pt-2 border-top text-muted small d-flex justify-content-between">
              <span>TeamHub HRMS Portal</span>
              <span>v1.0.0</span>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;