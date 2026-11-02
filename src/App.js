import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BranchProvider } from './context/BranchContext';
import {
  selectIsAuthenticated,
  selectAuthNextAction,
  fetchAuth,
  clearAuth,
  logout,
} from './redux/slices/authSlice';
import { getAuthToken, clearAuthToken, setUnauthorizedHandler } from './config/api';
import { store } from './redux/store';
import Layout from './Layout/Layout';
import Login from './view/Login';
import ResetPassword from './view/ResetPassword';
import NetworkStatusListener from './Components/Common/NetworkStatusListener';

const NoNetworkPage = lazy(() => import('./Pages/Errors/NoNetworkPage'));
const ServerDownPage = lazy(() => import('./Pages/Errors/ServerDownPage'));

// Route-level code-splitting with React.lazy
const Dashboard = lazy(() => import('./Pages/Dashboard/Dashboard'));
const Organisation = lazy(() => import('./Pages/Dashboard/Organisation'));
const BranchesPage = lazy(() => import('./Pages/Dashboard/BranchesPage'));
const HrOnboarding = lazy(() => import('./Pages/Dashboard/HrOnboarding'));
const LeaveRequest = lazy(() => import('./Pages/Dashboard/LeaveRequest'));
const Mis = lazy(() => import('./Pages/Dashboard/Mis'));
const Payslip = lazy(() => import('./Pages/Dashboard/Payslip'));
const UserManagement = lazy(() => import('./Pages/Dashboard/UserManagement'));
const Attendance = lazy(() => import('./Pages/Dashboard/Attendance'));
const Epfo = lazy(() => import('./Pages/Dashboard/Epfo'));
const ProjectManagement = lazy(() => import('./Pages/Dashboard/ProjectManagement'));
const TasksPage = lazy(() => import('./Pages/Dashboard/TasksPage'));
const AssetManagement = lazy(() => import('./Pages/Dashboard/AssetManagement'));
const InitialSetupPage = lazy(() => import('./Pages/Dashboard/InitialSetupPage'));
const SubscriptionRenewalPage = lazy(() => import('./Pages/Dashboard/SubscriptionRenewalPage'));
const LifecycleManagement = lazy(() => import('./Pages/Dashboard/LifecycleManagement'));
const ReimbursementManagement = lazy(() => import('./Pages/Dashboard/ReimbursementManagement'));
const ApprovalWorkflows = lazy(() => import('./Pages/Dashboard/ApprovalWorkflows'));
const AuditLogs = lazy(() => import('./Pages/Dashboard/AuditLogs'));
const PlatformAdmin = lazy(() => import('./Pages/Dashboard/PlatformAdmin'));
const SettingsPage = lazy(() => import('./Pages/Dashboard/SettingsPage'));

