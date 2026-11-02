import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdWifiOff,
  MdRefresh,
  MdArrowBack,
  MdCheckCircle,
  MdErrorOutline,
  MdDns,
  MdSignalCellularConnectedNoInternet0Bar,
  MdFlight,
  MdRouter,
} from 'react-icons/md';
import { FaHeartbeat } from 'react-icons/fa';
import './NoNetworkPage.css';

export default function NoNetworkPage() {
  const navigate = useNavigate();
  const [, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // 'success' | 'failed'
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Active ping test
  const checkConnection = useCallback(async () => {
    setChecking(true);
    setCheckResult(null);

    try {
      // Ping with cache busting
      const testUrl = `https://www.google.com/favicon.ico?_ping=${Date.now()}`;
      await fetch(testUrl, { mode: 'no-cors', cache: 'no-store' });

      // If fetch succeeded or resolved in no-cors
      setIsOnline(true);
      setCheckResult('success');
      setAutoRedirecting(true);

      setTimeout(() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      // Still offline
      setIsOnline(false);
      setCheckResult('failed');
    } finally {
      setChecking(false);
    }
  }, [navigate]);

  // Window online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setCheckResult('success');
      setAutoRedirecting(true);
      setTimeout(() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setCheckResult('failed');
      setAutoRedirecting(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [navigate]);

  // Automatic countdown polling every 10s
  useEffect(() => {
    if (autoRedirecting) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          checkConnection();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirecting, checkConnection]);

  const handleManualBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="th-error-page-wrapper">
      <div className="th-error-card">
        {/* Animated Badge & Signal Graphic */}
        <div className="th-error-icon-container">
          <div className="th-error-icon-ring" />
          <div className="th-error-icon-ring-outer" />
          <div className="th-error-icon-circle">
            <MdWifiOff className="th-error-svg" />
          </div>
        </div>

        {/* Status Chip */}
        <div className="th-error-status-badge">
          <span className="th-status-dot-offline" />
          {autoRedirecting ? 'Connection Restored' : 'No Internet Connection'}
        </div>

        {/* Friendly Heading & Description */}
        <h1 className="th-error-title">You're Off the Grid!</h1>
        <p className="th-error-subtitle">
          It looks like your device lost its internet connection. Don't worry — your current session
          and unsaved work are safely held on your device.
        </p>

        {/* Live Feedback Pill if testing */}
        {checkResult === 'failed' && (
          <div className="th-error-alert th-alert-warning">
            <MdErrorOutline size={18} />
            <span>Still offline. Please check your Wi-Fi or mobile hotspot.</span>
          </div>
        )}
        {checkResult === 'success' && (
          <div className="th-error-alert th-alert-success">
            <MdCheckCircle size={18} />
            <span>Connection verified! Bringing you back to your workspace...</span>
          </div>
        )}

        {/* Quick Troubleshooting Checklist */}
        <div className="th-troubleshoot-box">
          <h4 className="th-troubleshoot-header">Quick Friendly Checklist:</h4>
          <ul className="th-troubleshoot-list">
            <li>
              <MdRouter className="th-tb-icon" />
              <span>Verify that your Wi-Fi router or Ethernet cable is plugged in.</span>
            </li>
            <li>
              <MdFlight className="th-tb-icon" />
              <span>Ensure Airplane Mode isn't accidentally turned on.</span>
            </li>
            <li>
              <MdSignalCellularConnectedNoInternet0Bar className="th-tb-icon" />
              <span>If you're using mobile data or VPN, try reconnecting it.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons (Unified design system) */}
        <div className="th-error-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={checkConnection}
            disabled={checking || autoRedirecting}
          >
            <MdRefresh className={checking ? 'th-spin' : ''} size={18} />
            {checking ? 'Testing Connection...' : 'Try Connecting Now'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleManualBack}
          >
            <MdArrowBack size={16} />
            Go Back
          </button>
        </div>

        {/* Auto Polling Timer Footer */}
        <div className="th-auto-retry-note">
          <FaHeartbeat className="th-pulse-icon" />
          <span>
            {autoRedirecting
              ? 'Redirecting in a moment...'
              : `Auto-checking connection in ${countdown}s...`}
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
            {showDiagnostics ? 'Hide Network Diagnostics' : 'Show Network Diagnostics'}
          </button>
        </div>

        {showDiagnostics && (
          <div className="th-diagnostics-panel">
            <div className="th-diag-row">
              <span className="th-diag-label">Navigator Online State:</span>
              <span className="th-diag-val">{String(navigator.onLine)}</span>
            </div>
            <div className="th-diag-row">
              <span className="th-diag-label">Client Timestamp:</span>
              <span className="th-diag-val">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="th-diag-row">
              <span className="th-diag-label">Network Type:</span>
              <span className="th-diag-val">
                {navigator.connection ? navigator.connection.effectiveType || navigator.connection.type || 'Unknown' : 'Standard Web API'}
              </span>
            </div>
            <div className="th-diag-row">
              <span className="th-diag-label">Error Code:</span>
              <span className="th-diag-val">ERR_INTERNET_DISCONNECTED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

