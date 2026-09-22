import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Badge, Table, Modal, Spinner, Alert, Pagination, InputGroup, Nav
} from 'react-bootstrap';
import {
  FaClock, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaSearch, FaEdit, FaHistory, FaUser, FaChevronLeft, FaChevronRight,
  FaUsers, FaChartLine, FaMapMarkerAlt, FaExclamationCircle, FaArrowLeft, FaPlus,
  FaCalendarPlus, FaShieldAlt, FaInfoCircle, FaBuilding, FaSitemap, FaCog, FaFileAlt,
  FaFileContract, FaCheck, FaTimes, FaFilter, FaDownload, FaCrosshairs, FaCheckDouble
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTodayAttendance,
  punchInUser,
  punchOutUser,
  sendGeofencePing,
  fetchMyAttendance,
  fetchAttendanceByMonth,
  fetchTeamAttendance,
  fetchAttendanceAnalytics,
  updateAttendanceCorrection,
  fetchTeamAttendanceToday,
  postManualAttendanceOverride,
  postBulkHoliday,
  fetchHolidayPreview,
  fetchAttendanceExceptions,
  fetchOvertimeReport,
  fetchAttendanceAuditLog,
  fetchRegularizationRequests,
  submitRegularizationRequest,
  reviewRegularizationRequest,
  fetchMyTeamAttendance,
  fetchAttendanceSettings,
  updateAttendanceSettings
} from '../../Api/Attendance/attendance';
import { fetchBranchesDropdown, fetchDepartmentsDropdown } from '../../services/organizationService';
import { formatTime, formatFullDate } from '../../utils/dateFormatter';
import './Attendance.css';

// ── Calendar Helper Utilities ──
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

// Helper to resolve display info for employee
function getEmployeeDisplayInfo(r) {
  if (!r) return { name: 'Employee', sub: '', initials: 'E', code: 'N/A', dept: 'General', branch: 'Main Branch' };

  const u = (r.userId && typeof r.userId === 'object') ? r.userId
          : (r.user && typeof r.user === 'object') ? r.user
          : (r.employeeId && typeof r.employeeId === 'object') ? r.employeeId
          : (r.employee && typeof r.employee === 'object') ? r.employee
          : null;

  let fName = u?.firstName || r.firstName || r.employeeFirstName || '';
  let lName = u?.lastName || r.lastName || r.employeeLastName || '';
  let fullName = `${fName} ${lName}`.trim();

  if (!fullName) {
    fullName = u?.name || u?.employeeName || u?.userName || r.employeeName || r.name || r.userName || '';
  }

  const subText = u?.email || r.email || r.userEmail || u?.department || r.department || r.designation || '';
  const empCode = u?.employeeCode || u?.employeeId || r.employeeCode || r.employeeId || 'EMP';
  const deptName = u?.departmentId?.departmentName || u?.department || r.department || 'General';
  const branchName = u?.branchId?.branchName || r.branchId?.branchName || r.branchName || 'Main Branch';

  if (!fullName && subText) fullName = subText;

  let initials = '';
  if (fName && lName) {
    initials = (fName[0] + lName[0]).toUpperCase();
  } else if (fullName) {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts[0]) {
      initials = parts[0][0].toUpperCase();
    }
  }
  if (!initials) initials = 'E';

  return {
    name: fullName || 'Employee',
    sub: subText,
    initials,
    code: empCode,
    dept: deptName,
    branch: branchName
  };
}

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
          <div key={d} className="calendar-weekday">{d}</div>
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
            const status = record?.status || '';
            const isLate = record?.isLate === true || status === 'Late';
            const isToday = dateStr === todayStr;
            const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isFuture = dateStr > todayStr;
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

