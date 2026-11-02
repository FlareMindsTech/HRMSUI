import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardSkeleton from './pages/DashboardSkeleton';
import EmployeeListSkeleton from './pages/EmployeeListSkeleton';
import EmployeeProfileSkeleton from './pages/EmployeeProfileSkeleton';
import PayrollSkeleton from './pages/PayrollSkeleton';
import LeaveRequestsSkeleton from './pages/LeaveRequestsSkeleton';
import ProjectsSkeleton from './pages/ProjectsSkeleton';

const REGISTRY = {
  dashboard: DashboardSkeleton,
  employees: EmployeeListSkeleton,
  profile: EmployeeProfileSkeleton,
  payroll: PayrollSkeleton,
  leave: LeaveRequestsSkeleton,
  projects: ProjectsSkeleton,
};

function resolvePage(pathname) {
  if (!pathname || pathname === '/' || pathname.includes('dashboard')) return 'dashboard';
  if (pathname.includes('employees') || pathname.includes('users') || pathname.includes('onboarding') || pathname.includes('roles')) {
    return 'employees';
  }
  if (pathname.includes('profile')) return 'profile';
  if (pathname.includes('payroll') || pathname.includes('payslip') || pathname.includes('finance') || pathname.includes('reimbursement')) {
    return 'payroll';
  }
  if (pathname.includes('leave') || pathname.includes('requests')) return 'leave';
  if (pathname.includes('projects') || pathname.includes('tasks')) return 'projects';
  return 'dashboard';
}

export default function PageSkeleton({ page }) {
  const location = useLocation();
  const selectedKey = page || (location ? resolvePage(location.pathname) : 'dashboard');
  const Component = REGISTRY[selectedKey] || REGISTRY.dashboard;

  return <Component />;
}
