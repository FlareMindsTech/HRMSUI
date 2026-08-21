import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal, Spinner, Alert, Pagination, InputGroup
} from 'react-bootstrap';
import {
  FaClock, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaSearch, FaEdit, FaHistory, FaUser, FaChevronLeft, FaChevronRight,
  FaUsers, FaChartLine, FaTimesCircle, FaMapMarkerAlt,
  FaSignInAlt, FaSignOutAlt, FaExclamationCircle, FaArrowLeft
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyAttendance,
  fetchAttendanceByMonth,
  fetchTeamAttendance,
  fetchAttendanceAnalytics,
  updateAttendanceCorrection,
  fetchTodayAttendance,
  fetchTeamAttendanceToday
} from '../../Api/Attendance/attendance';
import { formatTime, formatFullDate } from '../../utils/dateFormatter';
import './Attendance.css';

// ── Calendar Helper Utilities ──
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getTodayString = () => new Date().toISOString().split('T')[0];

const getCalendarDays = (month, year) => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return [...blanks, ...days];
};

const getStatusDotClass = (status) => {
  switch (status) {
    case 'Present': return 'calendar-dot--present';
    case 'Working': return 'calendar-dot--working';
    case 'Late': return 'calendar-dot--late';
    case 'Half Day': return 'calendar-dot--halfday';
    case 'Absent': return 'calendar-dot--absent';
    case 'Leave': return 'calendar-dot--leave';
    case 'Weekend': return 'calendar-dot--weekend';
    default: return '';
  }
};

// ── Reusable Calendar Component ──
function AttendanceCalendar({ monthlyRecords, month, year, onMonthChange, onDayClick, loading }) {
  const calendarDays = getCalendarDays(month, year);
  const todayStr = getTodayString();

  const recordMap = {};
  (monthlyRecords || []).forEach(r => { recordMap[r.date] = r; });

  const handlePrev = () => {
    if (month === 1) onMonthChange(12, year - 1);
    else onMonthChange(month - 1, year);
  };

  const handleNext = () => {
    if (month === 12) onMonthChange(1, year + 1);
    else onMonthChange(month + 1, year);
  };

  return (
    <Card className="border-0 shadow-sm attendance-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={handlePrev}><FaChevronLeft size={12} /></button>
        <span className="calendar-month-label">{MONTH_NAMES[month - 1]} {year}</span>
        <button className="calendar-nav-btn" onClick={handleNext}><FaChevronRight size={12} /></button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" size="sm" className="me-2" />
          <span className="small text-muted">Loading calendar...</span>
        </div>
      ) : (
        <div className="calendar-days">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`blank-${idx}`} className="calendar-day calendar-day--empty" />;

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = recordMap[dateStr];
            const status = record?.status || '';
            const isToday = dateStr === todayStr;
            const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isFuture = dateStr > todayStr;
            const dotClass = getStatusDotClass(status);

            return (
              <div
                key={dateStr}
                className={`calendar-day ${isToday ? 'calendar-day--today' : ''} ${isWeekend && !record?.loginTime ? 'calendar-day--weekend' : ''} ${isFuture && !record ? 'calendar-day--future' : ''}`}
                onClick={() => record && !record.isGenerated && onDayClick && onDayClick(record)}
              >
                <span>{day}</span>
                {dotClass && <div className={`calendar-dot ${dotClass}`} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="calendar-legend">
        <div className="calendar-legend-item"><div className="legend-dot" style={{ background: '#22c55e' }} /> Present</div>
        <div className="calendar-legend-item"><div className="legend-dot" style={{ background: '#f59e0b' }} /> Late</div>
        <div className="calendar-legend-item"><div className="legend-dot" style={{ background: '#8b5cf6' }} /> Half Day</div>
        <div className="calendar-legend-item"><div className="legend-dot" style={{ background: '#ef4444' }} /> Absent</div>
        <div className="calendar-legend-item"><div className="legend-dot" style={{ background: '#06b6d4', animation: 'pulse-dot 1.8s infinite' }} /> Working</div>
        <div className="calendar-legend-item"><div className="legend-dot" style={{ background: '#d1d5db' }} /> Weekend</div>
      </div>
    </Card>
  );
}

// ── Summary Cards ──
function SummaryCards({ records }) {
  const stats = { present: 0, late: 0, halfDay: 0, absent: 0, totalHours: 0, workDays: 0 };
  (records || []).forEach(r => {
    if (['Present', 'Late', 'Half Day', 'Working'].includes(r.status)) stats.workDays++;
    if (r.status === 'Present') stats.present++;
    if (r.status === 'Late') { stats.late++; stats.present++; }
    if (r.status === 'Half Day') stats.halfDay++;
    if (r.status === 'Absent') stats.absent++;
    if (r.totalHours) stats.totalHours += r.totalHours;
  });
  const avgHours = stats.workDays > 0 ? (stats.totalHours / stats.workDays).toFixed(1) : '0';

  return (
    <div className="attendance-summary-grid">
      <div className="summary-metric-card">
        <div className="summary-metric-value" style={{ color: '#22c55e' }}>{stats.present}</div>
        <div className="summary-metric-label">Present</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value" style={{ color: '#ef4444' }}>{stats.absent}</div>
        <div className="summary-metric-label">Absent</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value" style={{ color: '#f59e0b' }}>{stats.late}</div>
        <div className="summary-metric-label">Late</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value" style={{ color: '#8b5cf6' }}>{stats.halfDay}</div>
        <div className="summary-metric-label">Half Day</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value" style={{ color: '#06b6d4' }}>{avgHours}h</div>
        <div className="summary-metric-label">Avg Hours</div>
      </div>
    </div>
  );
}

// ── Day Detail Modal ──
function DayDetailModal({ show, onHide, record }) {
  if (!record) return null;
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h6 fw-bold">
          <FaCalendarAlt className="me-2 text-success" />
          {formatFullDate(record.date + 'T00:00:00') || record.date}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="day-detail-grid">
          <div className="day-detail-item">
            <div className="day-detail-label">Punch In</div>
            <div className="day-detail-value" style={{ color: '#22c55e' }}>
              {record.loginTime ? formatTime(record.loginTime) : '—'}
            </div>
          </div>
          <div className="day-detail-item">
            <div className="day-detail-label">Punch Out</div>
            <div className="day-detail-value" style={{ color: '#ef4444' }}>
              {record.logoutTime ? formatTime(record.logoutTime) : record.loginTime ? 'Working...' : '—'}
            </div>
          </div>
          <div className="day-detail-item">
            <div className="day-detail-label">Total Hours</div>
            <div className="day-detail-value">
              {record.totalHours ? `${record.totalHours} hrs` : record.loginTime && !record.logoutTime ? 'In progress' : '0 hrs'}
            </div>
          </div>
          <div className="day-detail-item">
            <div className="day-detail-label">Location</div>
            <div className="day-detail-value">
              {record.locationType ? (
                <span className="d-flex align-items-center justify-content-center gap-1">
                  <FaMapMarkerAlt size={12} className={record.locationType === 'Office' ? 'text-success' : 'text-primary'} />
                  {record.locationType}
                </span>
              ) : '—'}
            </div>
          </div>
        </div>
        <div className="text-center mt-3">
          {renderStatusBadgeStatic(record.status)}
          {record.isLate && <Badge bg="warning" text="dark" className="ms-2">Late Arrival</Badge>}
        </div>
      </Modal.Body>
    </Modal>
  );
}

