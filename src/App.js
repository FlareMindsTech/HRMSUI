import { BrowserRouter, Routes, Route } from 'react-router-dom';
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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/organisation" element={<Organisation />} />
          <Route path="/onboarding" element={<HrOnboarding />} />
          <Route path="/leave" element={<LeaveRequest />} />
          <Route path="/mis" element={<Mis />} />
          <Route path="/payslip" element={<Payslip />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/epfo" element={<Epfo />} />
          {/* Add other routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
