import React from 'react';
import PageShell from '../../Components/Common/PageShell';
import PageHeader from '../../Components/Common/PageHeader';
import { useNavigate } from 'react-router-dom';
import {
  MdAssessment,
  MdDashboard,
  MdAccessTime,
  MdWork,
  MdArrowForward,
  MdChevronRight,
  MdTrendingUp,
  MdPieChart,
  MdBarChart,
  MdSecurity
} from 'react-icons/md';
import { FaInfoCircle } from 'react-icons/fa';
import './PlaceholderModules.css';

function Mis() {
  const navigate = useNavigate();

  const shortcuts = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      desc: 'Real-time overview',
      icon: <MdDashboard />
    },
    {
      title: 'Attendance',
      path: '/attendance',
      desc: 'Check-ins & timesheets',
      icon: <MdAccessTime />
    },
    {
      title: 'Projects',
      path: '/projects',
      desc: 'Sprints & deliverables',
      icon: <MdWork />
    }
  ];

  const plannedScopes = [
    {
      title: 'Executive KPI Dashboards',
      desc: 'Consolidated organizational indicators, headcount movements, and workforce health metrics.',
      icon: <MdTrendingUp />
    },
    {
      title: 'Attendance & Leave Trends',
      desc: 'Monthly punctuality curves, leave utilization distributions, and departmental attendance patterns.',
      icon: <MdBarChart />
    },
    {
      title: 'Project Delivery Insights',
      desc: 'Sprint velocities, task backlog health, milestone timelines, and delivery efficiency analyses.',
      icon: <MdPieChart />
    },
    {
      title: 'Audit & Compliance Logs',
      desc: 'Action histories, permission escalations, access records, and regulatory compliance documentation.',
      icon: <MdSecurity />
    }
  ];

  return (
    <PageShell className="placeholder-page-shell">
      {/* ── Breadcrumb & Page Header ── */}
      <div className="placeholder-breadcrumb">
        <span
          className="clickable"
          onClick={() => navigate('/dashboard')}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate('/dashboard');
            }
          }}
        >
          Dashboard
        </span>
        <MdChevronRight />
        <span>MIS</span>
      </div>

      <PageHeader
        title="Management Information System"
        subtitle="Centralized reporting and business insights workspace."
        actions={
          <div className="placeholder-status-badge">
            <span className="placeholder-status-dot"></span>
            Reporting Integration Pending
          </div>
        }
      />

      {/* ── Main Workspace Card ── */}
      <div className="placeholder-workspace-card">
        {/* Hero Section */}
        <div className="placeholder-hero">
          <div className="placeholder-hero-icon-wrapper mis">
            <MdAssessment />
          </div>
          <h2 className="placeholder-hero-title">Management Information System (MIS)</h2>
          <p className="placeholder-hero-text">
            This workspace will host centralized executive analytics, data visualizations, and operational reporting.
            Backend analytical aggregation pipelines and report generation services are currently pending integration.
          </p>

          {/* Notice Box */}
          <div className="placeholder-notice-box">
            <FaInfoCircle className="placeholder-notice-icon" />
            <div>
              <div className="placeholder-notice-title">Integration Status: Awaiting Reporting Services</div>
              <p className="placeholder-notice-desc">
                The layout and analytical views are designed. When backend reporting aggregation endpoints are deployed, this section will present verified business metrics and exportable summaries.
              </p>
            </div>
          </div>
        </div>

        {/* Planned Capabilities Section */}
        <div className="placeholder-scope-section">
          <div className="placeholder-section-heading">
            <MdTrendingUp />
            Planned Reporting Capabilities
          </div>
          <div className="placeholder-scope-grid">
            {plannedScopes.map((scope, idx) => (
              <div key={idx} className="placeholder-scope-item">
                <div className="placeholder-scope-item-icon">
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
                <div className="placeholder-shortcut-icon">
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
    </PageShell>
  );
}

export default Mis;