const isAuthError = (payload) => {
  // 401 only — a 403 (AccessDenied with required* keys) must never bounce to
  // login. Legacy string payloads ('No token') still count as auth errors.
  if (typeof payload === 'string') return true;
  if (payload && typeof payload === 'object') {
    if (payload.status && payload.status !== 401) return false;
    const msg = payload.message;
    return (
      typeof msg === 'string' &&
      (msg.includes('User account not found') ||
        msg.includes('token') ||
        msg.includes('Authentication'))
    );
  }
  return false;
};

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const nextAction = useSelector(selectAuthNextAction);
  const [booted, setBooted] = useState(false);

  // Central runtime-401 recovery, registered once.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      try {
        const st = store.getState();
        if (!st.auth?.user && !getAuthToken()) return;
        dispatch(logout());
      } catch {
        // Recovery must never break the app shell.
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [dispatch]);

  // Boot: validate any stored token via Redux.
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        if (!getAuthToken()) {
          dispatch(clearAuth());
          return;
        }
        const result = await dispatch(fetchAuth());
        if (!cancelled && fetchAuth.rejected.match(result) && isAuthError(result.payload)) {
          clearAuthToken();
          try {
            ['isAuthenticated', 'user', 'tenantId', 'organizationId', 'selectedBranchId', 'cached_org_profile'].forEach((k) =>
              localStorage.removeItem(k)
            );
          } catch {
            // ignore storage errors
          }
          dispatch(clearAuth());
          window.location.href = '/login';
          return;
        }
      } finally {
        if (!cancelled) setBooted(true);
      }
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const handleLogin = () => {
    // Auth context loaded through Redux
  };

  // Helper to determine destination for authenticated user
  const getAuthenticatedRedirect = () => {
    if (nextAction === 'SETUP_ORGANIZATION') return '/setup';
    if (nextAction === 'RENEW_SUBSCRIPTION') return '/subscription-renewal';
    return '/dashboard';
  };

  // Boot splash only while initial token validation is outstanding.
  if (!booted) {
    return (
      <div
        className="app-boot-splash"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: '#77736B',
        }}
      >
        Loading HRMS…
      </div>
    );
  }

  return (
    <BranchProvider>
      <BrowserRouter>
        <NetworkStatusListener />
        <Routes>
          {/* Organization Setup Route */}
          <Route
            path="/setup"
            element={
              isAuthenticated ? (
                nextAction === 'RENEW_SUBSCRIPTION' ? (
                  <Navigate to="/subscription-renewal" replace />
                ) : (
                  <Suspense fallback={<div className="p-5 text-center text-muted">Loading setup...</div>}>
                    <InitialSetupPage />
                  </Suspense>
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Subscription Renewal Route */}
          <Route
            path="/subscription-renewal"
            element={
              isAuthenticated ? (
                <Suspense fallback={<div className="p-5 text-center text-muted">Loading renewal...</div>}>
                  <SubscriptionRenewalPage />
                </Suspense>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Public Login & Signup Routes - Always default for unauthenticated users */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={getAuthenticatedRedirect()} replace />
              ) : (
                <Login onLogin={() => handleLogin(true)} initialMode="signin" />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to={getAuthenticatedRedirect()} replace />
              ) : (
                <Login onLogin={() => handleLogin(true)} initialMode="signup" />
              )
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Dedicated Network & Server Error Pages (Publicly accessible) */}
          <Route
            path="/no-network"
            element={
              <Suspense fallback={<div className="p-5 text-center text-muted">Checking network status...</div>}>
                <NoNetworkPage />
              </Suspense>
            }
          />
          <Route path="/offline" element={<Navigate to="/no-network" replace />} />
          <Route
            path="/server-down"
            element={
              <Suspense fallback={<div className="p-5 text-center text-muted">Checking server health...</div>}>
                <ServerDownPage />
              </Suspense>
            }
          />
          <Route path="/server-error" element={<Navigate to="/server-down" replace />} />
          <Route path="/500" element={<Navigate to="/server-down" replace />} />

          {/* Protected Dashboard Routes */}
          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/organisation" element={<Organisation />} />
              <Route path="/organisation/branches" element={<BranchesPage />} />
              <Route path="/branches" element={<Navigate to="/organisation/branches" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/:subtab" element={<SettingsPage />} />
              <Route path="/organisation/settings" element={<Navigate to="/settings/organization" replace />} />
              <Route path="/organisation/branch-settings" element={<Navigate to="/settings/branches" replace />} />
              <Route path="/organisation/:section" element={<Organisation />} />
              <Route path="/onboarding" element={<HrOnboarding />} />
              <Route path="/leave" element={<LeaveRequest />} />
              <Route path="/mis" element={<Mis />} />
              <Route path="/payslip" element={<Payslip />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/roles" element={<UserManagement />} />
              <Route path="/assets" element={<AssetManagement />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/projects" element={<ProjectManagement />} />
              <Route path="/projects/tasks" element={<TasksPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/epfo" element={<Epfo />} />
              <Route path="/lifecycle" element={<LifecycleManagement />} />
              <Route path="/resignation" element={<LifecycleManagement />} />
              <Route path="/offboarding" element={<LifecycleManagement />} />
              <Route path="/reimbursement" element={<ReimbursementManagement />} />
              <Route path="/reimbursements" element={<ReimbursementManagement />} />
              <Route path="/approval-workflows" element={<ApprovalWorkflows />} />
              <Route path="/approvals" element={<ApprovalWorkflows />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/platform" element={<PlatformAdmin />} />
              <Route path="/platform/*" element={<PlatformAdmin />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </BrowserRouter>
    </BranchProvider>
  );
}

export default App;
