import React, { useState } from 'react';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import {
  FaCrown,
  FaExclamationTriangle,
  FaSyncAlt,
  FaSignOutAlt,
  FaHeadset,
  FaEnvelope,
  FaPhoneAlt,
  FaCalendarAlt,
  FaBuilding,
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAuth, logout, selectAuthUser, selectAuthSubscription } from '../../redux/slices/authSlice';
import './Organisation.css';

export default function SubscriptionRenewalPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const subscription = useSelector(selectAuthSubscription);

  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setFeedback({ type: '', message: '' });
      const result = await dispatch(fetchAuth({ force: true }));
      if (fetchAuth.fulfilled.match(result)) {
        const nextAction = result.payload?.nextAction;
        if (nextAction === 'OPEN_DASHBOARD') {
          navigate('/dashboard', { replace: true });
        } else {
          setFeedback({
            type: 'info',
            message: 'Subscription is still pending renewal. Please contact your organization administrator or support.',
          });
        }
      } else {
        setFeedback({
          type: 'danger',
          message: result.payload?.message || 'Unable to refresh subscription status. Please try again.',
        });
      }
    } catch (e) {
      setFeedback({ type: 'danger', message: 'Network error refreshing status.' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const orgName =
    user?.organizationName ||
    user?.organization?.organizationName ||
    user?.tenant?.organizationName ||
    'Your Organization';

  const planName = subscription?.planName || subscription?.plan?.planName || 'Enterprise SaaS License';
  const expiryDate = subscription?.currentPeriodEnd || subscription?.endDate || 'Expired / Pending';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#000906',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 0)',
        backgroundSize: '16px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#FEFDF2',
      }}
    >
      <Card
        style={{
          width: '680px',
          maxWidth: '96vw',
          borderRadius: '18px',
          border: '1px solid rgba(199, 157, 88, 0.25)',
          background: 'linear-gradient(145deg, #1C1D1D 0%, #001A12 60%, #002E28 100%)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          padding: '32px',
          color: '#FEFDF2',
        }}
      >
        {/* Header with Icon */}
        <div className="text-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'rgba(232, 163, 61, 0.15)',
              border: '1px solid rgba(232, 163, 61, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E8A33D',
              fontSize: '26px',
            }}
          >
            <FaCrown />
          </div>

          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <h3 className="fw-bold mb-0 text-white" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              Subscription Renewal Required
            </h3>
            <Badge bg="warning" text="dark" className="fw-bold px-2 py-1">
              Renewal Pending
            </Badge>
          </div>

          <p className="text-muted small mx-auto mb-0" style={{ maxWidth: 520, lineHeight: 1.5 }}>
            Access to HRMS workspace features for <strong>{orgName}</strong> requires an active subscription.
            Please renew your organization plan or reach out to your administrator to restore access.
          </p>
        </div>

        {/* Feedback Message */}
        {feedback.message && (
          <div
            className={`alert alert-${feedback.type === 'danger' ? 'danger' : 'info'} py-2 px-3 small d-flex align-items-center gap-2 mb-3`}
            role="alert"
          >
            <FaExclamationTriangle />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current Plan Overview Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <Row className="g-3">
            <Col sm={6}>
              <div className="text-muted extra-small text-uppercase fw-bold mb-1">Organization</div>
              <div className="fw-semibold text-white d-flex align-items-center gap-2">
                <FaBuilding className="text-warning" size={14} />
                <span>{orgName}</span>
              </div>
            </Col>

            <Col sm={6}>
              <div className="text-muted extra-small text-uppercase fw-bold mb-1">Plan Tier</div>
              <div className="fw-semibold text-white d-flex align-items-center gap-2">
                <FaCrown className="text-warning" size={14} />
                <span>{planName}</span>
              </div>
            </Col>

            <Col sm={6}>
              <div className="text-muted extra-small text-uppercase fw-bold mb-1">Subscription Status</div>
              <div>
                <span className="badge bg-danger bg-opacity-75 text-white">Expired / Renewal Due</span>
              </div>
            </Col>

            <Col sm={6}>
              <div className="text-muted extra-small text-uppercase fw-bold mb-1">Period Expiry</div>
              <div className="text-muted small d-flex align-items-center gap-1">
                <FaCalendarAlt size={12} className="text-warning" />
                <span>{expiryDate}</span>
              </div>
            </Col>
          </Row>
        </div>

        {/* Contact Administrator / Support Info */}
        <div
          style={{
            background: 'rgba(232, 163, 61, 0.08)',
            border: '1px dashed rgba(232, 163, 61, 0.35)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="fw-bold text-warning small d-flex align-items-center gap-2 mb-1">
            <FaHeadset /> Need Help with Subscription Renewal?
          </div>
          <p className="extra-small text-muted mb-2">
            To renew or upgrade your SaaS subscription tier, contact your HRMS platform representative or enterprise sales desk:
          </p>
          <div className="d-flex flex-wrap gap-3 small text-muted">
            <span className="d-flex align-items-center gap-1">
              <FaEnvelope className="text-warning" size={12} /> support@flaremindstech.com
            </span>
            <span className="d-flex align-items-center gap-1">
              <FaPhoneAlt className="text-warning" size={12} /> +91 (800) HRMS-HELP
            </span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="d-flex align-items-center justify-content-between gap-3 pt-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleLogout}
            className="d-flex align-items-center gap-2 text-white border-secondary"
            style={{ borderRadius: '8px', padding: '8px 16px' }}
          >
            <FaSignOutAlt /> Sign Out
          </Button>

          <Button
            variant="warning"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="d-flex align-items-center gap-2 fw-bold text-dark"
            style={{
              borderRadius: '8px',
              padding: '8px 20px',
              backgroundColor: '#C79D58',
              borderColor: '#C79D58',
            }}
          >
            {refreshing ? <Spinner animation="border" size="sm" /> : <FaSyncAlt />}
            <span>{refreshing ? 'Checking Status…' : 'Check / Refresh Status'}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
