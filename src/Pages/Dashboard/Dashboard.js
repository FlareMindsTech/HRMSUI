import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaSignInAlt, FaSignOutAlt, FaCheckCircle, FaClock, FaMapMarkerAlt, FaCalendarCheck } from 'react-icons/fa';
import { API_BASE_URL, authHeaders } from '../../config/api';

function Dashboard() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get GPS Coordinates on Demand for Punch In
  const getCoordinates = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  // Fetch today's attendance status
  const fetchTodayAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/today`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAttendance(data.data);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  // Handle Punch In
  const handlePunchIn = async () => {
    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let coords;
      try {
        coords = await getCoordinates();
      } catch (geoErr) {
        setMessage({
          type: 'danger',
          text: 'Location access is required to punch in. Please allow location access in your browser.',
        });
        setActionLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAttendance(data.data);
        setMessage({ type: 'success', text: 'Punched in successfully! Have a productive day.' });
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to punch in.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while punching in. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Punch Out
  const handlePunchOut = async () => {
    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });

      const data = await res.json();

      if (data.success) {
        setAttendance(data.data);
        setMessage({ type: 'success', text: 'Punched out successfully! Work session ended.' });
      } else {
        setMessage({ type: 'danger', text: data.message || 'Failed to punch out.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Server error while punching out. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '--:--';
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <Badge bg="success" className="px-3 py-2 rounded-pill">Present</Badge>;
      case 'Half Day':
        return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill">Half Day</Badge>;
      case 'Absent':
        return <Badge bg="danger" className="px-3 py-2 rounded-pill">Absent</Badge>;
      default:
        return <Badge bg="secondary" className="px-3 py-2 rounded-pill">{status}</Badge>;
    }
  };

  return (
    <Container fluid className="p-3">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2e2a' }}>Dashboard</h4>
          <p className="text-muted small mb-0">Overview of your daily workspace and attendance.</p>
        </Col>
      </Row>

      {/* Alerts */}
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {/* Attendance Action Widget Card */}
      <Row className="g-3 mb-4">
        <Col lg={6} xl={5}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: '#fff' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(45,197,138,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2DC58A',
                  }}
                >
                  <FaCalendarCheck size={18} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">Today's Attendance</h6>
                  <span className="extra-small text-muted" style={{ fontSize: '0.75rem' }}>
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {attendance && attendance.status && getStatusBadge(attendance.status)}
            </Card.Header>

            <Card.Body className="p-4">
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" variant="success" />
                  <span className="ms-2 small text-muted">Checking attendance...</span>
                </div>
              ) : !attendance ? (
                /* State 1: NOT PUNCHED IN */
                <div className="text-center py-3">
                  <div className="mb-3 text-muted">
                    <FaClock size={36} className="text-warning mb-2" />
                    <p className="small mb-0">You have not punched in for today yet.</p>
                  </div>
                  <Button
                    variant="success"
                    className="px-4 py-2 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #2DC58A 0%, #20a673 100%)', border: 'none' }}
                    onClick={handlePunchIn}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Spinner animation="border" size="sm" /> : <FaSignInAlt />}
                    Punch In Now
                  </Button>
                </div>
              ) : !attendance.logoutTime ? (
                /* State 2: PUNCHED IN, WORKING */
                <div>
                  <div className="p-3 bg-light rounded-3 mb-3 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="extra-small text-muted d-block" style={{ fontSize: '0.75rem' }}>Punched In At</span>
                      <span className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                        {formatTime(attendance.loginTime)}
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="extra-small text-muted d-block" style={{ fontSize: '0.75rem' }}>Location Type</span>
                      <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                        <FaMapMarkerAlt size={10} className="text-danger" /> {attendance.locationType || 'Office'}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-center">
                    <Button
                      variant="danger"
                      className="px-4 py-2 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: 'none' }}
                      onClick={handlePunchOut}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Spinner animation="border" size="sm" /> : <FaSignOutAlt />}
                      Punch Out
                    </Button>
                  </div>
                </div>
              ) : (
                /* State 3: PUNCHED OUT, COMPLETED */
                <div>
                  <div className="p-3 bg-light rounded-3 mb-3">
                    <Row className="g-2 text-center">
                      <Col xs={4}>
                        <span className="extra-small text-muted d-block" style={{ fontSize: '0.7rem' }}>In Time</span>
                        <span className="fw-bold text-dark small">{formatTime(attendance.loginTime)}</span>
                      </Col>
                      <Col xs={4}>
                        <span className="extra-small text-muted d-block" style={{ fontSize: '0.7rem' }}>Out Time</span>
                        <span className="fw-bold text-dark small">{formatTime(attendance.logoutTime)}</span>
                      </Col>
                      <Col xs={4}>
                        <span className="extra-small text-muted d-block" style={{ fontSize: '0.7rem' }}>Total Hours</span>
                        <span className="fw-bold text-primary small">{attendance.totalHours || 0} hrs</span>
                      </Col>
                    </Row>
                  </div>

                  <div className="text-center text-success d-flex align-items-center justify-content-center gap-2 small fw-medium">
                    <FaCheckCircle /> Attendance completed for today.
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;