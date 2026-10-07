import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form } from 'react-bootstrap';
import { FaUmbrellaBeach, FaCheckCircle, FaTimesCircle, FaCalendarAlt } from 'react-icons/fa';
import EmptyState from '../../Components/Common/EmptyState';
import LoadingSpinner from '../../Components/Common/LoadingSpinner';
import FeedbackAlert from '../../Components/Common/FeedbackAlert';
import {
  fetchOptionalHolidayCatalog,
  fetchMyOptionalHolidayOptIns,
  optInOptionalHoliday,
  optOutOptionalHoliday,
  formatAttendanceError,
} from '../../Api/Attendance/attendance';

// Format a "YYYY-MM-DD" date string without timezone drift (new Date("YYYY-MM-DD")
// is parsed as UTC midnight and can render the previous day in negative offsets).
const formatOptionalHolidayDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const optInStatusBadge = (status) => {
  switch (status) {
    case 'OPTED_IN':
      return <Badge bg="success-subtle" text="success">Opted In</Badge>;
    case 'CANCELLED':
      return <Badge bg="warning-subtle" text="warning">Cancelled</Badge>;
    default:
      return <Badge bg="secondary-subtle" text="dark">Available</Badge>;
  }
};

function OptionalHolidays() {
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [myOptIns, setMyOptIns] = useState([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myError, setMyError] = useState('');

  const [actionHolidayId, setActionHolidayId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [yearFilter, setYearFilter] = useState('');

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const res = await fetchOptionalHolidayCatalog(yearFilter ? { year: yearFilter } : {});
      setCatalog(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setCatalogError(formatAttendanceError(err));
      setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [yearFilter]);

  const loadMyOptIns = useCallback(async () => {
    setMyLoading(true);
    setMyError('');
    try {
      const res = await fetchMyOptionalHolidayOptIns(yearFilter ? { year: yearFilter } : {});
      setMyOptIns(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setMyError(formatAttendanceError(err));
      setMyOptIns([]);
    } finally {
      setMyLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => {
    loadCatalog();
    loadMyOptIns();
  }, [loadCatalog, loadMyOptIns]);

  const handleOptIn = async (holidayId) => {
    setActionHolidayId(holidayId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await optInOptionalHoliday(holidayId);
      setActionSuccess(res?.message || 'Successfully opted into the optional holiday.');
      await Promise.all([loadCatalog(), loadMyOptIns()]);
    } catch (err) {
      setActionError(formatAttendanceError(err));
    } finally {
      setActionHolidayId(null);
    }
  };

  const handleOptOut = async (holidayId) => {
    setActionHolidayId(holidayId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await optOutOptionalHoliday(holidayId);
      setActionSuccess(res?.message || 'Successfully opted out of the optional holiday.');
      await Promise.all([loadCatalog(), loadMyOptIns()]);
    } catch (err) {
      setActionError(formatAttendanceError(err));
    } finally {
      setActionHolidayId(null);
    }
  };

  return (
    <div>
      {/* ── Feedback ── */}
      <FeedbackAlert variant="success" dismissible message={actionSuccess} onClose={() => setActionSuccess('')} />
      <FeedbackAlert variant="danger" dismissible message={actionError} onClose={() => setActionError('')} />

      {/* ── Year Filter ── */}
      <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
        <Row className="g-2 align-items-center">
          <Col xs="auto">
            <Form.Label className="mb-0 small fw-bold text-muted">Year</Form.Label>
          </Col>
          <Col xs={4} md={2}>
            <Form.Control
              size="sm"
              type="number"
              placeholder={String(new Date().getFullYear())}
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* ── Optional Holiday Catalog ── */}
      <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
        <h6 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
          <FaUmbrellaBeach /> Optional Holiday Catalog
        </h6>

        {catalogLoading ? (
          <LoadingSpinner variant="page" message="Loading optional holidays..." />
        ) : catalogError ? (
          <FeedbackAlert variant="danger" message={catalogError} />
        ) : catalog.length === 0 ? (
          <EmptyState
            icon={FaCalendarAlt}
            iconSize={32}
            iconClassName="text-muted mb-2"
            title="No optional holidays available"
            description="There are no optional holidays configured for your organization/branch yet, or all have passed."
          />
        ) : (
          <Table hover responsive className="align-middle small">
            <thead className="bg-light">
              <tr>
                <th>Holiday</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((h) => (
                <tr key={h.holidayId}>
                  <td className="fw-bold">{h.holidayName || h.title}</td>
                  <td>{formatOptionalHolidayDate(h.date)}</td>
                  <td>
                    <Badge bg="info-subtle" text="info">{h.holidayType || 'OPTIONAL'}</Badge>
                  </td>
                  <td>{optInStatusBadge(h.optInStatus)}</td>
                  <td className="text-end">
                    {h.optInStatus === 'OPTED_IN' ? (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={!h.canOptOut || actionHolidayId === h.holidayId}
                        onClick={() => handleOptOut(h.holidayId)}
                      >
                        <FaTimesCircle className="me-1" />
                        {actionHolidayId === h.holidayId ? 'Working...' : 'Opt Out'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-success"
                        disabled={!h.canOptIn || actionHolidayId === h.holidayId}
                        onClick={() => handleOptIn(h.holidayId)}
                      >
                        <FaCheckCircle className="me-1" />
                        {actionHolidayId === h.holidayId ? 'Working...' : 'Opt In'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ── My Optional Holidays ── */}
      <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
        <h6 className="fw-bold mb-3 text-success d-flex align-items-center gap-2">
          <FaCheckCircle /> My Optional Holidays
        </h6>

        {myLoading ? (
          <LoadingSpinner variant="page" message="Loading your optional holidays..." />
        ) : myError ? (
          <FeedbackAlert variant="danger" message={myError} />
        ) : myOptIns.length === 0 ? (
          <EmptyState
            icon={FaCalendarAlt}
            iconSize={32}
            iconClassName="text-muted mb-2"
            title="No optional holiday opt-ins yet"
            description="Opt into an optional holiday from the catalog above to see it here."
          />
        ) : (
          <Table hover responsive className="align-middle small">
            <thead className="bg-light">
              <tr>
                <th>Holiday</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Opted In At</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {myOptIns.map((rec) => {
                const holiday = rec.holidayId && typeof rec.holidayId === 'object' ? rec.holidayId : {};
                const canOptOut = rec.status === 'OPTED_IN' && holiday?.date && holiday.date >= new Date().toISOString().slice(0, 10);
                return (
                  <tr key={rec._id}>
                    <td className="fw-bold">{holiday.holidayName || holiday.title || '—'}</td>
                    <td>{formatOptionalHolidayDate(rec.date)}</td>
                    <td>
                      <Badge bg="info-subtle" text="info">{holiday.holidayType || 'OPTIONAL'}</Badge>
                    </td>
                    <td>{optInStatusBadge(rec.status)}</td>
                    <td className="text-muted">
                      {rec.optedInAt ? new Date(rec.optedInAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="text-end">
                      {rec.status === 'OPTED_IN' && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={!canOptOut || actionHolidayId === rec.holidayId?._id}
                          onClick={() => handleOptOut(rec.holidayId?._id)}
                        >
                          <FaTimesCircle className="me-1" />
                          {actionHolidayId === rec.holidayId?._id ? 'Working...' : 'Opt Out'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default OptionalHolidays;
