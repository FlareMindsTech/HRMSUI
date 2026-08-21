import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import {
  FaCalendarCheck,
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaArrowRight,
} from 'react-icons/fa';
import { fetchTodayAttendance, punchInUser, punchOutUser } from '../../Api/Attendance/attendance';
import { getCurrentCoordinates } from '../../utils/geolocation';
import { formatTime, formatFullDate } from '../../utils/dateFormatter';
import './AttendanceCard.css';

/**
 * AttendanceCard Component
 *
 * Implements the 3-state attendance workflow:
 * - State 1: Not Punched In (data === null) -> Prompts "Punch In Now"
 * - State 2: Punched In / Currently Working (logoutTime === null) -> Prompts "Punch Out"
 * - State 3: Attendance Completed (logoutTime !== null) -> Displays summary of today's attendance
 *
 * The backend API (GET /api/attendance/today) is the single source of truth.
 */
function AttendanceCard() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionStageText, setActionStageText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ── Load Today's Attendance on Mount / Refresh ──
  const loadTodayAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetchTodayAttendance();
      if (response && response.success) {
        setAttendance(response.data);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to retrieve today’s attendance status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayAttendance();
  }, [loadTodayAttendance]);

  // ── Handle Punch In Action ──
  const handlePunchIn = async () => {
    if (actionInProgress) return;

    setActionInProgress(true);
    setErrorMessage('');
    setSuccessMessage('');
    setActionStageText('Getting location...');

    try {
      // 1. Request browser geolocation on-demand
      let coords;
      try {
        coords = await getCurrentCoordinates();
      } catch (geoError) {
        setErrorMessage(geoError.message);
        setActionInProgress(false);
        setActionStageText('');
        return;
      }

      // 2. Call backend Punch In API
      setActionStageText('Punching in...');
      await punchInUser({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy || 0,
      });

      setSuccessMessage('Punched in successfully! Have a great workday.');

      // 3. Refresh from backend as source of truth to transition to State 2
      await loadTodayAttendance();
    } catch (apiError) {
      setErrorMessage(apiError.message || 'Failed to punch in. Please try again.');
    } finally {
      setActionInProgress(false);
      setActionStageText('');
    }
  };

  // ── Handle Punch Out Action ──
  const handlePunchOut = async () => {
    if (actionInProgress) return;

    setActionInProgress(true);
    setErrorMessage('');
    setSuccessMessage('');
    setActionStageText('Punching out...');

    try {
      // 1. Call backend Punch Out API
      await punchOutUser();

      setSuccessMessage('Punched out successfully! Workday session completed.');

      // 2. Refresh from backend as source of truth to transition to State 3
      await loadTodayAttendance();
    } catch (apiError) {
      setErrorMessage(apiError.message || 'Failed to punch out. Please try again.');
    } finally {
      setActionInProgress(false);
      setActionStageText('');
    }
  };

  // ── Status Badge Helper ──
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return (
          <Badge bg="success" className="px-3 py-2 rounded-pill fw-semibold">
            Present
          </Badge>
        );
      case 'Half Day':
        return (
          <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fw-semibold">
            Half Day
          </Badge>
        );
      case 'Absent':
        return (
          <Badge bg="danger" className="px-3 py-2 rounded-pill fw-semibold">
            Absent
          </Badge>
        );
      default:
        return (
          <Badge bg="secondary" className="px-3 py-2 rounded-pill fw-semibold">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return (
    <Card className="attendance-card">
      {/* Card Header */}
      <div className="attendance-card-header">
        <div className="d-flex align-items-center gap-3">
          <div className="attendance-icon-badge">
            <FaCalendarCheck />
          </div>
          <div>
            <div className="attendance-title">Today's Attendance</div>
            <div className="attendance-date">{formatFullDate(new Date())}</div>
          </div>
        </div>

        {/* Header Status Tag */}
        {!loading && (
          <div>
            {attendance && !attendance.logoutTime && (
              <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill d-inline-flex align-items-center">
                <span className="pulse-indicator" /> Working
              </Badge>
            )}
            {attendance && attendance.logoutTime && renderStatusBadge(attendance.status)}
            {!attendance && (
              <Badge bg="light" text="secondary" className="border px-3 py-2 rounded-pill">
                Not Punched In
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="attendance-body">
        {/* Error Notification */}
        {errorMessage && (
          <Alert variant="danger" dismissible onClose={() => setErrorMessage('')} className="py-2 px-3 small mb-3">
            <FaExclamationTriangle className="me-2" />
            {errorMessage}
          </Alert>
        )}

        {/* Success Notification */}
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="py-2 px-3 small mb-3">
            <FaCheckCircle className="me-2 text-success" />
            {successMessage}
          </Alert>
        )}

        {/* Initial Loading Spinner */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" variant="success" className="me-2" />
            <span className="small text-muted">Checking attendance status...</span>
          </div>
        ) : !attendance ? (
          /* ======================================================
             STATE 1: NOT PUNCHED IN (attendance === null)
             ====================================================== */
          <div className="state-not-punched">
            <div className="state-icon-wrap">
              <FaClock size={28} />
            </div>
            <p className="state-not-punched-text">
              You haven't punched in today. Click below to start your workday.
            </p>
            <div>
              <Button
                variant="success"
                className="btn-punch-in"
                onClick={handlePunchIn}
                disabled={actionInProgress}
              >
                {actionInProgress ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span>{actionStageText || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <FaSignInAlt />
                    <span>Punch In Now</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : !attendance.logoutTime ? (
          /* ======================================================
             STATE 2: PUNCHED IN / CURRENTLY WORKING (logoutTime === null)
             ====================================================== */
          <div>
            <div className="state-working-info">
              <div className="working-grid">
                <div>
                  <div className="working-label">Punched In At</div>
                  <div className="working-value text-success">
                    {formatTime(attendance.loginTime)}
                  </div>
                </div>
                <div>
                  <div className="working-label">Location Type</div>
                  <div className="working-value d-flex align-items-center gap-1">
                    <FaMapMarkerAlt size={14} className="text-danger" />
                    <span>{attendance.locationType || 'Office'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="danger"
                className="btn-punch-out"
                onClick={handlePunchOut}
                disabled={actionInProgress}
              >
                {actionInProgress ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span>{actionStageText || 'Punching out...'}</span>
                  </>
                ) : (
                  <>
                    <FaSignOutAlt />
                    <span>Punch Out</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* ======================================================
             STATE 3: ATTENDANCE COMPLETED (logoutTime !== null)
             ====================================================== */
          <div>
            <div className="state-completed-info">
              <div className="completed-grid">
                <div>
                  <div className="completed-label">In Time</div>
                  <div className="completed-value">{formatTime(attendance.loginTime)}</div>
                </div>
                <div>
                  <div className="completed-label">Out Time</div>
                  <div className="completed-value">{formatTime(attendance.logoutTime)}</div>
                </div>
                <div>
                  <div className="completed-label">Total Hours</div>
                  <div className="completed-value text-primary">
                    {attendance.totalHours !== undefined ? attendance.totalHours : 0} hrs
                  </div>
                </div>
                <div>
                  <div className="completed-label">Location</div>
                  <div className="completed-value">{attendance.locationType || 'Office'}</div>
                </div>
              </div>
            </div>

            <div className="completed-badge-wrap">
              <FaCheckCircle />
              <span>Today's attendance is completed</span>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-top text-center">
          <Button
            variant="link"
            className="text-decoration-none p-0 small fw-bold text-success d-inline-flex align-items-center gap-1"
            onClick={() => navigate('/attendance')}
          >
            <span>View Full Attendance History</span>
            <FaArrowRight size={12} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AttendanceCard;
