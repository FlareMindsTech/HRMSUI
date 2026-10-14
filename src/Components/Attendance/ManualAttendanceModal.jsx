  import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaUserCheck, FaExclamationTriangle, FaInfoCircle, FaCalendarAlt, FaBuilding, FaUser } from 'react-icons/fa';
import {
  fetchManualAttendanceOptions,
  fetchManualAttendanceEmployees,
  postManualAttendanceOverride,
} from '../../Api/Attendance/attendance';

export default function ManualAttendanceModal({ show, onHide, onSuccess }) {
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Form states
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [loginTimeStr, setLoginTimeStr] = useState('09:30');
  const [logoutTimeStr, setLogoutTimeStr] = useState('18:00');
  const [reason, setReason] = useState('');

  // Conflict & submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [conflictData, setConflictData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const todayDateString = new Date().toISOString().split('T')[0];

  // Load options when modal opens
  useEffect(() => {
    if (!show) {
      resetForm();
      return;
    }

    let isMounted = true;
    async function loadOptions() {
      setLoadingOptions(true);
      setErrorMsg('');
      try {
        const res = await fetchManualAttendanceOptions();
        if (isMounted && res?.data) {
          const branchList = res.data.branches || [];
          setBranches(branchList);
          if (branchList.length === 1) {
            setSelectedBranchId(branchList[0]._id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load authorized branches.');
        }
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [show]);

  // Load employees when branch changes
  useEffect(() => {
    if (!selectedBranchId) {
      setEmployees([]);
      setSelectedUserId('');
      return;
    }

    let isMounted = true;
    async function loadBranchEmployees() {
      setLoadingEmployees(true);
      try {
        const res = await fetchManualAttendanceEmployees(selectedBranchId);
        if (isMounted && res?.data) {
          const empList = Array.isArray(res.data) ? res.data : [];
          setEmployees(empList);
          if (empList.length === 1) {
            setSelectedUserId(empList[0]._id);
          } else {
            setSelectedUserId('');
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load employees for the selected branch.');
        }
      } finally {
        if (isMounted) setLoadingEmployees(false);
      }
    }

    loadBranchEmployees();
    return () => {
      isMounted = false;
    };
  }, [selectedBranchId]);

  const resetForm = () => {
    setSelectedBranchId('');
    setSelectedUserId('');
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setAttendanceStatus('Present');
    setLoginTimeStr('09:30');
    setLogoutTimeStr('18:00');
    setReason('');
    setErrorMsg('');
    setConflictData(null);
    setShowConfirmation(false);
  };

  const isNonWorking = attendanceStatus === 'Leave' || attendanceStatus === 'Absent';

  const validateForm = () => {
    if (!selectedBranchId) {
      setErrorMsg('Please select an authorized branch.');
      return false;
    }
    if (!selectedUserId) {
      setErrorMsg('Please select an employee.');
      return false;
    }
    if (!attendanceDate) {
      setErrorMsg('Attendance date is required.');
      return false;
    }
    if (attendanceDate > todayDateString) {
      setErrorMsg('Cannot record manual attendance for future dates.');
      return false;
    }
    if (!reason || reason.trim().length < 5) {
      setErrorMsg('A valid reason of at least 5 characters is required.');
      return false;
    }

    if (!isNonWorking) {
      if (!loginTimeStr) {
        setErrorMsg('Punch-in time is required for working attendance.');
        return false;
      }
      if (attendanceStatus !== 'Working' && !logoutTimeStr) {
        setErrorMsg('Punch-out time is required unless attendance is currently in-progress.');
        return false;
      }
      if (loginTimeStr && logoutTimeStr && logoutTimeStr < loginTimeStr) {
        setErrorMsg('Punch-out time must be after punch-in time.');
        return false;
      }
    }

    return true;
  };

  const buildPayload = (allowOverwrite = false) => {
    const payload = {
      userId: selectedUserId,
      branchId: selectedBranchId,
      date: attendanceDate,
      status: attendanceStatus,
      locationType: 'Office',
      reason: reason.trim(),
      allowOverwrite,
    };

    if (isNonWorking) {
      payload.loginTime = null;
      payload.logoutTime = null;
    } else {
      if (loginTimeStr) {
        payload.loginTime = `${attendanceDate}T${loginTimeStr.length === 5 ? loginTimeStr + ':00' : loginTimeStr}`;
      }
      if (logoutTimeStr) {
        payload.logoutTime = `${attendanceDate}T${logoutTimeStr.length === 5 ? logoutTimeStr + ':00' : logoutTimeStr}`;
      }
    }

    return payload;
  };

  const handleInitialSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setConflictData(null);

    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleExecuteSave = async (forceOverwrite = false) => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = buildPayload(forceOverwrite);
      const res = await postManualAttendanceOverride(payload);

      if (res?.success) {
        if (onSuccess) {
          onSuccess(res.message || 'Manual attendance recorded successfully.');
        }
        onHide();
      }
    } catch (err) {
      if (err.status === 409) {
        setShowConfirmation(false);
        setConflictData({
          message: err.message || 'An attendance record already exists for this date.',
          details: err.data?.existingRecord || null,
        });
      } else {
        setErrorMsg(err.message || 'Failed to record manual attendance.');
        setShowConfirmation(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmpObj = employees.find((e) => e._id === selectedUserId);
  const selectedBranchObj = branches.find((b) => b._id === selectedBranchId);

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
          <FaUserCheck className="text-success" />
          Manual Attendance Entry by Branch Head
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 small">
        <p className="text-muted extra-small mb-3">
          Record authorized attendance for employees within your permitted branch without requiring device location geofence verification.
          Every manual entry is logged with complete audit trail and marked as <code>MANUAL</code>.
        </p>

        {loadingOptions ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" variant="primary" />
            <div className="text-muted mt-2 extra-small">Loading authorized branches...</div>
          </div>
        ) : branches.length === 0 ? (
          <Alert variant="warning" className="small d-flex align-items-center gap-2">
            <FaExclamationTriangle />
            <span>You are not designated as Head or authorized manager for any active branches.</span>
          </Alert>
        ) : (
          <Form onSubmit={handleInitialSubmit}>
            {errorMsg && (
              <Alert variant="danger" dismissible onClose={() => setErrorMsg('')} className="py-2 px-3 extra-small">
                {errorMsg}
              </Alert>
            )}

            {conflictData && (
              <Alert variant="warning" className="py-2 px-3 small">
                <div className="d-flex align-items-center gap-2 fw-bold text-dark mb-1">
                  <FaExclamationTriangle className="text-warning" />
                  Duplicate Record Conflict Detected
                </div>
                <div className="extra-small text-secondary mb-2">{conflictData.message}</div>
                <div className="d-flex justify-content-end gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => setConflictData(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleExecuteSave(true)}
                  >
                    {submitting ? <Spinner size="sm" animation="border" /> : 'Confirm & Overwrite Existing Record'}
                  </Button>
                </div>
              </Alert>
            )}

            {showConfirmation && (
              <Alert variant="info" className="py-3 px-3 small border-0 bg-info-subtle">
                <div className="fw-bold mb-2 d-flex align-items-center gap-1.5 text-primary">
                  <FaInfoCircle /> Confirm Manual Attendance Entry
                </div>
                <div className="extra-small text-dark mb-3">
                  <div><strong>Employee:</strong> {selectedEmpObj?.firstName} {selectedEmpObj?.lastName} ({selectedEmpObj?.employeeCode || 'N/A'})</div>
                  <div><strong>Branch:</strong> {selectedBranchObj?.branchName}</div>
                  <div><strong>Date:</strong> {attendanceDate}</div>
                  <div><strong>Status:</strong> <Badge bg="primary">{attendanceStatus}</Badge></div>
                  {!isNonWorking && (
                    <div><strong>Hours:</strong> {loginTimeStr} to {logoutTimeStr || 'In-Progress'}</div>
                  )}
                  <div><strong>Reason:</strong> {reason}</div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <Button variant="light" size="sm" onClick={() => setShowConfirmation(false)}>
                    Back to Edit
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleExecuteSave(false)}
                  >
                    {submitting ? <Spinner size="sm" animation="border" /> : 'Confirm & Record Attendance'}
                  </Button>
                </div>
              </Alert>
            )}

            {!showConfirmation && !conflictData && (
              <>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group controlId="manualBranchSelect">
                      <Form.Label className="fw-semibold">
                        <FaBuilding className="me-1 text-muted" /> Authorized Branch *
                      </Form.Label>
                      <Form.Select
                        size="sm"
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        required
                      >
                        <option value="">Select Branch...</option>
                        {branches.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.branchName} ({b.branchCode})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="manualEmployeeSelect">
                      <Form.Label className="fw-semibold">
                        <FaUser className="me-1 text-muted" /> Employee *
                      </Form.Label>
                      <Form.Select
                        size="sm"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        disabled={!selectedBranchId || loadingEmployees}
                        required
                      >
                        <option value="">
                          {loadingEmployees ? 'Loading branch employees...' : selectedBranchId ? 'Select Employee...' : 'Select Branch first'}
                        </option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ''} - {emp.designation || 'Staff'}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group controlId="manualDateInput">
                      <Form.Label className="fw-semibold">
                        <FaCalendarAlt className="me-1 text-muted" /> Attendance Date *
                      </Form.Label>
                      <Form.Control
                        type="date"
                        size="sm"
                        max={todayDateString}
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="manualStatusSelect">
                      <Form.Label className="fw-semibold">Attendance Status *</Form.Label>
                      <Form.Select
                        size="sm"
                        value={attendanceStatus}
                        onChange={(e) => setAttendanceStatus(e.target.value)}
                      >
                        <option value="Present">Present</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Late">Late</option>
                        <option value="Working">Working (In-Progress)</option>
                        <option value="Absent">Absent</option>
                        <option value="Leave">Leave</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {!isNonWorking && (
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group controlId="manualLoginTime">
                        <Form.Label className="fw-semibold">Punch-in Time *</Form.Label>
                        <Form.Control
                          type="time"
                          size="sm"
                          value={loginTimeStr}
                          onChange={(e) => setLoginTimeStr(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="manualLogoutTime">
                        <Form.Label className="fw-semibold">
                          Punch-out Time {attendanceStatus === 'Working' ? '(Optional)' : '*'}
                        </Form.Label>
                        <Form.Control
                          type="time"
                          size="sm"
                          value={logoutTimeStr}
                          onChange={(e) => setLogoutTimeStr(e.target.value)}
                          required={attendanceStatus !== 'Working'}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <Form.Group className="mb-3" controlId="manualReasonInput">
                  <Form.Label className="fw-semibold">Reason for Manual Entry *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    size="sm"
                    placeholder="Enter business reason (e.g., On-duty client visit, manual attendance regularized by branch head, biometric sync issue)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted extra-small">
                    Minimum 5 characters. This reason is preserved in the permanent audit history.
                  </Form.Text>
                </Form.Group>
              </>
            )}

            {!showConfirmation && !conflictData && (
              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <Button variant="light" size="sm" onClick={onHide} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submitting || !selectedUserId || !selectedBranchId}
                  className="px-3"
                >
                  Review & Save Attendance
                </Button>
              </div>
            )}
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
