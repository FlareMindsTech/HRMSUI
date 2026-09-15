import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal, Spinner, Alert, Pagination, InputGroup, ProgressBar
} from 'react-bootstrap';
import {
  FaClock, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaSearch, FaEdit, FaHistory, FaUser, FaChevronLeft, FaChevronRight,
  FaUsers, FaChartLine, FaMapMarkerAlt, FaExclamationCircle, FaArrowLeft, FaPlus
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAttendanceByMonth,
  fetchTeamAttendance,
  fetchAttendanceAnalytics,
  updateAttendanceCorrection,
  fetchTeamAttendanceToday,
  postManualAttendanceOverride
} from '../../Api/Attendance/attendance';
import { fetchAllUsers } from '../../services/rbacService';
import { formatTime, formatFullDate } from '../../utils/dateFormatter';
import './Attendance.css';

// ── Calendar Helper Utilities ──
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// const getTodayString = () => new Date().toISOString().split('T')[0];
const getTodayString = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

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
    case 'Half Day Leave': return 'calendar-dot--halfday-leave';
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
    <Card className="border-0 shadow-sm attendance-calendar rounded-4 overflow-hidden bg-white">
      <div className="calendar-header d-flex justify-content-between align-items-center p-3 px-4 border-bottom">
        <button className="calendar-nav-btn" onClick={handlePrev} title="Previous Month">
          <FaChevronLeft size={12} />
        </button>
        <span className="calendar-month-label fw-bold">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button className="calendar-nav-btn" onClick={handleNext} title="Next Month">
          <FaChevronRight size={12} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map(d => (
          <div key={d} className="calendar-weekday">
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" size="sm" className="me-2" />
          <span className="small text-muted">Loading attendance calendar...</span>
        </div>
      ) : (
        <div className="calendar-days">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`blank-${idx}`} className="calendar-day calendar-day--empty" />;

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = recordMap[dateStr];
            // const status = record?.status || '';
             const status = record?.status || '';
            const isLate = record?.isLate === true || status === 'Late';
            const isToday = dateStr === todayStr;
            const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isFuture = dateStr > todayStr;
            // const dotClass = getStatusDotClass(status);
            const dotClass = isLate ? 'calendar-dot--late' : getStatusDotClass(status);

            return (
              <div
                key={dateStr}
                className={`calendar-day ${isToday ? 'calendar-day--today' : ''} ${isWeekend && !record?.loginTime ? 'calendar-day--weekend' : ''} ${isFuture && !record ? 'calendar-day--future' : ''}`}
                onClick={() => record && !record.isGenerated && onDayClick && onDayClick(record)}
                title={record ? `${dateStr}: ${status}` : dateStr}
              >
                <span>{day}</span>
                {dotClass && <div className={`calendar-dot ${dotClass}`} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="calendar-legend">
        <div className="calendar-legend-item"><div className="legend-dot dot-present" /> Present</div>
        <div className="calendar-legend-item"><div className="legend-dot dot-late" /> Late</div>
        <div className="calendar-legend-item"><div className="legend-dot dot-halfday" /> Half Day Attendance</div>
        <div className="calendar-legend-item"><div className="legend-dot dot-leave" /> Full Day Leave</div>
        <div className="calendar-legend-item"><div className="legend-dot dot-halfday-leave" /> Half Day Leave</div>
        <div className="calendar-legend-item"><div className="legend-dot dot-absent" /> Absent</div>
        <div className="calendar-legend-item"><div className="legend-dot dot-working" /> Working</div>
        <div className="calendar-legend-item"><div className="legend-dot dot-weekend" /> Weekend</div>
      </div>
    </Card>
  );
}

// ── Summary Cards ──
function SummaryCards({ records }) {
  const stats = { present: 0, late: 0, halfDay: 0, absent: 0, leave: 0, totalHours: 0, workDays: 0 };
  (records || []).forEach(r => {
    if (['Present', 'Late', 'Half Day', 'Working'].includes(r.status)) stats.workDays++;
    if (r.status === 'Present') stats.present++;
    if (r.status === 'Late') { stats.late++; stats.present++; }
    else if (r.isLate) { stats.late++; }
    if (r.status === 'Half Day') stats.halfDay++;
    if (r.status === 'Absent') stats.absent++;
    if (['Leave', 'Half Day Leave'].includes(r.status)) stats.leave++;
    if (r.totalHours) stats.totalHours += r.totalHours;
  });
  const avgHours = stats.workDays > 0 ? (stats.totalHours / stats.workDays).toFixed(1) : '0';

  return (
    <div className="attendance-summary-grid">
      <div className="summary-metric-card">
        <div className="summary-metric-value metric-val-success">{stats.present}</div>
        <div className="summary-metric-label">Present</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value metric-val-danger">{stats.absent}</div>
        <div className="summary-metric-label">Absent</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value metric-val-primary">{stats.leave}</div>
        <div className="summary-metric-label">Approved Leave</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value metric-val-warning">{stats.late}</div>
        <div className="summary-metric-label">Late</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value metric-val-purple">{stats.halfDay}</div>
        <div className="summary-metric-label">Half Day</div>
      </div>
      <div className="summary-metric-card">
        <div className="summary-metric-value metric-val-info">{avgHours}h</div>
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
            <div className="day-detail-value metric-val-success">
              {record.loginTime ? formatTime(record.loginTime) : '—'}
            </div>
          </div>
          <div className="day-detail-item">
            <div className="day-detail-label">Punch Out</div>
            <div className="day-detail-value metric-val-danger">
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
          {record.logoutTime && (
            <div className="day-detail-item day-detail-item--full">
              <div className="day-detail-label">Logout Type</div>
              <div className="day-detail-value">
                {record.logoutType === 'AUTO' ? (
                  <span className="att-badge-auto">Auto-Closed</span>
                ) : (
                  <span className="att-badge-manual">Manual</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-center mt-3 d-flex justify-content-center align-items-center gap-2 flex-wrap">
          {renderStatusBadgeStatic(record.status)}
          {renderLogoutTypeBadge(record.logoutType, record.logoutTime)}
          {record.isLate && <Badge bg="warning" text="dark" className="ms-1 att-badge-late">Late Arrival</Badge>}
        </div>
      </Modal.Body>
    </Modal>
  );
}

// Helper: render logout type badge (Auto-Closed / Manual)
function renderLogoutTypeBadge(logoutType, logoutTime) {
  if (!logoutTime) return null;
  if (logoutType === 'AUTO') {
    return <span className="att-badge-auto">Auto-Closed</span>;
  }
  if (logoutType === 'MANUAL') {
    return <span className="att-badge-manual">Manual</span>;
  }
  return null;
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
  return <Badge bg={s.bg} className={`${s.cls} border px-2.5 py-0.5 rounded-pill fw-semibold att-badge-status-compact`}>{status || 'N/A'}</Badge>;
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

  const defaultTab = 'my-attendance';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // ── Manual Override Modal States ──
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    userId: '',
    date: getTodayString(),
    status: 'Present',
    locationType: 'Office',
    loginTime: '',
    logoutTime: '',
    isLate: false,
    reason: '',
  });

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
        search: debouncedSearch, status: statusFilter, date: dateFilter,
        page: currentPage, limit: 10
      });
      if (res?.success) {
        setTeamRecords(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Failed to load team records.' });
    } finally { setTeamLoading(false); }
  }, [debouncedSearch, statusFilter, dateFilter, currentPage]);

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

  // ── Debounce Search (300ms) ──
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ── Effects ──
  useEffect(() => {
    if (activeTab === 'my-attendance') loadOwnMonthly();
  }, [activeTab, loadOwnMonthly]);

  // Load team summary ONLY when Team Attendance tab is activated
  useEffect(() => {
    if (activeTab === 'team-attendance' && canViewTeam && !drillEmployee) {
      loadTeamToday();
    }
  }, [activeTab, canViewTeam, drillEmployee, loadTeamToday]);

  // Load analytics ONLY when Overview tab is activated
  useEffect(() => {
    if (activeTab === 'overview' && canViewAnalytics) {
      loadAnalytics();
    }
  }, [activeTab, canViewAnalytics, loadAnalytics]);

  // Load team records when a relevant table tab is active and filters/page change
  const isTeamRecordsTab = (activeTab === 'team-attendance' && canViewTeam && !drillEmployee) ||
                           (activeTab === 'overview' && canViewAnalytics) ||
                           (activeTab === 'corrections' && canCorrect);

  useEffect(() => {
    if (isTeamRecordsTab) {
      loadTeamRecords();
    }
  }, [isTeamRecordsTab, loadTeamRecords]);

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

  // ── Manual Override Handlers (Admin / Owner) ──
  const handleOpenOverrideModal = async () => {
    setOverrideError('');
    setOverrideForm({
      userId: '',
      date: getTodayString(),
      status: 'Present',
      locationType: 'Office',
      loginTime: '',
      logoutTime: '',
      isLate: false,
      reason: '',
    });
    setShowOverrideModal(true);

    if (usersList.length === 0) {
      setUsersLoading(true);
      try {
        const usersData = await fetchAllUsers();
        const list = Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData?.users)
          ? usersData.users
          : Array.isArray(usersData?.data)
          ? usersData.data
          : [];
        setUsersList(list);
      } catch (err) {
        console.warn('Failed to load users for manual override:', err.message);
      } finally {
        setUsersLoading(false);
      }
    }
  };

  const handleOverrideStatusChange = (newStatus) => {
    const isNonWorking = newStatus === 'Leave' || newStatus === 'Absent';
    setOverrideForm((prev) => ({
      ...prev,
      status: newStatus,
      loginTime: isNonWorking ? '' : prev.loginTime,
      logoutTime: isNonWorking ? '' : prev.logoutTime,
    }));
  };

  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    if (!overrideForm.userId) {
      setOverrideError('Please select an employee.');
      return;
    }
    if (!overrideForm.date) {
      setOverrideError('Please select a valid date.');
      return;
    }
    if (!overrideForm.reason || overrideForm.reason.trim().length < 5) {
      setOverrideError('Reason must be at least 5 characters.');
      return;
    }

    const isNonWorking = overrideForm.status === 'Leave' || overrideForm.status === 'Absent';
    const isFuture = overrideForm.date > getTodayString();

    if (!isNonWorking && isFuture && (!overrideForm.loginTime || !overrideForm.logoutTime)) {
      setOverrideError('Both Punch In and Punch Out times are required when creating future working records.');
      return;
    }

    if (!isNonWorking && overrideForm.loginTime && overrideForm.logoutTime) {
      if (new Date(overrideForm.logoutTime).getTime() < new Date(overrideForm.loginTime).getTime()) {
        setOverrideError('Punch Out time cannot be earlier than Punch In time.');
        return;
      }
    }

    setOverrideSubmitting(true);
    setOverrideError('');
    try {
      const payload = {
        userId: overrideForm.userId,
        date: overrideForm.date,
        status: overrideForm.status,
        locationType: overrideForm.locationType,
        loginTime: isNonWorking ? null : (overrideForm.loginTime ? new Date(overrideForm.loginTime).toISOString() : null),
        logoutTime: isNonWorking ? null : (overrideForm.logoutTime ? new Date(overrideForm.logoutTime).toISOString() : null),
        isLate: overrideForm.isLate,
        reason: overrideForm.reason.trim(),
      };

      const res = await postManualAttendanceOverride(payload);
      if (res?.success) {
        setFeedbackMessage({
          type: 'success',
          text: res.message || 'Manual attendance override saved successfully.',
        });
        setShowOverrideModal(false);
        loadTeamRecords();
        loadTeamToday();
        loadOwnMonthly();
        if (canViewAnalytics) loadAnalytics();
      }
    } catch (err) {
      setOverrideError(err.message || 'Failed to apply manual override.');
    } finally {
      setOverrideSubmitting(false);
    }
  };


  // ── Render ──
  return (
    <Container fluid className="p-2.5 p-md-3 no-scrollbar att-page-container">
      {/* Header */}
      <Row className="mb-2.5 align-items-center g-2">
        <Col>
          <div className="d-flex align-items-center gap-2">
            <div className="d-inline-flex align-items-center justify-content-center rounded-3 att-header-icon">
              <FaClock />
            </div>
            <h4 className="fw-bold mb-0 att-page-title">
              Attendance & Work Logs
            </h4>
          </div>
          <p className="text-muted small mb-0 mt-0.5">
            {isAdminOrOwner ? 'Organization attendance overview, analytics and corrections.' :
             isHR ? 'Your attendance logs, calendar, and team workforce tracking.' :
             'Track your daily attendance, view calendar status, and inspect work duration.'}
          </p>
        </Col>
      </Row>

      {/* Global Feedback */}
      {feedbackMessage.text && (
        <Alert variant={feedbackMessage.type} dismissible onClose={() => setFeedbackMessage({ type: '', text: '' })} className="py-1.5 px-3 small mb-2.5 rounded-3 shadow-xs">
          {feedbackMessage.text}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="attendance-tabs">
        <button className={`attendance-tab ${activeTab === 'my-attendance' ? 'attendance-tab--active' : ''}`}
          onClick={() => { setActiveTab('my-attendance'); setDrillEmployee(null); }}>
          <FaUser size={13} /> My Attendance
        </button>
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
            <Card className="border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <FaClock className="text-success" /> Recent Activity
                </h6>
                <span className="badge bg-light text-muted border px-2 py-1 rounded-pill att-badge-micro">
                  This Month
                </span>
              </div>
              <div className="pe-1 att-list-scroll-420">
                {(monthlyRecords || []).filter(r => r.loginTime).slice(-10).reverse().map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-center py-2 border-bottom att-list-item-sm">
                    <div>
                      <div className="fw-bold text-dark">{item.date}</div>
                      <div className="text-muted extra-small">
                        {item.loginTime ? formatTime(item.loginTime) : '—'}
                        {item.logoutTime ? ` → ${formatTime(item.logoutTime)}` : item.loginTime ? ' → Working' : ''}
                      </div>
                    </div>
                    <div className="text-end d-inline-flex align-items-center gap-1 flex-wrap justify-content-end">
                      {renderStatusBadgeStatic(item.status)}
                      {renderLogoutTypeBadge(item.logoutType, item.logoutTime)}
                    </div>
                  </div>
                ))}
                {(!monthlyRecords || monthlyRecords.filter(r => r.loginTime).length === 0) && (
                  <div className="text-center py-4 text-muted small">
                    No punch activity recorded for this month.
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ════════════════════════════════════════════════
          TAB: TEAM ATTENDANCE (HR / Admin)
          ════════════════════════════════════════════════ */}
      {/* {activeTab === 'team-attendance' && !drillEmployee && ( */}
        {activeTab === 'team-attendance' && canViewTeam && !drillEmployee && (
        <>
          {/* Today Overview Cards */}
          {teamTodayLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="success" size="sm" /></div>
          ) : teamTodayData && (
            <div className="attendance-summary-grid mb-3">
              <div className="summary-metric-card">
                <div className="summary-metric-value metric-val-success">{teamTodayData.presentCount + teamTodayData.workingCount}</div>
                <div className="summary-metric-label">Present / Working</div>
              </div>
              <div className="summary-metric-card">
                <div className="summary-metric-value metric-val-danger">{teamTodayData.absentCount}</div>
                <div className="summary-metric-label">Not Checked In</div>
              </div>
              <div className="summary-metric-card">
                <div className="summary-metric-value metric-val-warning">{teamTodayData.lateCount}</div>
                <div className="summary-metric-label">Late Arrivals</div>
              </div>
              <div className="summary-metric-card">
                <div className="summary-metric-value metric-val-info">{teamTodayData.attendanceRate}%</div>
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
                    <h6 className="fw-bold small mb-2 d-flex align-items-center">
                      <FaExclamationCircle className="me-2 text-danger" />
                      Not Checked In ({teamTodayData.needsAttention.notCheckedIn.length})
                    </h6>
                    <div className="needs-attention-list">
                      {teamTodayData.needsAttention.notCheckedIn.slice(0, 8).map((emp, i) => (
                        <div key={i} className="needs-attention-item">
                          <span className="fw-semibold text-dark">{emp.name}</span>
                          <span className="text-muted extra-small">{emp.department || 'General'}</span>
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
                  <Card className="border-0 shadow-sm rounded-4 p-3 h-100 att-card-late-attention">
                    <h6 className="fw-bold small mb-2 d-flex align-items-center">
                      <FaExclamationTriangle className="me-2 text-warning" />
                      Late Arrivals ({teamTodayData.needsAttention.lateArrivals.length})
                    </h6>
                    <div className="needs-attention-list">
                      {teamTodayData.needsAttention.lateArrivals.map((emp, i) => (
                        <div key={i} className="needs-attention-item">
                          <span className="fw-semibold text-dark">{emp.name}</span>
                          <span className="text-muted extra-small">{emp.loginTime ? formatTime(emp.loginTime) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              )}
              {teamTodayData.needsAttention.notPunchedOut?.length > 0 && (
                <Col md={4}>
                  <Card className="border-0 shadow-sm rounded-4 p-3 h-100 att-card-working-attention">
                    <h6 className="fw-bold small mb-2 d-flex align-items-center">
                      <FaClock className="me-2 text-info" />
                      Still Working ({teamTodayData.needsAttention.notPunchedOut.length})
                    </h6>
                    <div className="needs-attention-list">
                      {teamTodayData.needsAttention.notPunchedOut.map((emp, i) => (
                        <div key={i} className="needs-attention-item">
                          <span className="fw-semibold text-dark">{emp.name}</span>
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
          <Card className="border-0 shadow-sm rounded-3 bg-white att-table-card">
            <div className="d-flex justify-content-between align-items-center mb-2.5 flex-wrap gap-2">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2 att-section-heading">
                <FaUsers className="text-success" /> Employee Directory
              </h6>
              <span className="badge bg-light text-muted border px-2 py-1 rounded-pill extra-small fw-semibold">
                {totalRecords} Total Records
              </span>
            </div>
            <Row className="g-2 mb-2.5 align-items-center att-filters-row">
              <Col md={4}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white border-end-0 py-1 ps-2.5 pe-2 text-muted"><FaSearch size={12} /></InputGroup.Text>
                  <Form.Control placeholder="Search employee..." value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="border-start-0 py-1 att-filter-input" />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="py-1 att-filter-input">
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option><option value="Late">Late</option>
                  <option value="Working">Working</option><option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Control type="date" size="sm" value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="py-1 att-filter-input" />
              </Col>
              <Col md={2}>
                <Button variant="outline-secondary" size="sm" className="w-100 py-1 att-btn-reset"
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setStatusFilter(''); setDateFilter(''); setCurrentPage(1); }}>
                  Clear
                </Button>
              </Col>
            </Row>

            {teamLoading ? (
              <div className="text-center py-4"><Spinner animation="border" variant="success" size="sm" className="me-2" /><span className="small text-muted">Loading records...</span></div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table borderless hover className="align-middle att-table mb-0">
                    <thead><tr>
                      <th className="py-2 px-3">Employee</th><th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">In</th><th className="py-2 px-3">Out</th>
                      <th className="py-2 px-3">Hours</th><th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-end">Actions</th>
                    </tr></thead>
                    <tbody>
                      {teamRecords.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-4 text-muted small">No attendance records found matching filters.</td></tr>
                      ) : teamRecords.map((item) => (
                        <tr key={item._id} className="border-bottom-light">
                          <td className="py-2 px-3">
                            <div className="d-flex align-items-center gap-2">
                              <div className="att-avatar-sm-compact">
                                {(item.userId?.firstName?.[0] || 'E') + (item.userId?.lastName?.[0] || '')}
                              </div>
                              <div>
                                <div className="att-emp-name">{item.userId ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() : 'Employee'}</div>
                                <div className="att-emp-sub">{item.userId?.email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 att-time-cell">{item.date}</td>
                          <td className="py-2 px-3 att-time-cell">{item.loginTime ? formatTime(item.loginTime) : '—'}</td>
                          <td className="py-2 px-3 att-time-cell">{item.logoutTime ? formatTime(item.logoutTime) : item.loginTime ? <Badge bg="info-subtle" className="text-info border">Working</Badge> : '—'}</td>
                          <td className="py-2 px-3 att-time-cell fw-semibold">{item.totalHours ? `${item.totalHours}h` : '0h'}</td>
                          <td className="py-2 px-3">
                            <div className="d-inline-flex align-items-center gap-1 flex-wrap">
                              {renderStatusBadgeStatic(item.status)}
                              {renderLogoutTypeBadge(item.logoutType, item.logoutTime)}
                              {item.isLate && <Badge bg="warning" text="dark" className="ms-1 att-badge-late">Late</Badge>}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-end">
                            <Button variant="outline-success" size="sm" className="p-1 px-2 extra-small rounded-pill"
                              onClick={() => handleDrillDown(item.userId || item)} title="View Monthly Calendar">
                              <FaCalendarAlt className="me-1" /> Calendar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {totalRecords > 0 && (
                  <div className="att-pagination-bar">
                    <div className="att-pagination-info">
                      Showing <span className="fw-bold text-dark">{Math.min((currentPage - 1) * 10 + 1, totalRecords)}</span> to{' '}
                      <span className="fw-bold text-dark">{Math.min(currentPage * 10, totalRecords)}</span> of{' '}
                      <span className="fw-bold text-dark">{totalRecords}</span> records
                    </div>
                    {totalPages > 1 && (
                      <Pagination size="sm" className="att-pagination mb-0">
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          let pg;
                          if (totalPages <= 5) pg = i + 1;
                          else if (currentPage <= 3) pg = i + 1;
                          else if (currentPage >= totalPages - 2) pg = totalPages - 4 + i;
                          else pg = currentPage - 2 + i;
                          return <Pagination.Item key={pg} active={pg === currentPage} onClick={() => setCurrentPage(pg)}>{pg}</Pagination.Item>;
                        })}
                        <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
                      </Pagination>
                    )}
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
          <Button variant="link" className="text-success fw-bold mb-3 p-0 text-decoration-none d-inline-flex align-items-center" onClick={() => setDrillEmployee(null)}>
            <FaArrowLeft className="me-2" /> Back to Team Directory
          </Button>
          <Card className="border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold text-success att-avatar-md"
              >
                {(drillEmployee.firstName?.[0] || 'E') + (drillEmployee.lastName?.[0] || '')}
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">
                  {drillEmployee.firstName || ''} {drillEmployee.lastName || ''}'s Attendance
                </h6>
                <span className="text-muted small">{drillEmployee.email || ''} · {drillEmployee.department || 'General'}</span>
              </div>
            </div>
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
              <Card className="border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h6 className="fw-bold mb-3 small text-dark"><FaClock className="me-2 text-success" /> Recent Days</h6>
                <div className="pe-1 att-list-scroll-380">
                  {(drillRecords || []).filter(r => r.loginTime).slice(-8).reverse().map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center py-2 border-bottom att-list-item-xs">
                      <div>
                        <div className="fw-bold text-dark">{item.date}</div>
                        <div className="text-muted extra-small">{item.loginTime ? formatTime(item.loginTime) : '—'} → {item.logoutTime ? formatTime(item.logoutTime) : 'Working'}</div>
                      </div>
                      <div className="d-inline-flex align-items-center gap-1 flex-wrap justify-content-end">
                        {renderStatusBadgeStatic(item.status)}
                        {renderLogoutTypeBadge(item.logoutType, item.logoutTime)}
                      </div>
                    </div>
                  ))}
                  {(!drillRecords || drillRecords.filter(r => r.loginTime).length === 0) && (
                    <div className="text-center py-4 text-muted small">No punch data recorded.</div>
                  )}
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
            <div className="text-center py-4"><Spinner animation="border" variant="success" size="sm" className="me-2" /><span className="small text-muted">Calculating metrics...</span></div>
          ) : analyticsData ? (
            <>
              {/* Compact Top Summary Cards */}
              <Row className="g-2 mb-2.5">
                <Col lg={3} sm={6}>
                  <div className="analytics-stat-card-compact">
                    <div className="analytics-stat-icon analytics-icon-users"><FaUsers /></div>
                    <div className="analytics-stat-content">
                      <div className="analytics-stat-label">Total Employees</div>
                      <div className="analytics-stat-value">{analyticsData.totalEmployees}</div>
                      <div className="analytics-stat-sub">Active workforce</div>
                    </div>
                  </div>
                </Col>
                <Col lg={3} sm={6}>
                  <div className="analytics-stat-card-compact">
                    <div className="analytics-stat-icon analytics-icon-check"><FaCheckCircle /></div>
                    <div className="analytics-stat-content">
                      <div className="analytics-stat-label">Present Today</div>
                      <div className="analytics-stat-value">{analyticsData.presentToday + analyticsData.currentlyWorking}</div>
                      <div className="analytics-stat-sub">{analyticsData.currentlyWorking} currently working</div>
                    </div>
                  </div>
                </Col>
                <Col lg={3} sm={6}>
                  <div className="analytics-stat-card-compact">
                    <div className="analytics-stat-icon analytics-icon-warn"><FaExclamationTriangle /></div>
                    <div className="analytics-stat-content">
                      <div className="analytics-stat-label">Late Arrivals</div>
                      <div className="analytics-stat-value">{analyticsData.lateToday}</div>
                      <div className="analytics-stat-sub">After 09:15 AM</div>
                    </div>
                  </div>
                </Col>
                <Col lg={3} sm={6}>
                  <div className="analytics-stat-card-compact">
                    <div className="analytics-stat-icon analytics-icon-chart"><FaChartLine /></div>
                    <div className="analytics-stat-content">
                      <div className="analytics-stat-label">Attendance Rate</div>
                      <div className="analytics-stat-value">{analyticsData.attendancePercentage}%</div>
                      <div className="analytics-stat-sub">Organization today</div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Compact Monthly Status Breakdown */}
              {analyticsData.monthlyStats && (
                <div className="monthly-breakdown-card mb-2.5">
                  <div className="monthly-breakdown-header">
                    <div className="monthly-breakdown-title">
                      <FaCalendarAlt className="text-success" />
                      <span>Monthly Status Breakdown</span>
                    </div>
                    <div className="monthly-legend-pills">
                      <span className="monthly-legend-pill">
                        <span className="monthly-legend-dot dot-present" />
                        <strong className="text-success">{analyticsData.monthlyStats.Present}</strong> Present
                      </span>
                      <span className="monthly-legend-pill">
                        <span className="monthly-legend-dot dot-late" />
                        <strong className="text-warning">{analyticsData.monthlyStats.Late}</strong> Late
                      </span>
                      <span className="monthly-legend-pill">
                        <span className="monthly-legend-dot dot-halfday" />
                        <strong className="text-purple-val">{analyticsData.monthlyStats['Half Day'] || 0}</strong> Half Day
                      </span>
                      <span className="monthly-legend-pill">
                        <span className="monthly-legend-dot dot-working" />
                        <strong className="text-info">{analyticsData.monthlyStats.Working || 0}</strong> Working
                      </span>
                    </div>
                  </div>
                  <ProgressBar className="monthly-stat-bar-slim">
                    {(() => {
                      const total = Object.values(analyticsData.monthlyStats).reduce((a, b) => a + b, 0) || 1;
                      return <>
                        <ProgressBar now={(analyticsData.monthlyStats.Present / total) * 100} className="att-bar-present" key={1} />
                        <ProgressBar now={(analyticsData.monthlyStats.Late / total) * 100} className="att-bar-late" key={2} />
                        <ProgressBar now={((analyticsData.monthlyStats['Half Day'] || 0) / total) * 100} className="att-bar-halfday" key={3} />
                        <ProgressBar now={((analyticsData.monthlyStats.Working || 0) / total) * 100} className="att-bar-working" key={4} />
                      </>;
                    })()}
                  </ProgressBar>
                </div>
              )}
            </>
          ) : null}

          {/* Employee Attendance Records (Main Focus) */}
          <Card className="border-0 shadow-sm rounded-3 bg-white att-table-card">
            <div className="d-flex justify-content-between align-items-center mb-2.5">
              <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2 att-section-heading">
                <FaUsers className="text-success" /> Employee Attendance Records
              </h6>
              <span className="badge bg-light text-muted border px-2 py-1 rounded-pill extra-small fw-semibold">
                {totalRecords} Total Records
              </span>
            </div>

            {/* Compact 1-Row Filter Toolbar */}
            <Row className="g-2 mb-2.5 align-items-center att-filters-row">
              <Col md={4} sm={12}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white border-end-0 py-1 ps-2.5 pe-2 text-muted">
                    <FaSearch size={12} />
                  </InputGroup.Text>
                  <Form.Control
                    size="sm"
                    placeholder="Search employee..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="border-start-0 py-1 att-filter-input"
                  />
                </InputGroup>
              </Col>
              <Col md={3} sm={4}>
                <Form.Select
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="py-1 att-filter-input"
                >
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Working">Working</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                </Form.Select>
              </Col>
              <Col md={3} sm={4}>
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                  className="py-1 att-filter-input"
                />
              </Col>
              <Col md={2} sm={4}>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100 py-1 att-btn-reset"
                  onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setStatusFilter(''); setDateFilter(''); setCurrentPage(1); }}
                >
                  Reset
                </Button>
              </Col>
            </Row>

            {teamLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="success" size="sm" className="me-2" />
                <span className="small text-muted">Loading records...</span>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table borderless hover className="align-middle att-table mb-0">
                    <thead>
                      <tr>
                        <th className="py-2 px-3">Employee</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">In</th>
                        <th className="py-2 px-3">Out</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-muted small">
                            No attendance records found matching filters.
                          </td>
                        </tr>
                      ) : (
                        teamRecords.map((item) => (
                          <tr key={item._id} className="border-bottom-light">
                            <td className="py-2 px-3">
                              <div className="d-flex align-items-center gap-2">
                                <div className="att-avatar-sm-compact">
                                  {(item.userId?.firstName?.[0] || 'E') + (item.userId?.lastName?.[0] || '')}
                                </div>
                                <div>
                                  <div className="att-emp-name">
                                    {item.userId ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() : 'Employee'}
                                  </div>
                                  {item.userId?.email && (
                                    <div className="att-emp-sub">{item.userId.email}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 att-time-cell">{item.date}</td>
                            <td className="py-2 px-3 att-time-cell">
                              {item.loginTime ? formatTime(item.loginTime) : '—'}
                            </td>
                            <td className="py-2 px-3 att-time-cell">
                              {item.logoutTime ? formatTime(item.logoutTime) : '—'}
                            </td>
                            <td className="py-2 px-3">
                              <div className="d-inline-flex align-items-center gap-1 flex-wrap">
                                {renderStatusBadgeStatic(item.status)}
                                {renderLogoutTypeBadge(item.logoutType, item.logoutTime)}
                                {item.isLate && (
                                  <Badge bg="warning" text="dark" className="ms-1 att-badge-late">Late</Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Compact Pagination */}
                {totalRecords > 0 && (
                  <div className="att-pagination-bar">
                    <div className="att-pagination-info">
                      Showing <span className="fw-bold text-dark">{Math.min((currentPage - 1) * 10 + 1, totalRecords)}</span> to{' '}
                      <span className="fw-bold text-dark">{Math.min(currentPage * 10, totalRecords)}</span> of{' '}
                      <span className="fw-bold text-dark">{totalRecords}</span> records
                    </div>
                    {totalPages > 1 && (
                      <Pagination size="sm" className="att-pagination mb-0">
                        <Pagination.Prev
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        />
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          let pg;
                          if (totalPages <= 5) {
                            pg = i + 1;
                          } else if (currentPage <= 3) {
                            pg = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pg = totalPages - 4 + i;
                          } else {
                            pg = currentPage - 2 + i;
                          }
                          return (
                            <Pagination.Item
                              key={pg}
                              active={pg === currentPage}
                              onClick={() => setCurrentPage(pg)}
                            >
                              {pg}
                            </Pagination.Item>
                          );
                        })}
                        <Pagination.Next
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        />
                      </Pagination>
                    )}
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      {/* ════════════════════════════════════════════════
          TAB: CORRECTIONS & AUDIT (Admin / Owner)
          ════════════════════════════════════════════════ */}
      {activeTab === 'corrections' && canCorrect && (
        <Card className="border-0 shadow-sm rounded-3 bg-white att-table-card">
          <div className="d-flex justify-content-between align-items-center mb-2.5 flex-wrap gap-2">
            <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2 att-section-heading">
              <FaEdit className="text-success" /> Attendance Correction Portal
            </h6>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-muted border px-2 py-1 rounded-pill extra-small fw-semibold">
                {totalRecords} Total Records
              </span>
              <Button
                variant="success"
                size="sm"
                className="d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-2 shadow-xs"
                onClick={handleOpenOverrideModal}
              >
                <FaPlus size={10} /> Manual Override
              </Button>
            </div>
          </div>
          <Row className="g-2 mb-2.5 align-items-center att-filters-row">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-white border-end-0 py-1 ps-2.5 pe-2 text-muted"><FaSearch size={12} /></InputGroup.Text>
                <Form.Control placeholder="Search employee..." value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="border-start-0 py-1 att-filter-input" />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="py-1 att-filter-input">
                <option value="">All Statuses</option>
                <option value="Present">Present</option><option value="Late">Late</option>
                <option value="Working">Working</option><option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </Form.Select>
            </Col>
            <Col md={3}><Form.Control type="date" size="sm" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }} className="py-1 att-filter-input" /></Col>
            <Col md={2}><Button variant="outline-secondary" size="sm" className="w-100 py-1 att-btn-reset" onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setStatusFilter(''); setDateFilter(''); setCurrentPage(1); }}>Reset</Button></Col>
          </Row>

          {teamLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="success" size="sm" className="me-2" /><span className="small text-muted">Loading records...</span></div>
          ) : (
            <>
              <div className="table-responsive">
                <Table borderless hover className="align-middle att-table mb-0">
                  <thead><tr>
                    <th className="py-2 px-3">Employee</th><th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">In</th><th className="py-2 px-3">Out</th>
                    <th className="py-2 px-3">Status</th><th className="py-2 px-3 text-end">Actions</th>
                  </tr></thead>
                  <tbody>
                    {teamRecords.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-muted small">No records found.</td></tr>
                    ) : teamRecords.map((item) => (
                      <tr key={item._id} className="border-bottom-light">
                        <td className="py-2 px-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="att-avatar-sm-compact">
                              {(item.userId?.firstName?.[0] || 'E') + (item.userId?.lastName?.[0] || '')}
                            </div>
                            <div>
                              <div className="att-emp-name">{item.userId ? `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim() : 'Employee'}</div>
                              <div className="att-emp-sub">{item.userId?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 att-time-cell">{item.date}</td>
                        <td className="py-2 px-3 att-time-cell">{item.loginTime ? formatTime(item.loginTime) : '—'}</td>
                        <td className="py-2 px-3 att-time-cell">{item.logoutTime ? formatTime(item.logoutTime) : '—'}</td>
                        <td className="py-2 px-3">
                          <div className="d-inline-flex align-items-center gap-1 flex-wrap">
                            {renderStatusBadgeStatic(item.status)}
                            {renderLogoutTypeBadge(item.logoutType, item.logoutTime)}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="outline-primary" size="sm" className="p-1 px-2 extra-small rounded-pill" onClick={() => handleOpenCorrection(item)}>
                              <FaEdit className="me-1" /> Correct
                            </Button>
                            {item.auditHistory?.length > 0 && (
                              <Button variant="outline-secondary" size="sm" className="p-1 px-2 extra-small rounded-pill" onClick={() => handleOpenAudit(item)}>
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
              {totalRecords > 0 && (
                <div className="att-pagination-bar">
                  <div className="att-pagination-info">
                    Showing <span className="fw-bold text-dark">{Math.min((currentPage - 1) * 10 + 1, totalRecords)}</span> to{' '}
                    <span className="fw-bold text-dark">{Math.min(currentPage * 10, totalRecords)}</span> of{' '}
                    <span className="fw-bold text-dark">{totalRecords}</span> records
                  </div>
                  {totalPages > 1 && (
                    <Pagination size="sm" className="att-pagination mb-0">
                      <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pg;
                        if (totalPages <= 5) pg = i + 1;
                        else if (currentPage <= 3) pg = i + 1;
                        else if (currentPage >= totalPages - 2) pg = totalPages - 4 + i;
                        else pg = currentPage - 2 + i;
                        return <Pagination.Item key={pg} active={pg === currentPage} onClick={() => setCurrentPage(pg)}>{pg}</Pagination.Item>;
                      })}
                      <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
                    </Pagination>
                  )}
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
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold"><FaEdit className="me-2 text-primary" /> Correct Attendance Record</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitCorrection}>
          <Modal.Body className="small">
            {correctionError && <Alert variant="danger" className="py-2 px-3 small mb-3 rounded-3">{correctionError}</Alert>}
            {selectedRecord && (
              <div className="p-3 bg-light rounded-3 mb-3 extra-small">
                <div><strong>Employee:</strong> {selectedRecord.userId ? `${selectedRecord.userId.firstName} ${selectedRecord.userId.lastName}` : 'N/A'}</div>
                <div><strong>Date:</strong> {selectedRecord.date}</div>
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
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
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
          <Modal.Footer className="border-0 pt-0">
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
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold"><FaHistory className="me-2 text-secondary" /> Correction Audit Trail</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          {auditRecord?.auditHistory?.length > 0 ? (
            <div className="table-responsive">
              <Table borderless hover className="align-middle extra-small mb-0">
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
            </div>
          ) : (
            <p className="text-muted text-center my-3">No modification history recorded.</p>
          )}
        </Modal.Body>
      </Modal>

      {/* ════════════════════════════════════════════════
          MODAL: MANUAL ATTENDANCE OVERRIDE (Admin / Owner)
          ════════════════════════════════════════════════ */}
      <Modal show={showOverrideModal} onHide={() => setShowOverrideModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold">
            <FaPlus className="me-2 text-success" /> Admin Manual Attendance Override
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitOverride}>
          <Modal.Body className="small">
            {overrideError && (
              <Alert variant="danger" className="py-2 px-3 small mb-3 rounded-3">
                {overrideError}
              </Alert>
            )}

            <p className="text-muted extra-small mb-3">
              Manually create or update an attendance record for any date (past, today, future, weekends, or company holidays).
              Leave and Absent records do not require punch times.
            </p>

            <Row className="g-2 mb-3">
              <Col md={7}>
                <Form.Group>
                  <Form.Label className="fw-bold">Employee *</Form.Label>
                  {usersLoading ? (
                    <div className="d-flex align-items-center gap-2 py-1 text-muted extra-small">
                      <Spinner animation="border" size="sm" variant="success" /> Loading employees...
                    </div>
                  ) : (
                    <Form.Select
                      size="sm"
                      value={overrideForm.userId}
                      onChange={(e) => setOverrideForm({ ...overrideForm, userId: e.target.value })}
                      required
                    >
                      <option value="">Select Employee...</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.firstName} {u.lastName} ({u.employeeCode || u.email || 'N/A'})
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fw-bold">Date *</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={overrideForm.date}
                    onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Status *</Form.Label>
                  <Form.Select
                    size="sm"
                    value={overrideForm.status}
                    onChange={(e) => handleOverrideStatusChange(e.target.value)}
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Leave">Leave (Holiday / Approved Leave)</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Location Type</Form.Label>
                  <Form.Select
                    size="sm"
                    value={overrideForm.locationType}
                    disabled={overrideForm.status === 'Leave' || overrideForm.status === 'Absent'}
                    onChange={(e) => setOverrideForm({ ...overrideForm, locationType: e.target.value })}
                  >
                    <option value="Office">Office</option>
                    <option value="WFH">WFH</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Time Fields (Disabled for Leave / Absent) */}
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Punch In Time {overrideForm.status !== 'Leave' && overrideForm.status !== 'Absent' && overrideForm.date > getTodayString() ? '*' : ''}
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    size="sm"
                    value={overrideForm.loginTime}
                    disabled={overrideForm.status === 'Leave' || overrideForm.status === 'Absent'}
                    onChange={(e) => setOverrideForm({ ...overrideForm, loginTime: e.target.value })}
                  />
                  {(overrideForm.status === 'Leave' || overrideForm.status === 'Absent') && (
                    <Form.Text className="text-muted extra-small">
                      Not applicable for {overrideForm.status}.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Punch Out Time {overrideForm.status !== 'Leave' && overrideForm.status !== 'Absent' && overrideForm.date > getTodayString() ? '*' : ''}
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    size="sm"
                    value={overrideForm.logoutTime}
                    disabled={overrideForm.status === 'Leave' || overrideForm.status === 'Absent'}
                    onChange={(e) => setOverrideForm({ ...overrideForm, logoutTime: e.target.value })}
                  />
                  {(overrideForm.status === 'Leave' || overrideForm.status === 'Absent') && (
                    <Form.Text className="text-muted extra-small">
                      Not applicable for {overrideForm.status}.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {overrideForm.status !== 'Leave' && overrideForm.status !== 'Absent' && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Mark as Late Arrival"
                  checked={overrideForm.isLate}
                  onChange={(e) => setOverrideForm({ ...overrideForm, isLate: e.target.checked })}
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-danger">
                Reason for Manual Override * (min 5 characters)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                size="sm"
                placeholder="E.g., Approved leave granted by management / Holiday declaration / Pre-scheduled shift..."
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" size="sm" onClick={() => setShowOverrideModal(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={overrideSubmitting}>
              {overrideSubmitting ? <Spinner animation="border" size="sm" /> : 'Save Manual Override'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Attendance;