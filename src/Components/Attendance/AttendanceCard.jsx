import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Alert, Spinner, Button } from 'react-bootstrap';
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
import { useAuth } from '../../context/AuthContext';
import './AttendanceCard.css';

/**
 * AttendanceCard Component
 *
 * Implements the 3-state attendance workflow:
 * - State 1: Not Punched In (attendance === null) -> Prompts "Punch In Now"
 * - State 2: Punched In / Currently Working (logoutTime === null) -> Prompts "Punch Out"
 * - State 3: Attendance Completed (logoutTime !== null) -> Displays summary of today's attendance
 *
 * The backend API (GET /api/attendance/today) is the single source of truth.
 */
function AttendanceCard() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const roleCode = (user?.roleCode || user?.roleName || '').toUpperCase();
  const isAdminOrOwner = roleCode.includes('ADMIN') || roleCode.includes('OWNER') || user?.priority === 1;
  const canPunchIn = !isAdminOrOwner && (hasPermission('attendance.punch_in') || roleCode.includes('EMPLOYEE') || roleCode.includes('HR'));
  const canPunchOut = !isAdminOrOwner && (hasPermission('attendance.punch_out') || roleCode.includes('EMPLOYEE') || roleCode.includes('HR'));

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
    if (actionInProgress || !canPunchIn) return;

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

      setSuccessMessage('Punched in successfully! Have a productive workday.');

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
    if (actionInProgress || !canPunchOut) return;

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
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill fw-semibold att-card-badge-sm">
            <FaCheckCircle className="me-1" /> Present
          </span>
        );
      case 'Half Day':
        return (
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-1 rounded-pill fw-semibold att-card-badge-sm">
            Half Day
          </span>
        );
      case 'Absent':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1 rounded-pill fw-semibold att-card-badge-sm">
            Absent
          </span>
        );
      default:
        return (
          <span className="badge bg-light text-secondary border px-3 py-1 rounded-pill fw-semibold att-card-badge-sm">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <Card className="attendance-card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
      {/* Card Header */}
      <div className="attendance-card-header d-flex justify-content-between align-items-center p-3 px-4 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center rounded-3 shadow-xs att-card-header-icon">
            <FaCalendarCheck />
          </div>
          <div>
            <div className="fw-bold text-dark att-card-title">
              Today's Attendance
            </div>
            <div className="text-muted att-card-date">
              {formatFullDate(new Date())}
            </div>
          </div>
        </div>

        {/* Header Live Status Tag */}
        {!loading && (
          <div>
            {attendance && !attendance.logoutTime && (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill d-inline-flex align-items-center fw-semibold att-card-badge-sm">
                <span className="pulse-indicator" /> Currently Working
              </span>
            )}
            {attendance && attendance.logoutTime && (
              <div className="d-inline-flex align-items-center gap-1">
                {renderStatusBadge(attendance.status)}
                {attendance.logoutType === 'AUTO' && (
                  <span className="att-badge-auto">Auto-Closed</span>
                )}
                {attendance.logoutType === 'MANUAL' && (
                  <span className="att-badge-manual">Manual</span>
                )}
              </div>
            )}
            {!attendance && (
              <span className="badge bg-light text-muted border px-3 py-1 rounded-pill fw-medium att-card-badge-sm">
                {isAdminOrOwner ? 'Management' : 'Not Punched In'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Error Notification */}
        {errorMessage && (
          <Alert variant="danger" dismissible onClose={() => setErrorMessage('')} className="py-2 px-3 small mb-3 rounded-3">
            <FaExclamationTriangle className="me-2" />
            {errorMessage}
          </Alert>
        )}

        {/* Success Notification */}
        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="py-2 px-3 small mb-3 rounded-3">
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
          <div className="text-center py-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 att-card-state1-icon">
              <FaClock size={30} />
            </div>
            <h6 className="fw-bold text-dark mb-1">Ready to start your day?</h6>
            <p className="text-muted small mb-4 mx-auto att-card-state1-desc">
              You have not punched in for today yet. Record your start time with verified location.
            </p>
            <div>
              {canPunchIn ? (
                <Button
                  variant="success"
                  className="btn-punch-in px-4 py-2 rounded-pill fw-bold shadow-sm"
                  onClick={handlePunchIn}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <Spinner animation="border" size="sm" />
                      <span>{actionStageText || 'Processing...'}</span>
                    </span>
                  ) : (
                    <span className="d-inline-flex align-items-center gap-2">
                      <FaSignInAlt />
                      <span>Punch In Now</span>
                    </span>
                  )}
                </Button>
              ) : (
                <div className="text-muted small py-2 px-3 bg-light rounded-pill d-inline-block fw-semibold border">
                  {isAdminOrOwner ? 'Management user — shift punch not required' : 'Punch actions not enabled for this account'}
                </div>
              )}
            </div>
          </div>
        ) : !attendance.logoutTime ? (
          /* ======================================================
             STATE 2: PUNCHED IN / CURRENTLY WORKING (logoutTime === null)
             ====================================================== */
          <div>
            <div className="p-3 rounded-3 mb-4 att-card-working-box">
              <div className="row g-3 text-center text-sm-start">
                <div className="col-12 col-sm-6">
                  <div className="text-muted text-uppercase fw-semibold att-card-sublabel">
                    Punched In At
                  </div>
                  <div className="fw-bold text-success d-flex align-items-center justify-content-center justify-content-sm-start gap-1 mt-1 att-card-punch-time">
                    <FaClock size={16} />
                    <span>{formatTime(attendance.loginTime)}</span>
                  </div>
                  {attendance.isLate && (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-0 mt-1 rounded-pill att-card-badge-late">
                      Late Arrival
                    </span>
                  )}
                </div>
                <div className="col-12 col-sm-6">
                  <div className="text-muted text-uppercase fw-semibold att-card-sublabel">
                    Workplace Location
                  </div>
                  <div className="fw-bold text-dark d-flex align-items-center justify-content-center justify-content-sm-start gap-1 mt-1 att-card-location-val">
                    <FaMapMarkerAlt size={16} className={attendance.locationType === 'WFH' ? 'text-primary' : 'text-danger'} />
                    <span>{attendance.locationType || 'Office'}</span>
                  </div>
                  <span className="text-muted extra-small">GPS Verified</span>
                </div>
              </div>
            </div>

            {canPunchOut && (
              <div className="text-center">
                <Button
                  variant="danger"
                  className="btn-punch-out px-4 py-2 rounded-pill fw-bold shadow-sm"
                  onClick={handlePunchOut}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <span className="d-inline-flex align-items-center gap-2">
                      <Spinner animation="border" size="sm" />
                      <span>{actionStageText || 'Punching out...'}</span>
                    </span>
                  ) : (
                    <span className="d-inline-flex align-items-center gap-2">
                      <FaSignOutAlt />
                      <span>Punch Out</span>
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================
             STATE 3: ATTENDANCE COMPLETED (logoutTime !== null)
             ====================================================== */
          <div>
            <div className="p-3 rounded-3 mb-3 att-card-completed-box">
              <div className="row g-2 text-center">
                <div className="col-6 col-md-3">
                  <div className="text-muted text-uppercase fw-semibold att-card-metric-label">
                    In Time
                  </div>
                  <div className="fw-bold text-dark mt-1 att-card-metric-val">
                    {formatTime(attendance.loginTime)}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted text-uppercase fw-semibold att-card-metric-label">
                    Out Time
                  </div>
                  <div className="fw-bold text-dark mt-1 att-card-metric-val">
                    {formatTime(attendance.logoutTime)}
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted text-uppercase fw-semibold att-card-metric-label">
                    Total Hours
                  </div>
                  <div className="fw-bold text-success mt-1 att-card-metric-val">
                    {attendance.totalHours !== undefined ? attendance.totalHours : 0} hrs
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-muted text-uppercase fw-semibold att-card-metric-label">
                    Location
                  </div>
                  <div className="fw-bold text-dark mt-1 att-card-metric-val">
                    {attendance.locationType || 'Office'}
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-center gap-2 text-success fw-semibold small py-1 flex-wrap">
              <FaCheckCircle />
              <span>Today's attendance session is completed</span>
              {attendance.logoutType === 'AUTO' && (
                <span className="att-badge-auto ms-1">Auto-Closed</span>
              )}
              {attendance.logoutType === 'MANUAL' && (
                <span className="att-badge-manual ms-1">Manual</span>
              )}
            </div>
          </div>
        )}

        {/* Footer Navigation Link */}
        <div className="mt-3 pt-3 border-top text-center att-card-footer">
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
