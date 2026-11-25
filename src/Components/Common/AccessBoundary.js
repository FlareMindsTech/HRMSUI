import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectAuthUser,
  selectAuthMenus,
  selectAuthPermissions,
  selectAuthStatus,
} from '../../redux/slices/authSlice';
import {
  buildAccessContext,
  getRouteAccess,
  getFirstAccessiblePath,
} from '../../config/accessRules';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route-level authorization wrapper.
 *
 * Menus/permissions are loaded asynchronously after login via /auth/me. While
 * that context is unresolved we render a loader instead of redirecting, which
 * avoids bouncing legitimate users to a wrong landing page (or into a loop).
 */
export default function AccessBoundary({ children }) {
  const location = useLocation();
  const user = useSelector(selectAuthUser);
  const menus = useSelector(selectAuthMenus);
  const permissions = useSelector(selectAuthPermissions);
  const status = useSelector(selectAuthStatus);
  const hasAccessData = menus.length > 0 || permissions.length > 0;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (status === 'loading' || (status !== 'succeeded' && !hasAccessData)) {
    return (
      <div
        className="d-flex align-items-center justify-content-center vh-100"
        style={{ background: 'var(--ink-bg-canvas, #f5f5f3)' }}
      >
        <LoadingSpinner variant="page" message="Loading your workspace…" />
      </div>
    );
  }

  const access = buildAccessContext(user, menus, permissions);
  const { allowed } = getRouteAccess(location.pathname, access);

  if (allowed) return children;

  const landingPath = getFirstAccessiblePath(access);
  const current = `${location.pathname}${location.search}`;
  if (landingPath && landingPath !== current) {
    return <Navigate to={landingPath} replace />;
  }

  // No accessible module at all: never bounce back into the same URL forever.
  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="text-center">
        <h5 className="fw-bold mb-2">No workspace modules assigned</h5>
        <p className="text-muted small mb-0">
          Your account has no accessible modules. Please contact your administrator.
        </p>
      </div>
    </div>
  );
}
