import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BranchProvider } from './context/BranchContext';
import {
  selectIsAuthenticated,
  fetchAuth,
  clearAuth,
  logout,
} from './redux/slices/authSlice';
import { getAuthToken, clearAuthToken, setUnauthorizedHandler } from './config/api';
import { store } from './redux/store';
import Layout from './Layout/Layout';
import Dashboard from './Pages/Dashboard/Dashboard';
import Organisation from './Pages/Dashboard/Organisation';
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
import LifecycleManagement from './Pages/Dashboard/LifecycleManagement';
import ReimbursementManagement from './Pages/Dashboard/ReimbursementManagement';
import ApprovalWorkflows from './Pages/Dashboard/ApprovalWorkflows';
import AuditLogs from './Pages/Dashboard/AuditLogs';
import PlatformAdmin from './Pages/Dashboard/PlatformAdmin';
import { fetchSystemSetupStatus } from './services/organizationService';

const isAuthError = (msg) =>
  typeof msg === 'string' &&
  (msg.includes('User account not found') ||
    msg.includes('token') ||
    msg.includes('Authentication'));

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [booted, setBooted] = useState(false);
  const [setupRequired, setSetupRequired] = useState(null);

  // Central runtime-401 recovery, registered once. Any authenticated API
  // call that comes back 401 (expired/revoked token mid-session) funnels
  // through the EXISTING logout flow: the thunk clears the session
  // synchronously and logout.pending flips the route gate to /login
  // declaratively — no reload, no per-page handling needed. Single-flight
  // holds at two levels: apiFetch notifies only once per expiry episode,
  // and the state re-check below collapses any residual duplicates (logout
  // itself is idempotent, so even a double dispatch is harmless).
  // Auth-owned paths (/auth/login, /auth/me, /user/logout) and token-less
  // requests never notify — boot owns /auth/me explicitly and Login owns
  // its own 401 messaging.
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

  // Boot: validate any stored token via Redux (replaces AuthContext.loadAuthContext).
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

  // Check setup requirement on startup (from main).
  useEffect(() => {
    fetchSystemSetupStatus()
      .then((status) => {
        if (status?.setupRequired && !status?.ownerExists) {
          setSetupRequired(true);
        } else {
          setSetupRequired(false);
        }
      })
      .catch(() => setSetupRequired(false));
  }, []);

  const handleLogin = () => {
    // Route gating comes from the Redux selector (user + token); the legacy
    // localStorage sentinel is no longer written (reads of it remain only
    // where the initial Redux state hydrates, and cleanup lists still remove
    // it for existing installs).
  };

  // Boot splash only while the initial token validation is outstanding.
  // Background refreshes (e.g. the post-login fetchAuth that loads
  // menus/permissions) must NOT unmount the app back to a splash screen —
  // that was the main perceived "login is slow" delay.
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
          {/* Standalone One-Time Setup Route */}
          <Route path="/setup" element={<InitialSetupPage />} />

          {/* Public Login & Signup Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : setupRequired === true ? (
                <Navigate to="/setup" replace />
              ) : (
                <Login onLogin={() => handleLogin(true)} initialMode="signin" />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : setupRequired === true ? (
                <Navigate to="/setup" replace />
              ) : (
                <Login onLogin={() => handleLogin(true)} initialMode="signup" />
              )
            }
          />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/organisation" element={<Organisation />} />
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
            <Route
              path="*"
              element={
                setupRequired === true ? (
                  <Navigate to="/setup" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          )}
        </Routes>
      </BrowserRouter>
    </BranchProvider>
  );
}

export default App;
