import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BranchProvider } from './context/BranchContext';
import {
  selectIsAuthenticated,
  fetchAuth,
  clearAuth,
} from './redux/slices/authSlice';
import { getAuthToken, clearAuthToken } from './config/api';
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
import AssetManagement from './Pages/Dashboard/AssetManagement';
import InitialSetupPage from './Pages/Dashboard/InitialSetupPage';
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
    try {
      localStorage.setItem('isAuthenticated', 'true');
    } catch {
      // ignore storage errors — route gating comes from Redux selector
    }
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

          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : setupRequired === true ? (
                <Navigate to="/setup" replace />
              ) : (
                <Login onLogin={() => handleLogin(true)} />
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
              <Route path="/epfo" element={<Epfo />} />
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