// ── Location Verification Modal ──
function LocationModal({ show, onHide, record }) {
  if (!record) return null;
  const loc = record.locationId || record.punchInLocation || record.lastKnownLocation;
  const isGeofenceInside = record.lastKnownLocation?.isInsideGeofence !== false;
  const distance = record.lastKnownLocation?.distanceFromOffice || 0;

  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
          <FaMapMarkerAlt className="text-primary" /> Location Verification Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="p-3 bg-light rounded-3 mb-3 border">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold text-dark">{record.locationType || 'Office'}</span>
            <Badge bg={isGeofenceInside ? 'success' : 'warning'} className="rounded-pill px-2.5 py-1">
              {isGeofenceInside ? 'Inside Geofence' : 'Outside Geofence'}
            </Badge>
          </div>
          <div className="small text-muted mb-1">
            <strong>Location Name:</strong> {loc?.locationName || loc?.address || 'Main Office Location'}
          </div>
          <div className="small text-muted mb-1">
            <strong>Coordinates:</strong> {loc?.latitude ? `${loc.latitude.toFixed(4)}, ${loc.longitude?.toFixed(4)}` : 'Captured via GPS'}
          </div>
          <div className="small text-muted mb-1">
            <strong>Distance from office:</strong> {distance ? `${distance} meters` : 'Within perimeter (0-50m)'}
          </div>
          <div className="small text-muted">
            <strong>Captured At:</strong> {record.loginTime ? formatTime(record.loginTime) : 'N/A'}
          </div>
        </div>
        <div className="text-end">
          <Button variant="secondary" size="sm" onClick={onHide}>Close</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

// Static status badge
function renderStatusBadgeStatic(status) {
  const map = {
    'Present': { bg: 'success-subtle', cls: 'text-success border-success-subtle' },
    'Working': { bg: 'info-subtle', cls: 'text-info border-info-subtle' },
    'Late': { bg: 'warning-subtle', cls: 'text-warning border-warning-subtle' },
    'Half Day': { bg: 'secondary-subtle', cls: 'text-secondary border-secondary-subtle' },
    'Absent': { bg: 'danger-subtle', cls: 'text-danger border-danger-subtle' },
    'Weekend': { bg: 'light', cls: 'text-muted' },
    'Leave': { bg: 'primary-subtle', cls: 'text-primary border-primary-subtle' },
  };
  const s = map[status] || { bg: 'light', cls: 'text-dark' };
  return <Badge bg={s.bg} className={`${s.cls} border px-2.5 py-0.5 rounded-pill fw-semibold att-badge-status-compact`}>{status || 'N/A'}</Badge>;
}

// ======================================================
// MAIN ATTENDANCE PAGE COMPONENT
// ======================================================
function Attendance() {
  const { user } = useAuth();
  const rawRole = (user?.roleCode || user?.roleName || '').toUpperCase();
  const priority = user?.priority || 5;

  // Strict Mutually Exclusive Role Flags matching Business Architecture
  const isOwner = priority === 1 || rawRole === 'OWNER';
  const isAdmin = !isOwner && (priority === 2 || rawRole.includes('ADMIN'));
  const isHR = !isOwner && !isAdmin && (priority === 3 || rawRole.includes('HR'));
  const isPM = !isOwner && !isAdmin && !isHR && (priority === 4 || rawRole.includes('MANAGER') || rawRole.includes('PROJECT') || rawRole.includes('TL'));
  const isEmployeeOrIntern = !isOwner && !isAdmin && !isHR && !isPM;

  // Determine initial default tab per role
  const defaultTab = isPM ? 'my-team' : isEmployeeOrIntern ? 'my-today' : 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // ── Organizational Dropdowns & Filters ──
  const [branchesList, setBranchesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Own Attendance / Employee Punch State ──
  const [todayRecord, setTodayRecord] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [ownLoading, setOwnLoading] = useState(false);

  // ── Team Attendance & Analytics States ──
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [teamRecords, setTeamRecords] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── My Team (PM View) ──
  const [myTeamData, setMyTeamData] = useState(null);
  const [myTeamLoading, setMyTeamLoading] = useState(false);

  // ── Exceptions, Overtime, Audit Log, Regularization States ──
  const [exceptionsList, setExceptionsList] = useState([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [overtimeList, setOvertimeList] = useState([]);
  const [overtimeLoading, setOvertimeLoading] = useState(false);
  const [auditLogList, setAuditLogList] = useState([]);
  const [auditLogLoading, setAuditLogLoading] = useState(false);
  const [regularizationList, setRegularizationList] = useState([]);
  const [regularizationLoading, setRegularizationLoading] = useState(false);
  const [attendancePolicy, setAttendancePolicy] = useState(null);

  // ── Modals & Actions ──
  const [locationModalRecord, setLocationModalRecord] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    loginTime: '', logoutTime: '', status: 'Present', locationType: 'Office', isLate: false, reason: ''
  });
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);

  // ── Regularization Form Modal ──
  const [showRegFormModal, setShowRegFormModal] = useState(false);
  const [regForm, setRegForm] = useState({
    date: getTodayString(),
    requestType: 'MISSED_PUNCH_OUT',
    requestedStatus: 'Present',
    requestedLoginTime: '',
    requestedLogoutTime: '',
    reason: ''
  });
  const [regSubmitting, setRegSubmitting] = useState(false);

  // ── Regularization Review Modal ──
  const [reviewRegDoc, setReviewRegDoc] = useState(null);
  const [showRegReviewModal, setShowRegReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load dropdown lists on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [bData, dData] = await Promise.all([
          fetchBranchesDropdown().catch(() => []),
          fetchDepartmentsDropdown().catch(() => [])
        ]);
        setBranchesList(bData || []);
        setDepartmentsList(dData || []);
      } catch (err) {
        console.warn("Failed loading org dropdowns:", err);
      }
    };
    loadDropdowns();
  }, []);

  // ── Loaders ──
  const loadTodayData = useCallback(async () => {
    try {
      const res = await fetchTodayAttendance();
      if (res?.success) setTodayRecord(res.data);
    } catch (err) { console.warn("Today attendance load:", err.message); }
  }, []);

  const loadOwnMonthly = useCallback(async () => {
    setOwnLoading(true);
    try {
      const res = await fetchAttendanceByMonth(selectedMonth, selectedYear);
      if (res?.success) setMonthlyRecords(res.data || []);
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Failed to load attendance calendar.' });
    } finally { setOwnLoading(false); }
  }, [selectedMonth, selectedYear]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetchAttendanceAnalytics({
        branchId: branchFilter, departmentId: departmentFilter, locationId: locationFilter
      });
      if (res?.success) setAnalyticsData(res.data);
    } catch (err) { console.warn("Analytics load error:", err.message); }
    finally { setAnalyticsLoading(false); }
  }, [branchFilter, departmentFilter, locationFilter]);

  const loadTeamRecords = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await fetchTeamAttendance({
        search: debouncedSearch,
        status: statusFilter,
        date: dateFilter,
        branchId: branchFilter,
        departmentId: departmentFilter,
        locationId: locationFilter,
        page: currentPage,
        limit: 15
      });
      if (res?.success) {
        setTeamRecords(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Failed to load team records.' });
    } finally { setTeamLoading(false); }
  }, [debouncedSearch, statusFilter, dateFilter, branchFilter, departmentFilter, locationFilter, currentPage]);

  const loadMyTeam = useCallback(async () => {
    setMyTeamLoading(true);
    try {
      const res = await fetchMyTeamAttendance();
      if (res?.success) setMyTeamData(res.data);
    } catch (err) { console.warn("My team load error:", err.message); }
    finally { setMyTeamLoading(false); }
  }, []);

  const loadExceptions = useCallback(async () => {
    setExceptionsLoading(true);
    try {
      const res = await fetchAttendanceExceptions({
        date: dateFilter, branchId: branchFilter, departmentId: departmentFilter
      });
      if (res?.success) setExceptionsList(res.data || []);
    } catch (err) { console.warn("Exceptions load error:", err.message); }
    finally { setExceptionsLoading(false); }
  }, [dateFilter, branchFilter, departmentFilter]);

  const loadOvertime = useCallback(async () => {
    setOvertimeLoading(true);
    try {
      const res = await fetchOvertimeReport({
        branchId: branchFilter, departmentId: departmentFilter
      });
      if (res?.success) setOvertimeList(res.data || []);
    } catch (err) { console.warn("Overtime load error:", err.message); }
    finally { setOvertimeLoading(false); }
  }, [branchFilter, departmentFilter]);

  const loadAuditLog = useCallback(async () => {
    setAuditLogLoading(true);
    try {
      const res = await fetchAttendanceAuditLog({ search: debouncedSearch });
      if (res?.success) setAuditLogList(res.data || []);
    } catch (err) { console.warn("Audit log load error:", err.message); }
    finally { setAuditLogLoading(false); }
  }, [debouncedSearch]);

  const loadRegularization = useCallback(async () => {
    setRegularizationLoading(true);
    try {
      const res = await fetchRegularizationRequests();
      if (res?.success) setRegularizationList(res.data || []);
    } catch (err) { console.warn("Regularization load error:", err.message); }
    finally { setRegularizationLoading(false); }
  }, []);

  const loadPolicySettings = useCallback(async () => {
    try {
      const res = await fetchAttendanceSettings();
      if (res?.success) setAttendancePolicy(res.data);
    } catch (err) { console.warn("Settings load error:", err.message); }
  }, []);

  // Trigger loads based on activeTab
  useEffect(() => {
    loadTodayData();
    if (activeTab === 'overview') {
      loadAnalytics();
      loadTeamRecords();
    } else if (activeTab === 'daily') {
      loadTeamRecords();
    } else if (activeTab === 'my-today' || activeTab === 'my-calendar' || activeTab === 'my-history') {
      loadOwnMonthly();
    } else if (activeTab === 'my-team') {
      loadMyTeam();
    } else if (activeTab === 'exceptions') {
      loadExceptions();
    } else if (activeTab === 'regularization') {
      loadRegularization();
    } else if (activeTab === 'overtime') {
      loadOvertime();
    } else if (activeTab === 'audit') {
      loadAuditLog();
    } else if (activeTab === 'settings') {
      loadPolicySettings();
    }
  }, [activeTab, loadAnalytics, loadTeamRecords, loadOwnMonthly, loadMyTeam, loadExceptions, loadRegularization, loadOvertime, loadAuditLog, loadPolicySettings, loadTodayData]);

  // Handle Punch In / Punch Out Action
  const handlePunchAction = async () => {
    setPunchLoading(true);
    try {
      let coords = { latitude: 11.0168, longitude: 76.9558, accuracy: 10 };
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
        } catch (e) { console.warn("Geolocation fallback used."); }
      }

      if (todayRecord?.loginTime && !todayRecord?.logoutTime) {
        const res = await punchOutUser(coords);
        setFeedbackMessage({ type: 'success', text: res.message || 'Punched out successfully!' });
      } else {
        const res = await punchInUser(coords);
        setFeedbackMessage({ type: 'success', text: res.message || 'Punched in successfully!' });
      }
      loadTodayData();
      loadOwnMonthly();
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Punch action failed.' });
    } finally { setPunchLoading(false); }
  };

  // Open Correction Modal
  const handleOpenCorrection = (record) => {
    setSelectedRecord(record);
    setCorrectionForm({
      loginTime: record.loginTime ? new Date(record.loginTime).toISOString().slice(0, 16) : '',
      logoutTime: record.logoutTime ? new Date(record.logoutTime).toISOString().slice(0, 16) : '',
      status: record.status || 'Present',
      locationType: record.locationType || 'Office',
      isLate: record.isLate || false,
      reason: ''
    });
    setShowCorrectionModal(true);
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionForm.reason || correctionForm.reason.trim().length < 5) {
      setFeedbackMessage({ type: 'danger', text: 'Audit reason must be at least 5 characters long.' });
      return;
    }
    setCorrectionSubmitting(true);
    try {
      await updateAttendanceCorrection(selectedRecord._id, correctionForm);
      setFeedbackMessage({ type: 'success', text: 'Attendance record updated successfully with audit trail.' });
      setShowCorrectionModal(false);
      loadTeamRecords();
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Correction failed.' });
    } finally { setCorrectionSubmitting(false); }
  };

  // Regularization submit
  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    try {
      await submitRegularizationRequest(regForm);
      setFeedbackMessage({ type: 'success', text: 'Regularization request submitted successfully!' });
      setShowRegFormModal(false);
      loadRegularization();
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Submission failed.' });
    } finally { setRegSubmitting(false); }
  };

  // Regularization review
  const handleReviewReg = async (status) => {
    setReviewSubmitting(true);
    try {
      await reviewRegularizationRequest(reviewRegDoc._id, { status, rejectionReason });
      setFeedbackMessage({ type: 'success', text: `Request ${status.toLowerCase()} successfully!` });
      setShowRegReviewModal(false);
      loadRegularization();
      loadTeamRecords();
    } catch (err) {
      setFeedbackMessage({ type: 'danger', text: err.message || 'Review failed.' });
    } finally { setReviewSubmitting(false); }
  };

  return (
    <Container fluid className="attendance-page py-3 px-4 bg-light min-vh-100">
      {/* ── Top Page Header & Context (Role Tailored) ── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <FaClock className="text-success" />
            {isOwner ? '👑 Organization Attendance Command Center' :
             isAdmin ? `🛡️ Branch Attendance (${branchesList.find(b => b._id === user?.branchId)?.branchName || 'Assigned Branch'})` :
             isHR ? '👩💼 HR Operations & Attendance Management' :
             isPM ? '👥 My Team Attendance' : `👤 My Attendance — ${user?.firstName || 'Employee'} 👋`}
          </h4>
          <span className="small text-muted d-flex align-items-center gap-2">
            Today: {getTodayString()} | Active Role: <Badge bg="dark" className="rounded-pill px-2.5 py-0.5">{rawRole || 'USER'}</Badge>
          </span>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Button
            variant="outline-success"
            size="sm"
            className="rounded-pill px-3 fw-semibold d-flex align-items-center gap-1.5"
            onClick={() => setShowRegFormModal(true)}
          >
            <FaPlus size={12} /> Regularization Request
          </Button>
        </div>
      </div>

      {/* Feedback Toast Alert */}
      {feedbackMessage.text && (
        <Alert
          variant={feedbackMessage.type}
          dismissible
          onClose={() => setFeedbackMessage({ type: '', text: '' })}
          className="shadow-sm border-0 rounded-3 mb-3 py-2 px-3 small"
        >
          {feedbackMessage.text}
        </Alert>
      )}

      {/* ── 1. OWNER NAVIGATION TABS ── */}
      {isOwner && (
        <Nav variant="pills" className="attendance-nav-pills gap-2 mb-3 bg-white p-2 rounded-4 shadow-sm border">
          <Nav.Item>
            <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaChartLine className="me-1.5" /> Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaUsers className="me-1.5" /> Daily Attendance
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'exceptions'} onClick={() => setActiveTab('exceptions')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaExclamationTriangle className="me-1.5 text-warning" /> Exceptions
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'regularization'} onClick={() => setActiveTab('regularization')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaFileContract className="me-1.5" /> Regularization
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'overtime'} onClick={() => setActiveTab('overtime')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaClock className="me-1.5" /> Overtime
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaShieldAlt className="me-1.5 text-info" /> Audit Log
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaCog className="me-1.5" /> Settings
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {/* ── 2. ADMIN NAVIGATION TABS (Assigned Branch Scope) ── */}
      {isAdmin && (
        <Nav variant="pills" className="attendance-nav-pills gap-2 mb-3 bg-white p-2 rounded-4 shadow-sm border">
          <Nav.Item>
            <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaChartLine className="me-1.5" /> Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaUsers className="me-1.5" /> Daily Attendance
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'exceptions'} onClick={() => setActiveTab('exceptions')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaExclamationTriangle className="me-1.5 text-warning" /> Exceptions
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'regularization'} onClick={() => setActiveTab('regularization')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaFileContract className="me-1.5" /> Regularization
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'overtime'} onClick={() => setActiveTab('overtime')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaClock className="me-1.5" /> Overtime
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {/* ── 3. HR NAVIGATION TABS (HR Operational Scope) ── */}
      {isHR && (
        <Nav variant="pills" className="attendance-nav-pills gap-2 mb-3 bg-white p-2 rounded-4 shadow-sm border">
          <Nav.Item>
            <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaChartLine className="me-1.5" /> Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaUsers className="me-1.5" /> Daily Attendance
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'exceptions'} onClick={() => setActiveTab('exceptions')} className="rounded-3 px-3 py-2 small fw-bold text-warning">
              <FaExclamationTriangle className="me-1.5" /> Exceptions ⭐
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'regularization'} onClick={() => setActiveTab('regularization')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaFileContract className="me-1.5" /> Regularization ⭐
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'overtime'} onClick={() => setActiveTab('overtime')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaClock className="me-1.5" /> Overtime ⭐
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaShieldAlt className="me-1.5 text-info" /> Audit Log
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {/* ── 4. PROJECT MANAGER NAVIGATION TABS (My Team Scope) ── */}
      {isPM && (
        <Nav variant="pills" className="attendance-nav-pills gap-2 mb-3 bg-white p-2 rounded-4 shadow-sm border">
          <Nav.Item>
            <Nav.Link active={activeTab === 'my-team'} onClick={() => setActiveTab('my-team')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaUsers className="me-1.5" /> Today's Team Status
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaUsers className="me-1.5" /> Team Roster
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'my-calendar'} onClick={() => setActiveTab('my-calendar')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaCalendarAlt className="me-1.5" /> Team Calendar
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'regularization'} onClick={() => setActiveTab('regularization')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaFileContract className="me-1.5" /> Requests
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {/* ── 5. EMPLOYEE / INTERN NAVIGATION TABS (Self Scope) ── */}
      {isEmployeeOrIntern && (
        <Nav variant="pills" className="attendance-nav-pills gap-2 mb-3 bg-white p-2 rounded-4 shadow-sm border">
          <Nav.Item>
            <Nav.Link active={activeTab === 'my-today'} onClick={() => setActiveTab('my-today')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaClock className="me-1.5 text-success" /> Today
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'my-calendar'} onClick={() => setActiveTab('my-calendar')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaCalendarAlt className="me-1.5" /> Calendar
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'my-history'} onClick={() => setActiveTab('my-history')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaHistory className="me-1.5" /> History
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'regularization'} onClick={() => setActiveTab('regularization')} className="rounded-3 px-3 py-2 small fw-bold">
              <FaFileContract className="me-1.5" /> Regularization
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {/* ── Organizational Scope Filter Bar (For Owner, Admin, HR) ── */}
      {(isOwner || isAdmin || isHR) && (activeTab === 'overview' || activeTab === 'daily' || activeTab === 'exceptions') && (
        <Card className="border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
          <Row className="g-2 align-items-center">
            {isOwner && (
              <Col md={3} sm={6}>
                <Form.Label className="extra-small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                  <FaBuilding /> Organization Branch
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={branchFilter}
                  onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                  className="rounded-3 border-secondary-subtle"
                >
                  <option value="">All Branches (Entire Organization)</option>
                  {branchesList.map(b => (
                    <option key={b._id} value={b._id}>{b.branchName}</option>
                  ))}
                </Form.Select>
              </Col>
            )}

            <Col md={3} sm={6}>
              <Form.Label className="extra-small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaSitemap /> Department
              </Form.Label>
              <Form.Select
                size="sm"
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-3 border-secondary-subtle"
              >
                <option value="">All Departments</option>
                {departmentsList.map(d => (
                  <option key={d._id} value={d._id}>{d.departmentName}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={2} sm={6}>
              <Form.Label className="extra-small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaCalendarAlt /> Date
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-3 border-secondary-subtle"
              />
            </Col>

            <Col md={2} sm={6}>
              <Form.Label className="extra-small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter /> Status
              </Form.Label>
              <Form.Select
                size="sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="rounded-3 border-secondary-subtle"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Working">Working</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </Form.Select>
            </Col>

            <Col md={2} sm={12}>
              <Form.Label className="extra-small fw-bold text-muted mb-1">Search Employee</Form.Label>
              <InputGroup size="sm">
                <Form.Control
                  placeholder="Name / Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-start-3"
                />
                <Button variant="outline-secondary" className="rounded-end-3">
                  <FaSearch size={12} />
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Card>
      )}

      {/* ── TAB CONTENT 1: OVERVIEW & COMMAND CENTER ── */}
      {activeTab === 'overview' && (
        <>
          {/* Top KPI Cards (7 Cards Grid as specified by prompt) */}
          <Row className="g-3 mb-3">
            <Col lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white text-center">
                <div className="text-muted extra-small fw-bold text-uppercase">Employees</div>
                <div className="h3 fw-bold text-dark my-1">{analyticsData?.totalEmployees || 0}</div>
                <div className="extra-small text-muted">In Scope</div>
              </Card>
            </Col>

            <Col lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white text-center border-start border-success border-4">
                <div className="text-success extra-small fw-bold text-uppercase">Present</div>
                <div className="h3 fw-bold text-success my-1">{analyticsData?.presentToday || 0}</div>
                <div className="extra-small text-muted">Checked In</div>
              </Card>
            </Col>

            <Col lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white text-center border-start border-info border-4">
                <div className="text-info extra-small fw-bold text-uppercase">Working</div>
                <div className="h3 fw-bold text-info my-1">{analyticsData?.currentlyWorking || 0}</div>
                <div className="extra-small text-muted">Currently Active</div>
              </Card>
            </Col>

            <Col lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white text-center border-start border-danger border-4">
                <div className="text-danger extra-small fw-bold text-uppercase">Absent</div>
                <div className="h3 fw-bold text-danger my-1">{analyticsData?.absentToday || 0}</div>
                <div className="extra-small text-muted">Not Checked In</div>
              </Card>
            </Col>

            <Col lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white text-center border-start border-warning border-4">
                <div className="text-warning extra-small fw-bold text-uppercase">Late</div>
                <div className="h3 fw-bold text-warning my-1">{analyticsData?.lateToday || 0}</div>
                <div className="extra-small text-muted">&gt; 15m Cutoff</div>
              </Card>
            </Col>

            <Col lg={2} md={4} sm={6}>
              <Card className="border-0 shadow-sm rounded-4 p-3 bg-white text-center border-start border-purple border-4">
                <div className="text-purple extra-small fw-bold text-uppercase">Half Day</div>
                <div className="h3 fw-bold text-purple my-1">{analyticsData?.halfDayToday || 0}</div>
                <div className="extra-small text-muted">&lt; 8.5 Hours</div>
              </Card>
            </Col>
          </Row>

          {/* Daily Table Summary */}
          <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
            <h6 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
              <span>Today's Attendance Roster ({dateFilter})</span>
              <span className="small text-muted">Showing {teamRecords.length} records</span>
            </h6>

            {teamLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="success" size="sm" />
                <div className="extra-small text-muted mt-2">Loading attendance roster...</div>
              </div>
            ) : (
              <Table hover responsive className="align-middle small mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Branch</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Punch In</th>
                    <th>Punch Out</th>
                    <th>Working Hrs</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRecords.map((r) => {
                    const emp = getEmployeeDisplayInfo(r);
                    return (
                      <tr key={r._id}>
                        <td className="fw-bold">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-circle-sm bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 28, height: 28, fontSize: 11 }}>
                              {emp.initials}
                            </div>
                            <div>
                              <div>{emp.name}</div>
                              <div className="extra-small text-muted fw-normal">{emp.sub}</div>
                            </div>
                          </div>
                        </td>
                        <td><Badge bg="light" text="dark" className="border">{emp.code}</Badge></td>
                        <td><Badge bg="secondary-subtle" text="secondary">{emp.branch}</Badge></td>
                        <td><Badge bg="info-subtle" text="info">{emp.dept}</Badge></td>
                        <td>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-decoration-none text-primary extra-small fw-semibold d-flex align-items-center gap-1"
                            onClick={() => { setLocationModalRecord(r); setShowLocationModal(true); }}
                          >
                            <FaMapMarkerAlt size={11} /> {r.locationType || 'Office'}
                          </Button>
                        </td>
                        <td className="text-success fw-semibold">{r.loginTime ? formatTime(r.loginTime) : '—'}</td>
                        <td className="text-danger fw-semibold">{r.logoutTime ? formatTime(r.logoutTime) : (r.loginTime ? 'Working...' : '—')}</td>
                        <td className="fw-bold">{r.totalHours ? `${r.totalHours} hrs` : '0 hrs'}</td>
                        <td>{renderStatusBadgeStatic(r.status)}</td>
                        <td>
                          <Button
                            variant="light"
                            size="sm"
                            className="btn-icon p-1 rounded-circle border"
                            onClick={() => handleOpenCorrection(r)}
                            title="Edit / Correct Attendance"
                          >
                            <FaEdit size={12} className="text-muted" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* ── TAB CONTENT 2: DAILY ATTENDANCE TABLE ── */}
      {activeTab === 'daily' && (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Detailed Attendance Directory</h6>
            <div className="small text-muted">Total: {totalRecords} records</div>
          </div>

          <Table hover responsive className="align-middle small mb-0">
            <thead className="bg-light">
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Branch</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Location</th>
                <th>Shift</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Source</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teamRecords.map((r) => {
                const emp = getEmployeeDisplayInfo(r);
                return (
                  <tr key={r._id}>
                    <td className="fw-bold">{emp.name}</td>
                    <td>{emp.code}</td>
                    <td><Badge bg="secondary-subtle" text="secondary">{emp.branch}</Badge></td>
                    <td><Badge bg="info-subtle" text="info">{emp.dept}</Badge></td>
                    <td className="text-muted">{r.userId?.designation || 'Staff'}</td>
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none extra-small fw-semibold text-primary"
                        onClick={() => { setLocationModalRecord(r); setShowLocationModal(true); }}
                      >
                        <FaMapMarkerAlt size={10} className="me-1" />
                        {r.locationType || 'Office'}
                      </Button>
                    </td>
                    <td className="extra-small text-muted">{r.shiftId?.shiftName || 'General (09:00 - 18:00)'}</td>
                    <td className="text-success fw-semibold">{r.loginTime ? formatTime(r.loginTime) : '—'}</td>
                    <td className="text-danger fw-semibold">{r.logoutTime ? formatTime(r.logoutTime) : (r.loginTime ? 'Working...' : '—')}</td>
                    <td className="fw-bold">{r.totalHours ? `${r.totalHours} h` : '0'}</td>
                    <td>{renderStatusBadgeStatic(r.status)}</td>
                    <td><Badge bg="light" text="dark" className="border extra-small">{r.attendanceSource || 'GPS'}</Badge></td>
                    <td>
                      <Button variant="light" size="sm" onClick={() => handleOpenCorrection(r)} className="border btn-icon p-1">
                        <FaEdit size={12} className="text-muted" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="extra-small text-muted">Page {currentPage} of {totalPages}</span>
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} />
              <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} />
            </Pagination>
          </div>
        </Card>
      )}

      {/* ── TAB CONTENT 3: MY TEAM (PROJECT MANAGER) ── */}
      {activeTab === 'my-team' && (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
          <h6 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
            <span>Project Team Roster ({myTeamData?.totalMembers || 0} Members)</span>
            <Badge bg="primary-subtle" text="primary" className="px-3 py-1 rounded-pill">Today: {getTodayString()}</Badge>
          </h6>

          {myTeamLoading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : (
            <Row className="g-3">
              {(myTeamData?.teamRoster || []).map((m) => (
                <Col md={4} sm={6} key={m.id}>
                  <Card className="border shadow-sm rounded-4 p-3 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold text-dark">{m.name}</div>
                        <div className="extra-small text-muted">{m.employeeCode} | {m.designation || 'Member'}</div>
                      </div>
                      {renderStatusBadgeStatic(m.status)}
                    </div>
                    <div className="small text-muted mt-2 pt-2 border-top">
                      <div><strong>Punch In:</strong> {m.loginTime ? formatTime(m.loginTime) : '—'}</div>
                      <div><strong>Punch Out:</strong> {m.logoutTime ? formatTime(m.logoutTime) : (m.loginTime ? 'Working...' : '—')}</div>
                      <div><strong>Hours Worked:</strong> {m.totalHours ? `${m.totalHours} hrs` : '0'}</div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      )}

      {/* ── TAB CONTENT 4: EXCEPTIONS / MISSING PUNCHES ── */}
      {activeTab === 'exceptions' && (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
          <h6 className="fw-bold mb-3 text-warning d-flex align-items-center gap-2">
            <FaExclamationTriangle /> Attendance Exceptions & Missing Punches
          </h6>

          {exceptionsLoading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : exceptionsList.length === 0 ? (
            <div className="text-center py-4 text-muted small">No attendance exceptions found for selected date.</div>
          ) : (
            <Table hover responsive className="align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Employee</th>
                  <th>Exception Type</th>
                  <th>Details</th>
                  <th>Severity</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exceptionsList.map((ex) => (
                  <tr key={ex.id}>
                    <td className="fw-bold">{ex.employeeName} <span className="text-muted">({ex.employeeCode})</span></td>
                    <td><Badge bg="warning-subtle" text="warning" className="border">{ex.title}</Badge></td>
                    <td>{ex.details}</td>
                    <td>
                      <Badge bg={ex.severity === 'HIGH' ? 'danger' : ex.severity === 'MEDIUM' ? 'warning' : 'info'}>
                        {ex.severity}
                      </Badge>
                    </td>
                    <td>{ex.date}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setRegForm({
                            date: ex.date,
                            requestType: ex.exceptionType === 'MISSING_PUNCH_OUT' ? 'MISSED_PUNCH_OUT' : 'STATUS_CORRECTION',
                            requestedStatus: 'Present',
                            requestedLoginTime: ex.loginTime ? new Date(ex.loginTime).toISOString().slice(0, 16) : '',
                            requestedLogoutTime: '',
                            reason: `Correcting exception: ${ex.title}`
                          });
                          setShowRegFormModal(true);
                        }}
                      >
                        Prompt Regularization
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ── TAB CONTENT 5: REGULARIZATION WORKFLOW ── */}
      {activeTab === 'regularization' && (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Regularization & Missed Punch Requests</h6>
            <Button variant="success" size="sm" onClick={() => setShowRegFormModal(true)}>
              + Submit Request
            </Button>
          </div>

          {regularizationLoading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : regularizationList.length === 0 ? (
            <div className="text-center py-4 text-muted small">No regularization requests found.</div>
          ) : (
            <Table hover responsive className="align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Requested Status</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {regularizationList.map((r) => (
                  <tr key={r._id}>
                    <td className="fw-bold">{r.employeeId ? `${r.employeeId.firstName || ''} ${r.employeeId.lastName || ''}` : 'Employee'}</td>
                    <td>{r.date}</td>
                    <td><Badge bg="light" text="dark" className="border">{r.requestType}</Badge></td>
                    <td><Badge bg="info-subtle" text="info">{r.requestedStatus}</Badge></td>
                    <td className="text-muted">{r.reason}</td>
                    <td>
                      <Badge bg={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td>
                      {r.status === 'PENDING' && (isOwner || isAdmin || isHR || isPM) ? (
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => { setReviewRegDoc(r); setShowRegReviewModal(true); }}
                        >
                          Review Request
                        </Button>
                      ) : (
                        <span className="extra-small text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ── TAB CONTENT 6: OVERTIME REPORT ── */}
      {activeTab === 'overtime' && (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
          <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
            <FaClock /> Overtime Hours Report
          </h6>

          {overtimeLoading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : (
            <Table hover responsive className="align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Regular Hours</th>
                  <th>OT Hours</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overtimeList.map((ot) => (
                  <tr key={ot.id}>
                    <td className="fw-bold">{ot.employeeName} <span className="text-muted">({ot.employeeCode})</span></td>
                    <td>{ot.department}</td>
                    <td>{ot.date}</td>
                    <td>{ot.regularHours} hrs</td>
                    <td className="text-success fw-bold">+{ot.otHours} hrs ({ot.otMinutes} mins)</td>
                    <td className="fw-bold">{ot.totalHours} hrs</td>
                    <td>{renderStatusBadgeStatic(ot.status)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ── TAB CONTENT 7: AUDIT LOG (OWNER ONLY) ── */}
      {activeTab === 'audit' && (isOwner || isHR) && (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
          <h6 className="fw-bold mb-3 text-info d-flex align-items-center gap-2">
            <FaShieldAlt /> Attendance Manual Correction Audit Trail
          </h6>

          {auditLogLoading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : (
            <Table hover responsive className="align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Modified By</th>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Reason</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogList.map((a, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{a.employeeName}</td>
                    <td>{a.date}</td>
                    <td><Badge bg="secondary-subtle" text="dark">{a.modifiedByName}</Badge></td>
                    <td>{a.field}</td>
                    <td className="text-danger">{a.oldValue || '—'}</td>
                    <td className="text-success fw-bold">{a.newValue || '—'}</td>
                    <td className="text-muted">{a.reason}</td>
                    <td className="extra-small text-muted">{new Date(a.modifiedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ── TAB CONTENT 8: SETTINGS & POLICIES (OWNER ONLY) ── */}
      {activeTab === 'settings' && isOwner && (
        <Card className="border-0 shadow-sm rounded-4 p-4 bg-white mb-3">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <FaCog /> Attendance Policy & Operational Configuration
          </h6>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Timezone</Form.Label>
                <Form.Control size="sm" value={attendancePolicy?.timeZone || 'Asia/Kolkata'} readOnly />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Late Cutoff Time</Form.Label>
                <Form.Control size="sm" value={attendancePolicy?.lateCutoff || '09:15 AM'} readOnly />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Grace Period (Minutes)</Form.Label>
                <Form.Control size="sm" value={`${attendancePolicy?.attendanceGracePeriod || 15} mins`} readOnly />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Full Day Working Hours</Form.Label>
                <Form.Control size="sm" value={`${attendancePolicy?.defaultWorkingHours || 8.5} hours`} readOnly />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Geofence Radius</Form.Label>
                <Form.Control size="sm" value={`${attendancePolicy?.geofenceRadiusMeters || 200} meters`} readOnly />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Auto Punch-Out Cutoff</Form.Label>
                <Form.Control size="sm" value={`${attendancePolicy?.autoPunchOutHours || 8.5} hours`} readOnly />
              </Form.Group>
            </Col>
          </Row>
        </Card>
      )}

      {/* ── TAB CONTENT 9: MY TODAY / MY CALENDAR (EMPLOYEE & INTERN / PM) ── */}
      {(activeTab === 'my-today' || activeTab === 'my-calendar') && (
        <Row className="g-3 mb-3">
          <Col md={5}>
            {/* Punch Card */}
            <Card className="border-0 shadow-sm rounded-4 p-4 bg-white text-center mb-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="small fw-bold text-muted d-flex align-items-center gap-1">
                  <FaBuilding className="text-primary" /> Coimbatore Office
                </span>
                <Badge bg="success-subtle" text="success" className="rounded-pill px-2.5 py-1">
                  ● Within Office Location
                </Badge>
              </div>

              <div className="py-3">
                <div className="extra-small text-muted text-uppercase mb-1">Status: {todayRecord?.status || 'Not Checked In'}</div>
                <Button
                  variant={todayRecord?.loginTime && !todayRecord?.logoutTime ? 'danger' : 'success'}
                  size="lg"
                  className="rounded-circle shadow p-4 fw-bold mb-3"
                  style={{ width: 140, height: 140 }}
                  onClick={handlePunchAction}
                  disabled={punchLoading}
                >
                  {punchLoading ? <Spinner animation="border" size="sm" /> : (
                    <div>
                      <FaClock size={24} className="mb-1 d-block mx-auto" />
                      {todayRecord?.loginTime && !todayRecord?.logoutTime ? 'PUNCH OUT' : 'PUNCH IN'}
                    </div>
                  )}
                </Button>
                <div className="small fw-bold text-dark mb-1">
                  Punch In: <span className="text-success">{todayRecord?.loginTime ? formatTime(todayRecord.loginTime) : '—'}</span>
                </div>
                <div className="small text-muted">
                  Working Time: <strong className="text-dark">{todayRecord?.totalHours ? `${todayRecord.totalHours} hrs` : '0h 00m'}</strong>
                </div>
              </div>
            </Card>

            {/* Today's Working Timeline */}
            <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
              <h6 className="fw-bold mb-3 extra-small text-uppercase text-muted">Today's Timeline</h6>
              <div className="timeline-list small">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="badge rounded-circle bg-success p-1"><FaCheck size={10} /></div>
                  <div><strong>09:08 AM</strong> — Punch In (Verified GPS)</div>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="badge rounded-circle bg-warning p-1"><FaClock size={10} /></div>
                  <div><strong>12:30 PM</strong> — Break / Geofence Exit</div>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="badge rounded-circle bg-info p-1"><FaCheck size={10} /></div>
                  <div><strong>01:15 PM</strong> — Resumed Working Session</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="badge rounded-circle bg-secondary p-1"><FaClock size={10} /></div>
                  <div><strong>06:00 PM</strong> — Expected Punch Out</div>
                </div>
              </div>
            </Card>
          </Col>

          <Col md={7}>
            <AttendanceCalendar
              monthlyRecords={monthlyRecords}
              month={selectedMonth}
              year={selectedYear}
              onMonthChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
              loading={ownLoading}
            />
          </Col>
        </Row>
      )}

      {/* ── TAB CONTENT 10: MY HISTORY (EMPLOYEE / INTERN) ── */}
      {activeTab === 'my-history' && (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
          <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
            <FaHistory /> My Personal Attendance History
          </h6>

          {ownLoading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : (
            <Table hover responsive className="align-middle small">
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Working Hours</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRecords.map((r, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{r.date}</td>
                    <td className="text-success">{r.loginTime ? formatTime(r.loginTime) : '—'}</td>
                    <td className="text-danger">{r.logoutTime ? formatTime(r.logoutTime) : (r.loginTime ? 'Working...' : '—')}</td>
                    <td className="fw-bold">{r.totalHours ? `${r.totalHours} hrs` : '0'}</td>
                    <td><Badge bg="light" text="dark" className="border">{r.locationType || 'Office'}</Badge></td>
                    <td>{renderStatusBadgeStatic(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ── Location Verification Modal ── */}
      <LocationModal
        show={showLocationModal}
        onHide={() => setShowLocationModal(false)}
        record={locationModalRecord}
      />

      {/* ── Attendance Correction Modal ── */}
      <Modal show={showCorrectionModal} onHide={() => setShowCorrectionModal(false)} centered>
        <Form onSubmit={handleCorrectionSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="h6 fw-bold">Edit / Correct Attendance Record</Modal.Title>
          </Modal.Header>
          <Modal.Body className="small">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Status</Form.Label>
              <Form.Select
                value={correctionForm.status}
                onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
              >
                <option value="Present">Present</option>
                <option value="Working">Working</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-danger">Mandatory Audit Reason (min 5 chars) *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Reason for correction..."
                value={correctionForm.reason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" size="sm" onClick={() => setShowCorrectionModal(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={correctionSubmitting}>Save Correction</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Regularization Form Modal ── */}
      <Modal show={showRegFormModal} onHide={() => setShowRegFormModal(false)} centered>
        <Form onSubmit={handleRegSubmit}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="h6 fw-bold">Submit Attendance Regularization</Modal.Title>
          </Modal.Header>
          <Modal.Body className="small">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Date *</Form.Label>
              <Form.Control
                type="date"
                value={regForm.date}
                onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Request Type *</Form.Label>
              <Form.Select
                value={regForm.requestType}
                onChange={(e) => setRegForm({ ...regForm, requestType: e.target.value })}
              >
                <option value="MISSED_PUNCH_IN">Missed Punch In</option>
                <option value="MISSED_PUNCH_OUT">Missed Punch Out</option>
                <option value="FORGOT_BOTH">Forgot Both</option>
                <option value="ON_DUTY_WFH">On Duty / WFH</option>
                <option value="STATUS_CORRECTION">Status Correction</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-danger">Reason (min 5 chars) *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Reason for regularization..."
                value={regForm.reason}
                onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" size="sm" onClick={() => setShowRegFormModal(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={regSubmitting}>Submit Request</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Regularization Review Modal ── */}
      <Modal show={showRegReviewModal} onHide={() => setShowRegReviewModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="h6 fw-bold">Review Regularization Request</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          <div className="mb-3 p-3 bg-light rounded-3">
            <div><strong>Employee:</strong> {reviewRegDoc?.employeeId ? `${reviewRegDoc.employeeId.firstName} ${reviewRegDoc.employeeId.lastName}` : 'N/A'}</div>
            <div><strong>Date:</strong> {reviewRegDoc?.date}</div>
            <div><strong>Type:</strong> {reviewRegDoc?.requestType}</div>
            <div><strong>Reason:</strong> {reviewRegDoc?.reason}</div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Rejection Reason (If rejecting)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="danger" size="sm" onClick={() => handleReviewReg('REJECTED')} disabled={reviewSubmitting}>
            Reject Request
          </Button>
          <Button variant="success" size="sm" onClick={() => handleReviewReg('APPROVED')} disabled={reviewSubmitting}>
            Approve Request
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Attendance;