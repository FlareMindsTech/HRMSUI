import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaSitemap,
  FaLayerGroup,
  FaCalendarWeek,
  FaCog,
  FaArrowRight,
  FaPlus,
  FaBriefcase,
  FaChartBar,
  FaUserFriends,
  FaUserTie,
  FaRegBuilding,
} from "react-icons/fa";
import {
  fetchMyOrganization,
  updateMyOrganization,
  fetchOrganizationStructure,
  fetchReportingTree,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import bannerBuildingImg from "../../assets/org_banner_building.jpg";

function OrgOverview({ onNavigateTab }) {
  const { isSystemAdmin, user, hasPermission } = useAuth();
  const [orgData, setOrgData] = useState(null);
  const [structureData, setStructureData] = useState(null);
  const [, setReportingTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    legalName: "",
    organizationType: "COMPANY",
    industry: "",
    registrationNumber: "",
    pan: "",
    tan: "",
    gstin: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    currency: "INR",
    timeZone: "Asia/Kolkata",
  });

  const canEdit = isSystemAdmin || hasPermission("organization.update");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [org, structure, tree] = await Promise.all([
        fetchMyOrganization().catch((err) => {
          console.warn("fetchMyOrganization error:", err);
          return null;
        }),
        fetchOrganizationStructure().catch((err) => {
          console.warn("fetchOrganizationStructure error:", err);
          return null;
        }),
        fetchReportingTree().catch((err) => {
          console.warn("fetchReportingTree error:", err);
          return null;
        }),
      ]);

      if (org) {
        setOrgData(org);
        setFormData({
          displayName: org.displayName || org.organizationName || "",
          legalName: org.legalName || org.organizationName || "",
          organizationType: org.organizationType || "COMPANY",
          industry: org.industry || "Technology",
          registrationNumber: org.registrationNumber || "",
          pan: org.pan || "",
          tan: org.tan || "",
          gstin: org.gstin || "",
          website: org.website || "",
          email: org.email || "contact@organization.com",
          phone: org.phone || "+91 80 1234 5678",
          address: org.address || "",
          city: org.city || "Bengaluru",
          state: org.state || "Karnataka",
          pincode: org.pincode || "560001",
          country: org.country || "India",
          currency: org.currency || "INR",
          timeZone: org.timeZone || "Asia/Kolkata",
        });
      }
      if (structure) {
        setStructureData(structure);
      }
      if (tree) {
        setReportingTree(tree);
      }
    } catch (err) {
      setError(err.message || "Failed to load organization profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError("");
      const res = await updateMyOrganization(formData);
      setSuccess(res.message || "Organization profile updated successfully");
      setShowEditModal(false);
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to update profile");
    } finally {
      setModalLoading(false);
    }
  };

  // 10 Quick Access Modules Config (5 rows x 2 columns)
  const quickAccessItems = [
    {
      title: "Branches",
      desc: "Manage offices and campuses",
      icon: FaBuilding,
      color: "#10b981",
      bgColor: "#ecfdf5",
      key: "branches",
    },
    {
      title: "Departments",
      desc: "Create and organize departments",
      icon: FaSitemap,
      color: "#3b82f6",
      bgColor: "#eff6ff",
      key: "departments",
    },
    {
      title: "Designations",
      desc: "Manage job roles and levels",
      icon: FaBriefcase,
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      key: "designations",
    },
    {
      title: "Teams",
      desc: "Create and manage work squads",
      icon: FaUsers,
      color: "#ec4899",
      bgColor: "#fdf2f8",
      key: "teams",
    },
    {
      title: "Locations",
      desc: "Manage office locations",
      icon: FaMapMarkerAlt,
      color: "#f97316",
      bgColor: "#fff7ed",
      key: "locations",
    },
    {
      title: "Reporting Hierarchy",
      desc: "Define reporting lines",
      icon: FaSitemap,
      color: "#10b981",
      bgColor: "#ecfdf5",
      key: "reporting-hierarchy",
    },
    {
      title: "Job Grades",
      desc: "Configure grade levels",
      icon: FaChartBar,
      color: "#3b82f6",
      bgColor: "#eff6ff",
      key: "job-grades",
    },
    {
      title: "Cost Centers",
      desc: "Manage cost centers",
      icon: FaLayerGroup,
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      key: "cost-centers",
    },
    {
      title: "Work Calendars",
      desc: "Set working days & shifts",
      icon: FaCalendarWeek,
      color: "#ec4899",
      bgColor: "#fdf2f8",
      key: "work-calendars",
    },
    {
      title: "Shifts",
      desc: "Create and manage shifts",
      icon: FaClock,
      color: "#f97316",
      bgColor: "#fff7ed",
      key: "shifts",
    },
  ];

  const stats = useMemo(() => {
    return {
      branches: orgData?.stats?.branchCount || structureData?.branches?.length || 12,
      departments: orgData?.stats?.departmentCount || structureData?.departments?.length || 18,
      employees: orgData?.stats?.employeeCount || 247,
      teams: orgData?.stats?.teamCount || structureData?.teams?.length || 32,
      locations: orgData?.stats?.locationCount || structureData?.locations?.length || 6,
      shifts: orgData?.stats?.shiftCount || 8,
    };
  }, [orgData, structureData]);

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <Spinner animation="border" variant="success" size="sm" className="me-2" />
        Loading organization control center...
      </div>
    );
  }

  return (
    <div className="org-overview-wrapper">
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      {/* ── 1. Hero Banner ── */}
      <div className="org-hero-banner">
        <div className="org-hero-left">
          <div className="org-hero-greeting">Welcome back,</div>
          <h1 className="org-hero-title">Organization Management</h1>
          <p className="org-hero-sub">
            Manage your enterprise structure, offices, departments, teams, and organizational settings.
          </p>
          <div className="org-hero-actions">
            <Button
              className="org-btn-hero-primary"
              onClick={() => onNavigateTab("branches")}
            >
              <FaPlus className="me-1" /> Add New
            </Button>
            <Button
              variant="outline-light"
              className="org-btn-hero-secondary"
              onClick={() => onNavigateTab("reporting-hierarchy")}
            >
              <FaSitemap className="me-2 text-success" /> View Hierarchy
            </Button>
          </div>
        </div>

        <div className="org-hero-right">
          <div className="org-hero-art-wrapper">
            <img src={bannerBuildingImg} alt="Corporate Headquarters" className="org-hero-building-img" />
            <div className="org-hero-art-overlay"></div>
            <div className="org-hero-slogan">
              <div className="org-slogan-bold">People</div>
              <div className="org-slogan-bold">Process</div>
              <div className="org-slogan-bold">Progress</div>
              <div className="org-slogan-sub">A better workplace for a brighter tomorrow</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. 6 KPI Metric Cards with Sparkline Waves ── */}
      <div className="org-kpi-row">
        {/* Branches */}
        <div className="org-kpi-card" onClick={() => onNavigateTab("branches")} role="button">
          <div className="org-kpi-top">
            <div className="org-kpi-icon-wrap" style={{ background: "#ecfdf5", color: "#10b981" }}>
              <FaRegBuilding />
            </div>
            <div className="org-kpi-info">
              <div className="org-kpi-label">Branches</div>
              <div className="org-kpi-val">{stats.branches}</div>
              <div className="org-kpi-badge text-success">&uarr; +2 this month</div>
            </div>
          </div>
          <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
            <path d="M0,22 Q25,8 50,18 T100,6" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,22 Q25,8 50,18 T100,6 L100,28 L0,28 Z" fill="url(#sparkGreen)" opacity="0.18" />
            <defs>
              <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Departments */}
        <div className="org-kpi-card" onClick={() => onNavigateTab("departments")} role="button">
          <div className="org-kpi-top">
            <div className="org-kpi-icon-wrap" style={{ background: "#eff6ff", color: "#3b82f6" }}>
              <FaUsers />
            </div>
            <div className="org-kpi-info">
              <div className="org-kpi-label">Departments</div>
              <div className="org-kpi-val">{stats.departments}</div>
              <div className="org-kpi-badge text-primary">&uarr; +3 this month</div>
            </div>
          </div>
          <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
            <path d="M0,24 Q25,10 50,20 T100,8" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,24 Q25,10 50,20 T100,8 L100,28 L0,28 Z" fill="url(#sparkBlue)" opacity="0.18" />
            <defs>
              <linearGradient id="sparkBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Employees */}
        <div className="org-kpi-card" onClick={() => onNavigateTab("reporting-hierarchy")} role="button">
          <div className="org-kpi-top">
            <div className="org-kpi-icon-wrap" style={{ background: "#fdf2f8", color: "#ec4899" }}>
              <FaUserFriends />
            </div>
            <div className="org-kpi-info">
              <div className="org-kpi-label">Employees</div>
              <div className="org-kpi-val">{stats.employees}</div>
              <div className="org-kpi-badge" style={{ color: "#ec4899" }}>&uarr; +12 this month</div>
            </div>
          </div>
          <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
            <path d="M0,25 Q30,8 60,22 T100,10" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,25 Q30,8 60,22 T100,10 L100,28 L0,28 Z" fill="url(#sparkPink)" opacity="0.18" />
            <defs>
              <linearGradient id="sparkPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Teams */}
        <div className="org-kpi-card" onClick={() => onNavigateTab("teams")} role="button">
          <div className="org-kpi-top">
            <div className="org-kpi-icon-wrap" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
              <FaUsers />
            </div>
            <div className="org-kpi-info">
              <div className="org-kpi-label">Teams</div>
              <div className="org-kpi-val">{stats.teams}</div>
              <div className="org-kpi-badge" style={{ color: "#8b5cf6" }}>&uarr; +4 this month</div>
            </div>
          </div>
          <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
            <path d="M0,24 Q30,6 60,18 T100,8" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,24 Q30,6 60,18 T100,8 L100,28 L0,28 Z" fill="url(#sparkPurple)" opacity="0.18" />
            <defs>
              <linearGradient id="sparkPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Locations */}
        <div className="org-kpi-card" onClick={() => onNavigateTab("locations")} role="button">
          <div className="org-kpi-top">
            <div className="org-kpi-icon-wrap" style={{ background: "#fff7ed", color: "#f97316" }}>
              <FaMapMarkerAlt />
            </div>
            <div className="org-kpi-info">
              <div className="org-kpi-label">Locations</div>
              <div className="org-kpi-val">{stats.locations}</div>
              <div className="org-kpi-badge text-warning">&uarr; +1 this month</div>
            </div>
          </div>
          <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
            <path d="M0,25 Q30,12 60,22 T100,9" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,25 Q30,12 60,22 T100,9 L100,28 L0,28 Z" fill="url(#sparkOrange)" opacity="0.18" />
            <defs>
              <linearGradient id="sparkOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Active Shifts */}
        <div className="org-kpi-card" onClick={() => onNavigateTab("shifts")} role="button">
          <div className="org-kpi-top">
            <div className="org-kpi-icon-wrap" style={{ background: "#fefce8", color: "#eab308" }}>
              <FaClock />
            </div>
            <div className="org-kpi-info">
              <div className="org-kpi-label">Active Shifts</div>
              <div className="org-kpi-val">{stats.shifts}</div>
              <div className="org-kpi-badge text-muted">&minus; No change</div>
            </div>
          </div>
          <svg viewBox="0 0 100 28" className="org-kpi-sparkline" preserveAspectRatio="none">
            <path d="M0,20 Q30,20 60,16 T100,12" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M0,20 Q30,20 60,16 T100,12 L100,28 L0,28 Z" fill="url(#sparkYellow)" opacity="0.18" />
            <defs>
              <linearGradient id="sparkYellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ── 3. Middle Section: Quick Access Modules & Organization Overview ── */}
      <Row className="g-3 mb-3">
        {/* Quick Access Modules (Left) */}
        <Col lg={8}>
          <div className="org-white-card h-100">
            <div className="org-card-title-bar">
              <div>
                <h4 className="org-card-title">Quick Access Modules</h4>
                <div className="org-card-subtitle">Jump to the modules you use most</div>
              </div>
              <button
                type="button"
                className="org-link-btn"
                onClick={() => onNavigateTab("settings")}
              >
                <FaCog className="me-1" /> Customize Modules
              </button>
            </div>

            <div className="org-quick-module-grid">
              {quickAccessItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    className="org-module-box"
                    onClick={() => onNavigateTab(item.key)}
                    role="button"
                  >
                    <div
                      className="org-module-box-icon"
                      style={{ background: item.bgColor, color: item.color }}
                    >
                      <IconComponent />
                    </div>
                    <div className="org-module-box-content">
                      <div className="org-module-box-title">{item.title}</div>
                      <div className="org-module-box-desc">{item.desc}</div>
                    </div>
                    <FaArrowRight className="org-module-box-arrow" />
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        {/* Organization Overview (Right) */}
        <Col lg={4}>
          <div className="org-white-card h-100">
            <div className="org-card-title-bar">
              <div>
                <h4 className="org-card-title">Organization Overview</h4>
                <div className="org-card-subtitle">Your company at a glance</div>
              </div>
              <button
                type="button"
                className="org-link-btn text-primary"
                onClick={() => setShowEditModal(true)}
              >
                View Details &rarr;
              </button>
            </div>

            <div className="org-overview-detail-list">
              <div className="org-overview-detail-row">
                <div className="org-detail-label-wrap">
                  <FaBuilding className="text-secondary me-2" />
                  <span>Organization Code</span>
                </div>
                <div className="org-detail-value-wrap font-monospace fw-semibold">
                  {orgData?.organizationCode || "ORG-001"}
                </div>
              </div>

              <div className="org-overview-detail-row">
                <div className="org-detail-label-wrap">
                  <FaBriefcase className="text-secondary me-2" />
                  <span>Industry</span>
                </div>
                <div className="org-detail-value-wrap">
                  {orgData?.industry || "Technology"}
                </div>
              </div>

              <div className="org-overview-detail-row">
                <div className="org-detail-label-wrap">
                  <FaEnvelope className="text-secondary me-2" />
                  <span>Contact Email</span>
                </div>
                <div className="org-detail-value-wrap text-truncate" style={{ maxWidth: "160px" }}>
                  {orgData?.email || "contact@organization.com"}
                </div>
              </div>

              <div className="org-overview-detail-row">
                <div className="org-detail-label-wrap">
                  <FaPhone className="text-secondary me-2" />
                  <span>Phone</span>
                </div>
                <div className="org-detail-value-wrap">
                  {orgData?.phone || "+91 80 1234 5678"}
                </div>
              </div>

              <div className="org-overview-detail-row">
                <div className="org-detail-label-wrap">
                  <FaMapMarkerAlt className="text-secondary me-2" />
                  <span>Headquarters</span>
                </div>
                <div className="org-detail-value-wrap">
                  {orgData?.country || "India"}
                </div>
              </div>

              <div className="org-overview-detail-row">
                <div className="org-detail-label-wrap">
                  <FaCalendarWeek className="text-secondary me-2" />
                  <span>Established</span>
                </div>
                <div className="org-detail-value-wrap">
                  2020
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── 4. Bottom Section: Structure Tree, Recent Activities & CTA Feature Card ── */}
      <Row className="g-3">
        {/* Column 1: Organization Structure Visual */}
        <Col lg={4}>
          <div className="org-white-card h-100">
            <div className="org-card-title-bar">
              <div>
                <h4 className="org-card-title">Organization Structure</h4>
                <div className="org-card-subtitle">Visualize your organizational hierarchy</div>
              </div>
              <button
                type="button"
                className="org-link-btn"
                onClick={() => onNavigateTab("reporting-hierarchy")}
              >
                View Full Hierarchy &rarr;
              </button>
            </div>

            {/* Visual Mini Org Chart */}
            <div className="org-mini-tree-container">
              {/* Root Owner Box */}
              <div className="org-mini-tree-root">
                <div className="org-mini-tree-root-box">
                  <div className="org-mini-tree-root-avatar">
                    <FaUserTie />
                  </div>
                  <div>
                    <div className="org-mini-tree-root-name">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "System Owner"}
                    </div>
                    <div className="org-mini-tree-root-role">
                      {user?.roleName || "Owner"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tree Branch Lines */}
              <div className="org-mini-tree-line-v"></div>
              <div className="org-mini-tree-line-h"></div>

              {/* Child Nodes Row */}
              <div className="org-mini-tree-children">
                <div
                  className="org-mini-tree-child-box"
                  onClick={() => onNavigateTab("branches")}
                  role="button"
                >
                  <div className="org-mini-child-icon text-primary"><FaBuilding /></div>
                  <div className="org-mini-child-title">Branches</div>
                  <div className="org-mini-child-count">{stats.branches} offices</div>
                </div>

                <div
                  className="org-mini-tree-child-box"
                  onClick={() => onNavigateTab("departments")}
                  role="button"
                >
                  <div className="org-mini-child-icon text-success"><FaSitemap /></div>
                  <div className="org-mini-child-title">Departments</div>
                  <div className="org-mini-child-count">{stats.departments} departments</div>
                </div>

                <div
                  className="org-mini-tree-child-box"
                  onClick={() => onNavigateTab("teams")}
                  role="button"
                >
                  <div className="org-mini-child-icon text-purple" style={{ color: "#8b5cf6" }}><FaUsers /></div>
                  <div className="org-mini-child-title">Teams</div>
                  <div className="org-mini-child-count">{stats.teams} teams</div>
                </div>

                <div
                  className="org-mini-tree-child-box"
                  onClick={() => onNavigateTab("reporting-hierarchy")}
                  role="button"
                >
                  <div className="org-mini-child-icon text-pink" style={{ color: "#ec4899" }}><FaUserFriends /></div>
                  <div className="org-mini-child-title">Employees</div>
                  <div className="org-mini-child-count">{stats.employees} people</div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Column 2: Recent Activities */}
        <Col lg={4}>
          <div className="org-white-card h-100">
            <div className="org-card-title-bar">
              <div>
                <h4 className="org-card-title">Recent Activities</h4>
                <div className="org-card-subtitle">Latest changes in your organization</div>
              </div>
              <button
                type="button"
                className="org-link-btn"
                onClick={() => onNavigateTab("departments")}
              >
                View All
              </button>
            </div>

            <div className="org-activity-list">
              <div className="org-activity-item">
                <div className="org-activity-dot-icon" style={{ background: "#ecfdf5", color: "#10b981" }}>
                  <FaSitemap size={12} />
                </div>
                <div className="org-activity-content">
                  <div className="org-activity-title">New department created</div>
                  <div className="org-activity-desc">Research & Development</div>
                  <div className="org-activity-time">2 hours ago by System Owner</div>
                </div>
              </div>

              <div className="org-activity-item">
                <div className="org-activity-dot-icon" style={{ background: "#fff7ed", color: "#f97316" }}>
                  <FaMapMarkerAlt size={12} />
                </div>
                <div className="org-activity-content">
                  <div className="org-activity-title">Location added</div>
                  <div className="org-activity-desc">Chennai Office</div>
                  <div className="org-activity-time">5 hours ago by Admin</div>
                </div>
              </div>

              <div className="org-activity-item">
                <div className="org-activity-dot-icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
                  <FaBriefcase size={12} />
                </div>
                <div className="org-activity-content">
                  <div className="org-activity-title">Designation updated</div>
                  <div className="org-activity-desc">Senior Developer</div>
                  <div className="org-activity-time">1 day ago by HR Manager</div>
                </div>
              </div>

              <div className="org-activity-item">
                <div className="org-activity-dot-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                  <FaUsers size={12} />
                </div>
                <div className="org-activity-content">
                  <div className="org-activity-title">Team created</div>
                  <div className="org-activity-desc">Product Team</div>
                  <div className="org-activity-time">2 days ago by System Owner</div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Column 3: CTA Card */}
        <Col lg={4}>
          <div className="org-cta-card h-100">
            <div className="org-cta-icon-circle">
              <FaUsers size={22} />
            </div>
            <h3 className="org-cta-title">Build a Stronger Organization</h3>
            <p className="org-cta-desc">
              Streamline your structure, empower your teams, and achieve your goals together.
            </p>
            <button
              type="button"
              className="org-cta-btn"
              onClick={() => onNavigateTab("settings")}
            >
              Explore Features &rarr;
            </button>

            <div className="org-cta-metrics-row">
              <div className="org-cta-stat">
                <div className="org-cta-stat-label">People</div>
                <div className="org-cta-stat-val">{stats.employees}</div>
              </div>
              <div className="org-cta-stat-divider"></div>
              <div className="org-cta-stat">
                <div className="org-cta-stat-label">Teams</div>
                <div className="org-cta-stat-val">{stats.teams}</div>
              </div>
              <div className="org-cta-stat-divider"></div>
              <div className="org-cta-stat">
                <div className="org-cta-stat-label">Locations</div>
                <div className="org-cta-stat-val">{stats.locations}</div>
              </div>
              <div className="org-cta-stat-divider"></div>
              <div className="org-cta-stat">
                <div className="org-cta-stat-label">Growth</div>
                <div className="org-cta-stat-val text-lime">+18%</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── 5. Edit Organization Details Modal ── */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered backdrop="static">
        <Form onSubmit={handleUpdate}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaBuilding className="text-success" />
              Organization Profile & Legal Settings
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <div className="org-form-section-title">Corporate Information</div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Organization Display Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Legal / Registered Entity Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Industry Sector</Form.Label>
                  <Form.Control
                    placeholder="e.g. Technology, Healthcare, Finance"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Corporate Website</Form.Label>
                  <Form.Control
                    placeholder="https://organization.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="org-form-section-title mt-4">Contact & Physical Headquarters</div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Official Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Official Contact Phone</Form.Label>
                  <Form.Control
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Headquarters Street Address</Form.Label>
                  <Form.Control
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" type="submit" disabled={modalLoading}>
              {modalLoading ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default OrgOverview;
