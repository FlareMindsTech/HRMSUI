import { useEffect, useState } from 'react';
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
import Dashboard from './Pages/Dashboard/Dashboard';
import Organisation from './Pages/Dashboard/Organisation';
import BranchesPage from './Pages/Dashboard/BranchesPage';
import HrOnboarding from './Pages/Dashboard/HrOnboarding';
import LeaveRequest from './Pages/Dashboard/LeaveRequest';
import Mis from './Pages/Dashboard/Mis';
import Payslip from './Pages/Dashboard/Payslip';
import UserManagement from './Pages/Dashboard/UserManagement';
import Attendance from './Pages/Dashboard/Attendance';
import Epfo from './Pages/Dashboard/Epfo';
import Login from './view/Login';
import ProjectManagement from './Pages/Dashboard/ProjectManagement';
import TasksPage from './Pages/Dashboard/TasksPage';
import AssetManagement from './Pages/Dashboard/AssetManagement';
import InitialSetupPage from './Pages/Dashboard/InitialSetupPage';
import SubscriptionRenewalPage from './Pages/Dashboard/SubscriptionRenewalPage';
import LifecycleManagement from './Pages/Dashboard/LifecycleManagement';
import ReimbursementManagement from './Pages/Dashboard/ReimbursementManagement';
import ApprovalWorkflows from './Pages/Dashboard/ApprovalWorkflows';
import AuditLogs from './Pages/Dashboard/AuditLogs';
import PlatformAdmin from './Pages/Dashboard/PlatformAdmin';

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
        <Routes>
          {/* Organization Setup Route */}
          <Route
            path="/setup"
            element={
              isAuthenticated ? (
                nextAction === 'RENEW_SUBSCRIPTION' ? (
                  <Navigate to="/subscription-renewal" replace />
                ) : (
                  <InitialSetupPage />
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
                <SubscriptionRenewalPage />
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

          {/* Protected Dashboard Routes */}
          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/organisation" element={<Organisation />} />
              <Route path="/organisation/branches" element={<BranchesPage />} />
              <Route path="/branches" element={<BranchesPage />} />
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
