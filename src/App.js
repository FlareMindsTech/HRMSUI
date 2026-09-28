import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BranchProvider } from './context/BranchContext';
import {
  selectIsAuthenticated,
  selectAuthStatus,
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

const isAuthError = (msg) =>
  typeof msg === 'string' &&
  (msg.includes('User account not found') ||
    msg.includes('token') ||
    msg.includes('Authentication'));

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authStatus = useSelector(selectAuthStatus);
  const [booted, setBooted] = useState(false);

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
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
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
    try {
      localStorage.setItem('isAuthenticated', 'true');
    } catch {
      // ignore storage errors — route gating comes from Redux selector
    }
  };

  // Don't flash login/dashboard while the stored token is being validated.
  if (!booted || authStatus === 'loading') {
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
          {/* Public Route */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => handleLogin(true)} />
            }
          />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/organisation" element={<Organisation />} />
              <Route path="/organisation/:section" element={<Organisation />} />
              <Route path="/leave" element={<LeaveRequest />} />
              <Route path="/onboarding" element={<HrOnboarding />} />
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
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </BrowserRouter>
    </BranchProvider>
  );
}

export default App;
