import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdAccountBalance,
  MdDashboard,
  MdPeople,
  MdEventNote,
  MdArrowForward,
  MdChevronRight,
  MdVerifiedUser,
  MdSavings,
  MdFactCheck,
  MdAssignment
} from 'react-icons/md';
import { FaInfoCircle } from 'react-icons/fa';
import './PlaceholderModules.css';

function Epfo() {
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
      title: 'Leave Management',
      path: '/leave',
      desc: 'Leave requests & balance',
      icon: <MdEventNote />
    }
  ];

  const plannedScopes = [
    {
      title: 'Provident Fund (PF) Tracking',
      desc: 'Monthly employer and employee PF contribution shares, voluntary contributions, and deposit receipts.',
      icon: <MdSavings />
    },
    {
      title: 'UAN & KYC Verification',
      desc: 'Universal Account Number tracking, Aadhaar-linked KYC status, and member portal alignment.',
      icon: <MdVerifiedUser />
    },
    {
      title: 'Pension Scheme (EPS)',
      desc: 'Employee Pension Scheme allocations, service period credits, and pension claim status.',
      icon: <MdFactCheck />
    },
    {
      title: 'Statutory Compliance Registry',
      desc: 'ESI coverage details, Professional Tax records, Form 16 documents, and compliance records.',
      icon: <MdAssignment />
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
            <span>EPFO</span>
          </div>
          <h1 className="placeholder-title">
            <MdAccountBalance style={{ color: '#7c3aed' }} />
            EPFO & Statutory Details
          </h1>
          <p className="placeholder-desc">
            Employee provident fund and statutory information workspace.
          </p>
        </div>

        {/* Status Badge */}
        <div>
          <div className="placeholder-status-badge">
            <span className="placeholder-status-dot"></span>
            Statutory Integration Pending
          </div>
        </div>
      </div>

      {/* ── Main Workspace Card ── */}
      <div className="placeholder-workspace-card">
        {/* Hero Section */}
        <div className="placeholder-hero">
          <div className="placeholder-hero-icon-wrapper epfo">
            <MdAccountBalance />
          </div>
          <h2 className="placeholder-hero-title">EPFO & Statutory Workspace</h2>
          <p className="placeholder-hero-text">
            This module provides a dedicated hub for employee provident fund contributions, UAN verification, and statutory benefit tracking.
            Integration with backend statutory compliance and payroll deduction services is currently pending.
          </p>

          {/* Notice Box */}
          <div className="placeholder-notice-box">
            <FaInfoCircle className="placeholder-notice-icon" />
            <div>
              <div className="placeholder-notice-title">Integration Status: Awaiting Statutory Services</div>
              <p className="placeholder-notice-desc">
                The statutory workspace interface is prepared. When backend statutory endpoints and contribution verification pipelines are enabled, comprehensive PF passbook and compliance records will appear here.
              </p>
            </div>
          </div>
        </div>

        {/* Planned Capabilities Section */}
        <div className="placeholder-scope-section">
          <div className="placeholder-section-heading">
            <MdSavings style={{ color: '#7c3aed' }} />
            Planned Statutory Capabilities
          </div>
          <div className="placeholder-scope-grid">
            {plannedScopes.map((scope, idx) => (
              <div key={idx} className="placeholder-scope-item">
                <div className="placeholder-scope-item-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
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
                <div className="placeholder-shortcut-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
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

export default Epfo;