// Static status badge (outside component)
function renderStatusBadgeStatic(status) {
  const map = {
    'Present': { bg: 'success-subtle', cls: 'text-success border-success-subtle' },
    'Working': { bg: 'info-subtle', cls: 'text-info border-info-subtle' },
    'Late': { bg: 'warning-subtle', cls: 'text-warning border-warning-subtle' },
    'Half Day': { bg: 'secondary-subtle', cls: 'text-secondary border-secondary-subtle' },
    'Absent': { bg: 'danger-subtle', cls: 'text-danger border-danger-subtle' },
    'Weekend': { bg: 'light', cls: 'text-muted' },
    'Future': { bg: 'light', cls: 'text-muted' },
  };
  const s = map[status] || { bg: 'light', cls: 'text-dark' };
  return <Badge bg={s.bg} className={`${s.cls} border px-3 py-1 rounded-pill`}>{status || 'N/A'}</Badge>;
}

// ======================================================
// MAIN ATTENDANCE PAGE COMPONENT
// ======================================================
function Attendance() {
  const { user, hasPermission } = useAuth();
  const roleCode = (user?.roleCode || user?.roleName || '').toUpperCase();
  const isAdminOrOwner = roleCode.includes('ADMIN') || roleCode.includes('OWNER');
  const isHR = roleCode.includes('HR');

  // Determine available tabs based on role
  const canViewTeam = hasPermission('attendance.read.team') || hasPermission('attendance.read.all') || isAdminOrOwner;
  const canViewAnalytics = hasPermission('attendance.analytics') || isAdminOrOwner;
  const canCorrect = hasPermission('attendance.modify') || isAdminOrOwner;

  const defaultTab = isAdminOrOwner ? 'overview' : 'my-attendance';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // ── Own Attendance States ──
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [ownLoading, setOwnLoading] = useState(false);
  const [dayDetailRecord, setDayDetailRecord] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  // ── Team Attendance States ──
  const [teamTodayData, setTeamTodayData] = useState(null);
  const [teamTodayLoading, setTeamTodayLoading] = useState(false);
  const [teamRecords, setTeamRecords] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── Employee Drill-down ──
  const [drillEmployee, setDrillEmployee] = useState(null);
  const [drillMonth, setDrillMonth] = useState(new Date().getMonth() + 1);
  const [drillYear, setDrillYear] = useState(new Date().getFullYear());
  const [drillRecords, setDrillRecords] = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);

  // ── Analytics States ──
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Correction Modal States ──
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    loginTime: '', logoutTime: '', status: '', locationType: '', isLate: false, reason: ''
  });
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [correctionError, setCorrectionError] = useState('');

  // ── Audit Modal States ──
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditRecord, setAuditRecord] = useState(null);

  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // ── Data Loading Functions ──
  const loadOwnMonthly = useCallback(async () => {
    setOwnLoading(true);
    try {
      const res = await fetchAttendanceByMonth(selectedMonth, selectedYear);
      if (res?.success) setMonthlyRecords(res.data || []);
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Failed to load attendance.' });
    } finally { setOwnLoading(false); }
  }, [selectedMonth, selectedYear]);

  const loadTeamToday = useCallback(async () => {
    setTeamTodayLoading(true);
    try {
      const res = await fetchTeamAttendanceToday();
      if (res?.success) setTeamTodayData(res.data);
    } catch (err) {
      console.warn("Team today load:", err.message);
    } finally { setTeamTodayLoading(false); }
  }, []);

  const loadTeamRecords = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await fetchTeamAttendance({
        search: searchQuery, status: statusFilter, date: dateFilter,
        page: currentPage, limit: 15
      });
      if (res?.success) {
        setTeamRecords(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Failed to load team records.' });
    } finally { setTeamLoading(false); }
  }, [searchQuery, statusFilter, dateFilter, currentPage]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetchAttendanceAnalytics();
      if (res?.success) setAnalyticsData(res.data);
    } catch (err) { console.warn("Analytics load:", err.message); }
    finally { setAnalyticsLoading(false); }
  }, []);

  const loadDrillDown = useCallback(async (userId, month, year) => {
    setDrillLoading(true);
    try {
      const res = await fetchAttendanceByMonth(month, year, userId);
      if (res?.success) setDrillRecords(res.data || []);
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Failed to load employee attendance.' });
    } finally { setDrillLoading(false); }
  }, []);

  // ── Effects ──
  useEffect(() => {
    if (activeTab === 'my-attendance') loadOwnMonthly();
  }, [activeTab, loadOwnMonthly]);

  useEffect(() => {
    if (activeTab === 'team-attendance') {
      loadTeamToday();
      loadTeamRecords();
    }
  }, [activeTab, loadTeamToday, loadTeamRecords]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadAnalytics();
      loadTeamRecords();
    }
  }, [activeTab, loadAnalytics, loadTeamRecords]);

  useEffect(() => {
    if (activeTab === 'corrections') loadTeamRecords();
  }, [activeTab, loadTeamRecords]);

  useEffect(() => {
    if (drillEmployee) loadDrillDown(drillEmployee._id || drillEmployee.userId?._id, drillMonth, drillYear);
  }, [drillEmployee, drillMonth, drillYear, loadDrillDown]);

  // ── Handlers ──
  const handleDayClick = (record) => {
    setDayDetailRecord(record);
    setShowDayDetail(true);
  };

  const handleOpenCorrection = (record) => {
    setSelectedRecord(record);
    const toInput = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    setCorrectionForm({
      loginTime: toInput(record.loginTime), logoutTime: toInput(record.logoutTime),
      status: record.status || 'Present', locationType: record.locationType || 'Office',
      isLate: record.isLate || false, reason: ''
    });
    setCorrectionError('');
    setShowCorrectionModal(true);
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      setCorrectionError('A valid reason is required for manual attendance correction.');
      return;
    }
    setCorrectionSubmitting(true);
    setCorrectionError('');
    try {
      const payload = {
        loginTime: correctionForm.loginTime ? new Date(correctionForm.loginTime).toISOString() : undefined,
        logoutTime: correctionForm.logoutTime ? new Date(correctionForm.logoutTime).toISOString() : undefined,
        status: correctionForm.status, locationType: correctionForm.locationType,
        isLate: correctionForm.isLate, reason: correctionForm.reason.trim()
      };
      const res = await updateAttendanceCorrection(selectedRecord._id, payload);
      if (res?.success) {
        setFeedbackMessage({ type: 'success', text: 'Attendance record corrected successfully.' });
        setShowCorrectionModal(false);
        loadTeamRecords();
        if (canViewAnalytics) loadAnalytics();
      }
    } catch (err) { setCorrectionError(err.message || 'Failed to update correction.'); }
    finally { setCorrectionSubmitting(false); }
  };

  const handleOpenAudit = (record) => { setAuditRecord(record); setShowAuditModal(true); };

  const handleDrillDown = (employee) => {
    setDrillEmployee(employee);
    setDrillMonth(new Date().getMonth() + 1);
    setDrillYear(new Date().getFullYear());
  };

  // ── Render ──
  return (
    <Container fluid className="p-3 no-scrollbar" style={{ minHeight: 'calc(100vh - var(--header-height))' }}>
      {/* Header */}
      <Row className="mb-3 align-items-center g-3">
        <Col>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--primary-color, #1a2e2a)' }}>
            Attendance & Work Logs
          </h4>
          <p className="text-muted small mb-0">
            {isAdminOrOwner ? 'Organization attendance overview, analytics and corrections.' :
             isHR ? 'Your attendance and team management.' :
             'Track your daily attendance and monthly history.'}
          </p>
        </Col>
      </Row>

      {/* Global Feedback */}
      {feedbackMessage.text && (
        <Alert variant={feedbackMessage.type} dismissible onClose={() => setFeedbackMessage({ type: '', text: '' })} className="py-2 px-3 small mb-3">
          {feedbackMessage.text}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="attendance-tabs">
        {!isAdminOrOwner && (
          <button className={`attendance-tab ${activeTab === 'my-attendance' ? 'attendance-tab--active' : ''}`}
            onClick={() => { setActiveTab('my-attendance'); setDrillEmployee(null); }}>
            <FaUser size={13} /> My Attendance
          </button>
        )}
        {canViewTeam && (
          <button className={`attendance-tab ${activeTab === 'team-attendance' ? 'attendance-tab--active' : ''}`}
            onClick={() => { setActiveTab('team-attendance'); setDrillEmployee(null); }}>
            <FaUsers size={13} /> Team Attendance
          </button>
        )}
        {canViewAnalytics && (
          <button className={`attendance-tab ${activeTab === 'overview' ? 'attendance-tab--active' : ''}`}
            onClick={() => { setActiveTab('overview'); setDrillEmployee(null); }}>
            <FaChartLine size={13} /> Analytics & Overview
          </button>
        )}
        {canCorrect && (
          <button className={`attendance-tab ${activeTab === 'corrections' ? 'attendance-tab--active' : ''}`}
            onClick={() => { setActiveTab('corrections'); setDrillEmployee(null); }}>
            <FaEdit size={13} /> Corrections & Audit
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          TAB: MY ATTENDANCE (Employee & HR)
          ════════════════════════════════════════════════ */}
      {activeTab === 'my-attendance' && (
        <Row className="g-3">
          <Col lg={12}>
            <SummaryCards records={monthlyRecords} />
          </Col>
          <Col lg={7} xl={8}>
            <AttendanceCalendar
              monthlyRecords={monthlyRecords}
              month={selectedMonth}
              year={selectedYear}
              onMonthChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
              onDayClick={handleDayClick}
              loading={ownLoading}
            />
          </Col>
          <Col lg={5} xl={4}>
            <Card className="border-0 shadow-sm rounded-4 p-3">
              <h6 className="fw-bold mb-3">
                <FaClock className="me-2 text-success" /> Recent Activity
              </h6>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {(monthlyRecords || []).filter(r => r.loginTime).slice(-10).reverse().map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ fontSize: '0.82rem' }}>
                    <div>
                      <div className="fw-bold">{item.date}</div>
                      <div className="text-muted extra-small">
                        {item.loginTime ? formatTime(item.loginTime) : '—'}
                        {item.logoutTime ? ` → ${formatTime(item.logoutTime)}` : item.loginTime ? ' → Working' : ''}
                      </div>
                    </div>
                    <div className="text-end">
                      {renderStatusBadgeStatic(item.status)}
                    </div>
                  </div>
                ))}
                {(!monthlyRecords || monthlyRecords.filter(r => r.loginTime).length === 0) && (
                  <p className="text-muted text-center small my-3">No activity this month.</p>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ════════════════════════════════════════════════
          TAB: TEAM ATTENDANCE (HR / Admin)
          ════════════════════════════════════════════════ */}
      {activeTab === 'team-attendance' && !drillEmployee && (
        <>
          {/* Today Overview Cards */}
          {teamTodayLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="success" size="sm" /></div>
          ) : teamTodayData && (
            <div className="attendance-summary-grid mb-3">
              <div className="summary-metric-card">
                <div className="summary-metric-value" style={{ color: '#22c55e' }}>{teamTodayData.presentCount + teamTodayData.workingCount}</div>
                <div className="summary-metric-label">Present / Working</div>
              </div>
              <div className="summary-metric-card">
                <div className="summary-metric-value" style={{ color: '#ef4444' }}>{teamTodayData.absentCount}</div>
                <div className="summary-metric-label">Not Checked In</div>
              </div>
              <div className="summary-metric-card">
                <div className="summary-metric-value" style={{ color: '#f59e0b' }}>{teamTodayData.lateCount}</div>
                <div className="summary-metric-label">Late Arrivals</div>
              </div>
              <div className="summary-metric-card">
                <div className="summary-metric-value" style={{ color: '#06b6d4' }}>{teamTodayData.attendanceRate}%</div>
                <div className="summary-metric-label">Attendance Rate</div>
              </div>
            </div>
          )}

          {/* Needs Attention */}
          {teamTodayData?.needsAttention && (
            <Row className="g-3 mb-3">
              {teamTodayData.needsAttention.notCheckedIn?.length > 0 && (
                <Col md={4}>
                  <Card className="border-0 shadow-sm rounded-4 p-3 needs-attention-card h-100">
                    <h6 className="fw-bold small mb-2">
                      <FaExclamationCircle className="me-2 text-danger" />
                      Not Checked In ({teamTodayData.needsAttention.notCheckedIn.length})
                    </h6>
                    <div className="needs-attention-list">
                      {teamTodayData.needsAttention.notCheckedIn.slice(0, 8).map((emp, i) => (
                        <div key={i} className="needs-attention-item">
                          <span className="fw-medium">{emp.name}</span>
                          <span className="text-muted extra-small">{emp.department || ''}</span>
                        </div>
                      ))}
                      {teamTodayData.needsAttention.notCheckedIn.length > 8 && (
                        <div className="text-muted extra-small text-center pt-1">
                          +{teamTodayData.needsAttention.notCheckedIn.length - 8} more
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              )}
              {teamTodayData.needsAttention.lateArrivals?.length > 0 && (
                <Col md={4}>
                  <Card className="border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: '3px solid #f59e0b' }}>
                    <h6 className="fw-bold small mb-2">
                      <FaExclamationTriangle className="me-2 text-warning" />
                      Late Arrivals ({teamTodayData.needsAttention.lateArrivals.length})
                    </h6>
                    <div className="needs-attention-list">
                      {teamTodayData.needsAttention.lateArrivals.map((emp, i) => (
                        <div key={i} className="needs-attention-item">
                          <span className="fw-medium">{emp.name}</span>
                          <span className="text-muted extra-small">{emp.loginTime ? formatTime(emp.loginTime) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              )}
              {teamTodayData.needsAttention.notPunchedOut?.length > 0 && (
                <Col md={4}>
                  <Card className="border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: '3px solid #06b6d4' }}>
                    <h6 className="fw-bold small mb-2">
                      <FaClock className="me-2 text-info" />
                      Still Working ({teamTodayData.needsAttention.notPunchedOut.length})
                    </h6>
                    <div className="needs-attention-list">
                      {teamTodayData.needsAttention.notPunchedOut.map((emp, i) => (
                        <div key={i} className="needs-attention-item">
                          <span className="fw-medium">{emp.name}</span>
                          <span className="text-muted extra-small">Since {emp.loginTime ? formatTime(emp.loginTime) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          )}

          {/* Team Directory Table */}
          <Card className="border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h6 className="fw-bold mb-0">
                <FaUsers className="me-2 text-success" /> Employee Directory ({totalRecords})
              </h6>
            </div>
            <Row className="g-2 mb-3">
              <Col md={4}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                  <Form.Control placeholder="Search employee..." value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="border-start-0" />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option><option value="Late">Late</option>
                  <option value="Working">Working</option><option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Control type="date" size="sm" value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} />
              </Col>
              <Col md={2}>
                <Button variant="outline-secondary" size="sm" className="w-100"
                  onClick={() => { setSearchQuery(''); setStatusFilter(''); setDateFilter(''); setCurrentPage(1); }}>
                  Clear
                </Button>
              </Col>
            </Row>

            {teamLoading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="success" size="sm" className="me-2" /><span className="small text-muted">Loading...</span></div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table borderless hover className="align-middle small">
                    <thead className="table-light text-muted"><tr>
                      <th className="py-2 px-3">Employee</th><th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">In</th><th className="py-2 px-3">Out</th>
                      <th className="py-2 px-3">Hours</th><th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-end">View</th>
                    </tr></thead>
                    <tbody>
                      {teamRecords.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-4 text-muted">No records found.</td></tr>
                      ) : teamRecords.map((item) => (
                        <tr key={item._id} className="border-bottom-light">
                          <td className="py-3 px-3">
                            <div className="fw-bold text-dark">{item.userId ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() : 'Employee'}</div>
                            <div className="extra-small text-muted">{item.userId?.email || ''}</div>
                          </td>
                          <td className="py-3 px-3 fw-semibold">{item.date}</td>
                          <td className="py-3 px-3">{item.loginTime ? formatTime(item.loginTime) : '—'}</td>
                          <td className="py-3 px-3">{item.logoutTime ? formatTime(item.logoutTime) : item.loginTime ? <Badge bg="info-subtle" className="text-info border">Working</Badge> : '—'}</td>
                          <td className="py-3 px-3 fw-semibold">{item.totalHours ? `${item.totalHours}h` : '0h'}</td>
                          <td className="py-3 px-3">
                            {renderStatusBadgeStatic(item.status)}
                            {item.isLate && <Badge bg="warning" text="dark" className="ms-1" style={{ fontSize: '0.65rem' }}>Late</Badge>}
                          </td>
                          <td className="py-3 px-3 text-end">
                            <Button variant="outline-success" size="sm" className="p-1 px-2 extra-small"
                              onClick={() => handleDrillDown(item.userId || item)} title="View Monthly Calendar">
                              <FaCalendarAlt className="me-1" /> Calendar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                    <span className="extra-small text-muted">Page {currentPage} of {totalPages}</span>
                    <Pagination size="sm" className="mb-0">
                      <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} />
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        const pg = i + 1;
                        return <Pagination.Item key={pg} active={pg === currentPage} onClick={() => setCurrentPage(pg)}>{pg}</Pagination.Item>;
                      })}
                      <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      {/* ── Employee Drill-down Calendar View ── */}
      {activeTab === 'team-attendance' && drillEmployee && (
        <>
          <Button variant="link" className="text-success fw-bold mb-3 p-0" onClick={() => setDrillEmployee(null)}>
            <FaArrowLeft className="me-2" /> Back to Team Directory
          </Button>
          <Card className="border-0 shadow-sm rounded-4 p-3 mb-3">
            <h6 className="fw-bold">
              <FaUser className="me-2 text-success" />
              {drillEmployee.firstName || ''} {drillEmployee.lastName || ''}'s Attendance
            </h6>
            <span className="text-muted small">{drillEmployee.email || ''} · {drillEmployee.department || ''}</span>
          </Card>
          <Row className="g-3">
            <Col lg={12}><SummaryCards records={drillRecords} /></Col>
            <Col lg={8}>
              <AttendanceCalendar
                monthlyRecords={drillRecords} month={drillMonth} year={drillYear}
                onMonthChange={(m, y) => { setDrillMonth(m); setDrillYear(y); }}
                onDayClick={handleDayClick} loading={drillLoading}
              />
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm rounded-4 p-3">
                <h6 className="fw-bold mb-3 small"><FaClock className="me-2 text-success" /> Recent Days</h6>
                <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                  {(drillRecords || []).filter(r => r.loginTime).slice(-8).reverse().map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ fontSize: '0.8rem' }}>
                      <div>
                        <div className="fw-bold">{item.date}</div>
                        <div className="text-muted extra-small">{item.loginTime ? formatTime(item.loginTime) : '—'} → {item.logoutTime ? formatTime(item.logoutTime) : 'Working'}</div>
                      </div>
                      {renderStatusBadgeStatic(item.status)}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* ════════════════════════════════════════════════
          TAB: ANALYTICS & OVERVIEW (Admin / Owner)
          ════════════════════════════════════════════════ */}
      {activeTab === 'overview' && canViewAnalytics && (
        <>
          {analyticsLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="success" size="sm" className="me-2" /><span className="small text-muted">Calculating metrics...</span></div>
          ) : analyticsData ? (
            <>
              <Row className="g-3 mb-4">
                <Col md={3} sm={6}>
                  <div className="analytics-stat-card">
                    <div className="analytics-stat-icon" style={{ background: 'rgba(45, 197, 138, 0.1)', color: '#2DC58A' }}><FaUsers /></div>
                    <div className="analytics-stat-value">{analyticsData.totalEmployees}</div>
                    <div className="analytics-stat-label">Total Employees</div>
                    <div className="analytics-stat-sub">Active workforce</div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="analytics-stat-card">
                    <div className="analytics-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><FaCheckCircle /></div>
                    <div className="analytics-stat-value">{analyticsData.presentToday + analyticsData.currentlyWorking}</div>
                    <div className="analytics-stat-label">Present Today</div>
                    <div className="analytics-stat-sub">{analyticsData.currentlyWorking} currently working</div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="analytics-stat-card">
                    <div className="analytics-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><FaExclamationTriangle /></div>
                    <div className="analytics-stat-value">{analyticsData.lateToday}</div>
                    <div className="analytics-stat-label">Late Arrivals</div>
                    <div className="analytics-stat-sub">After 09:15 AM</div>
                  </div>
                </Col>
                <Col md={3} sm={6}>
                  <div className="analytics-stat-card">
                    <div className="analytics-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}><FaChartLine /></div>
                    <div className="analytics-stat-value">{analyticsData.attendancePercentage}%</div>
                    <div className="analytics-stat-label">Attendance Rate</div>
                    <div className="analytics-stat-sub">Organization today</div>
                  </div>
                </Col>
              </Row>

              {/* Monthly Stats Bar */}
              {analyticsData.monthlyStats && (
                <Card className="border-0 shadow-sm rounded-4 p-4 mb-4">
                  <h6 className="fw-bold mb-3"><FaCalendarAlt className="me-2 text-success" /> Monthly Status Breakdown</h6>
                  <div className="monthly-stat-bar mb-3">
                    {(() => {
                      const total = Object.values(analyticsData.monthlyStats).reduce((a, b) => a + b, 0) || 1;
                      return <>
                        <div className="monthly-stat-bar-segment" style={{ width: `${(analyticsData.monthlyStats.Present / total) * 100}%`, background: '#22c55e' }} />
                        <div className="monthly-stat-bar-segment" style={{ width: `${(analyticsData.monthlyStats.Late / total) * 100}%`, background: '#f59e0b' }} />
                        <div className="monthly-stat-bar-segment" style={{ width: `${((analyticsData.monthlyStats['Half Day'] || 0) / total) * 100}%`, background: '#8b5cf6' }} />
                        <div className="monthly-stat-bar-segment" style={{ width: `${((analyticsData.monthlyStats.Working || 0) / total) * 100}%`, background: '#06b6d4' }} />
                      </>;
                    })()}
                  </div>
                  <div className="d-flex flex-wrap gap-3 small">
                    <span><span className="fw-bold text-success">{analyticsData.monthlyStats.Present}</span> Present</span>
                    <span><span className="fw-bold text-warning">{analyticsData.monthlyStats.Late}</span> Late</span>
                    <span><span className="fw-bold" style={{ color: '#8b5cf6' }}>{analyticsData.monthlyStats['Half Day'] || 0}</span> Half Day</span>
                    <span><span className="fw-bold text-info">{analyticsData.monthlyStats.Working || 0}</span> Working</span>
                  </div>
                </Card>
              )}
            </>
          ) : null}

          {/* Employee Table under analytics */}
          <Card className="border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3"><FaUsers className="me-2 text-success" /> Employee Attendance Records</h6>
            <Row className="g-2 mb-3">
              <Col md={4}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                  <Form.Control placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="border-start-0" />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option><option value="Late">Late</option>
                  <option value="Working">Working</option><option value="Half Day">Half Day</option>
                </Form.Select>
              </Col>
              <Col md={3}><Form.Control type="date" size="sm" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} /></Col>
              <Col md={2}><Button variant="outline-secondary" size="sm" className="w-100" onClick={() => { setSearchQuery(''); setStatusFilter(''); setDateFilter(''); setCurrentPage(1); }}>Reset</Button></Col>
            </Row>
            {teamLoading ? (
              <div className="text-center py-4"><Spinner animation="border" variant="success" size="sm" /></div>
            ) : (
              <div className="table-responsive">
                <Table borderless hover className="align-middle small">
                  <thead className="table-light text-muted"><tr>
                    <th className="py-2 px-3">Employee</th><th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">In</th><th className="py-2 px-3">Out</th>
                    <th className="py-2 px-3">Status</th>
                  </tr></thead>
                  <tbody>
                    {teamRecords.map((item) => (
                      <tr key={item._id} className="border-bottom-light">
                        <td className="py-3 px-3 fw-bold">{item.userId ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() : 'Employee'}</td>
                        <td className="py-3 px-3">{item.date}</td>
                        <td className="py-3 px-3">{item.loginTime ? formatTime(item.loginTime) : '—'}</td>
                        <td className="py-3 px-3">{item.logoutTime ? formatTime(item.logoutTime) : '—'}</td>
                        <td className="py-3 px-3">{renderStatusBadgeStatic(item.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ════════════════════════════════════════════════
          TAB: CORRECTIONS & AUDIT (Admin / Owner)
          ════════════════════════════════════════════════ */}
      {activeTab === 'corrections' && canCorrect && (
        <Card className="border-0 shadow-sm rounded-4 p-4">
          <h6 className="fw-bold mb-3"><FaEdit className="me-2 text-success" /> Attendance Correction Portal</h6>
          <Row className="g-2 mb-3">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control placeholder="Search employee..." value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="border-start-0" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All Statuses</option>
                <option value="Present">Present</option><option value="Late">Late</option>
                <option value="Working">Working</option><option value="Half Day">Half Day</option>
              </Form.Select>
            </Col>
            <Col md={3}><Form.Control type="date" size="sm" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} /></Col>
            <Col md={2}><Button variant="outline-secondary" size="sm" className="w-100" onClick={() => { setSearchQuery(''); setStatusFilter(''); setDateFilter(''); setCurrentPage(1); }}>Reset</Button></Col>
          </Row>

          {teamLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="success" size="sm" /></div>
          ) : (
            <>
              <div className="table-responsive">
                <Table borderless hover className="align-middle small">
                  <thead className="table-light text-muted"><tr>
                    <th className="py-2 px-3">Employee</th><th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">In</th><th className="py-2 px-3">Out</th>
                    <th className="py-2 px-3">Status</th><th className="py-2 px-3 text-end">Actions</th>
                  </tr></thead>
                  <tbody>
                    {teamRecords.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">No records found.</td></tr>
                    ) : teamRecords.map((item) => (
                      <tr key={item._id} className="border-bottom-light">
                        <td className="py-3 px-3">
                          <div className="fw-bold">{item.userId ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() : 'Employee'}</div>
                          <div className="extra-small text-muted">{item.userId?.email || ''}</div>
                        </td>
                        <td className="py-3 px-3">{item.date}</td>
                        <td className="py-3 px-3">{item.loginTime ? formatTime(item.loginTime) : '—'}</td>
                        <td className="py-3 px-3">{item.logoutTime ? formatTime(item.logoutTime) : '—'}</td>
                        <td className="py-3 px-3">{renderStatusBadgeStatic(item.status)}</td>
                        <td className="py-3 px-3 text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="outline-primary" size="sm" className="p-1 px-2 extra-small" onClick={() => handleOpenCorrection(item)}>
                              <FaEdit className="me-1" /> Correct
                            </Button>
                            {item.auditHistory?.length > 0 && (
                              <Button variant="outline-secondary" size="sm" className="p-1 px-2 extra-small" onClick={() => handleOpenAudit(item)}>
                                <FaHistory /> {item.auditHistory.length}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                  <span className="extra-small text-muted">Page {currentPage} of {totalPages}</span>
                  <Pagination size="sm" className="mb-0">
                    <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} />
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const pg = i + 1;
                      return <Pagination.Item key={pg} active={pg === currentPage} onClick={() => setCurrentPage(pg)}>{pg}</Pagination.Item>;
                    })}
                    <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: DAY DETAIL
          ════════════════════════════════════════════════ */}
      <DayDetailModal show={showDayDetail} onHide={() => setShowDayDetail(false)} record={dayDetailRecord} />

      {/* ════════════════════════════════════════════════
          MODAL: CORRECTION
          ════════════════════════════════════════════════ */}
      <Modal show={showCorrectionModal} onHide={() => setShowCorrectionModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold"><FaEdit className="me-2 text-primary" /> Correct Attendance Record</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitCorrection}>
          <Modal.Body className="small">
            {correctionError && <Alert variant="danger" className="py-2 px-3 small mb-3">{correctionError}</Alert>}
            {selectedRecord && (
              <div className="p-2 bg-light rounded-3 mb-3 extra-small">
                <strong>Employee:</strong> {selectedRecord.userId ? `${selectedRecord.userId.firstName} ${selectedRecord.userId.lastName}` : 'N/A'}<br />
                <strong>Date:</strong> {selectedRecord.date}
              </div>
            )}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Punch In Time</Form.Label>
              <Form.Control type="datetime-local" size="sm" value={correctionForm.loginTime}
                onChange={(e) => setCorrectionForm({ ...correctionForm, loginTime: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Punch Out Time</Form.Label>
              <Form.Control type="datetime-local" size="sm" value={correctionForm.logoutTime}
                onChange={(e) => setCorrectionForm({ ...correctionForm, logoutTime: e.target.value })} />
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Status</Form.Label>
                  <Form.Select size="sm" value={correctionForm.status}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}>
                    <option value="Present">Present</option><option value="Late">Late</option>
                    <option value="Half Day">Half Day</option><option value="Absent">Absent</option>
                    <option value="Working">Working</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Location</Form.Label>
                  <Form.Select size="sm" value={correctionForm.locationType}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, locationType: e.target.value })}>
                    <option value="Office">Office</option><option value="WFH">WFH</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Mark as Late Arrival" checked={correctionForm.isLate}
                onChange={(e) => setCorrectionForm({ ...correctionForm, isLate: e.target.checked })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-danger">Reason for Correction *</Form.Label>
              <Form.Control as="textarea" rows={3} size="sm" placeholder="Specify reason..."
                value={correctionForm.reason} onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowCorrectionModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={correctionSubmitting}>
              {correctionSubmitting ? <Spinner animation="border" size="sm" /> : 'Save Correction'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ════════════════════════════════════════════════
          MODAL: AUDIT HISTORY
          ════════════════════════════════════════════════ */}
      <Modal show={showAuditModal} onHide={() => setShowAuditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold"><FaHistory className="me-2 text-secondary" /> Correction Audit Trail</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          {auditRecord?.auditHistory?.length > 0 ? (
            <Table borderless hover className="align-middle extra-small">
              <thead className="table-light"><tr>
                <th>Modified At</th><th>Modified By</th><th>Field</th>
                <th>Old Value</th><th>New Value</th><th>Reason</th>
              </tr></thead>
              <tbody>
                {auditRecord.auditHistory.map((item, idx) => (
                  <tr key={idx} className="border-bottom-light">
                    <td>{new Date(item.modifiedAt).toLocaleString()}</td>
                    <td className="fw-bold">{item.modifiedByName || 'Admin'}</td>
                    <td><Badge bg="secondary-subtle" className="text-secondary">{item.field}</Badge></td>
                    <td className="text-muted">{item.oldValue}</td>
                    <td className="fw-bold text-primary">{item.newValue}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center my-3">No modification history.</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Attendance;