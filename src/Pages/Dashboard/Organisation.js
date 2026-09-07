import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdBusiness,
  MdDashboard,
  MdPeople,
  MdAdminPanelSettings,
  MdArrowForward,
  MdChevronRight,
  MdOutlineAccountTree,
  MdLocationOn,
  MdPolicy
} from 'react-icons/md';
import { FaInfoCircle } from 'react-icons/fa';
import './PlaceholderModules.css';

function Organisation() {
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
      title: 'Role Management',
      path: '/roles',
      desc: 'Access control & RBAC',
      icon: <MdAdminPanelSettings />
    }
  ];

  const plannedScopes = [
    {
      title: 'Company Hierarchy & Structure',
      desc: 'Department trees, reporting structures, and organizational unit mapping.',
      icon: <MdOutlineAccountTree />
    },
    {
      title: 'Branch & Office Locations',
      desc: 'Multi-office coordination, branch registry, and physical work centers.',
      icon: <MdLocationOn />
    },
    {
      title: 'Department Directory',
      desc: 'Business units, designations, team leaders, and departmental rosters.',
      icon: <MdBusiness />
    },
    {
      title: 'Corporate Policies & Guidelines',
      desc: 'Centralized company regulations, standard procedures, and compliance documents.',
      icon: <MdPolicy />
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
            <span>Organisation</span>
          </div>
          <h1 className="placeholder-title">
            <MdBusiness style={{ color: '#20a673' }} />
            Organisation Management
          </h1>
          <p className="placeholder-desc">
            Manage organisational information and company structure.
          </p>
        </div>

        {/* Status Badge */}
        <div>
          <div className="placeholder-status-badge">
            <span className="placeholder-status-dot"></span>
            Backend Integration Pending
          </div>
        </div>
      </div>

      {/* ── Main Workspace Card ── */}
      <div className="placeholder-workspace-card">
        {/* Hero Section */}
        <div className="placeholder-hero">
          <div className="placeholder-hero-icon-wrapper organisation">
            <MdBusiness />
          </div>
          <h2 className="placeholder-hero-title">Organisation Management Workspace</h2>
          <p className="placeholder-hero-text">
            This module provides a unified hub for company hierarchy, branch offices, and department directories.
            Backend services and database schemas for organization management are currently scheduled for integration.
          </p>

          {/* Notice Box */}
          <div className="placeholder-notice-box">
            <FaInfoCircle className="placeholder-notice-icon" />
            <div>
              <div className="placeholder-notice-title">Integration Status: Awaiting Backend Services</div>
              <p className="placeholder-notice-desc">
                The user interface structure is ready. Once organizational hierarchy and branch management APIs are deployed on the server, live data and controls will automatically populate here.
              </p>
            </div>
          </div>
        </div>

        {/* Planned Capabilities Section */}
        <div className="placeholder-scope-section">
          <div className="placeholder-section-heading">
            <MdOutlineAccountTree style={{ color: '#20a673' }} />
            Planned Module Capabilities
          </div>
          <div className="placeholder-scope-grid">
            {plannedScopes.map((scope, idx) => (
              <div key={idx} className="placeholder-scope-item">
                <div className="placeholder-scope-item-icon">{scope.icon}</div>
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
                <div className="placeholder-shortcut-icon">{sc.icon}</div>
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

export default Organisation;