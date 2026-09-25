import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [setupRequired, setSetupRequired] = useState(null);

  // Check setup requirement on startup
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

  const handleLogin = (status) => {
    setIsAuthenticated(status);
    localStorage.setItem('isAuthenticated', status);
  };

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
