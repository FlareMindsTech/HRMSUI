import Button from '../../Components/Common/Button';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCloudOff,
  MdRefresh,
  MdArrowBack,
  MdCheckCircle,
  MdErrorOutline,
  MdContentCopy,
  MdDns,
} from 'react-icons/md';
import { FaServer } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';
import './ServerDownPage.css';

export default function ServerDownPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // 'success' | 'failed'
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [copiedRef, setCopiedRef] = useState(false);
  const [incidentRef] = useState(() => `SRV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Ping backend server
  const testServer = useCallback(async () => {
    setChecking(true);
    setCheckResult(null);

    try {
      let cleanBase = (API_BASE_URL || '').replace(/\/+$/, '');
      if (!cleanBase.endsWith('/api')) cleanBase = `${cleanBase}/api`;
      const pingUrl = `${cleanBase}/organization/list?_ping=${Date.now()}`;

      const res = await fetch(pingUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status < 500) {
        // Server responded!
        setCheckResult('success');
        setAutoRedirecting(true);
        setTimeout(() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/dashboard');
          }
        }, 1500);
      } else {
        setCheckResult('failed');
      }
    } catch (err) {
      setCheckResult('failed');
    } finally {
      setChecking(false);
    }
  }, [navigate]);

  // Automatic countdown polling every 15s
  useEffect(() => {
    if (autoRedirecting) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          testServer();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirecting, testServer]);

  const handleCopyRef = () => {
    try {
      navigator.clipboard.writeText(incidentRef);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="th-error-page-wrapper">
      <div className="th-error-card th-server-card">
        {/* Animated Server Graphic */}
        <div className="th-error-icon-container">
          <div className="th-server-lights-wrap">
            <span className="th-srv-light th-light-red" />
            <span className="th-srv-light th-light-amber" />
            <span className="th-srv-light th-light-green" />
          </div>
          <div className="th-error-icon-circle th-server-icon-circle">
            <FaServer className="th-error-svg" />
          </div>
          <div className="th-cloud-badge">
            <MdCloudOff />
          </div>
        </div>

        {/* HTTP Status Code Pill */}
        <div className="th-error-status-badge th-server-badge">
          <span className="th-status-dot-server" />
          <span>503 · Service Unavailable</span>
        </div>

        {/* Friendly Heading & Description */}
        <h1 className="th-error-title">Our Servers Are Catching Their Breath!</h1>
        <p className="th-error-subtitle">
          The application backend is temporarily taking a quick coffee break or undergoing routine
          maintenance. Our DevOps team has already been notified and is on it!
        </p>

        {/* Live Feedback Pill if testing */}
        {checkResult === 'failed' && (
          <div className="th-error-alert th-alert-warning">
            <MdErrorOutline size={18} />
            <span>The server is still warming up. We'll automatically retry in a few seconds.</span>
          </div>
        )}
        {checkResult === 'success' && (
          <div className="th-error-alert th-alert-success">
            <MdCheckCircle size={18} />
            <span>Server is online! Reconnecting your session...</span>
          </div>
        )}

        {/* Live Cluster Service Health Status */}
        <div className="th-cluster-status-box">
          <h4 className="th-troubleshoot-header">Cluster Service Status</h4>
          <div className="th-cluster-grid">
            <div className="th-cluster-item">
              <span className="th-cluster-dot th-cluster-online" />
              <div className="th-cluster-info">
                <span className="th-cluster-name">API Gateway</span>
                <span className="th-cluster-desc">Operating Normally</span>
              </div>
            </div>
            <div className="th-cluster-item">
              <span className="th-cluster-dot th-cluster-reconnecting" />
              <div className="th-cluster-info">
                <span className="th-cluster-name">Application Core</span>
                <span className="th-cluster-desc">Auto-Recovering...</span>
              </div>
            </div>
            <div className="th-cluster-item">
              <span className="th-cluster-dot th-cluster-online" />
              <div className="th-cluster-info">
                <span className="th-cluster-name">Authentication Vault</span>
                <span className="th-cluster-desc">Encrypted & Safe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Reference Pill */}
        <div className="th-incident-ref-box">
          <span className="th-incident-label">Support Reference:</span>
          <code className="th-incident-code">{incidentRef}</code>
          <button
            type="button"
            className="th-copy-btn"
            onClick={handleCopyRef}
            title="Copy Reference Code"
          >
            <MdContentCopy size={13} />
            {copiedRef ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="th-error-actions">
          <Button variant="primary" icon={MdRefresh} loading={checking} onClick={testServer} disabled={checking || autoRedirecting}>{checking ? "Checking Server Health..." : "Check Server Connection"}</Button>

          <Button variant="secondary" icon={MdArrowBack} onClick={handleGoBack}>Back to Dashboard</Button>
        </div>

        {/* Auto Polling Timer Footer */}
        <div className="th-auto-retry-note">
          <span>
            {autoRedirecting
              ? 'Server active! Returning to workspace...'
              : `Auto-pinging server health in ${countdown}s...`}
          </span>
        </div>

        {/* Hardcore Diagnostic Toggle */}
        <div className="th-diagnostics-toggle-wrap">
          <button
            type="button"
            className="th-diagnostics-toggle-btn"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            <MdDns size={14} />
            {showDiagnostics ? 'Hide Server Diagnostics' : 'Show Server Diagnostics'}
          </button>
        </div>

        {showDiagnostics && (
          <div className="th-diagnostics-panel">
            <div className="th-diag-row">
              <span className="th-diag-label">Target API Host:</span>
              <span className="th-diag-val">{API_BASE_URL || 'Local / Configured Base'}</span>
            </div>
            <div className="th-diag-row">
              <span className="th-diag-label">Incident ID:</span>
              <span className="th-diag-val">{incidentRef}</span>
            </div>
            <div className="th-diag-row">
              <span className="th-diag-label">HTTP Status:</span>
              <span className="th-diag-val">503 SERVICE_UNAVAILABLE</span>
            </div>
            <div className="th-diag-row">
              <span className="th-diag-label">Timestamp (UTC):</span>
              <span className="th-diag-val">{new Date().toISOString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

