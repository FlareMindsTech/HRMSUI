import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdReceipt,
  MdDashboard,
  MdPeople,
  MdAccessTime,
  MdArrowForward,
  MdChevronRight,
  MdPayments,
  MdCalculate,
  MdReceiptLong,
  MdAccountBalanceWallet
} from 'react-icons/md';
import { FaInfoCircle } from 'react-icons/fa';
import './PlaceholderModules.css';

function Payslip() {
  const navigate = useNavigate();

  const shortcuts = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      desc: 'Overview & metrics',
      icon: <MdDashboard />
    },
    {
      title: 'User Management',
      path: '/users',
      desc: 'Employee directory',
      icon: <MdPeople />
    },
    {
      title: 'Attendance',
      path: '/attendance',
      desc: 'Work hours & timesheets',
      icon: <MdAccessTime />
    }
  ];

  const plannedScopes = [
    {
      title: 'Monthly Salary Statements',
      desc: 'Downloadable official monthly payslips, earnings breakdowns, and payout notifications.',
      icon: <MdReceiptLong />
    },
    {
      title: 'Tax Deductions & TDS',
      desc: 'Income tax deductions, professional tax calculations, and quarterly TDS summaries.',
      icon: <MdCalculate />
    },
    {
      title: 'Reimbursements & Allowances',
      desc: 'Approved reimbursement claims, travel allowances, and supplementary payout statements.',
      icon: <MdPayments />
    },
    {
      title: 'Compensation & CTC Structure',
      desc: 'Detailed annual compensation structure, salary revisions, and gross-to-net calculators.',
      icon: <MdAccountBalanceWallet />
    }
  ];

  return (
    <div className="placeholder-page">
      {/* ── Page Header ── */}
      <div className="placeholder-header">
        <div>
          <div className="placeholder-breadcrumb">
            <span className="clickable" onClick={() => navigate('/dashboard')}>
              Dashboard
            </span>
            <MdChevronRight />
            <span>Payslip</span>
          </div>
          <h1 className="placeholder-title">
            <MdReceipt style={{ color: '#059669' }} />
            Payslip Management
          </h1>
          <p className="placeholder-desc">
            Employee salary and payslip information workspace.
          </p>
        </div>

        {/* Status Badge */}
        <div>
          <div className="placeholder-status-badge">
            <span className="placeholder-status-dot"></span>
            Payroll Integration Pending
          </div>
        </div>
      </div>

      {/* ── Main Workspace Card ── */}
      <div className="placeholder-workspace-card">
        {/* Hero Section */}
        <div className="placeholder-hero">
          <div className="placeholder-hero-icon-wrapper payslip">
            <MdReceipt />
          </div>
          <h2 className="placeholder-hero-title">Payslip & Payroll Workspace</h2>
          <p className="placeholder-hero-text">
            This module provides a secure portal for monthly salary statements, tax breakdown summaries, and compensation slips.
            Integration with the backend payroll engine and automated disbursement records is currently scheduled.
          </p>

          {/* Notice Box */}
          <div className="placeholder-notice-box">
            <FaInfoCircle className="placeholder-notice-icon" />
            <div>
              <div className="placeholder-notice-title">Integration Status: Awaiting Payroll Engine</div>
              <p className="placeholder-notice-desc">
                The interface framework is prepared. Once payroll calculation pipelines and slip generation services are integrated, authenticated employees and administrators will be able to view and download salary statements here.
              </p>
            </div>
          </div>
        </div>

        {/* Planned Capabilities Section */}
        <div className="placeholder-scope-section">
          <div className="placeholder-section-heading">
            <MdPayments style={{ color: '#059669' }} />
            Planned Payroll Features
          </div>
          <div className="placeholder-scope-grid">
            {plannedScopes.map((scope, idx) => (
              <div key={idx} className="placeholder-scope-item">
                <div className="placeholder-scope-item-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                  {scope.icon}
                </div>
                <div className="placeholder-scope-item-title">{scope.title}</div>
                <p className="placeholder-scope-item-desc">{scope.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Navigation Shortcuts ── */}
      <div className="placeholder-shortcuts-card">
        <div className="placeholder-shortcuts-header">
          <div>
            <h3 className="placeholder-shortcuts-title">Active HRMS Modules</h3>
            <span className="placeholder-shortcuts-subtitle">
              Jump directly to currently available modules in the application
            </span>
          </div>
        </div>

        <div className="placeholder-shortcuts-grid">
          {shortcuts.map((sc, idx) => (
            <button
              key={idx}
              className="placeholder-shortcut-btn"
              onClick={() => navigate(sc.path)}
              type="button"
            >
              <div className="placeholder-shortcut-left">
                <div className="placeholder-shortcut-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                  {sc.icon}
                </div>
                <div>
                  <div className="placeholder-shortcut-name">{sc.title}</div>
                  <div className="placeholder-shortcut-target">{sc.path}</div>
                </div>
              </div>
              <MdArrowForward className="placeholder-shortcut-arrow" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Payslip;