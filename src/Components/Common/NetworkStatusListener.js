import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdWifiOff, MdCheckCircle, MdDns, MdClose } from 'react-icons/md';
import './NetworkStatusListener.css';

export default function NetworkStatusListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const [serverErrorBanner, setServerErrorBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
      setDismissed(false);
    };

    const handleServerError = (e) => {
      setServerErrorBanner(e.detail || { message: 'Server is temporarily unreachable.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('teamhub:server-error', handleServerError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('teamhub:server-error', handleServerError);
    };
  }, []);

  // Do not show the floating banner if already on the dedicated error pages
  const isErrorRoute =
    location.pathname === '/offline' ||
    location.pathname === '/no-network' ||
    location.pathname === '/server-down' ||
    location.pathname === '/500';

  if (isErrorRoute) return null;

  if (showRestored) {
    return (
      <aside aria-label="Network status banner" className="th-net-banner th-net-restored animate-slide-down">
        <MdCheckCircle size={17} />
        <span>You are back online! Connection restored.</span>
      </aside>
    );
  }

  if (serverErrorBanner && !dismissed) {
    return (
      <aside aria-label="Server error notification" className="th-net-banner th-net-server-down animate-slide-down">
        <MdDns size={17} />
        <span>Server is temporarily unreachable. We are auto-reconnecting...</span>
        <button
          type="button"
          className="th-net-banner-action"
          onClick={() => navigate('/server-down')}
        >
          Check Status
        </button>
        <button
          type="button"
          className="th-net-banner-close"
          onClick={() => setServerErrorBanner(null)}
          aria-label="Dismiss banner"
        >
          <MdClose size={15} />
        </button>
      </aside>
    );
  }

  if (isOffline && !dismissed) {
    return (
      <aside aria-label="Offline notification banner" className="th-net-banner th-net-offline animate-slide-down">
        <MdWifiOff size={17} />
        <span>You are currently offline. Changes are preserved locally.</span>
        <button
          type="button"
          className="th-net-banner-action"
          onClick={() => navigate('/offline')}
        >
          Diagnose
        </button>
        <button
          type="button"
          className="th-net-banner-close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
        >
          <MdClose size={15} />
        </button>
      </aside>
    );
  }

  return null;
}

